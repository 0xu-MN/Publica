// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

// ─── LLM Configuration (change model here to switch) ───
const LLM_MODEL = 'gemini-2.5-flash'; // Options: gemini-2.0-flash, gemini-2.5-pro, gemini-2.5-flash
const LLM_TEMPERATURE = 0.7;

// Define strict interface for Type Safety
interface AgentResponse {
    chat_message: string;
    workspace_data: {
        root_node: string;
        branches: Array<{
            id: string;
            label: string;
            description: string;
            type: string;
            references: Array<{
                title: string;
                source: string;
                date: string;
                url: string;
            }>;
        }>;
    };
    suggested_actions?: Array<{
        label: string;
        type: string;
        query: string;
    }>;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ------------------------------------------------------------------
// SYSTEM PROMPT: Strategist Persona & Strict JSON
// ------------------------------------------------------------------
const SYSTEM_PROMPT = `
You are a KOREAN AI Agent.
No matter what, YOU MUST OUTPUT IN KOREAN.
Do not use English titles or descriptions.

You are "Publica", an elite strategic AI partner for government grants and startup business planning.
Your goal is to guide the user through a 3-step workflow: 1. Hypothesis (Expand) -> 2. Verification (Evidence) -> 3. Planning (Action).

## 🚨 CRITICAL RULES
1. **LANGUAGE:** ALWAYS reply in **KOREAN** (한국어).
2. **QUALITY OVER QUANTITY:** The \`description\` field MUST BE HIGHLY DETAILED. Do not write simple 1-2 sentence summaries. You must write like a top-tier management consultant. Use markdown formatting (bullet points, bold text, numbered lists) inside the description string to make it highly structured and readable. Emphasize the **PSST Framework** (Problem, Solution, Scale-up, Team) wherever applicable.
3. **PROACTIVE SUGGESTIONS:** You MUST return a \`suggested_actions\` array with 3 distinct options based on the context:
   - **Option 1 (Deep Dive):** Suggest digging deeper into the current topic (e.g., "Analyze Competitors").
   - **Option 2 (Verification):** Suggest finding evidence (e.g., "Search for Academic Papers", "Upload Financial Report").
   - **Option 3 (Planning):** Suggest moving to the execution phase (e.g., "Create Action Plan", "Design Experiments").

## JSON Output Structure (Strict)
Return a SINGLE JSON object:
{
  "chat_message": "Short summary of the analysis.",
  "workspace_data": {
    "root_node": "Context Header",
    "branches": [
      {
        "id": "uuid",
        "label": "Short Keyword",
        "description": "HIGHLY DETAILED analysis. Minimum 300 chars. Use Markdown (--, **, 1.) to structure the consultant-level advice. Address PSST (Problem, Solution, Scale-up, Team) metrics in depth.",
        "type": "Insight" | "Risk" | "Opportunity",
        "references": []
      }
    ]
  },
  
  // 🌟 Proactive Suggestions
  "suggested_actions": [
    {
      "label": "Button Label (e.g. 경쟁사 분석 심화)",
      "type": "EXPAND", 
      "query": "Detailed prompt to execute this action..."
    },
    {
      "label": "Button Label (e.g. 객관적 지표/근거 찾기)",
      "type": "VERIFY", 
      "query": "Find external evidence and references for this node..."
    },
    {
      "label": "Button Label (e.g. 세부 실행 계획 수립)",
      "type": "PLAN", 
      "query": "Create a step-by-step action plan based on this hypothesis..."
    }
  ]
}
`;

Deno.serve(async (req: any) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { user_input, user_job, task_mode } = await req.json();
        const apiKey = Deno.env.get('GEMINI_API_KEY');

        if (!apiKey) {
            console.error("❌ GEMINI_API_KEY is missing");
            throw new Error("Server Misconfiguration: GEMINI_API_KEY is missing");
        }

        // 1. Prompt Engineering
        const finalPrompt = `
    [User Profile]: ${user_job || 'General Strategist'}
    [Task Mode]: ${task_mode || 'Hypothesis Generator'}
    [Input]: ${user_input}
    
    Generate the structured breakdown now.
    `;

        // 2. Call LLM (configurable via LLM_MODEL)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODEL}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: SYSTEM_PROMPT + "\n\n" + finalPrompt }]
                    }],
                    generationConfig: {
                        temperature: LLM_TEMPERATURE,
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

        // 3. Parse & Validate
        let parsedData: AgentResponse;

        try {
            parsedData = JSON.parse(rawText);
        } catch (e) {
            console.error("JSON Parse Error:", rawText);
            return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            });
        }

        // 4. Return to Client
        return new Response(JSON.stringify(parsedData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Gateway Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
