// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

// ─── LLM Configuration (change model here to switch) ───
const LLM_MODEL = 'gemini-2.5-flash'; // Options: gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash
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
2. **READABLE DESCRIPTION FORMAT:** The \`description\` field MUST be easy to read on a mobile card. Follow this exact structure:
   - Line 1-3: Bold executive summary (**문제 핵심**, **시장 기회**, **전략 방향**)
   - Line 4+: Numbered Action Steps (1. 2. 3.) with specific metrics
   - FORBIDDEN: Never use "--" dashes as bullet points. Use "1." "2." "3." numbered lists separated by \\n.
   - FORBIDDEN: Never write wall-of-text paragraphs. Every sentence must be on its own line separated by \\n.
   - Each action step must include a concrete number or percentage target.
3. **STRICT JSON FORMATTING & ESCAPING:** You must output perfectly valid, parsable JSON. ALL double quotes inside strings must be escaped as \\". ALL newlines inside strings must be escaped as \\n. NEVER use unescaped newlines or quotes inside JSON values.
4. **FORCED PSST ROOTS (INITIAL IDEATION):** If the user is providing their initial business idea (no prior context), output EXACTLY 4 branches:
   - Branch 1: "문제인식 (Problem)" - Market problems and target customer pain points.
   - Branch 2: "해결방안 (Solution)" - Product/service details and differentiators.
   - Branch 3: "성장전략 (Scale-up)" - Target market, go-to-market, business model.
   - Branch 4: "팀구성 (Team)" - Required expertise and hiring plan.
5. **SUGGESTED ACTIONS:** Return a \`suggested_actions\` array. ALL labels AND queries MUST be in Korean. The query must include the parent node's label for context:
   - Option 1 (Deep Dive): e.g., label: "타겟 고객 페인 포인트 심층 분석", query: "[문제인식] 브랜치의 타겟 고객 페인 포인트를 정량화하고 경쟁사 대비 차별점을 분석해줘"
   - Option 2 (Verify): e.g., label: "시장 규모 근거 찾기", query: "[해결방안] 브랜치의 TAM/SAM/SOM 시장 규모를 리서치해줘"
   - Option 3 (Plan): e.g., label: "실행 계획 수립", query: "[성장전략] 브랜치의 3개월 단기 실행 로드맵을 수립해줘"

## 💬 CHAT MODE (When user asks a QUESTION about a specific node)
When the user is asking a question rather than requesting analysis, the \`chat_message\` MUST be a **detailed, substantive answer** (minimum 200 characters, no maximum).
- Answer the user's SPECIFIC question with expert-level analysis
- Include concrete examples, data points, and actionable recommendations
- Structure the answer with numbered points or bullet points for readability
- Reference the context of the current node
- Do NOT just repeat the question or give a generic one-liner
- Still output workspace_data branches if the answer suggests actionable sub-topics

## JSON Output Structure (Strict)
Return a SINGLE JSON object:
{
  "chat_message": "사용자의 질문에 대한 상세하고 실질적인 답변 (최소 200자 이상). 질문이 아닌 초기 분석 요청인 경우에만 한 줄 요약 가능. 항상 구체적이고 전문적인 답변을 제공할 것.",
  "workspace_data": {
    "root_node": "컨텍스트 헤더 (한국어)",
    "branches": [
      {
        "id": "uuid",
        "label": "짧은 키워드 (한국어)",
        "description": "**핵심 요약 3줄**\\n\\n1. 첫 번째 액션 (수치 포함)\\n2. 두 번째 액션 (수치 포함)\\n3. 세 번째 액션 (수치 포함)",
        "type": "research",
        "references": []
      }
    ]
  },
  "suggested_actions": [
    { "label": "한국어 레이블", "type": "EXPAND", "query": "[부모 브랜치명] 한국어 지시문" },
    { "label": "한국어 레이블", "type": "VERIFY", "query": "[부모 브랜치명] 한국어 지시문" },
    { "label": "한국어 레이블", "type": "PLAN", "query": "[부모 브랜치명] 한국어 지시문" }
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

        // Detect if this is a chat question vs analysis request
        const isQuestion = /\?|어떻게|무엇|왜|얼마나|구체적|설명|알려|어디|뭘|뭐|어떤|인지|할까|할지|인가|건지|건가/.test(user_input);

        // 1. Prompt Engineering — include context and mode hint
        const finalPrompt = `
    [User Profile]: ${user_job || 'General Strategist'}
    [Task Mode]: ${task_mode || 'Hypothesis Generator'}
    [Interaction Type]: ${isQuestion ? 'CHAT_QUESTION — 사용자가 구체적인 질문을 했습니다. chat_message에 최소 200자 이상의 상세하고 전문적인 답변을 작성하세요. 단순 요약 금지.' : 'ANALYSIS_REQUEST — 분석 요청입니다. 브랜치 생성에 집중하세요.'}
    [Input]: ${user_input}
    
    ${isQuestion ? '중요: 사용자가 질문을 했으므로, chat_message 필드에 반드시 구체적이고 실질적인 답변을 200자 이상 작성하세요. 예시, 데이터, 구체적 방법론을 포함하세요.' : 'Generate the structured breakdown now.'}
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
            // Pre-process raw text to strip markdown formatting
            let cleanText = rawText.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.substring(7);
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.substring(3);
            }
            if (cleanText.endsWith('```')) {
                cleanText = cleanText.substring(0, cleanText.length - 3);
            }
            cleanText = cleanText.trim();

            parsedData = JSON.parse(cleanText);

            // 🌟 Quality guard: if chat_message is too short for a question, enhance it
            if (isQuestion && parsedData.chat_message && parsedData.chat_message.length < 80) {
                // Append branch descriptions as extended answer
                const branchDetails = (parsedData.workspace_data?.branches || [])
                    .map((b: any, i: number) => `${i + 1}. **${b.label}**: ${b.description}`)
                    .join('\n\n');
                if (branchDetails) {
                    parsedData.chat_message = parsedData.chat_message + '\n\n' + branchDetails;
                }
            }
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
