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
    teaser: string;
    category: 'Science' | 'Economy';
}

/**
 * AI 카드 생성 (단일 "핵심 정리" 섹션)
 */
export async function generateCard(article: NewsArticle): Promise<GeneratedCard> {
    const prompt = `당신은 한국의 투자자와 연구자를 위한 중립적 뉴스 분석가입니다.

[원본 기사]
제목: ${article.title}
내용: ${article.description}

[핵심 원칙]
1. **완전한 정치적 중립** - 어떤 성향도 드러내지 말 것
2. **팩트만 전달** - "~~라고 발언했다" 수준, 우리의 판단/의견 절대 금지
3. **간결하고 명확** - 핵심만 압축
4. **투자 인사이트** - 경제적 시사점 중심

[절대 금지사항]
❌ 정치인/기업에 대한 긍정적/부정적 평가
❌ "~~해야 한다", "~~이 옳다" 같은 주장
❌ 한쪽 편을 드는 표현
✅ 대신: "~~라고 밝혔다", "~~로 나타났다", "~~가 관찰된다"

[출력 형식 - JSON만 출력]
{
  "headline": "중립적이고 명확한 제목 (15자 이내)",
  "teaser": "한 줄 요약 (40자 이내)",
  
  "body": "📌 핵심 정리

• (핵심 팩트 1) ~~가 발표되었다
• (핵심 팩트 2) ~~로 나타났다  
• (시장 영향) 관련 업종은 ~~% 변동을 보였다
• (전문가 분석) 전문가들은 ~~로 분석했다
• (투자 시사점) ~~를 모니터링할 필요가 있다

※ 4-6개 불릿 포인트로 정리 (300-400자)
※ 첫 줄에 '📌 핵심 정리' 제목 필수
※ 완전 중립적 표현만 사용",
  
  "category": "${article.category === 'science' ? 'Science' : 'Economy'}"
}

**예시:**
✅ 올바른 구조:

{
  "headline": "SK텔레콤 AI 투자 주목",
  "teaser": "앤트로픽 투자로 시총 15조 육박",
  "body": "📌 핵심 정리\\n\\n• SK텔레콤이 AI 국가대표 선정 기대감으로 하루 만에 12% 급등했다\\n• 2000년 이후 최고가를 경신하며 시가총액 15조 원에 육박했다\\n• 앤트로픽 투자 성공이 주가 상승에 긍정적 영향을 미친 것으로 분석된다\\n• 통신 업계 전반에 걸쳐 AI 기술 경쟁 심화가 예상된다\\n• 투자자들은 SK텔레콤의 AI 기술 개발 및 투자 동향을 주시할 필요가 있다",
  "category": "Economy"
}

**중요:** 
- "📌 핵심 정리" 제목 반드시 포함
- 그 다음 빈 줄 하나, 그 다음부터 불릿 포인트만
- 4-6개 항목으로 모든 핵심 내용 압축
- 간결하고 명확하게!`;

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

        // 기본 검증
        if (!card.headline || !card.body) {
            throw new Error('Invalid card structure');
        }

        // body에 "📌 핵심 정리" 포함 확인
        if (!card.body.includes('📌 핵심 정리')) {
            console.error('⚠️  Warning: Body missing "📌 핵심 정리" header');
            throw new Error('Body must start with "📌 핵심 정리"');
        }

        return card as GeneratedCard;
    } catch (error: any) {
        console.error('AI Generation Error:', error.message);
        throw error;
    }
}

/**
 * 테스트
 */
async function test() {
    const testArticle: NewsArticle = {
        id: 'test-1',
        title: 'SK텔레콤, AI 국가대표 선정 기대감에 12% 급등',
        description: 'SK텔레콤이 AI 국가대표로 선정될 것이라는 기대감에 주가가 급등했다. 앤트로픽 투자 성공도 긍정적 영향.',
        link: 'https://example.com',
        pubDate: new Date().toISOString(),
        category: 'economy'
    };

    console.log('🤖 Testing AI Generator...\n');
    const card = await generateCard(testArticle);

    console.log('✅ Generated Card:');
    console.log(JSON.stringify(card, null, 2));
}

if (require.main === module) {
    test().catch(console.error);
}
