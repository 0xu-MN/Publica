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
 * AI 카드 생성 (구조화 + 중립성)
 */
export async function generateCard(article: NewsArticle): Promise<GeneratedCard> {
    const prompt = `당신은 한국의 투자자와 연구자를 위한 중립적 뉴스 분석가입니다.

[원본 기사]
제목: ${article.title}
내용: ${article.description}

[핵심 원칙]
1. **완전한 정치적 중립** - 어떤 성향도 드러내지 말 것
2. **팩트만 전달** - "~~라고 발언했다" 수준, 우리의 판단/의견 절대 금지
3. **구조화된 형식** - 읽기 쉽게 정리
4. **투자 인사이트** - 경제적 시사점 중심

[절대 금지사항]
❌ 정치인/기업에 대한 긍정적/부정적 평가
❌ "~~해야 한다", "~~이 옳다" 같은 주장
❌ 한쪽 편을 드는 표현
✅ 대신: "~~라고 밝혔다", "~~로 나타났다", "~~가 관찰된다"

[출력 형식]
{
  "headline": "중립적이고 명확한 제목 (15자 이내)",
  "teaser": "한 줄 요약 (40자 이내)",
  "body": "구조화된 AI 요약 (300-400자)
  
예시 구조:
**핵심 이슈**
• (구체적 숫자/팩트) ~~가 발표되었다
• ~~라고 밝혔다

**시장 반응**  
• 관련 업종: ~~% 상승/하락
• 전문가 전망: ~~로 예상된다

**투자 시사점**
• (중립적 분석) ~~가 주목된다
• ~~를 모니터링할 필요가 있다

※ 반드시 위와 같은 구조화된 형식 사용
※ 줄글 금지, 불릿 포인트로 정리
※ 완전 중립적 표현만 사용",
  
  "bullets": [
    "핵심 포인트 1 (구체적 숫자, 30자 이내)",
    "핵심 포인트 2 (시장 반응, 30자 이내)",  
    "핵심 포인트 3 (투자 시사점, 30자 이내)"
  ],
  "category": "${article.category === 'science' ? 'Science' : 'Economy'}"
}

**예시 (중립적 표현):**
❌ "대통령의 무리한 정책이 문제다"
✅ "대통령이 ~~정책을 발표했다. 시장에서는 ~~한 반응이 나타났다"

❌ "기업의 탁월한 전략"  
✅ "기업이 ~~전략을 발표했다. 매출은 ~~% 증가했다"

**중요:** JSON만 출력. 정치적 중립 필수!`;

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
