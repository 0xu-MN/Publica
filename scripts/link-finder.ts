/**
 * Link Finder - 관련 기사 링크 수집
 * 비슷한 주제의 다른 기사 찾기 (원본 제외)
 */

import { NewsArticle, extractKeywords } from './news-collector';

/**
 * 관련도 점수 계산
 */
function calculateRelevanceScore(
    article: NewsArticle,
    keywords: string[]
): number {
    let score = 0;
    const text = `${article.title} ${article.description}`.toLowerCase();

    keywords.forEach(keyword => {
        const kw = keyword.toLowerCase();
        // 제목에 포함: 3점
        if (article.title.toLowerCase().includes(kw)) {
            score += 3;
        }
        // 설명에 포함: 1점
        if (article.description.toLowerCase().includes(kw)) {
            score += 1;
        }
    });

    return score;
}

export interface RelatedMaterial {
    title: string;
    url: string;
}

/**
 * 관련 링크 찾기 (원본 제외)
 */
export function findRelatedArticles(
    originalArticle: NewsArticle,
    allArticles: NewsArticle[],
    count: number = 4
): RelatedMaterial[] {

    // 키워드 추출
    const keywords = extractKeywords(originalArticle);

    // 원본 제외 & 같은 카테고리만
    const candidates = allArticles.filter(article =>
        article.id !== originalArticle.id &&
        article.category === originalArticle.category
    );

    // 관련도 점수 계산
    const scored = candidates.map(article => ({
        article,
        score: calculateRelevanceScore(article, keywords)
    }));

    // 점수순 정렬 후 상위 N개
    const topArticles = scored
        .filter(s => s.score > 0) // 점수 0 제외
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(s => s.article);

    // RelatedMaterial 형식으로 변환
    return topArticles.map(article => ({
        title: article.title,
        url: article.link
    }));
}

/**
 * 테스트
 */
async function test() {
    const { collectAllNews } = require('./news-collector');

    console.log('🔗 Testing Link Finder...\n');

    const articles = await collectAllNews();

    if (articles.length === 0) {
        console.log('❌ No articles collected');
        return;
    }

    const original = articles[0];
    console.log(`Original: ${original.title}\n`);

    const related = findRelatedArticles(original, articles, 4);

    console.log(`✅ Found ${related.length} related articles:`);
    related.forEach((material, i) => {
        console.log(`${i + 1}. ${material.title}`);
        console.log(`   ${material.url}\n`);
    });
}

if (require.main === module) {
    test().catch(console.error);
}
