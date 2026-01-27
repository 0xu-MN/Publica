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
❌ body에 **핵심 이슈**, **시장 반응**, **투자 시사점** 같은 섹션 제목 사용
✅ 대신: "~~라고 밝혔다", "~~로 나타났다", "~~가 관찰된다"

[출력 형식 - JSON만 출력]
{
  "headline": "중립적이고 명확한 제목 (15자 이내)",
  "teaser": "한 줄 요약 (40자 이내)",
  
  "bullets": [
    "핵심 이슈 1 (구체적 팩트, 40자 이내)",
    "핵심 이슈 2 (구체적 팩트, 40자 이내)",
    "핵심 이슈 3 (구체적 팩트, 40자 이내)"
  ],
  
  "body": "3-4가지 부가 설명만 (250-350자)

• (배경/맥락) ~~의 배경은 ~~이다
• (시장 반응) 관련 업종은 ~~% 변동을 보였다
• (전문가 분석) 전문가들은 ~~로 분석했다
• (투자 시사점) ~~를 모니터링할 필요가 있다

※ 절대 금지: 섹션 제목 (예: **핵심 이슈**, **시장 반응** 등)
※ bullets에 핵심 이슈가 있으므로 body에서 완전 제외
※ 불릿 포인트로 3-4가지만 간결하게
※ 완전 중립적 표현만 사용",
  
  "category": "${article.category === 'science' ? 'Science' : 'Economy'}"
}

**구조 설명:**
- bullets (AI 핵심 내용): 무슨 일이 일어났는지 핵심 팩트
- body (본문): 왜 중요한지, 어떤 영향이 있는지 부가 설명 (섹션 제목 없이!)

**예시:**
✅ 올바른 구조:

bullets: [
  "트럼프, 한국산 제품 관세를 25%로 인상 발언",
  "현대차·기아 주가 발언 직후 약세",
  "기존 2.5% 대비 10배 수준 인상"
]

body: "
• 이번 발언은 한미 무역 협상 과정에서 나온 것으로 알려졌다
• 자동차 업계는 단기적으로 불확실성이 커질 것으로 전망했다
• 전문가들은 실제 적용 여부를 지켜봐야 한다고 분석했다
• 관련 업종 투자자들은 무역 협상 진행 상황을 주시할 필요가 있다
"

❌ 잘못된 구조 (이렇게 하지 마세요!):
body: "
**핵심 이슈**
• 트럼프가 관세 인상...
**시장 반응**
• 주가가...
"
→ 섹션 제목 사용 금지! 그냥 불릿 포인트만!

**중요:** 
- bullets에 핵심 이슈 배치 (WHAT happened)
- body에 부가 설명만, 섹션 제목 절대 금지 (WHY important, HOW it affects)
- bullets와 body 내용이 겹치면 안 됨!`;

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
