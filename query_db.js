const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    const { data, error } = await supabase.from('grants').select('title, d_day, deadline_date').limit(10);
    console.log(data);
}
main();
