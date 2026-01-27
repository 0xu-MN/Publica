
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.12.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { title, keywords } = await req.json();

        if (!title || !keywords) {
            return new Response(
                JSON.stringify({ error: 'Title and keywords are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
        const geminiKey = Deno.env.get('GEMINI_API_KEY');

        if (!supabaseUrl || !supabaseKey || !geminiKey) {
            throw new Error('Missing environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, or GEMINI_API_KEY)');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // Category-based image pools
        const scienceImages = [
            'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1541185933-710f5092f470?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop',
        ];

        const economyImages = [
            'https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1560221328-12fe60f83ab8?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop',
        ];

        // Determine category from keywords
        const isScience = keywords.toLowerCase().includes('ai') ||
            keywords.toLowerCase().includes('과학') ||
            keywords.toLowerCase().includes('기술') ||
            keywords.toLowerCase().includes('바이오') ||
            keywords.toLowerCase().includes('우주');
        const category = isScience ? 'Science' : 'Economy';

        // Select random image from appropriate pool
        const imagePool = isScience ? scienceImages : economyImages;
        const imageUrl = imagePool[Math.floor(Math.random() * imagePool.length)];

        const systemPrompt = `You are a Science/Economy Expert Editor. Reconstruct the given news into a completely new format based on the Title and Keywords.

CRITICAL REQUIREMENTS:
1. The "bullets" field is MANDATORY and must contain 3-4 concise key points
2. Each bullet should be a SHORT phrase (1-3 words in Korean)
3. Bullets should be actionable keywords that investors can quickly scan
4. The "related_materials" field is MANDATORY and must contain 2-4 useful reference links

Output Format Requirements:
- Headline: Attractive, catchy title (Korean)
- Body: 150-250 characters of unique expert insight (Korean)
- Bullets: EXACTLY 3-4 short key phrases (예: "AI 수요 급증", "HBM 공급 부족", "엔비디아 점유율 확대")
- Category: "${category}"
- Related Materials: 2-4 relevant articles/papers with REAL URLs (Korean title + URL)

Example Output:
{
  "headline": "AI 반도체 시장, 2026년 폭발적 성장 전망",
  "body": "📌 핵심 정리\\n• 글로벌 AI 반도체 시장이 전년 대비 150% 성장 예상\\n• HBM3E 공급 부족으로 프리미엄 가격 지속\\n• 국내 장비 업체들의 수혜 기대감 확대",
  "bullets": ["AI 수요 급증", "HBM 공급 부족", "국내 업체 수혜", "프리미엄 가격"],
  "category": "${category}",
  "imageUrl": "${imageUrl}",
  "related_materials": [
    { "title": "삼성전자 반도체 뉴스룸", "url": "https://semiconductor.samsung.com/kr/" },
    { "title": "SK하이닉스 HBM 기술 로드맵", "url": "https://www.skhynix.com" },
    { "title": "AI 반도체 시장 분석 보고서", "url": "https://www.sedaily.com" }
  ]
}

IMPORTANT: Return ONLY valid JSON. Do NOT include markdown code blocks or any text outside the JSON object.`;

        const userPrompt = `Title: ${title}
    Keywords: ${keywords}`;

        const result = await model.generateContent([systemPrompt, userPrompt]);
        const response = await result.response;
        let content = response.text();

        if (!content) {
            throw new Error('Failed to generate content');
        }

        // Clean markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse and validate
        let parsedContent;
        try {
            parsedContent = JSON.parse(content);
        } catch (e) {
            throw new Error(`Failed to parse AI response as JSON: ${e.message}`);
        }

        // Validate bullets array
        if (!parsedContent.bullets || !Array.isArray(parsedContent.bullets) || parsedContent.bullets.length < 3) {
            console.warn('Bullets array missing or insufficient, generating fallback');
            // Fallback: Extract key phrases from body
            const bodyText = parsedContent.body || '';
            const fallbackBullets = bodyText
                .split('•')
                .slice(1, 5)
                .map((b: string) => b.trim().split('\n')[0])
                .filter((b: string) => b.length > 0 && b.length < 30);

            parsedContent.bullets = fallbackBullets.length >= 3
                ? fallbackBullets
                : ['핵심 내용 1', '핵심 내용 2', '핵심 내용 3'];
        }

        // Validate related_materials array
        if (!parsedContent.related_materials || !Array.isArray(parsedContent.related_materials) || parsedContent.related_materials.length < 2) {
            console.warn('Related materials array missing or insufficient, generating fallback');
            // Fallback: Generate category-specific related materials
            const fallbackMaterials = category === 'Science' ? [
                { title: '한국과학기술연구원 연구 동향', url: 'https://www.kist.re.kr' },
                { title: '과학기술정보통신부 정책', url: 'https://www.msit.go.kr' },
                { title: '사이언스타임즈 최신 뉴스', url: 'https://www.sciencetimes.co.kr' }
            ] : [
                { title: '한국은행 경제 동향', url: 'https://www.bok.or.kr' },
                { title: '산업통상자원부 산업 정책', url: 'https://www.motie.go.kr' },
                { title: '한국경제연구원 분석', url: 'https://www.keri.org' }
            ];

            parsedContent.related_materials = fallbackMaterials;
        }

        // Convert back to string for storage
        content = JSON.stringify(parsedContent);

        // Insert into Supabase
        const { data, error } = await supabase
            .from('cards')
            .insert({ content: content })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return new Response(
            JSON.stringify({ success: true, data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
