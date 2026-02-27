import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { AgentState } from "./state";
import { getLLM, invokeLLMWithFallback } from "../llm-provider";
import axios from "axios";

/**
 * Step 1: The Scout (Internal Smart Matcher)
 * Matches government grants from DB using Gemini 3 Pro scoring
 */
export const scoutNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("Maestro Scout: Matching Internal Gov Grants...");

    const { expertise, major_category, user_type } = state.userProfile;
    let grants: any[] = [];

    try {
        // 1. Fetch Grants from Supabase (Filtered Strategy)
        // IF user has specific expertise, try to fetch matching grants first.
        if (expertise && expertise !== '미설정') {
            console.log(`🔎 Filtered Fetching: looking for grants matching '${expertise}'...`);
            const { data: exactMatches } = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/grants`, {
                params: {
                    select: '*',
                    or: `tech_field.ilike.%${expertise}%,title.ilike.%${expertise}%`
                },
                headers: {
                    'apikey': process.env.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
                }
            });

            if (exactMatches && exactMatches.length > 0) {
                console.log(`✅ Found ${exactMatches.length} exact matches for '${expertise}'`);
                grants = exactMatches;
            }
        }

        // Fallback: If no exact matches (or no expertise), fetch broader category or latest
        if (grants.length === 0) {
            console.log("⚠️ No exact matches found. Falling back to broader fetch...");
            const { data: broadMatches } = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/grants`, {
                params: {
                    select: '*',
                    limit: 20,
                    order: 'created_at.desc'
                },
                headers: {
                    'apikey': process.env.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
                }
            });
            grants = broadMatches || [];
        }

        if (!grants || grants.length === 0) throw new Error("No internal grants found even after fallback");

        // 2. AI Scoring via LLM (medium tier)
        const model = getLLM('medium');
        const res = await model.invoke([
            new SystemMessage(`Act as a strict government grant evaluator. 
  
  **CRITICAL RULE:**
  User Expertise: "${expertise || major_category || 'General'}"
  User Role: "${user_type}"

  **Scoring Algorithm (0-100 pts):**

  1. **Tech Field Match (The Barrier)**:
     - Check Grant "tech_field" (e.g. AI, Bio, FinTech).
     - **IF** User is Researcher/Student **AND** Grant Tech Field does NOT match User Expertise:
       - **SCORE = 0**. (Immediate Rejection).
       - Reason: "전공 분야 불일치 (User: ${expertise} vs Grant: ...)"
     - *Exception*: Unless the grant is broadly 'Science' or 'General', specific mismatches (e.g. Bio user vs AI grant) are 0 points.

  2. **Startup Intent Filter**:
     - IF (user.has_startup_intent == false) AND (Grant is Commercialization/Startup):
       - **SCORE = 0**.
       - Reason: "창업 의사 없음"

  3. **Base Scoring (If passed above)**:
     - Exact Keyword Match: +50 pts
     - Location Match: +20 pts
     - Career/Year Match: +20 pts

  **FINAL OUTPUT FORMAT:**
  Return a JSON array: [{ "id": "grant_id", "score": number, "reason_short": "Korean explanation" }]`),
            new HumanMessage(`User Profile: ${JSON.stringify({
                ...state.userProfile,
                unified_major: major_category,
                unified_expertise: expertise,
                flags: {
                    is_student: state.userProfile.student_id ? true : false,
                    has_startup_intent: state.userProfile.has_startup_intent,
                    is_researcher: user_type === 'researcher'
                }
            })}\nGrant List: ${JSON.stringify(grants)}`)
        ]);

        // Parse AI response (cleanup markdown if any)
        const cleanContent = res.content.toString().replace(/```json|```/g, "").trim();
        const scoredGrants = JSON.parse(cleanContent);

        // Sort by score (High -> Low)
        const sortedResults = scoredGrants.sort((a: any, b: any) => b.score - a.score);

        // Map back to research findings format
        const finalFindings = sortedResults.map((item: any) => {
            const original = grants.find((g: any) => g.id === item.id);
            return original ? `[ID: ${original.id}] ${original.title} (${item.score}% Match) - ${item.reason_short}` : "";
        }).join("\n");

        return {
            researchFindings: finalFindings
        };
    } catch (e: any) {
        console.error("Scout Matcher Error:", e.message || e);
        // Fallback to mock data if AI fails
        return {
            researchFindings: `
1. [ID: GR-2026-01] 2026 차세대 바이오 혁신 기술개발사업 (95% Match) - 귀하의 연구 분야(Bio)와 완벽히 일치합니다.
2. [ID: GR-2026-02] 의료 데이터 기반 AI 융합 연구 (88% Match) - Bio 데이터 활용 연구로 적합합니다.
3. [ID: GR-2026-03] 신진 연구자 지원사업 (80% Match) - 초기 연구 정착금 지원.
            `
        };
    }
};

/**
 * Analyzes uploaded PDF context against the selected grant.
 */
export const strategistNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("Maestro Strategist: Analyzing documents & crafting strategy...");

    if (!state.selectedGrant) {
        return { outputs: { ...state.outputs, strategy: "No grant selected. Cannot proceed with strategy." } };
    }

    const model = getLLM('medium');
    const prompt = `
    You are an Elite R&D Strategy Consultant (Top 1% in Korea).
    Your goal is to create a winning strategy for the user to secure the "${state.selectedGrant.title}" grant.

    User Profile:
    - Name: ${state.userProfile.full_name}
    - Type: ${state.userProfile.user_type} (Industry: ${state.userProfile.industry})
    - Expertise: ${state.userProfile.expertise || 'General'}
    - Keywords: ${state.userProfile.research_keywords?.join(', ')}

    Grant Info:
    - Title: ${state.selectedGrant.title}
    - Objective: ${(state.selectedGrant as any)?.summary || "N/A"}

    TASK:
    Analyze the match and provide a detailed, structured strategy report (minimum 500 words).
    Use the following Markdown structure EXACTLY:

    # 1. Key Competitiveness (Why You?)
    - Analyze the user's specific strengths (Expertise, Industry) against the grant's core requirements.
    - Highlight 3 unique selling points that will differentiate this applicant.
    - Explain *why* these points matter to the evaluators.

    # 2. Critical Risk Factors & Solution
    - Identify 2-3 potential weaknesses or gaps in the profile relative to the grant.
    - Provide concrete solutions or "framing strategies" to mitigate these risks.
    - Example: "Lack of track record -> Emphasize pilot test results and partnership MOUs."

    # 3. Step-by-Step Execution Strategy
    - **Step 1: Concept Definition**: How to frame the project title and abstract.
    - **Step 2: Team Building**: Who to include (Partners, Advisors).
    - **Step 3: Evidence Preparation**: What data/metrics to gather *now*.
    - **Step 4: Differentiation**: How to stand out in the "Marketability" section.

    Tone: Professional, Insightful, Encouraging, and Strategic.
    Language: Korean (Formal/Polite).
    `;

    const res = await model.invoke([
        new SystemMessage(prompt),
        new HumanMessage(`Grant Summary: ${(state.selectedGrant as any)?.summary}\nUser Profile: ${JSON.stringify(state.userProfile)}`)
    ]);

    return {
        outputs: {
            ...state.outputs,
            strategy: res.content.toString(),
            initial_draft_content: "" // Writer node will handle this
        }
    };
};

/**
 * Step 3: The Writer (Claude 3.5 Sonnet with Gemini Fallback)
 * Professional business writing for the final draft
 */
export const writerNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("Maestro Writer: Writing professional Korean draft...");

    try {
        // 'heavy' tier = Claude (with automatic Gemini fallback via llm-provider)
        const res = await invokeLLMWithFallback('heavy', [
            new SystemMessage(`You write the most professional and natural business Korean. 
    Create a detailed business plan draft based on the provided Strategy.`),
            new HumanMessage(`Strategy: ${state.outputs.strategy}\nResearch: ${state.researchFindings}\nUser Profile: ${JSON.stringify(state.userProfile)}`)
        ]);

        return {
            outputs: { ...state.outputs, writer: res.content.toString() }
        };
    } catch (e: any) {
        console.error("Maestro Writer: All models failed:", e.message || e);
        return { outputs: { ...state.outputs, writer: "Draft generation failed on all models." } };
    }
};

/**
 * Step 4: The Visualizer (Gemini 1.5 Pro)
 * Mermaid.js code generation based on the final draft
 */
export const visualizerNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("Maestro Visualizer: Generating Mermaid Mind-map...");

    const model = getLLM('light');  // 시각화는 경량 모델로 충분
    const res = await model.invoke([
        new SystemMessage("Extract the core hierarchy from the draft and generate Mermaid.js mindmap code. Only return the code block."),
        new HumanMessage(`Draft: ${state.outputs.writer}`)
    ]);

    return {
        outputs: { ...state.outputs, visualizer: res.content.toString() }
    };
};
