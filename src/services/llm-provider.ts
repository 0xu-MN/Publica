/**
 * LLM Provider Abstraction Layer
 * 
 * 모든 AI 호출이 이 파일을 경유합니다.
 * 모델 교체 시 이 파일만 수정하면 전체 시스템에 반영됩니다.
 * 
 * 사용법:
 *   import { getLLM } from '../llm-provider';
 *   const model = getLLM('medium');  // 티어 선택
 *   const res = await model.invoke([...messages]);
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type LLMTier = 'light' | 'medium' | 'heavy' | 'search';

interface ProviderConfig {
    provider: 'gemini' | 'anthropic' | 'openai' | 'perplexity';
    model: string;
    temperature?: number;
    description: string; // 어디에 쓰이는지 설명
}

// ─────────────────────────────────────────────
// Configuration — 여기만 수정하면 전체 모델 교체 가능
// ─────────────────────────────────────────────

const TIER_CONFIG: Record<LLMTier, ProviderConfig> = {
    // Tier 1: 단순 작업 (요약, 태깅, 시각화, 분류)
    // 속도 최우선, 비용 최저
    light: {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        temperature: 0.3,
        description: '요약, 태깅, 시각화 등 단순 작업',
    },

    // Tier 2: 중간 작업 (공고 매칭, 문서 분석, 전략 대화)
    // 정확도와 비용의 균형
    medium: {
        provider: 'gemini',
        model: 'gemini-2.5-pro',
        temperature: 0.7,
        description: '공고 매칭, 문서 분석, 전략 생성',
    },

    // Tier 3: 고급 작업 (사업계획서 작성, 핵심 전략 수립)
    // 품질 최우선 (한국어 글쓰기)
    heavy: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        temperature: 0.7,
        description: '사업계획서 작성, 고급 전략',
    },

    // 검색 전용 (실시간 웹 검색이 필요한 작업)
    search: {
        provider: 'perplexity',
        model: 'sonar-reasoning',
        temperature: 0.5,
        description: '실시간 웹 검색 기반 분석',
    },
};

// ─────────────────────────────────────────────
// Fallback 체인 — API 장애 시 자동 전환
// ─────────────────────────────────────────────

const FALLBACK_CHAIN: Partial<Record<LLMTier, LLMTier[]>> = {
    heavy: ['medium'],       // Claude 장애 → Gemini Pro로 fallback
    medium: ['light'],       // Gemini Pro 장애 → Flash로 fallback
    search: ['medium'],      // Perplexity 장애 → Gemini Pro로 fallback
};

// ─────────────────────────────────────────────
// Factory — LangChain 모델 인스턴스 생성
// ─────────────────────────────────────────────

function createModel(config: ProviderConfig) {
    switch (config.provider) {
        case 'gemini':
            return new ChatGoogleGenerativeAI({
                model: config.model,
                temperature: config.temperature,
                apiKey: process.env.GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY,
            });

        case 'anthropic':
            return new ChatAnthropic({
                modelName: config.model,
                temperature: config.temperature,
                apiKey: process.env.ANTHROPIC_API_KEY,
            });

        case 'perplexity':
            return new ChatOpenAI({
                modelName: config.model,
                temperature: config.temperature,
                apiKey: process.env.PERPLEXITY_API_KEY,
                configuration: { baseURL: 'https://api.perplexity.ai' },
            });

        case 'openai':
            return new ChatOpenAI({
                modelName: config.model,
                temperature: config.temperature,
                apiKey: process.env.OPENAI_API_KEY,
            });

        default:
            throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * 티어별 LLM 인스턴스를 반환합니다.
 * 
 * @param tier - 'light' | 'medium' | 'heavy' | 'search'
 * @returns LangChain Chat Model 인스턴스
 * 
 * @example
 * const model = getLLM('medium');
 * const res = await model.invoke([new HumanMessage("분석해줘")]);
 */
export function getLLM(tier: LLMTier = 'medium') {
    const config = TIER_CONFIG[tier];
    if (!config) {
        console.warn(`⚠️ Unknown LLM tier: ${tier}. Falling back to 'medium'.`);
        return createModel(TIER_CONFIG.medium);
    }
    return createModel(config);
}

/**
 * 자동 fallback이 포함된 LLM 호출.
 * 첫 번째 모델이 실패하면 fallback 체인을 따라 재시도합니다.
 * 
 * @param tier - 시작 티어
 * @param messages - LangChain 메시지 배열
 * @returns AI 응답
 * 
 * @example
 * const res = await invokeLLMWithFallback('heavy', [
 *     new SystemMessage("전략가 역할"),
 *     new HumanMessage("분석해줘")
 * ]);
 */
export async function invokeLLMWithFallback(tier: LLMTier, messages: any[]) {
    const config = TIER_CONFIG[tier];
    const tierName = `${config.provider}/${config.model}`;

    try {
        const model = createModel(config);
        console.log(`🤖 [LLM] ${tierName} (${tier}) 호출 중...`);
        const result = await model.invoke(messages);
        console.log(`✅ [LLM] ${tierName} 성공`);
        return result;
    } catch (error: any) {
        console.error(`❌ [LLM] ${tierName} 실패:`, error.message);

        // Fallback 체인 시도
        const fallbacks = FALLBACK_CHAIN[tier] || [];
        for (const fallbackTier of fallbacks) {
            const fbConfig = TIER_CONFIG[fallbackTier];
            const fbName = `${fbConfig.provider}/${fbConfig.model}`;

            try {
                console.log(`⚠️ [LLM] Fallback → ${fbName} (${fallbackTier}) 시도 중...`);
                const fbModel = createModel(fbConfig);
                const result = await fbModel.invoke(messages);
                console.log(`✅ [LLM] Fallback ${fbName} 성공`);
                return result;
            } catch (fbError: any) {
                console.error(`❌ [LLM] Fallback ${fbName} 도 실패:`, fbError.message);
            }
        }

        throw new Error(`All LLM providers failed for tier '${tier}'. Last error: ${error.message}`);
    }
}

/**
 * Edge Function용 raw HTTP 호출 (Deno 환경).
 * LangChain 없이 직접 API를 호출해야 하는 Edge Function에서 사용.
 * 
 * @param tier - 티어
 * @param systemPrompt - 시스템 프롬프트
 * @param userPrompt - 사용자 프롬프트
 * @param options - 추가 옵션
 * @returns 파싱된 텍스트 응답
 */
export function getEdgeFunctionConfig(tier: LLMTier = 'medium') {
    const config = TIER_CONFIG[tier];

    if (config.provider === 'gemini') {
        return {
            provider: 'gemini' as const,
            url: (apiKey: string) =>
                `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`,
            buildBody: (systemPrompt: string, userPrompt: string, jsonMode: boolean = true) => ({
                contents: [{
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\n" + userPrompt }],
                }],
                generationConfig: {
                    temperature: config.temperature || 0.7,
                    ...(jsonMode ? { responseMimeType: "application/json" } : {}),
                },
            }),
            parseResponse: (data: any) => data.candidates?.[0]?.content?.parts?.[0]?.text || "{}",
        };
    }

    if (config.provider === 'anthropic') {
        return {
            provider: 'anthropic' as const,
            url: (_apiKey: string) => 'https://api.anthropic.com/v1/messages',
            buildBody: (systemPrompt: string, userPrompt: string) => ({
                model: config.model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: "user", content: userPrompt }],
            }),
            parseResponse: (data: any) => data.content?.[0]?.text || "{}",
            headers: (apiKey: string) => ({
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            }),
        };
    }

    throw new Error(`Edge function config not available for provider: ${config.provider}`);
}

/**
 * 현재 설정된 티어 구성을 반환합니다 (디버깅/로깅용).
 */
export function getLLMConfig() {
    return { ...TIER_CONFIG };
}
