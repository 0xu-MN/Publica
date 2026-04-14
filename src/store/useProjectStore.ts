import { create } from 'zustand';

export interface EvaluationCriterion {
    item: string;
    score: number;
    description: string;
    keywords: string[];
    weight: 'high' | 'medium' | 'low';
}

export interface AnnouncementAnalysis {
    evaluation_criteria: EvaluationCriterion[];
    required_sections: string[];
    writing_hints: Record<string, string>;
    form_info: {
        title: string;
        agency: string;
        budget?: string;
        deadline?: string;
    };
    character_limits: Record<string, number>;
    pass_strategy: string;
}

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
    editor_content?: string;
    editor_markdown?: string;
    // 공고 분석 결과 — 브레인스토밍/초안 작성 시 평가기준 주입에 사용
    announcement_analysis?: AnnouncementAnalysis;
    // 공고 원문 텍스트 (분석 소스)
    announcement_text?: string;
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
