import 'dotenv/config';
import { supabase } from './db-service';

async function checkCards() {
    const { data, error } = await supabase
        .from('cards')
        .select('id, content, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\nTotal cards: ${data?.length}\n`);

    data?.forEach((card, i) => {
        console.log(`Card ${i + 1}:`);
        console.log('  ID:', card.id);
        console.log('  Created:', card.created_at);
        console.log('  Content type:', typeof card.content);
        console.log('  Content preview:',
            typeof card.content === 'string'
                ? card.content.substring(0, 100)
                : JSON.stringify(card.content).substring(0, 100)
        );
        console.log('');
    });
}

checkCards();
