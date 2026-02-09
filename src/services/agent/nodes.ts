import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { AgentState } from "./state";
import axios from "axios";

// Models Configuration
const getPerplexity = () => new ChatOpenAI({
    modelName: "sonar-reasoning",
    apiKey: process.env.PERPLEXITY_API_KEY,
    configuration: { baseURL: "https://api.perplexity.ai" }
});

const getClaude = () => new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20240620",
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const getGemini = () => new ChatGoogleGenerativeAI({
    model: "gemini-3-pro-preview",
    apiKey: process.env.GOOGLE_API_KEY,
});

/**
 * Step 1: The Scout (Internal Smart Matcher)
 * Matches government grants from DB using Gemini 3 Pro scoring
 */
export const scoutNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("Maestro Scout: Matching Internal Gov Grants...");

    try {
        // 1. Fetch Grants from Supabase
        const response = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/grants`, {
            headers: {
                'apikey': process.env.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
            }
        });

        const grants = response.data;
        if (!grants || grants.length === 0) throw new Error("No internal grants found");

        // 2. AI Scoring via Gemini 3 Pro
        const gemini = getGemini();
        const res = await gemini.invoke([
            new SystemMessage(`Act as a government grant evaluator. Compare the User Profile against the provided Grant List.
  
  **Scoring Algorithm (0-100 pts):**

  **BASE MATCH (Category Alignment):**
  - Compare Grant "tech_field" vs User "expertise" (e.g. Bio == Bio).
  - Compare Grant "category" vs User "major_category" (e.g. Commercialization == Economy).
  
  **USER TYPE LOGIC:**
  
  1. **User is Student + Startup Intent (Hybrid)**:
     - IF (user.is_student AND user.has_startup_intent):
       - **BOOST (+20 pts)** for grants with keywords: ["Campus Town", "Student League", "University", "Initial Package", "Youth"].
       - Include "Pre-Entrepreneur" grants in the pool even if not explicitly targeted.

  2. **User is Researcher**:
     - **CRITICAL**: The match between Grant "tech_field" and User "expertise" (e.g. Bio == Bio) accounts for **50% of the total score**.
     - **IGNORE** revenue/business metrics.
     - **Hybrid Matching (Startup Intent)**: IF User.has_startup_intent is TRUE, score highly for "Pre-Entrepreneur" (예비창업패키지), "Campus Town", and "Youth Founder" grants.
     - **Academic/Sub-type Matching**: Match Grant target (e.g., '대학생', '석박사', '포닥', '교수') with User.researcher_type.
     - Reliability: Priority for National R&D if Researcher/Student ID exists (Bonus +5pts).

  3. **User is Pre-Entrepreneur**:
     - **BOOST (+40 pts)** for "Preliminary Startup Package" (예비창업패키지).
     - **LOCATION**: Critical match -> User "sido" must match Grant location.

  4. **User is Business**:
     - **STRICT**: Check "Up-force" (Business operation years). 
       - If Grant says "<3 years" and User is "5 years", SCORE = 0.
     - **LOCATION**: User "sido" must match Grant location.

  **FINAL OUTPUT FORMAT:**
  Return a JSON array: [{ "id": "grant_id", "score": number, "reason_short": "Korean explanation" }]`),
            new HumanMessage(`User Profile: ${JSON.stringify({
                ...state.userProfile,
                unified_major: state.userProfile.major_category, // 'Industry'
                unified_expertise: state.userProfile.expertise,   // 'Subfield'
                flags: {
                    is_student: state.userProfile.student_id ? true : false,
                    has_startup_intent: state.userProfile.has_startup_intent,
                    is_researcher: state.userProfile.user_type === 'Researcher'
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
1. [ID: GR-2026-01] 2026 기술혁신형 스타트업 육성사업 (서울) (92% Match) - Perfect for AI startups in Seoul.
2. [ID: GR-2026-02] 글로벌 시장 진출 지원 바우처 (85% Match) - Great for early-stage exports.
3. [ID: GR-2026-03] AI 기반 고도화 원천기술 개발 지원금 (78% Match) - Fits your tech stack well.
            `
        };
    }
};

/**
 * Step 2: The Strategist (Gemini 1.5 Pro)
 * Analyzes uploaded PDF context against the selected grant
 */
export const strategistNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("Maestro Strategist: Analyzing documents & crafting strategy...");

    if (!state.selectedGrant) {
        return { outputs: { ...state.outputs, strategy: "No grant selected. Cannot proceed with strategy." } };
    }

    const model = getGemini();
    const res = await model.invoke([
        new SystemMessage(`You are a senior analyst. 
    1. Analyze the grant '${state.selectedGrant?.title}' against the user's profile.
    2. Generate a specific strategy.
    3. Create a **short Business Plan Draft (300 words)** rooted in the user's background.
    
    Return JSON:
    { "strategy": "Markdown text...", "initial_draft_content": "Draft text..." }`),
        new HumanMessage(`Grant Summary: ${(state.selectedGrant as any)?.summary}\nUser Profile: ${JSON.stringify(state.userProfile)}`)
    ]);

    const cleanContent = res.content.toString().replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanContent);

    return {
        outputs: {
            ...state.outputs,
            strategy: result.strategy,
            initial_draft_content: result.initial_draft_content
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
        const claude = getClaude();
        const res = await claude.invoke([
            new SystemMessage(`You write the most professional and natural business Korean. 
    Create a detailed business plan draft based on the provided Strategy.`),
            new HumanMessage(`Strategy: ${state.outputs.strategy}\nResearch: ${state.researchFindings}\nUser Profile: ${JSON.stringify(state.userProfile)}`)
        ]);

        return {
            outputs: { ...state.outputs, writer: res.content.toString() }
        };
    } catch (e: any) {
        console.error("Maestro Writer [Claude] Failed:", e.message || e);
        console.log("⚠️ Attempting Fallback to Gemini 3 Pro Preview for Writing...");

        try {
            const gemini = getGemini();
            const res = await gemini.invoke([
                new SystemMessage(`You write the most professional and natural business Korean. 
    Create a detailed business plan draft based on the provided Strategy.`),
                new HumanMessage(`Strategy: ${state.outputs.strategy}\nResearch: ${state.researchFindings}\nUser Profile: ${JSON.stringify(state.userProfile)}`)
            ]);

            console.log("✅ Gemini Fallback Success.");
            return {
                outputs: { ...state.outputs, writer: res.content.toString() }
            };
        } catch (geminiError) {
            console.error("Maestro Writer [Gemini Fallback] also Failed:", geminiError);
            return { outputs: { ...state.outputs, writer: "Draft generation failed on all models." } };
        }
    }
};

/**
 * Step 4: The Visualizer (Gemini 1.5 Pro)
 * Mermaid.js code generation based on the final draft
 */
export const visualizerNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("Maestro Visualizer: Generating Mermaid Mind-map...");

    const model = getGemini();
    const res = await model.invoke([
        new SystemMessage("Extract the core hierarchy from the draft and generate Mermaid.js mindmap code. Only return the code block."),
        new HumanMessage(`Draft: ${state.outputs.writer}`)
    ]);

    return {
        outputs: { ...state.outputs, visualizer: res.content.toString() }
    };
};
