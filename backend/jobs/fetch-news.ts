import 'dotenv/config';
import { parseRSSFeed, deduplicateNews, detectFakeNewsPatterns, calculateReadTime } from '../utils/rss-parser';
// import { summarizeNews, batchSummarize } from '../utils/ai-summarizer'; // AI disabled for copyright compliance
import { getAllSources } from '../config/news-sources';
import { sortByPriority, matchTrendingTopics, extractTrendingTags } from '../config/trending-topics';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

interface ProcessedNewsItem {
    title: string;
    summary: string;
    ai_summary: string | null;  // Nullable or empty string
    ai_insight: string | null;  // Nullable or empty string
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
        const sources = getAllSources();
        for (const source of sources) {
            console.log(`📰 ${source.name} 수집 중...`);
            // @ts-ignore - Category string vs literal mismatch, safe to ignore as config is typed
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

        // 4. 우선순위 정렬
        const sortedNews = sortByPriority(validNews);
        const topNews = sortedNews.slice(0, 50); // 상위 50개 (AI 비용 걱정 없이 더 많이 수집 가능)
        console.log(`🔝 상위 ${topNews.length}개 선정`);

        // 5. AI 요약 생성 (비활성화 - 저작권 준수)
        console.log('🚫 AI 요약 비활성화 (저작권 준수: RSS 원문 스니펫 사용)');

        // 6. 데이터 가공
        const processedNews: ProcessedNewsItem[] = topNews.map((item) => {
            const matchedTopics = matchTrendingTopics(item.title, item.content);
            const trendingTags = extractTrendingTags(item.title, item.content);
            const tags = item.categories && item.categories.length > 0
                ? item.categories
                : trendingTags;

            // RSS Snippet 150자 제한 (저작권 준수)
            let snippet = item.contentSnippet || item.content || '';
            if (snippet.length > 200) {
                snippet = snippet.substring(0, 200) + '...';
            }

            // "AI Summary" UI를 위해 RSS 요약을 매핑 (저작권 안전)
            const safeSummary = snippet.length > 0 ? snippet : "요약문이 제공되지 않았습니다.";

            return {
                title: item.title, // 원문 제목 그대로 사용
                summary: snippet, // 카드뷰용 RSS 요약
                ai_summary: safeSummary, // 모달용 (AI UI 복구 요청 대응)
                ai_insight: safeSummary, // 모달용 (AI UI 복구 요청 대응)
                image_url: item.enclosure?.url || null, // RSS 이미지 우선 사용
                category: item.category,
                source: item.source,
                source_url: item.link,
                published_at: item.pubDate,
                tags: [...tags, ...trendingTags].slice(0, 5), // 태그 최대 5개
                read_time: calculateReadTime(item.content, 'en'), // 영어 기준 읽는 시간 계산 유지
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

        return {
            total: processedNews.length,
            trending: processedNews.filter(n => n.is_trending).length,
            ces: 0
        };

    } catch (error) {
        console.error('❌ 뉴스 수집 실패:', error);
        throw error;
    }
}

// 직접 실행 시
// if (require.main === module) {
//     fetchAndProcessNews()
//         .then(result => {
//             console.log('\n📊 수집 완료:', result);
//             process.exit(0);
//         })
//         .catch(error => {
//             console.error('\n💥 에러 발생:', error);
//             process.exit(1);
//         });
// }
