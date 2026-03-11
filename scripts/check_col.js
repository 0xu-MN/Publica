const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ltoqdapmhyxwosxbpaip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc1NzYxMCwiZXhwIjoyMDgzMzMzNjEwfQ.2rwR4sWSg8ikynxhc5LP_4l3bn33aY5ckyMBqP3IPwc';
const supabase = createClient(supabaseUrl, supabaseKey);
async function main() {
    const { data, error } = await supabase.from('workspace_sessions').select('brainstorm_content').limit(1);
    if (error) {
        console.error("Missing col!", error);
    } else {
        console.log("Col exists!");
    }
}
main();
