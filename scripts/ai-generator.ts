/**
 * AI Generator - Gemini 기반 콘텐츠 각색 엔진
 * 원본 기사 → 완전히 새로운 InsightFlow 카드 생성
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NewsArticle } from './news-collector';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
    }
});

export interface GeneratedCard {
    headline: string;
    body: string;
    bullets: string[];
    teaser: string;
    category: 'Science' | 'Economy';
}

/**
 * Gemini AI 프롬프트 (최적화)
 */
function createPrompt(article: NewsArticle): string {
    return `당신은 InsightFlow의 전문 에디터입니다.

**슬로건:** "검색을 넘어 실행으로, 정보를 넘어 자본으로"

**원본 기사:**
제목: ${article.title}
내용: ${article.description}
출처: ${article.source}

**핵심 규칙:**
1. ⛔ 원본 기사 내용을 절대 복사하지 말 것
2. ✅ 같은 주제를 완전히 새로운 시각으로 재구성
3. 🇰🇷 한국 연구자/투자자 관점에서 실질적 인사이트 제공
4. 🎯 정치적 중립 유지
5. 💡 실행 가능한 인사이트 포함

**카테고리:**
- Science: 기술, 과학, 연구, 혁신 관련
- Economy: 경제, 금융, 시장, 산업 관련

**출력 형식 (JSON):**
{
  "category": "Science" 또는 "Economy",
  "headline": "매력적인 제목 (15자 이내)",
  "teaser": "핵심 요약 (30자 이내)",
  "body": "완전히 새로운 본문 (150-200자, 한국 관점 인사이트 포함)",
  "bullets": [
    "핵심 포인트 1 (15자 이내)",
    "핵심 포인트 2 (15자 이내)",
    "핵심 포인트 3 (15자 이내)",
    "핵심 포인트 4 (15자 이내)"
  ]
}

**예시:**
원본: "반도체 업계, AI 칩 수요 증가"
→ headline: "AI 칩 슈퍼사이클, 한국의 기회"
→ body: "생성형 AI 확산으로 HBM과 AI 가속기 수요가 폭발적으로 증가하고 있습니다. 삼성과 SK하이닉스는 HBM 시장에서 90% 이상 점유율을 보유하며, 이번 슈퍼사이클의 최대 수혜가 예상됩니다. 연구자들은 차세대 메모리 기술에 주목해야 하며, 투자자들은 밸류체인 전반을 검토할 시점입니다."
    "핵심 포인트 1 (구체적 숫자 포함)",
    "핵심 포인트 2 (비판적 시각)",
    "핵심 포인트 3 (투자 시사점)"
  ],
  "teaser": "60자 이내의 후킹 문구 (body 첫 문장을 각색)",
  "category": "${article.category === 'science' ? 'Science' : 'Economy'}"
}

**중요:** 반드시 위 JSON 형식만 출력하세요. 다른 설명은 절대 포함하지 마세요.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // JSON 추출
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }

        const card = JSON.parse(jsonMatch[0]);

        // 검증
        if (!card.headline || !card.body || !card.bullets || !Array.isArray(card.bullets)) {
            throw new Error('Invalid card structure');
        }

        return card as GeneratedCard;
    } catch (error: any) {
        console.error('AI Generation Error:', error.message);
        throw error;
    }
}

/**
 * 생성된 카드 검증
 */
function validateCard(card: any): boolean {
    const checks = [
        card.headline?.length > 0 && card.headline?.length <= 50,
        card.teaser?.length > 0 && card.teaser?.length <= 100,
        card.body?.length >= 100 && card.body?.length <= 300,
        Array.isArray(card.bullets) && card.bullets.length === 4,
        card.bullets.every((b: string) => b.length > 0 && b.length <= 50),
        ['Science', 'Economy'].includes(card.category)
    ];

    return checks.every(Boolean);
}

/**
 * 이미지 URL 생성 (임시)
 */
export function generateImageUrl(category: string): string {
    const images = {
        Science: [
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
            'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
            'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'
        ],
        Economy: [
            'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'
        ]
    };

    const categoryImages = images[category as keyof typeof images] || images.Economy;
    return categoryImages[Math.floor(Math.random() * categoryImages.length)];
}

/**
 * 테스트
 */
async function test() {
    const testArticle: NewsArticle = {
        id: 'test123',
        title: '삼성전자, AI 반도체 투자 확대',
        description: '삼성전자가 인공지능(AI) 반도체 투자를 대폭 확대한다고 밝혔다.',
        link: 'https://example.com',
        pubDate: new Date().toISOString(),
        source: 'naver',
        category: 'science'
    };

    console.log('🤖 Testing AI Generator...\n');

    const card = await generateCard(testArticle);

    console.log('✅ Generated Card:');
    console.log(JSON.stringify(card, null, 2));
}

if (require.main === module) {
    test().catch(console.error);
}
