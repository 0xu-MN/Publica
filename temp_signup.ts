import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Attempting to create toss_test@publica.ai...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'toss_test@publica.ai',
        password: 'tosstestpassword123!'
    });

    if (signInData.user) {
        console.log('User already exists and can log in:', signInData.user.id);
        return;
    }

    console.log('Login failed, attempting sign up...', signInError?.message);

    const { data, error } = await supabase.auth.signUp({
        email: 'toss_test@publica.ai',
        password: 'tosstestpassword123!',
    });

    if (error) {
        console.error('Sign up failed:', error);
    } else {
        console.log('Sign up successful:', data.user?.id);
        
        // Also ensure profile has user_type if needed
        if (data.user) {
            const { error: profileError } = await supabase.from('profiles').update({
                user_type: 'individual',
                name: 'Toss Tester'
            }).eq('id', data.user.id);
            if (profileError) {
                console.error('Profile update failed (maybe OK if trigger handles it):', profileError);
            } else {
                console.log('Profile updated successfully');
            }
        }
    }
}

main();
