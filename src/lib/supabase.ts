
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ltoqdapmhyxwosxbpaip.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTc2MTAsImV4cCI6MjA4MzMzMzYxMH0.gopYg-bzv84R_qCUbf25RTtULqDsxTdbl7jz45fHQm4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
