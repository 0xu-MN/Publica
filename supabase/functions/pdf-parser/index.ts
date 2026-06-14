// PDF Parser Edge Function
// Replaces the Python FastAPI server (server/main.py /api/parse-pdf)
// Uses Gemini 1.5 Flash which natively supports PDF files

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
        const contentType = req.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return new Response(JSON.stringify({ error: 'multipart/form-data 형식으로 PDF 파일을 전송하세요.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return new Response(JSON.stringify({ error: 'file 필드가 없습니다.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // PDF를 base64로 변환
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8.length; i += chunkSize) {
            binary += String.fromCharCode(...uint8.slice(i, i + chunkSize));
        }
        const base64Pdf = btoa(binary);

        const prompt = `당신은 한국어 PDF 문서 분석 전문가입니다.
이 PDF 문서의 목차(TOC)와 각 섹션 내용을 추출해주세요.

다음 형식의 JSON만 반환하세요 (마크다운, 설명 없이):
{
  "numPages": <총 페이지 수>,
  "toc": [
    {
      "id": "sec-0-0",
      "title": "섹션 제목",
      "rawTitle": "섹션 제목",
      "page": 1,
      "y": 100,
      "x": 50,
      "level": 1,
      "number": "1",
      "readingOrder": 0
    }
  ],
  "sections": {
    "sec-0-0": "해당 섹션의 본문 내용 (최대 2000자)"
  }
}

규칙:
- level: 1=대제목, 2=중제목, 3=소제목
- 목차 항목이 없으면 페이지별로 생성 (id: "sec-{페이지번호}-0")
- sections 값은 해당 섹션의 실제 본문 텍스트 (2000자 이내)
- 페이지/좌표가 불명확하면 y=100, x=50 사용
- 반드시 유효한 JSON만 반환 (마크다운 코드블록 없이)`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: 'application/pdf', data: base64Pdf } }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 8192,
                    }
                }),
            }
        );

        const geminiData = await geminiRes.json();

        if (geminiData.error) {
            throw new Error(`Gemini 오류: ${geminiData.error.message}`);
        }

        const rawText = (geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let parsed: any;
        try {
            parsed = JSON.parse(cleanJson);
        } catch {
            // 파싱 실패 시 최소 응답 반환
            parsed = {
                numPages: 1,
                toc: [{ id: 'sec-0-0', title: '문서 내용', rawTitle: '문서 내용', page: 1, y: 100, x: 50, level: 1, number: '1', readingOrder: 0 }],
                sections: { 'sec-0-0': rawText.slice(0, 4000) }
            };
        }

        return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('pdf-parser error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
