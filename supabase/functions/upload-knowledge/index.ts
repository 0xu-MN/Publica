// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 1. Document Classifier System Prompt
const CLASSIFIER_PROMPT = `
You are an expert Document Classifier.
Analyze the provided text excerpt (first 500-1000 chars) and classify it into one of the following types:
- 'research_paper': Academic papers, journals.
- 'government_notice': Public announcements, RFPs, support program guides.
- 'financial_report': IR materials, earnings calls, balance sheets.
- 'legal_doc': Laws, regulations, terms of service.
- 'general': Anything else.

Return JSON: { "doc_type": "string", "confidence": number }
`;

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { text_content, filename } = await req.json();

        // Step 1: Classify Document using Gemini 1.5 Pro
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: `${CLASSIFIER_PROMPT}\n\nFilename: ${filename}\n\nText Preview: ${text_content.substring(0, 1000)}` }]
                    }],
                    generationConfig: {
                        temperature: 0,
                        responseMimeType: "application/json"
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${errorText}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        let docType = 'general';
        try {
            const clsParams = JSON.parse(rawText);
            docType = clsParams.doc_type || 'general';
        } catch (e) { console.error("Classification Parsing Error", e); }

        // Step 2: Semantic Chunking (Mock Implementation)
        let splitterRegex = /\n\n+/; // Default

        if (docType === 'government_notice') {
            splitterRegex = /(?=\n\d+\.\s)/;
        } else if (docType === 'legal_doc') {
            splitterRegex = /(?=\n제\d+조)/;
        }

        const chunks = text_content.split(splitterRegex).filter((c: string) => c.length > 50);

        // Step 3: Return result
        const result = {
            metadata: {
                filename,
                detected_type: docType,
                total_chunks: chunks.length,
                processed_at: new Date().toISOString(),
                model: "gemini-1.5-pro"
            },
            sample_chunk: chunks[0] // Preview
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
