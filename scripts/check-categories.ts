import { supabase } from './db-service';

async function checkCategories() {
    const { data } = await supabase.from('cards').select('content');

    if (!data) {
        console.log('No cards found');
        return;
    }

    const categories = data.map(d => {
        try {
            const content = JSON.parse(d.content);
            return content.category;
        } catch {
            return 'unknown';
        }
    });

    const science = categories.filter(c => c === 'Science').length;
    const economy = categories.filter(c => c === 'Economy').length;

    console.log('\n📊 Category Distribution:');
    console.log(`  Science: ${science} (${Math.round(science / categories.length * 100)}%)`);
    console.log(`  Economy: ${economy} (${Math.round(economy / categories.length * 100)}%)`);
    console.log(`  Total: ${categories.length}\n`);
}

checkCategories().catch(console.error);
