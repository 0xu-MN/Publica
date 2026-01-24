
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ltoqdapmhyxwosxbpaip.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTc2MTAsImV4cCI6MjA4MzMzMzYxMH0.gopYg-bzv84R_qCUbf25RTtULqDsxTdbl7jz45fHQm4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    console.log('Checking latest entries in "cards" table...');
    const { data, error } = await supabase
        .from('cards')
        .select('id, created_at, content')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No data found.');
    } else {
        console.log(`Found ${data.length} recent entries:`);
        data.forEach(row => {
            const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
            console.log(`[${new Date(row.created_at).toLocaleString()}] ${content.headline}`);
        });
    }
}

check();
