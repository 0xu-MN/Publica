import { collectAllNews } from './news-collector';

async function checkNewsCollection() {
    console.log('📰 Collecting news...\n');
    const articles = await collectAllNews();

    const science = articles.filter(a => a.category === 'science');
    const economy = articles.filter(a => a.category === 'economy');

    console.log('📊 Collection Results:');
    console.log(`  🔬 Science: ${science.length} articles`);
    console.log(`  💼 Economy: ${economy.length} articles`);
    console.log(`  📚 Total: ${articles.length} articles\n`);

    if (science.length > 0) {
        console.log('🔬 Sample Science Articles:');
        science.slice(0, 3).forEach((a, i) => {
            console.log(`  ${i + 1}. ${a.title}`);
        });
    } else {
        console.log('❌ NO SCIENCE ARTICLES COLLECTED!');
    }
}

checkNewsCollection().catch(console.error);
