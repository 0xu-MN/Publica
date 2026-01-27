import { supabase } from './db-service';

async function checkRecentCategories() {
    // 최근 20개 카드만
    const { data } = await supabase
        .from('cards')
        .select('content, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (!data) {
        console.log('No cards found');
        return;
    }

    console.log('\n📊 Recent 20 Cards:');
    console.log('═'.repeat(50));

    data.forEach((card, i) => {
        try {
            const content = JSON.parse(card.content);
            const date = new Date(card.created_at).toLocaleString('ko-KR');
            const category = content.category === 'Science' ? '🔬 과학' : '💼 경제';
            console.log(`${i + 1}. ${category} - ${content.headline}`);
        } catch (e) {
            console.log(`${i + 1}. ❌ Parse error`);
        }
    });

    const categories = data.map(d => {
        try {
            return JSON.parse(d.content).category;
        } catch {
            return 'unknown';
        }
    });

    const science = categories.filter(c => c === 'Science').length;
    const economy = categories.filter(c => c === 'Economy').length;

    console.log('\n' + '═'.repeat(50));
    console.log(`🔬 Science: ${science}/20 (${Math.round(science / 20 * 100)}%)`);
    console.log(`💼 Economy: ${economy}/20 (${Math.round(economy / 20 * 100)}%)`);
    console.log('═'.repeat(50) + '\n');
}

checkRecentCategories().catch(console.error);
