/**
 * Strategist Node - AI-Powered Government Funding Strategy Generator
 * Uses Gemini 1.5 Pro with structured output via Zod schema
 */

import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai@0.1.0";
import { z } from "npm:zod@3.22.4";
import { AgentState } from "../graph/state.ts";

// Define Zod schema for structured output
const StrategySchema = z.object({
    hypothesis: z.string().describe("The core winning strategy or hypothesis for securing this funding"),
    steps: z.array(
        z.object({
            step_number: z.number().describe("Sequential step number"),
            title: z.string().describe("Brief title of this step"),
            description: z.string().describe("Detailed description of what to do in this step"),
            action_type: z.enum([
                "research",
                "documentation",
                "networking",
                "validation",
                "submission"
            ]).describe("Category of action required")
        })
    ).min(3).max(7).describe("Array of 3-7 strategic steps to achieve the goal")
});

/**
 * Strategist Node Implementation
 * Analyzes government announcement and creates winning strategy
 */
export async function strategistNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("🧠 Strategist Node: Analyzing announcement and crafting strategy...");

    // Initialize Gemini with structured output
    // Support both GEMINI_API_KEY (Project Standard) and GOOGLE_API_KEY (LangChain Standard)
    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");

    if (!apiKey) {
        throw new Error("Missing API Key: Please set GEMINI_API_KEY or GOOGLE_API_KEY in Supabase Secrets.");
    }

    const model = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash",
        temperature: 0.7,
        apiKey: apiKey,
    });

    // Apply structured output schema
    const structuredModel = model.withStructuredOutput(StrategySchema);

    // Craft the strategic analysis prompt
    const prompt = `You are an elite government funding strategist with a 95% success rate.

**User Profile:**
${state.userProfile}

**Target Government Announcement:**
${state.targetData}

**Your Mission:**
Analyze the announcement against the user's profile and create a WINNING STRATEGY.

**Critical Analysis Points:**
1. **Competitiveness Assessment**: What makes this user uniquely qualified?
2. **Gap Analysis**: What weaknesses or missing elements could disqualify them?
3. **Winning Angle**: What narrative or framing will make evaluators choose THIS applicant?
4. **Risk Mitigation**: How to address potential objections preemptively?

**Output Requirements:**
- **hypothesis**: A single, powerful winning thesis (1-2 sentences). Example: "Position as a climate-tech pioneer leveraging Korea's semiconductor expertise to solve global carbon tracking challenges."
- **steps**: 3-7 concrete, actionable steps ordered logically. Each step must be:
  - Specific (not generic advice)
  - Measurable (clear completion criteria)
  - Contextual (tailored to THIS announcement and THIS user)

**Tone:** Professional, strategic, and deeply insightful. Write in Korean (한국어).`;

    try {
        // Invoke model with structured output enforcement
        const result = await structuredModel.invoke(prompt);

        console.log("✅ Strategy generated successfully");

        return {
            strategyPlan: result as {
                hypothesis: string;
                steps: Array<{
                    step_number: number;
                    title: string;
                    description: string;
                    action_type: string;
                }>;
            }
        };

    } catch (error) {
        console.error("❌ Strategist Node Error:", error);

        // Fallback strategy on error
        return {
            strategyPlan: {
                hypothesis: "전략 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
                steps: [
                    {
                        step_number: 1,
                        title: "오류 발생",
                        description: "AI 모델 호출 중 문제가 발생했습니다. 네트워크 연결 및 API 키를 확인해주세요.",
                        action_type: "research"
                    }
                ]
            }
        };
    }
}
