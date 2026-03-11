require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const dataGoKrKey = process.env.DATA_GO_KR_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("1. Deleting all old grants...");
    // Let's delete all k-startup and bizinfo grants to start fresh
    const { error: delError } = await supabase
        .from('grants')
        .delete()
        .in('source', ['data.go.kr', 'bizinfo', 'k-startup']);
        
    if (delError) console.error("Error deleting:", delError);
    else console.log("Deleted old grants successfully.");
    
    console.log("2. Running Edge Function to fetch fresh 2026 data...");
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/crawl-grants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const result = await response.json();
        console.log("Edge function result:", result);
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

main();
