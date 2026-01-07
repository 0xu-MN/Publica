require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function checkData() {
    const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .limit(5);

    if (error) console.error(error);

    console.log('Saved News Items:', data.length);
    if (data.length > 0) {
        console.log('Sample Item:', {
            title: data[0].title,
            summary_length: data[0].ai_summary.length,
            is_trending: data[0].is_trending,
            tags: data[0].tags
        });
    }
}

checkData();
