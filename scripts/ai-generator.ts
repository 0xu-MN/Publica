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
        maxOutputTokens: 2048,
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
 * AI 카드 생성 (개선된 프롬프트)
 */
export async function generateCard(article: NewsArticle): Promise<GeneratedCard> {
    const prompt = `당신은 한국의 투자자와 연구자를 위한 뉴스 인사이트 분석가입니다.

[원본 기사]
제목: ${article.title}
내용: ${article.description}

[미션]
이 기사를 바탕으로 **완전히 새로운 투자 인사이트 카드**를 작성하세요. 
단순 요약이 아닌, 깊이 있는 분석과 비판적 시각을 담아야 합니다.

[필수 작성 원칙]
1. **구체적인 숫자와 팩트** 언급 (예: "250조 원", "1,400원대", "90% 점유율")
2. **다양한 관점** 제시 (낙관론 vs 비판론, 표면 vs 이면)
3. **구조화된 분석** (예: "숨겨진진실 3가지", "핵심 이슈")
4. **현실적이고 날카로운 결론** (투자자/연구자에게 실질적 도움)
5. **원본 기사를 절대 복사하지 말 것** - 완전히 새로운 관점으로 재해석

[예시 톤 & 스타일]
- "주가는 사상 최고치인데, 왜 내 삶은 팍팍하지?"
- "화려한 숫자 뒤에 가려진 진실"
- "이 발언과 현실의 괴리"
- "표면: ~~ / 이면: ~~"

[출력 형식 - JSON만 출력]
{
  "headline": "날카롭고 흥미를 끄는 제목 (15자 이내, 물음표 활용 가능)",
  "body": "400-600자의 심층 분석. 
          첫 문장: 흥미로운 질문이나 팩트로 시작
          중간: 구체적 숫자, 다양한 관점, 비판적 분석
          마지막: 날카로운 결론이나 투자 시사점
          반드시 한국어로 작성하고, 투자자/연구자 관점에서 실질적 가치 제공",
  "bullets": [
    "핵심 포인트 1 (구체적 숫자 포함, 30자 이내)",
    "핵심 포인트 2 (비판적 시각, 30자 이내)",
    "핵심 포인트 3 (투자 시사점, 30자 이내)"
  ],
  "teaser": "60자 이내의 후킹 문구",
  "category": "${article.category === 'science' ? 'Science' : 'Economy'}"
}

**중요:** JSON만 출력하세요. 다른 설명 절대 포함 금지.`;

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
 * 이미지 URL 생성
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
