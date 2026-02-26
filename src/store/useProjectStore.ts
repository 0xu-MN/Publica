import { create } from 'zustand';

export interface AgentSession {
    id: string;
    title: string;
    mode: string;
    workspace_data: any[];
    chat_history: any[];
    auto_run_query?: string;
}

interface ProjectState {
    // Basic grant/project data (the one clicked from Connect Hub)
    activeProject: any | null;

    // The specific pre-configured context to launch the Agent with
    agentSession: AgentSession | null;

    // Actions
    setProject: (project: any, sessionConfiguration: AgentSession) => void;
    clearProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    activeProject: null,
    agentSession: null,

    // Sets both the metadata AND the session context ready for the agent
    setProject: (project, sessionConfiguration) => set({
        activeProject: project,
        agentSession: sessionConfiguration
    }),

    clearProject: () => set({
        activeProject: null,
        agentSession: null
    })
}));
