const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ltoqdapmhyxwosxbpaip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc1NzYxMCwiZXhwIjoyMDgzMzMzNjEwfQ.2rwR4sWSg8ikynxhc5LP_4l3bn33aY5ckyMBqP3IPwc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Deleting bizinfo and seed legacy grants via Service Role...");
    const { error: e1 } = await supabase.from('grants').delete().in('source', ['bizinfo', 'seed', 'manual']);
    if (e1) console.error(e1);

    const { error: e2 } = await supabase.from('grants').delete().ilike('title', '%2016%');
    if (e2) console.error(e2);

    console.log("Deletion completed. Checking remaining legacy rows:");
    const { data: legacy } = await supabase.from('grants').select('title, source').ilike('title', '%2016%');
    console.log("Legacy 2016 grants left:", legacy?.length);
}
main();
