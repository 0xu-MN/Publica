/**
 * News Collector - RSS 기반 뉴스 수집기
 * 네이버, 매일경제 등의 RSS 피드에서 실시간 뉴스 수집
 */

import Parser from 'rss-parser';
import crypto from 'crypto';

// RSS 파서 초기화
const parser = new Parser({
    customFields: {
        item: ['description', 'pubDate', 'link']
    }
});

// 뉴스 소스 정의 - 과학/기술 및 경제 전문
const NEWS_SOURCES = {
    // IT/과학 전문
    sciencetimes: {
        science: 'https://www.sciencetimes.co.kr/feed/'  // 사이언스타임즈
    },
    // 경제 전문  
    mk: {
        economy: 'https://www.mk.co.kr/rss/30100041/'  // 매경 - 경제일반
    },
    hankyung: {
        economy: 'https://www.hankyung.com/feed/economy'  // 한경 - 경제
    },
    mk_tech: {
        science: 'https://www.mk.co.kr/rss/40300001/'  // 매경 - IT/과학
    }
} as const;

export interface NewsArticle {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    description: string;
    source: 'sciencetimes' | 'mk_tech' | 'mk' | 'hankyung';
    category: 'science' | 'economy';
}

/**
 * URL에서 고유 ID 생성
 */
function generateArticleId(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * RSS 피드에서 뉴스 수집
 */
async function fetchRSS(
    url: string,
    source: 'sciencetimes' | 'mk_tech' | 'mk' | 'hankyung',
    category: 'science' | 'economy'
): Promise<NewsArticle[]> {
    try {
        const feed = await parser.parseURL(url);

        return feed.items.map(item => ({
            id: generateArticleId(item.link || ''),
            title: item.title || '',
            link: item.link || '',
            pubDate: item.pubDate || new Date().toISOString(),
            description: (item as any).contentSnippet || item.description || '',
            source,
            category
        }));
    } catch (error: any) {
        console.error(`❌ Failed to fetch RSS from ${url}:`, error.message);
        return [];
    }
}

/**
 * 모든 소스에서 뉴스 수집
 */
export async function collectAllNews(): Promise<NewsArticle[]> {
    console.log('📰 Starting news collection...');

    const results = await Promise.all([
        // IT/과학 전문
        fetchRSS(NEWS_SOURCES.sciencetimes.science, 'sciencetimes', 'science'),
        fetchRSS(NEWS_SOURCES.mk_tech.science, 'mk_tech', 'science'),

        // 경제 전문
        fetchRSS(NEWS_SOURCES.mk.economy, 'mk', 'economy'),
        fetchRSS(NEWS_SOURCES.hankyung.economy, 'hankyung', 'economy'),
    ]);

    const allArticles = results.flat();
    console.log(`✅ Collected ${allArticles.length} articles`);

    return allArticles;
}

/**
 * 키워드 추출 (간단한 버전)
 */
export function extractKeywords(article: NewsArticle): string[] {
    const text = `${article.title} ${article.description}`;

    // 한글 단어 추출 (2-4글자)
    const koreanWords = text.match(/[가-힣]{2,4}/g) || [];

    // 빈도수 계산
    const frequency: Record<string, number> = {};
    koreanWords.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });

    // 빈도순 정렬 후 상위 5개
    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
}

/**
 * 테스트 실행
 */
async function main() {
    const articles = await collectAllNews();

    console.log('\n📋 Sample Articles:');
    articles.slice(0, 3).forEach(article => {
        console.log(`\n[${article.category.toUpperCase()}] ${article.title}`);
        console.log(`Source: ${article.source}`);
        console.log(`Link: ${article.link}`);
        console.log(`Keywords: ${extractKeywords(article).join(', ')}`);
    });
}

// 직접 실행시
if (require.main === module) {
    main().catch(console.error);
}
