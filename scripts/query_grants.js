require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
async function main() {
    const { data, error } = await supabase.from('grants').select('title, source, application_period').ilike('title', '%2016%');
    console.log(data);
}
main();
