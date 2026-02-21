// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

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
- If 'Government Notice': Focus on "Eligibility", "Deadlines", "Funding limits", "Required docs". Extract Facts.
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

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { query, context_node, doc_type_hint } = await req.json(); // doc_type_hint comes from previous upload-knowledge step
        const apiKey = Deno.env.get('GEMINI_API_KEY');

        if (!apiKey) {
            console.error("❌ GEMINI_API_KEY is missing");
            throw new Error("Server Misconfiguration: GEMINI_API_KEY is missing");
        }

        // 1. Construct Dynamic System Prompt
        const currentDocType = doc_type_hint || 'general';
        const finalSystemPrompt = ANALYZER_SYSTEM_PROMPT.replace('{{DOC_TYPE}}', currentDocType);

        const userPrompt = `User Query: ${query}\nContext Node: ${context_node?.label || 'None'}\n\n(Simulated Retrieved Chunks would go here in RAG system)`;

        // 2. Call Gemini 1.5 Pro
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: finalSystemPrompt + "\n\n" + userPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.3, // Fact-based, low temp
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

        let parsedData = {};
        try {
            parsedData = JSON.parse(rawText);
        } catch (e) {
            console.error("JSON Parse Error:", rawText);
            parsedData = {
                summary: "Error parsing AI response",
                key_facts: [],
                references: []
            };
        }

        return new Response(JSON.stringify(parsedData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Analyzer Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
