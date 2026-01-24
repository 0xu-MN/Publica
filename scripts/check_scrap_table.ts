
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ltoqdapmhyxwosxbpaip.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTc2MTAsImV4cCI6MjA4MzMzMzYxMH0.gopYg-bzv84R_qCUbf25RTtULqDsxTdbl7jz45fHQm4';

// Use a service role key if available for checking DB admin stuff, but here we only have anon.
// However, we can try to insert with a random user UUID if RLS allows (which it usually doesn't for anon unless auth matches).
// BUT, if the table doesn't exist, we'll get a specific error.

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTable() {
    console.log('🔍 Checking if "scraps" table exists...');

    // Try to select from the table. Even if empty or RLS blocks, the error will differ if table is missing.
    const { data, error } = await supabase
        .from('scraps')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error accessing "scraps" table:', error.message);
        console.error('Details:', error);

        if (error.code === '42P01') {
            console.log('🚨 DIAGNOSIS: The "scraps" table does not exist. The migration SQL has not been executed.');
        } else if (error.code === 'PGRST301') {
            console.log('ℹ️ RLS might be blocking access, but table likely exists.');
        }
    } else {
        console.log('✅ "scraps" table exists and is accessible.');
    }
}

checkTable();
