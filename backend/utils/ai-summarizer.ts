import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 초기화 (환경변수에서 API 키 로드)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

interface SummarizeOptions {
    title: string;
    content: string;
    category: 'Science' | 'Economy';
    language: 'ko' | 'en';
}

interface SummarizeResult {
    summary: string;
    aiInsight: string;
    tags: string[];
    koreanTitle?: string;
}

/**
 * AI 뉴스 요약 생성
 */
export async function summarizeNews(options: SummarizeOptions): Promise<SummarizeResult> {
    const { title, content, category, language } = options;

    // 프롬프트 구성 (가짜뉴스 방지 포함)
    const prompt = language === 'ko'
        ? generateKoreanPrompt(title, content, category)
        : generateEnglishPrompt(title, content, category);

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // AI 응답 파싱
        return parseAIResponse(text, language);

    } catch (error) {
        console.error('AI summarization error:', error);

        // Smart Fallback: Create pseudo-bullets from content
        // 1. Remove HTML tags
        const cleanContent = content.replace(/<[^>]*>?/gm, '');

        // 2. Split into sentences (simple period check)
        const sentences = cleanContent
            .split('.')
            .map(s => s.trim())
            .filter(s => s.length > 20); // Filter out too short fragments

        // 3. Take top 3 sentences
        const topSentences = sentences.slice(0, 3);

        // 4. Format as bullet points
        const fallbackSummary = topSentences.length > 0
            ? topSentences.map(s => `- ${s}.`).join('\n')
            : `- ${content.substring(0, 150)}...`;

        return {
            summary: fallbackSummary,
            aiInsight: 'AI 서비스 연결량이 많아 잠시 후 다시 시도해주세요. (현재 원문 기반 요약 제공 중)',
            tags: []
        };
    }
}

/**
 * 한글 프롬프트 생성 (제목 번역 포함)
 */
function generateKoreanPrompt(title: string, content: string, category: string): string {
    return `
당신은 한국 독자를 위한 뉴스 큐레이터입니다. 
다음 ${category === 'Science' ? '과학' : '경제'} 뉴스를 분석하고 **모든 응답을 한국어로** 작성하세요.

**중요: 가짜뉴스 검증**
- 팩트 기반으로만 요약
- 확인되지 않은 정보는 제외
- 출처가 불분명한 내용은 언급 금지

**원본 제목:** ${title}

**본문:** ${content}

다음 형식으로 **반드시 한국어로만** 응답하세요:
---
한국어제목: [원본 제목을 자연스러운 한국어로 번역. 의역 가능]

요약:
- [핵심 내용 1: 문장은 완결된 형태]
- [핵심 내용 2: 문장은 완결된 형태]
- [핵심 내용 3: 문장은 완결된 형태]
(최대 5개 항목, 각 항목은 '-'로 시작)

인사이트: [이 뉴스가 왜 중요한지, 산업/경제/기술에 미칠 구체적인 영향을 2-3문장으로 깊이 있게 설명. 전문적인 어조 유지]

태그: [#키워드1, #키워드2, #키워드3] (최대 3개, 한글 키워드)
---
`;
}

/**
 * 영어 프롬프트 생성
 */
function generateEnglishPrompt(title: string, content: string, category: string): string {
    return `
You are a trusted news curator. Analyze the following ${category} news.

**Important: Fake News Prevention**
- Summarize based on facts only
- Exclude unverified information
- Don't mention unclear sources

**Title:** ${title}

**Content:** ${content}

Respond in this format:
---
Summary: [2-3 sentences covering key points. No exaggeration]

Insight: [Why this matters and potential impact in 1-2 sentences]

Tags: [#keyword1, #keyword2, #keyword3] (max 3, English)
---
`;
}

/**
 * AI 응답 파싱
 */
function parseAIResponse(text: string, language: 'ko' | 'en'): SummarizeResult & { koreanTitle?: string } {
    const koreanTitleMatch = text.match(/한국어제목:|Korean Title:\s*([^\n]+)/i);
    const summaryMatch = text.match(/요약:|Summary:\s*([^\n]+(?:\n(?!인사이트:|Insight:)[^\n]+)*)/i);
    const insightMatch = text.match(/인사이트:|Insight:\s*([^\n]+(?:\n(?!태그:|Tags:)[^\n]+)*)/i);
    const tagsMatch = text.match(/태그:|Tags:\s*(.+)/i);

    const koreanTitle = koreanTitleMatch?.[1]?.trim();
    const summary = summaryMatch?.[1]?.trim() || '요약을 생성할 수 없습니다.';
    const aiInsight = insightMatch?.[1]?.trim() || '';
    const tagsString = tagsMatch?.[1]?.trim() || '';
    const tags = tagsString.split(/[,\s]+/).filter(t => t.startsWith('#'));

    return {
        summary,
        aiInsight,
        tags,
        koreanTitle
    };
}

/**
 * 토큰 사용량 추정 (비용 관리)
 */
export function estimateTokens(text: string): number {
    // 대략적인 계산: 한글 1자 = ~2 토큰, 영어 1단어 = ~1.3 토큰
    const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length;
    const englishWords = text.split(/\s+/).length;

    return koreanChars * 2 + englishWords * 1.3;
}

/**
 * 배치 요약 (여러 뉴스 한번에)
 * Free Tier Limit: 5 RPM (Requests Per Minute)
 * -> 1 request every 12 seconds
 */
export async function batchSummarize(
    newsItems: SummarizeOptions[]
): Promise<SummarizeResult[]> {
    const results: SummarizeResult[] = [];

    // 순차 처리 (Rate Limit 준수)
    // 5 RPM = 12초마다 1개
    // 안전하게 13초 대기
    for (let i = 0; i < newsItems.length; i++) {
        console.log(`🤖 AI 요약 중... (${i + 1}/${newsItems.length})`);

        try {
            const result = await summarizeNews(newsItems[i]);
            results.push(result);
        } catch (e) {
            console.error(`Error summarizing item ${i}:`, e);
            results.push({
                summary: newsItems[i].content.substring(0, 150) + '...',
                aiInsight: '요약 생성 실패 (Rate Limit)',
                tags: []
            });
        }

        if (i < newsItems.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 13000));
        }
    }

    return results;
}
