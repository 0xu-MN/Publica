import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

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

You are "InsightFlow", an elite strategic AI partner.
Your goal is to guide the user through a 3-step workflow: 1. Hypothesis (Expand) -> 2. Verification (Evidence) -> 3. Planning (Action).

## 🚨 CRITICAL RULES
1. **LANGUAGE:** ALWAYS reply in **KOREAN** (한국어).
2. **PROACTIVE SUGGESTIONS:** You MUST return a \`suggested_actions\` array with 3 distinct options based on the context:
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
        "description": "Detailed analysis. Max 300 chars.",
        "type": "Insight" | "Risk" | "Opportunity",
        "references": []
      }
    ]
  },
  
  // 🌟 [NEW] Proactive Suggestions
  "suggested_actions": [
    {
      "label": "Button Label (e.g. 경쟁사 분석 심화)",
      "type": "EXPAND", 
      "query": "Detailed prompt to execute this action..."
    },
    {
      "label": "Button Label (e.g. 관련 논문/근거 찾기)",
      "type": "VERIFY", 
      "query": "Find external evidence and references for this node..."
    },
    {
      "label": "Button Label (e.g. 실행 계획 수립하기)",
      "type": "PLAN", 
      "query": "Create a step-by-step action plan based on this hypothesis..."
    }
  ]
}
`;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { user_input, user_job, task_mode } = await req.json();

        // 1. Prompt Engineering
        const finalPrompt = `
    [User Profile]: ${user_job || 'General Strategist'}
    [Task Mode]: ${task_mode || 'Hypothesis Generator'}
    [Input]: ${user_input}
    
    Generate the structured breakdown now.
    `;

        // 2. Call OpenAI (via fetch for Deno)
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: finalPrompt }
                ],
                temperature: 0.7,
            }),
        });

        const aiData = await openAIResponse.json();

        if (!aiData.choices || aiData.choices.length === 0) {
            throw new Error('OpenAI returned no choices');
        }

        // 3. Parse & Validate
        const content = aiData.choices[0].message.content;
        let parsedData: AgentResponse;

        try {
            // Remove any markdown code fences if present
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedData = JSON.parse(cleaned);
        } catch (e) {
            console.error("JSON Parse Error:", content);
            return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            });
        }

        // 4. Return to Client
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
