const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
    console.log("Testing save...");
    
    const payload = {
        title: "Test Project",
        mode: "Literature Review",
        workspace_data: [],
        chat_history: [],
        updated_at: new Date().toISOString()
    };
    
    // We don't have user id here easily, but let's query a user id first
    const { data: users, error: errorUser } = await supabase.from('profiles').select('id').limit(1);
    const userId = users[0].id;
    console.log("User ID:", userId);
    
    payload.user_id = userId;
    
    let res = await supabase.from('workspace_sessions').insert(payload).select();
    console.log("Basic Insert Result:", res);
    
    if(!res.error) {
        // Try extended
        const extendedPayload = {
            ...payload,
            pdf_url: null,
            brainstorm_content: 'test'
        };
        const extRes = await supabase.from('workspace_sessions').update(extendedPayload).eq('id', res.data[0].id).select();
        console.log("Extended Update Result:", extRes);
    }
}
testSave();
