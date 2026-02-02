import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

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

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { text_content, filename } = await req.json();

        // Step 1: Classify Document
        const classificationRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: CLASSIFIER_PROMPT },
                    { role: 'user', content: `Filename: ${filename}\n\nText Preview: ${text_content.substring(0, 1000)}` }
                ],
                temperature: 0,
            }),
        });

        const clsData = await classificationRes.json();
        let docType = 'general';
        try {
            const clsParams = JSON.parse(clsData.choices[0].message.content.replace(/```json/g, '').replace(/```/g, ''));
            docType = clsParams.doc_type;
        } catch (e) { console.error("Classification Parsing Error", e); }

        // Step 2: Semantic Chunking (Mock Implementation for Edge)
        // In production, this would use embeddings + clustering. 
        // Here we strictly split by double newlines or common headers based on docType.

        let splitterRegex = /\n\n+/; // Default parameter-based

        if (docType === 'government_notice') {
            // Look for common headers like "1. 사업개요", "2. 지원자격"
            splitterRegex = /(?=\n\d+\.\s)/;
        } else if (docType === 'legal_doc') {
            // Look for "제N조"
            splitterRegex = /(?=\n제\d+조)/;
        }

        const chunks = text_content.split(splitterRegex).filter((c: string) => c.length > 50);

        // Step 3: Return processed logic (in real app, insert into DB here)
        const result = {
            metadata: {
                filename,
                detected_type: docType,
                total_chunks: chunks.length,
                processed_at: new Date().toISOString()
            },
            sample_chunk: chunks[0] // Preview
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
