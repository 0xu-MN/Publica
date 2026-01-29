
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ltoqdapmhyxwosxbpaip.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTc2MTAsImV4cCI6MjA4MzMzMzYxMH0.gopYg-bzv84R_qCUbf25RTtULqDsxTdbl7jz45fHQm4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function removeDuplicates() {
    console.log('🔍 Scanning for duplicate feeds...');

    const { data: cards, error } = await supabase
        .from('cards')
        .select('id, content, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Failed to fetch cards:', error);
        return;
    }

    console.log(`📊 Total cards found: ${cards.length}`);

    const headlineMap = new Map<string, any[]>();
    const idsToDelete: string[] = [];

    // Group by Headline
    cards.forEach(card => {
        try {
            const content = typeof card.content === 'string' ? JSON.parse(card.content) : card.content;
            const headline = content.headline || content.title;

            if (headline) {
                if (!headlineMap.has(headline)) {
                    headlineMap.set(headline, []);
                }
                headlineMap.get(headline).push(card);
            }
        } catch (e) {
            // Ignore parse errors
        }
    });

    // Identify Duplicates
    headlineMap.forEach((group, headline) => {
        if (group.length > 1) {
            // Keep the first one (most recent, because we ordered by created_at desc)
            // Delete the rest (index 1 to end)
            const duplicates = group.slice(1);
            duplicates.forEach(d => idsToDelete.push(d.id));
            console.log(`🗑️ Found ${duplicates.length} duplicate(s) for: "${headline}"`);
        }
    });

    if (idsToDelete.length === 0) {
        console.log('✅ No duplicates found! Your feed is clean.');
        return;
    }

    console.log(`⚠️ Identifying ${idsToDelete.length} duplicate items to delete...`);

    // Batch Delete
    const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error('❌ Error deleting duplicates:', deleteError);
    } else {
        console.log(`✅ Successfully deleted ${idsToDelete.length} duplicate items.`);
        console.log('✨ Feed cleanup complete!');
    }
}

removeDuplicates().catch(console.error);
