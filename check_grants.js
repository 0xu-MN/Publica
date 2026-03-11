require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function check() {
  const { data, error } = await supabase.from('grants').select('id, title').neq('is_active', false);
  console.log("Active grants count:", data ? data.length : 0);
  if (error) console.error(error);
}
check();
