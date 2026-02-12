/**
 * AgentState Interface for Publica Brain
 * Defines the state structure for the LangGraph workflow
 */

export interface AgentState {
    // Input fields
    userProfile: string;
    targetData: string;

    // Output field
    strategyPlan?: {
        hypothesis: string;
        steps: Array<{
            step_number: number;
            title: string;
            description: string;
            action_type: string;
        }>;
    };
}
