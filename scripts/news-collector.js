/**
 * News Collector - RSS 기반 뉴스 수집기
 * 네이버, 매일경제 등의 RSS 피드에서 실시간 뉴스 수집
 */

const Parser = require('rss-parser');
const crypto = require('crypto');

// RSS 파서 초기화
const parser = new Parser({
    customFields: {
        item: ['description', 'pubDate', 'link']
    }
});

// 뉴스 소스 정의
const NEWS_SOURCES = {
    naver: {
        science: 'https://news.naver.com/main/rss/section.nhn?sid1=105',
        economy: 'https://news.naver.com/main/rss/section.nhn?sid1=101'
    },
    mk: {
        science: 'https://www.mk.co.kr/rss/30200041/',
        economy: 'https://www.mk.co.kr/rss/50200011/'
    }
};

/**
 * URL에서 고유 ID 생성
 */
function generateArticleId(url) {
    return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * RSS 피드에서 뉴스 수집
 */
async function fetchRSS(url, source, category) {
    try {
        const feed = await parser.parseURL(url);

        return feed.items.map(item => ({
            id: generateArticleId(item.link || ''),
            title: item.title || '',
            link: item.link || '',
            pubDate: item.pubDate || new Date().toISOString(),
            description: item.contentSnippet || item.description || '',
            source,
            category
        }));
    } catch (error) {
        console.error(`❌ Failed to fetch RSS from ${url}:`, error.message);
        return [];
    }
}

/**
 * 모든 소스에서 뉴스 수집
 */
async function collectAllNews() {
    console.log('📰 Starting news collection...');

    const results = await Promise.all([
        // 네이버 뉴스
        fetchRSS(NEWS_SOURCES.naver.science, 'naver', 'science'),
        fetchRSS(NEWS_SOURCES.naver.economy, 'naver', 'economy'),

        // 매일경제
        fetchRSS(NEWS_SOURCES.mk.science, 'mk', 'science'),
        fetchRSS(NEWS_SOURCES.mk.economy, 'mk', 'economy')
    ]);

    const allArticles = results.flat();
    console.log(`✅ Collected ${allArticles.length} articles`);

    return allArticles;
}

/**
 * 키워드 추출 (간단한 버전)
 */
function extractKeywords(article) {
    const text = `${article.title} ${article.description}`;

    // 한글 단어 추출 (2-4글자)
    const koreanWords = text.match(/[가-힣]{2,4}/g) || [];

    // 빈도수 계산
    const frequency = {};
    koreanWords.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });

    // 빈도순 정렬 후 상위 5개
    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
}

// 모듈 export
module.exports = {
    collectAllNews,
    extractKeywords
};

/**
 * 테스트 실행
 */
if (require.main === module) {
    (async () => {
        const articles = await collectAllNews();

        console.log('\n📋 Sample Articles:');
        articles.slice(0, 3).forEach(article => {
            console.log(`\n[${article.category.toUpperCase()}] ${article.title}`);
            console.log(`Source: ${article.source}`);
            console.log(`Link: ${article.link}`);
            console.log(`Keywords: ${extractKeywords(article).join(', ')}`);
        });
    })();
}
