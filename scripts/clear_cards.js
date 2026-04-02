require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function clearCards() {
    console.log('Attempting to delete all cards by filtering where id is not null...');
    const { data, error } = await supabase.from('cards').delete().not('id', 'is', null);
    if (error) {
        console.error('Error deleting cards:', error);
    } else {
        console.log('Successfully deleted all cards. Data:', data);
    }
}

clearCards();
