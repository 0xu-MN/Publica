import { create } from 'zustand';

export interface AgentSession {
    id?: string;
    title: string;
    mode?: string;
    workspace_data: any[];
    chat_history?: any[];
    auto_run_query?: string;
    grant_url?: string;
    grant_title?: string;
    pdf_url?: string;
    brainstorm_content?: string;
}

interface ProjectState {
    // Basic grant/project data (the one clicked from Connect Hub)
    activeProject: any | null;

    // The specific pre-configured context to launch the Agent with
    agentSession: AgentSession | null;

    // Cross-component tab routing request
    globalTabRequest: string | null;

    // Actions
    setProject: (project: any, sessionConfiguration: AgentSession) => void;
    clearProject: () => void;
    setGlobalTabRequest: (tab: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    activeProject: null,
    agentSession: null,
    globalTabRequest: null,

    // Sets both the metadata AND the session context ready for the agent
    setProject: (project, sessionConfiguration) => set({
        activeProject: project,
        agentSession: sessionConfiguration
    }),

    clearProject: () => set({
        activeProject: null,
        agentSession: null
    }),

    setGlobalTabRequest: (tab) => set({
        globalTabRequest: tab
    })
}));
