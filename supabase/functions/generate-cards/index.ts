
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { title, keywords } = await req.json();

        if (!title || !keywords) {
            return new Response(
                JSON.stringify({ error: 'Title and keywords are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
        const geminiKey = Deno.env.get('GEMINI_API_KEY');

        if (!supabaseUrl || !supabaseKey || !geminiKey) {
            throw new Error('Missing environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, or GEMINI_API_KEY)');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const systemPrompt = `You are a Science/Economy Expert Editor. Reconstruct the given news into a completely new format based on the Title and Keywords.
    Design and Layout must remain unchanged.
    Output Format:
    - Headline: Attractive Title
    - Body: 150-250 characters of unique insight (Korean Expert Perspective)
    - Bullet: 3-4 key points
    - Related Materials: 4 related articles/papers (Title + Actual URL format)
    
    Do not copy the original text. Create original content.
    Return the result in JSON format:
    {
      "headline": "string",
      "body": "string",
      "bullets": ["string", "string", "string"],
      "related_materials": [{ "title": "string", "url": "string" }]
    }`;

        const userPrompt = `Title: ${title}
    Keywords: ${keywords}`;

        const result = await model.generateContent([systemPrompt, userPrompt]);
        const response = await result.response;
        const content = response.text();

        if (!content) {
            throw new Error('Failed to generate content');
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('cards')
            .insert({ content: content })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return new Response(
            JSON.stringify({ success: true, data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
