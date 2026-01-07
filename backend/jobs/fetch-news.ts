import 'dotenv/config';
import { parseRSSFeed, deduplicateNews, detectFakeNewsPatterns, calculateReadTime } from '../utils/rss-parser';
import { summarizeNews, batchSummarize } from '../utils/ai-summarizer';
import { allNewsSources } from '../config/news-sources';
import { sortByPriority, matchTrendingTopics, extractTrendingTags } from '../config/trending-topics';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

interface ProcessedNewsItem {
    title: string;
    summary: string;
    ai_summary: string;
    ai_insight: string;
    image_url: string | null;
    category: 'Science' | 'Economy';
    source: string;
    source_url: string;
    published_at: Date;
    tags: string[];
    read_time: string;
    priority_score: number;
    is_trending: boolean;
}

/**
 * 뉴스 수집 및 처리 메인 함수
 */
export async function fetchAndProcessNews() {
    console.log('🔍 뉴스 수집 시작...');

    try {
        // 1. 모든 RSS 피드에서 뉴스 수집
        const allNews = [];
        for (const source of allNewsSources) {
            console.log(`📰 ${source.name} 수집 중...`);
            const items = await parseRSSFeed(source);
            allNews.push(...items);
        }

        console.log(`✅ 총 ${allNews.length}개 뉴스 수집 완료`);

        // 2. 중복 제거
        const uniqueNews = deduplicateNews(allNews);
        console.log(`🔄 중복 제거 후: ${uniqueNews.length}개`);

        // 3. 가짜뉴스 필터링
        const validNews = uniqueNews.filter(item => {
            const isFake = detectFakeNewsPatterns(item.title, item.content);
            if (isFake) {
                console.log(`⚠️  의심스러운 뉴스 제외: ${item.title}`);
            }
            return !isFake;
        });
        console.log(`✅ 가짜뉴스 필터링 후: ${validNews.length}개`);

        // 4. 우선순위 정렬 (CES 2026 등 트렌딩 토픽 우선)
        const sortedNews = sortByPriority(validNews);
        const topNews = sortedNews.slice(0, 20); // 상위 20개만
        console.log(`🔝 상위 ${topNews.length}개 선정`);

        // 5. AI 요약 생성 (한국어)
        console.log('🤖 AI 요약 생성 중...');
        const summarizeOptions = topNews.map(item => ({
            title: item.title,
            content: item.content,
            category: item.category,
            language: 'ko' as const // 한국어로 요약 및 번역
        }));

        const summaries = await batchSummarize(summarizeOptions);

        // 6. 데이터 가공
        const processedNews: ProcessedNewsItem[] = topNews.map((item, index) => {
            const summary = summaries[index];
            const matchedTopics = matchTrendingTopics(item.title, item.content);
            const trendingTags = extractTrendingTags(item.title, item.content);

            return {
                title: summary.koreanTitle || item.title, // 한국어 번역 제목 사용
                summary: item.content.substring(0, 200),
                ai_summary: summary.summary,
                ai_insight: summary.aiInsight,
                image_url: null, // 이미지는 별도 처리 필요
                category: item.category,
                source: item.source,
                source_url: item.link,
                published_at: item.pubDate,
                tags: [...summary.tags, ...trendingTags],
                read_time: calculateReadTime(item.content, 'en'),
                priority_score: matchedTopics.length > 0 ? matchedTopics[0].priority : 5,
                is_trending: matchedTopics.length > 0
            };
        });

        // 7. Supabase에 저장
        console.log('💾 데이터베이스 저장 중...');
        const { data, error } = await supabase
            .from('news_items')
            .upsert(processedNews, {
                onConflict: 'source_url',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('❌ DB 저장 실패:', error);
            throw error;
        }

        console.log(`✅ ${processedNews.length}개 뉴스 저장 완료!`);

        // CES 2026 관련 뉴스 통계
        const cesNews = processedNews.filter(item =>
            item.is_trending && item.tags.some(tag => tag.includes('CES'))
        );
        console.log(`🎉 CES 2026 관련 뉴스: ${cesNews.length}개`);

        return {
            total: processedNews.length,
            trending: processedNews.filter(n => n.is_trending).length,
            ces: cesNews.length
        };

    } catch (error) {
        console.error('❌ 뉴스 수집 실패:', error);
        throw error;
    }
}

// 직접 실행 시
if (require.main === module) {
    fetchAndProcessNews()
        .then(result => {
            console.log('\n📊 수집 완료:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 에러 발생:', error);
            process.exit(1);
        });
}
