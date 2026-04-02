require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkCards() {
    const { data, count, error } = await supabase.from('cards').select('*', { count: 'exact' });
    console.log('Cards count:', count);
}

checkCards();
