require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
async function main() {
    const { data: all_grants, error } = await supabase.from('grants').select('source, title');
    if (error) console.error(error);
    console.log("Total grants:", all_grants?.length);
    const legacy = all_grants?.filter(g => g.title.includes('2016'));
    console.log("Legacy 2016 grants:", legacy?.length);
    if (legacy && legacy.length > 0) {
        console.log("Sample legacy:", legacy.slice(0, 3));
    }
}
main();
