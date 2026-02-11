import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 2. Deep Analyzer System Prompt template
const ANALYZER_SYSTEM_PROMPT = `
You are Publica's Deep Analyzer.
Your Role: Analyze specific document chunks to answer user queries with high precision.

[Current Document Type]: {{DOC_TYPE}}

[Analysis Rules]:
- If 'Government Notice': Focus on "Eligibility", "Deadlines", "Funding limits", "Required docs". extract Facts.
- If 'Financial Report': Focus on "Revenue", "YoY Growth", "Risk Factors", "Forward-looking statements".
- If 'Research Paper': Focus on "Methodology", "Results", "Novelty".
- If 'Legal Doc': Focus on "Definitions", "Obligations", "Penalties".

[Output Format]:
Return ONLY JSON:
{
  "summary": "Context-aware summary of the answer",
  "key_facts": [
    { "label": "Label (e.g. Deadline)", "value": "Value (e.g. 2024.12.31)" }
  ],
  "references": [
    { "title": "Doc Title", "source": "Issuer", "page": "P.12", "section": "Section Name", "url": "", "snippet": "Relevant text..." }
  ]
}
`;

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { query, context_node, doc_type_hint } = await req.json(); // doc_type_hint comes from previous upload-knowledge step

        // 1. Construct Dynamic System Prompt
        const currentDocType = doc_type_hint || 'general';
        const finalSystemPrompt = ANALYZER_SYSTEM_PROMPT.replace('{{DOC_TYPE}}', currentDocType);

        // 2. Call OpenAI
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: finalSystemPrompt },
                    { role: 'user', content: `User Query: ${query}\nContext Node: ${context_node?.label || 'None'}\n\n(Simulated Retrieved Chunks would go here in RAG system)` }
                ],
                temperature: 0.3, // Fact-based, low temp
            }),
        });

        const aiData = await openAIResponse.json();
        const content = aiData.choices[0].message.content;

        let parsedData = {};
        try {
            parsedData = JSON.parse(content.replace(/```json/g, '').replace(/```/g, ''));
        } catch (e) {
            parsedData = { summary: content, key_facts: [], references: [] };
        }

        return new Response(JSON.stringify(parsedData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
