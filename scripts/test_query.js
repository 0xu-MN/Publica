require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    console.log("Fetching matching grants...");
    const { data, error } = await supabase
        .from('grants')
        .select('id, title, source, agency')
        .ilike('title', '%2016%');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found", data?.length, "grants");
        console.log(data?.slice(0, 5));
    }
}
main();
