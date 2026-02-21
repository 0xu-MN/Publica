// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🧠 Smart Colleague Persona
const EXPLAINER_SYSTEM_PROMPT = `
You are an expert academic research colleague (PhD level) named 'Moonlight'.
Your goal is to help the user understand complex academic texts deeply, efficiently, and contextually.

[Role & Tone]:
- Tone: Professional, Insightful, Encouraging but Rigorous.
- Perspective: Don't just translate words; translate *meaning* and *implication*.
- Method: Use the Socratic method where appropriate (ask a guiding question if it helps understanding).

[Task]:
Analyze the provided text selection within its **Parent Section** context.
Provide a structured explanation that bridges the specific detail (Micro) with the section's goal (Macro).

[Output Format]:
Return ONLY valid JSON:
{
  "outcome": "A concise (1-2 sentences) summary of what this specific text is saying.",
  "key_terms": [
    { "term": "Term 1", "definition": "Concise definition relevant to this context." },
    { "term": "Term 2", "definition": "..." }
  ],
  "context_significance": "Explain how this text contributes to the [Parent Section]. (e.g., 'In the context of [Section Title], this data valdiates...')",
  "related_concepts": ["Concept A", "Concept B"],
  "questions": ["A thoughtful question to check understanding or prompt further thought (optional)."]
}

[Modes]:
- If mode is 'translate': Provide a *literal* translation first in 'outcome', then explain nuances in 'context_significance'.
- If mode is 'explain': Focus on concepts and logic.
- If mode is 'simplify': Explain it like I'm an undergraduate.

[Language]:
- If the input text is English, provide the explanation in **Korean** (unless requested otherwise).
- If the input text is Korean, provide the explanation in Korean.
`;

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { text, context, mode } = await req.json();
        const apiKey = Deno.env.get('GEMINI_API_KEY');

        if (!apiKey) {
            console.error("❌ GEMINI_API_KEY is missing");
            throw new Error("Server Misconfiguration: GEMINI_API_KEY is missing");
        }

        const userPrompt = `
        Mode: ${mode || 'explain'}
        Selected Text: "${text}"
        Parent Section: "${context?.sectionTitle || 'Unknown Section'}"
        surrounding_context: "${JSON.stringify(context)}"
        `;

        // Call Gemini 1.5 Pro
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: EXPLAINER_SYSTEM_PROMPT + "\n\n" + userPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
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

        console.log("🧠 Smart Explanation Generated:", rawText.substring(0, 100) + "...");

        let parsedData = {};
        try {
            parsedData = JSON.parse(rawText);
        } catch (e) {
            console.error("JSON Parse Error:", rawText);
            parsedData = {
                outcome: "Error parsing AI response.",
                key_terms: [],
                context_significance: rawText // Fallback to raw text
            };
        }

        return new Response(JSON.stringify(parsedData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Explanation Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
