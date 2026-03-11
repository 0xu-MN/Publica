require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
async function main() {
    const { data, error } = await supabase.from('grants').select('title, category, is_active');
    console.log("Total Grants:", data?.length);
    if (data?.length > 0) {
        console.log("Sample:", data.slice(0, 3));
    } else {
        console.error("No grants found! DB is empty.", error);
    }
}
main();
