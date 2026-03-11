require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Purging all bizinfo and data.go.kr data to remove 2016 grants...");
    await supabase.from('grants').delete().in('source', ['bizinfo', 'data.go.kr', 'k-startup', 'seed']);

    console.log("Re-triggering Edge Function for fresh 2026 data only...");
    const fetch = require('node-fetch');
    const response = await fetch(`${supabaseUrl}/functions/v1/crawl-grants`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    if (response.ok) {
        console.log("Successfully fetched new data:", await response.json());
    } else {
        console.error("Failed to fetch Edge function:", await response.text());
    }
}
main();
