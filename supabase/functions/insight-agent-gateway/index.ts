import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { user_input, user_job, task_mode } = await req.json();
        const API_KEY = Deno.env.get('GEMINI_API_KEY');

        // 1. Dynamic Mode Instructions (Liner / Moonlight / n8n Phases)
        let modeInstruction = "";

        switch (task_mode) {
            case "Hypothesis Generator": // Liner Phase (Exploration)
                modeInstruction = `
                [MODE: EXPLORATION & HYPOTHESIS]
                - GOAL: Diverge and brainstorm. Offer various perspectives (Market, Tech, Policy).
                - ACTION: Break down the topic into mutually exclusive, collectively exhaustive (MECE) branches.
                - TONE: Creative, strategic, and broad.
                `;
                break;
            case "Literature Review": // Moonlight Phase (Verification)
                modeInstruction = `
                [MODE: VERIFICATION & EVIDENCE]
                - GOAL: Verify facts with academic or industrial sources.
                - ACTION: Focus on citations, key papers, and concrete data points.
                - TONE: Academic, rigorous, and evidence-based.
                `;
                break;
            case "Research Planner": // n8n Phase (Planning)
                modeInstruction = `
                [MODE: PLANNING & METHODOLOGY]
                - GOAL: Create a step-by-step roadmap.
                - ACTION: Outline a sequential process (Step 1 -> Step 2 -> Step 3).
                - TONE: Practical, actionable, and structured.
                `;
                break;
            default: // General / Data Analyst
                modeInstruction = `
                [MODE: GENERAL ANALYSIS]
                - GOAL: Provide balanced insight.
                - ACTION: Explain concepts clearly and professionally.
                `;
                break;
        }

        // 2. Persona Generator
        const personaPrompt = `
        [ROLE DEFINITION]
        User's Profession: ${user_job || "General Strategist"}.
        ACT AS: A world-class expert and advisor in the field of "${user_job}".
        
        [ANALYSIS LENS]
        - If the user is a "VC/Investor": Focus on TAM, CAGR, ROI, Moat, and Exit Strategy. Cite: Bloomberg, TechCrunch.
        - If the user is a "Researcher/Scientist": Focus on Methodology, Mechanism, Experiments, and Citations. Cite: Nature, PubMed.
        - For others: Adapt accordingly.
        `;

        const systemPrompt = `
        ${personaPrompt}
        
        ${modeInstruction}
        
        [TASK]
        Analyze the input and expand the knowledge graph step-by-step.
        
        [OUTPUT RULES]
        1. Return ONLY valid JSON.
        2. 'type' MUST be "mind_map".
        
        Response Structure:
        {
          "chat_message": "Summary regarding '${user_input}' in ${task_mode || 'General'} mode.",
          "workspace_data": {
            "type": "mind_map",
            "root_node": "Topic Title",
            "summary": "Deep insight regarding the node (3-4 sentences).",
            "references": [
                "Source 1 (Date) - Key Finding",
                "Source 2 (Date) - Key Finding"
            ],
            "branches": [
               { "id": "1", "label": "Sub-point 1", "description": "Context..." },
               { "id": "2", "label": "Sub-point 2", "description": "Context..." },
               { "id": "3", "label": "Sub-point 3", "description": "Context..." }
            ]
          }
        }
        `;

        // 3. Call Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\n[USER INPUT]: ${user_input}` }] }]
            })
        });

        const data = await response.json();
        let parsedData = null;

        if (data.candidates && data.candidates[0]) {
            const rawText = data.candidates[0].content.parts[0].text;
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try { parsedData = JSON.parse(jsonMatch[0]); } catch (e) { }
            } else {
                try { parsedData = JSON.parse(rawText); } catch (e) { }
            }
        }

        if (!parsedData) {
            parsedData = {
                chat_message: "⚠️ Analysis could not be completed.",
                workspace_data: {
                    type: 'mind_map',
                    root_node: "Error",
                    summary: "AI response led to a parsing error or was blocked.",
                    branches: []
                }
            };
        }
        if (parsedData.workspace_data) parsedData.workspace_data.type = 'mind_map';

        return new Response(JSON.stringify(parsedData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
