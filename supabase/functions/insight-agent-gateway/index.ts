import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { user_input, user_domain } = await req.json();
        const API_KEY = Deno.env.get('GEMINI_API_KEY');

        // 1. Define Persona & Goal
        const role = user_domain === 'SCIENCE' ? 'Principal Investigator' : 'Strategic Analyst';
        const focus = user_domain === 'SCIENCE' ? 'Mechanism & Tech' : 'Market & Growth';

        // 2. System Prompt (Strict JSON)
        const systemPrompt = `
    You are InsightFlow AI (Role: ${role}).
    Analyze "${user_input}" focusing on ${focus}.
    
    [OUTPUT RULES]
    1. Return ONLY valid JSON. No Markdown blocks.
    2. 'type' MUST be "mind_map".
    
    Response Structure:
    {
      "chat_message": "Short insight summary. End with a question to guide exploration.",
      "workspace_data": {
        "type": "mind_map",
        "root_node": "Short Title",
        "branches": [
           { "id": "1", "label": "Key Insight 1", "description": "Detail..." },
           { "id": "2", "label": "Key Insight 2", "description": "Detail..." },
           { "id": "3", "label": "Key Insight 3", "description": "Detail..." }
        ]
      }
    }
    `;

        // 3. Call Gemini (🌟 UPDATED TO 2.5-FLASH 🌟)
        // The previous error was because we used 1.5-flash. Now we use 2.5-flash.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });

        const data = await response.json();

        // 4. Parse Response (With Fail-Safe)
        let parsedData = null;

        if (!data.candidates || !data.candidates[0]) {
            console.error("⚠️ AI Error:", JSON.stringify(data));
            // Fallback if AI fails (e.g. Safety Block)
            parsedData = {
                chat_message: "⚠️ System Alert: " + (data.error?.message || "Model Busy"),
                workspace_data: {
                    type: 'mind_map',
                    root_node: "Connection Issue",
                    branches: [
                        { id: 'e1', label: 'Model Mismatch', description: "Check if Gemini 2.5 is enabled." },
                        { id: 'e2', label: 'Retry', description: "Please try asking again." }
                    ]
                }
            };
        } else {
            let rawText = data.candidates[0].content.parts[0].text;
            rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            try {
                parsedData = JSON.parse(rawText);
            } catch (e) {
                parsedData = {
                    chat_message: "Data parsing error.",
                    workspace_data: {
                        type: 'mind_map',
                        root_node: "Parse Error",
                        branches: [{ id: 'p1', label: 'Raw Output', description: rawText.substring(0, 50) }]
                    }
                };
            }
        }

        // 5. Final Guarantee
        if (parsedData.workspace_data) parsedData.workspace_data.type = 'mind_map';

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
