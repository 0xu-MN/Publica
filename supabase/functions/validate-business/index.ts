import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─────────────────────────────────────────────────────────────────────────────
// 국세청 사업자등록정보 진위확인 API (공공데이터포털)
// API 키 환경변수: NTS_API_KEY (Supabase Edge Function Secrets에 등록 필요)
// 등록 방법:
//   supabase secrets set NTS_API_KEY=발급받은서비스키
// API 발급: https://www.data.go.kr/data/15081808/openapi.do
// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { businessNumber, imageUrl, imageBase64, pdfText } = body;

        // ── 1. 이미지/PDF OCR 처리 (OpenAI GPT-4o) ─────────────────────────
        if (imageUrl || imageBase64 || pdfText) {
            const openAiKey = Deno.env.get('OPENAI_API_KEY');
            if (!openAiKey) throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');

            const prompt = `이 한국 사업자등록증에서 정보를 추출해주세요.
다음 키를 포함한 JSON 객체만 반환하세요 (마크다운 없이):
"businessNumber" (예: "123-45-67890"),
"sido" (예: "서울특별시"),
"sigungu" (예: "강남구"),
"industry" (예: "정보통신업")`;

            const messages = pdfText
                ? [{ role: 'user', content: `${prompt}\n\n문서 텍스트:\n${pdfText}` }]
                : [{ role: 'user', content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : imageUrl } }
                ]}];

            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'gpt-4o', messages, max_tokens: 300 }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error.message);

            let result = { businessNumber: '', sido: '', sigungu: '', industry: '' };
            try {
                const clean = data.choices[0].message.content.trim().replace(/```json\n?/g, '').replace(/```/g, '');
                result = JSON.parse(clean);
            } catch { /* 파싱 실패 시 빈 결과 반환 */ }

            return new Response(JSON.stringify({ success: true, data: result, method: 'ocr' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ── 2. 사업자등록번호 직접 입력 → 국세청 NTS API ───────────────────
        if (businessNumber) {
            const rawNumber = String(businessNumber).replace(/[-\s]/g, '');

            // 기본 유효성: 10자리 숫자
            if (!/^\d{10}$/.test(rawNumber)) {
                return new Response(JSON.stringify({
                    success: false,
                    error: '사업자등록번호는 10자리 숫자여야 합니다.',
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
            }

            const ntsKey = Deno.env.get('NTS_API_KEY');

            if (!ntsKey) {
                return new Response(JSON.stringify({
                    success: false,
                    setup_required: true,
                    error: 'NTS_API_KEY가 설정되지 않았습니다. 아래 안내를 따라 등록해주세요.',
                    guide: {
                        step1: '공공데이터포털(data.go.kr) 가입 후 "국세청_사업자등록정보 진위확인 및 상태조회 서비스" 검색',
                        step2: '활용신청 → 일반 인증키 발급 (1~2시간 소요)',
                        step3: 'Supabase 대시보드 → Project Settings → Edge Functions → Secrets → NTS_API_KEY 등록',
                        step4: '또는 터미널: supabase secrets set NTS_API_KEY=발급받은키',
                        url: 'https://www.data.go.kr/data/15081808/openapi.do'
                    }
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 });
            }

            // 국세청 사업자 상태 조회 API 호출
            const ntsRes = await fetch(
                `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(ntsKey)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ b_no: [rawNumber] }),
                }
            );

            if (!ntsRes.ok) {
                throw new Error(`NTS API 오류: ${ntsRes.status} ${ntsRes.statusText}`);
            }

            const ntsData = await ntsRes.json();
            const bizInfo = ntsData?.data?.[0];

            if (!bizInfo) {
                return new Response(JSON.stringify({
                    success: false,
                    error: '등록된 사업자 정보를 찾을 수 없습니다. 번호를 다시 확인해주세요.',
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
            }

            // b_stt_cd: '01'=계속사업자, '02'=휴업, '03'=폐업
            const statusCode = bizInfo.b_stt_cd;
            const statusText = bizInfo.b_stt || '확인됨';
            const taxType = bizInfo.tax_type || '';
            const formatted = `${rawNumber.slice(0,3)}-${rawNumber.slice(3,5)}-${rawNumber.slice(5)}`;

            if (statusCode === '03') {
                return new Response(JSON.stringify({
                    success: false,
                    error: '폐업된 사업자입니다. 유효한 사업자등록번호를 입력해주세요.',
                    status: 'closed'
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
            }

            if (statusCode === '02') {
                return new Response(JSON.stringify({
                    success: false,
                    error: '휴업 중인 사업자입니다. 유효한 사업자등록번호를 입력해주세요.',
                    status: 'suspended'
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
            }

            // NTS 상태 조회 API는 업종/주소를 제공하지 않으므로 빈 값 반환
            // (사용자가 프로필에서 직접 입력)
            return new Response(JSON.stringify({
                success: true,
                data: {
                    businessNumber: formatted,
                    status: statusText,
                    statusCode,
                    taxType,
                    sido: '',
                    sigungu: '',
                    industry: '',
                },
                method: 'nts',
                message: `사업자 번호 확인 완료 (${statusText}). 지역 및 업종은 직접 선택해주세요.`
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        throw new Error('businessNumber 또는 이미지 데이터가 필요합니다.');

    } catch (error: any) {
        console.error('validate-business error:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
