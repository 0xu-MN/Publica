/**
 * Auto Pipeline - 전체 자동화 파이프라인
 * 뉴스 수집 → AI 각색 → 관련 링크 → 카드 발행
 */

import { collectAllNews, extractKeywords } from './news-collector';
import { filterUnusedArticles, markArticleAsUsed, publishCard, getUsedArticlesCount } from './db-service';
import { generateCard, generateImageUrl } from './ai-generator';
import { findRelatedArticles } from './link-finder';

/**
 * 메인 파이프라인
 */
async function runPipeline() {
    console.log('\n🚀 InsightFlow Auto Pipeline Started');
    console.log('슬로건: "검색을 넘어 실행으로, 정보를 넘어 자본으로"\n');

    try {
        // 1. 뉴스 수집
        console.log('📰 Step 1: Collecting news...');
        const allArticles = await collectAllNews();

        if (allArticles.length === 0) {
            console.log('❌ No articles collected. Exiting.');
            return;
        }

        // 2. 중복 필터
        console.log('\n🔍 Step 2: Filtering unused articles...');
        const unused = await filterUnusedArticles(allArticles);

        if (unused.length === 0) {
            console.log('ℹ️  All articles already used. No new content to generate.');
            return;
        }

        // 3. 카드 생성 (최대 5개)
        const toProcess = unused.slice(0, 5);
        console.log(`\n✨ Step 3: Generating ${toProcess.length} cards...\n`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < toProcess.length; i++) {
            const article = toProcess[i];

            try {
                console.log(`[${i + 1}/${toProcess.length}] Processing: ${article.title}`);

                // AI 각색
                console.log('  🤖 Generating content with AI...');
                const card = await generateCard(article);

                // 관련 링크
                console.log('  🔗 Finding related articles...');
                const keywords = extractKeywords(article);
                const relatedMaterials = findRelatedArticles(article, allArticles, 4);

                // 이미지
                const imageUrl = generateImageUrl(card.category);

                // 카드 데이터 구성
                const cardData = {
                    headline: card.headline,
                    body: card.body,
                    bullets: card.bullets,
                    teaser: card.teaser,
                    category: card.category,
                    imageUrl,
                    related_materials: relatedMaterials,
                    timestamp: new Date().toISOString()
                };

                // 발행
                console.log('  📤 Publishing card...');
                await publishCard(cardData);

                // 사용 완료 마킹
                await markArticleAsUsed(article);

                successCount++;
                console.log(`  ✅ Success!\n`);

                // API 부담 방지 (3초 대기)
                if (i < toProcess.length - 1) {
                    console.log('  ⏳ Waiting 3 seconds...\n');
                    await sleep(3000);
                }

            } catch (error: any) {
                failCount++;
                console.error(`  ❌ Failed: ${error.message}\n`);
            }
        }

        // 결과 요약
        console.log('\n📊 Pipeline Summary:');
        console.log(`  ✅ Success: ${successCount}`);
        console.log(`  ❌ Failed: ${failCount}`);
        console.log(`  📚 Total used articles: ${await getUsedArticlesCount()}`);
        console.log('\n✨ Pipeline completed!\n');

    } catch (error: any) {
        console.error('\n❌ Pipeline Error:', error.message);
        throw error;
    }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 스케줄러 (30분마다 실행)
 */
function startScheduler() {
    console.log('⏰ Scheduler started (runs every 30 minutes)');

    // 즉시 한번 실행
    runPipeline().catch(console.error);

    // 30분마다 반복
    setInterval(() => {
        console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Scheduled run starting...`);
        runPipeline().catch(console.error);
    }, 30 * 60 * 1000);
}

/**
 * CLI 인터페이스
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'schedule') {
        // 스케줄 모드
        startScheduler();
    } else {
        // 단발 실행
        await runPipeline();
        process.exit(0);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exit(1);
    });
}

export { runPipeline, startScheduler };
