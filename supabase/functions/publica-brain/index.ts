import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { markdown } = await req.json();
        const apiKey = Deno.env.get('GEMINI_API_KEY');

        // 키가 바뀌었는지 로그로 힌트 확인 (보안상 앞 4자리만)
        console.log(`🔑 [Brain] Using API Key: ${apiKey?.substring(0, 4)}...`);

        if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

        // 안정성을 위해 15,000자 제한 (gemini-pro 최적화)
        const truncatedMarkdown = markdown ? markdown.substring(0, 15000) : "";
        console.log(`🧠 [Brain] Processing ${truncatedMarkdown.length} chars using gemini-pro...`);

        const genAI = new GoogleGenerativeAI(apiKey);

        // 범용적으로 사용 가능한 gemini-pro 모델로 변경 (404 에러 방지)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
    You are an expert startup strategist specializing in Korean government grants.
    Analyze the provided document and create a winning strategy for a 'Preliminary Startup Package' (예비창업패키지) applicant.
    
    Target Document (Markdown):
    ---
    ${truncatedMarkdown}
    ---

    Your Task:
    Based on the document, generate a specific, actionable strategic plan in Korean.
    
    Output Format (JSON Only):
    {
      "hypothesis": "One powerful sentence in Korean summarizing the core success strategy.",
      "steps": [
        { "step_number": 1, "title": "Step Title", "description": "Actionable advice in Korean.", "action_type": "research" },
        { "step_number": 2, "title": "Step Title", "description": "Actionable advice in Korean.", "action_type": "research" },
        { "step_number": 3, "title": "Step Title", "description": "Actionable advice in Korean.", "action_type": "research" },
        { "step_number": 4, "title": "Step Title", "description": "Actionable advice in Korean.", "action_type": "documentation" }
      ]
    }
    Return ONLY valid JSON.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // JSON 정제 (마크다운 블록 제거)
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const strategyPlan = JSON.parse(cleanedText);

        console.log("✅ [Brain] Strategy Generated Successfully with Gemini Pro!");

        return new Response(
            JSON.stringify({ success: true, strategyPlan }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error(`🚨 Brain Error: ${error.message}`);
        return new Response(
            JSON.stringify({
                success: false,
                error: `API Call Failed: ${error.message}`,
                strategyPlan: {
                    hypothesis: "API 키 권한 또는 모델 서빙 오류가 발생했습니다.",
                    steps: [{
                        step_number: 1,
                        title: "키 확인 필요",
                        description: "Google AI Studio에서 새로 발급받은 키가 Supabase Secrets에 올바르게 설정되었는지 확인해주세요. (Error: " + error.message + ")",
                        action_type: "error"
                    }]
                }
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
