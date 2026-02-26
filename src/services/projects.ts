import { supabase } from '../lib/supabase';

export interface Project {
    id: string;
    grant_id: string;
    grant_title: string;
    status: 'Saved' | 'Analysis' | 'Drafting' | 'Done';
    workspace_data?: any;
    created_at: string;
    last_updated: string;
    // Computed fields for UI
    progress?: number;
    currentStage?: string;
    stages?: string[];
}

export const fetchProjects = async (): Promise<Project[]> => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('last_updated', { ascending: false });

        if (error) {
            if (error.code === 'PGRST205') {
                console.warn('Projects table not found (HTTP 404). Returning empty array.');
                return [];
            }
            throw error;
        }

        // Map status to progress/stages for UI
        return (data || []).map(p => {
            let progress = 0;
            let currentStage = '가설 수립';

            switch (p.status) {
                case 'Saved':
                    progress = 10;
                    currentStage = '가설 수립';
                    break;
                case 'Analysis':
                    progress = 40;
                    currentStage = '근거 검증';
                    break;
                case 'Drafting':
                    progress = 70;
                    currentStage = '실행 계획';
                    break;
                case 'Done':
                    progress = 100;
                    currentStage = '완료';
                    break;
            }

            return {
                ...p,
                progress,
                currentStage,
                stages: ['가설 수립', '근거 검증', '실행 계획']
            };
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
};

export const createProject = async (
    userId: string,
    grantId: string,
    grantTitle: string,
    workspaceData: any
): Promise<Project | null> => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert({
                user_id: userId,
                grant_id: grantId,
                grant_title: grantTitle,
                status: 'Analysis',
                workspace_data: workspaceData
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating project:', error);
        return null;
    }
};
