import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";
import { AgentState } from "./state";
import {
    scoutNode,
    strategistNode,
    writerNode,
    visualizerNode
} from "./nodes";

// Initialize Memory for Human-in-the-Loop persistence
const memory = new MemorySaver();

// Initialize the Graph with the sequential hybrid flow
const workflow = new StateGraph<AgentState>({
    channels: {
        userProfile: { value: (a, b) => b, default: () => ({}) },
        economicData: { value: (a, b) => b, default: () => ({}) },
        uploadedFileContent: { value: (a, b) => b, default: () => "" },
        selectedGrant: { value: (a, b) => b },
        researchFindings: { value: (a, b) => b, default: () => "" },
        expandedThoughts: { value: (a, b) => b, default: () => [] },
        outputs: { value: (a, b) => ({ ...a, ...b }), default: () => ({}) },
        messages: { value: (a, b) => a.concat(b), default: () => [] },
    }
});

// Add Nodes
workflow.addNode("scout", scoutNode);
workflow.addNode("strategist", strategistNode);
workflow.addNode("writer", writerNode);
workflow.addNode("visualizer", visualizerNode);

// Define Linear Sequential Flow
workflow.addEdge(START, "scout" as any);
workflow.addEdge("scout" as any, "strategist" as any);
workflow.addEdge("strategist" as any, "writer" as any);
workflow.addEdge("writer" as any, "visualizer" as any);
workflow.addEdge("visualizer" as any, END);

// Compile the graph with checkpointer and interrupt points
export const orchestrator = workflow.compile({
    checkpointer: memory,
    // PAUSE after scout (User must select a grant)
    // PAUSE after writer (User must review/edit the draft)
    interruptAfter: ["scout" as any, "writer" as any]
});
