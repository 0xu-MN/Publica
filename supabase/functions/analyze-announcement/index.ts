// Analyze Announcement Edge Function
// Replaces Python server /api/analyze-announcement
// Analyzes Korean grant/support program announcements using Gemini

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
        return new Response(JSON.stringify({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json();
        const { announcement_text } = body;

        if (!announcement_text || announcement_text.trim().length < 50) {
            return new Response(JSON.stringify({ error: '공고문 텍스트가 너무 짧습니다.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const prompt = `당신은 한국 정부 지원사업 공고문 분석 전문가입니다.
아래 공고문을 분석하여 다음 형식의 JSON만 반환하세요 (마크다운 없이):

{
  "evaluation_criteria": [
    {"name": "평가항목명", "score": 점수, "description": "설명"}
  ],
  "required_sections": ["필수 작성 항목 1", "필수 작성 항목 2"],
  "key_requirements": ["핵심 요구사항 1", "핵심 요구사항 2"],
  "writing_strategy": "작성 전략 요약 (200자 이내)",
  "deadline": "신청 마감일 (있으면)",
  "budget_info": "지원 예산/금액 (있으면)",
  "target_audience": "지원 대상 요약"
}

공고문:
${announcement_text.slice(0, 8000)}`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
                }),
            }
        );

        const geminiData = await geminiRes.json();
        if (geminiData.error) throw new Error(geminiData.error.message);

        const rawText = (geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let result: any;
        try {
            result = JSON.parse(cleanJson);
        } catch {
            result = {
                evaluation_criteria: [],
                required_sections: [],
                key_requirements: [],
                writing_strategy: rawText.slice(0, 200),
                deadline: '',
                budget_info: '',
                target_audience: ''
            };
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('analyze-announcement error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
