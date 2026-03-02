// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

const LLM_MODEL = 'gemini-2.5-pro'; // Use PRO model for premium document generation
const LLM_TEMPERATURE = 0.5; // Lower temp for more professional, deterministic writing

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `
You are an elite Korean Startup Consultant and Government Grant Evaluator.
Your task is to synthesize the user's business idea and their "Strategy Mind Map Brainstorming" into a highly professional, 
ready-to-submit Business Plan (사업계획서) in the standard Korean PSST framework.

## 🚨 CRITICAL RULES
1. **LANGUAGE:** ALWAYS reply in **KOREAN** (한국어). Use formal, persuasive, and professional business Korean (하십시오체/개조식).
2. **FORMAT:** Output ONLY valid Markdown. Use ##, ###, bullet points (-), and bold text (**) extensively to make it readable.
3. **PSST FRAMEWORK:** You MUST strictly follow this structure:
   - # [프로젝트 명] (Create a compelling title)
   - ## 1. 문제인식 (Problem)
     - 현 시장의 문제점 및 고객의 Pain Point
     - 해결의 필요성
   - ## 2. 해결방안 (Solution)
     - 제공하는 서비스/제품의 구체적 설명
     - 경쟁사 대비 차별성 및 우위성 (경쟁력)
   - ## 3. 성장전략 (Scale-up)
     - 국내외 시장 진출 및 타겟 고객 확보 전략
     - 수익 창출 모델 (BM) 및 예상 매출
   - ## 4. 팀 구성 (Team)
     - 대표자 및 팀원의 전문성 
     - 사업 추진 역량
   - ## 5. 자금 소요 계획 (Budgeting)
     - 정부지원금 활용 및 마일스톤
4. **NO FLUFF:** Do not output any conversational text like "Here is your business plan". Output ONLY the Markdown document.
5. **SYNTHESIS:** You will be provided with a JSON Array of the user's "Mind Map Branches". These represent the strategic flow the user chose. Weave these deeply into the PSST structure. Be extremely specific.
`;

Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { business_idea, selected_nodes_context, pdf_context } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is missing");
      throw new Error("Server Misconfiguration: GEMINI_API_KEY is missing");
    }

    // 1. Compile User Input Payload
    const finalPrompt = `
        다음 정보를 바탕으로 최고 수준의 PSST 정부지원사업 사업계획서를 마크다운 형식으로 작성해주세요.
        
        [사용자 사업 아이디어 개요]
        ${business_idea || '제공되지 않음'}
        
        [사용자가 마인드맵에서 채택한 핵심 전략/근거 데이터 (JSON)]
        ${JSON.stringify(selected_nodes_context, null, 2)}
        
        [참고용 공고문/PDF 요약 데이터]
        ${pdf_context || '제공되지 않음'}
        
        지금 바로 마크다운 형태의 사업계획서를 출력하십시오.
        `;

    // 2. Call LLM
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
            temperature: LLM_TEMPERATURE
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const data = await response.json();
    const markdownDraft = data.candidates?.[0]?.content?.parts?.[0]?.text || "문서를 생성하지 못했습니다.";

    // 3. Return to Client
    return new Response(JSON.stringify({ markdown: markdownDraft }), {
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
