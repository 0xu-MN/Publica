import { HumanMessage } from "@langchain/core/messages";
import { orchestrator } from "../src/services/agent/graph";
import { AgentState } from "../src/services/agent/state";
import * as dotenv from "dotenv";

dotenv.config();

const testHITLFlow = async () => {
    console.log("🚀 Starting Hybrid HITL Orchestrator Test...");
    const thread_id = "test-session-123";
    const config = { configurable: { thread_id } };

    // 1. Initial Call (Scout Stage)
    console.log("\n--- [Phase 1: Scout / Search] ---");
    const initialState = {
        messages: [new HumanMessage("서울 소재 기술 스타트업인데 정부 지원금 좀 알아봐줘.")],
        userProfile: { industry: "Tech", location: "Seoul" },
        economicData: { usdKrw: 1464.1 },
        uploadedFileContent: "Existing business plan: We make AI-powered CRM systems.",
        researchFindings: "",
        outputs: {}
    };

    const scoutResult = await orchestrator.invoke(initialState, config);
    console.log("Scout Findings:", scoutResult.researchFindings);
    console.log("Status: PAUSED for Human (Grant Selection)");

    // 2. Human Intervention (User selects a grant)
    console.log("\n--- [Human Intervention: Selecting Grant] ---");
    const selectedGrant = {
        id: "GR-001",
        title: "기술혁신형 중소기업 지원사업",
        description: "R&D 자금 지원 사업",
        requirements: "AI 기술 보유 및 기술 스타트업 요건 충족"
    };

    // Update state for the next run
    await orchestrator.updateState(config, { selectedGrant });

    // 3. Continue (Strategist -> Writer Stage)
    console.log("\n--- [Phase 2: Strategy & Writing] ---");
    // Pass null to resume from thread
    const finalResult = (await orchestrator.invoke(null as any, config)) as unknown as AgentState;

    console.log("Strategy Summary:", finalResult.outputs.strategy?.substring(0, 200) + "...");
    console.log("Writer Output (Claude) Sample:", finalResult.outputs.writer?.substring(0, 200) + "...");
    console.log("Status: PAUSED for Human (Draft Review)");
};

testHITLFlow();
