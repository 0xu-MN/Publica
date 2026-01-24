
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ltoqdapmhyxwosxbpaip.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTc2MTAsImV4cCI6MjA4MzMzMzYxMH0.gopYg-bzv84R_qCUbf25RTtULqDsxTdbl7jz45fHQm4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanup() {
    console.log('🧹 Cleaning up old feed data...');

    // Delete all records from 'cards' table
    // Note: In real prod we might want a where clause, but for this dev task we want a clean slate.
    const { error } = await supabase
        .from('cards')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all: id is not equal to a dummy UUID

    if (error) {
        console.error('❌ Error deleting cards:', error.message);
    } else {
        console.log('✅ Successfully purged old feed items.');
    }
}

cleanup();
