import { Platform } from 'react-native';

const INSIGHT_AGENT_URL = process.env.EXPO_PUBLIC_INSIGHT_AGENT_URL || 'https://ltoqdapmhyxwosxbpaip.supabase.co/functions/v1/insight-agent-gateway';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// --------------------------------------------------------------------------
// DEVELOPMENT: Mock Profile Switcher
// Uncomment the profile you want to test.
// --------------------------------------------------------------------------


const MOCK_PROFILE = {
    id: 'mock-user-001',
    name: 'Dr. Kim',
    researcher_reg_no: 'RES-2026-X99',
    tags: ['BioTech', 'Genomics']
};

// OPTION B: Entrepreneur Persona (Economy Domain)

// const MOCK_PROFILE = {
//     id: 'mock-user-002',
//     name: 'CEO Park',
//     business_reg_no: 'BIZ-888-22',
//     tags: ['Fintech', 'SaaS']
// };


// --------------------------------------------------------------------------
// API Service
// --------------------------------------------------------------------------

interface InsightResponse<T = any> {
    success?: boolean;
    data?: T;
    error?: string;
    [key: string]: any;
}

/**
 * Sends POST request to Insight Agent.
 * Automatically injects the MOCK_PROFILE for testing context.
 */
const invokeInsightAgent = async <T>(payload: object): Promise<T> => {
    try {
        console.log(`[InsightService] Invoking Agent...`);

        // 1. DETERMINE DOMAIN from Mock Profile
        let calculatedDomain = 'GENERAL';
        // @ts-ignore
        if (MOCK_PROFILE.researcher_reg_no) calculatedDomain = 'SCIENCE';
        // @ts-ignore
        else if (MOCK_PROFILE.business_reg_no) calculatedDomain = 'ECONOMY';

        // Inject Mock Profile overrides for dev testing
        const finalPayload = {
            ...payload,
            user_id: MOCK_PROFILE.id, // In prod, get from Auth context
            profile_override: MOCK_PROFILE, // In prod, remove this to let backend fetch from DB
            user_domain: calculatedDomain
        };

        const response = await fetch(INSIGHT_AGENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify(finalPayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Agent request failed (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return data as T;
    } catch (error) {
        console.error('[InsightService] Error:', error);
        throw error;
    }
};

// --------------------------------------------------------------------------
// 1. Dashboard API (Implicit Domain)
// --------------------------------------------------------------------------
interface DashboardData {
    success: boolean;
    user_domain: string;
    recommendations: any[];
}

export const fetchDashboardData = async (userId?: string): Promise<DashboardData> => {
    return invokeInsightAgent<DashboardData>({
        action_type: 'dashboard_refresh',
        // user_id handled by invoke wrapper for now
    });
};

// --------------------------------------------------------------------------
// 2. Agent Interaction API (Implicit Domain)
// --------------------------------------------------------------------------
export type TaskMode = 'hypothesis' | 'experiment' | 'analysis' | 'drafting' | 'ref_check';

interface AgentInteractionResponse {
    success: boolean;
    data: {
        response: string;
        career_impact: string[];
    };
}

export const interactWithAgent = async (
    taskMode: TaskMode,
    userInput: string,
    fileContext?: string
): Promise<AgentInteractionResponse> => {
    return invokeInsightAgent<AgentInteractionResponse>({
        action_type: 'agent_interaction',
        task_mode: taskMode,
        user_input: userInput,
        file_context: fileContext,
    });
};

// --------------------------------------------------------------------------
// 3. File Processing API (Implicit Domain)
// --------------------------------------------------------------------------
interface FileProcessResponse {
    success: boolean;
    data: {
        domain: string;
        keywords: string[];
        summary: string;
    };
}

export const processFileMetadata = async (fileUrl: string, fileContent?: string): Promise<FileProcessResponse> => {
    return invokeInsightAgent<FileProcessResponse>({
        action_type: 'file_process',
        file_url: fileUrl,
        file_content: fileContent,
    });
};

// --------------------------------------------------------------------------
// 4. Career Matching API (Implicit Domain)
// --------------------------------------------------------------------------
interface CareerAdviceResponse {
    success: boolean;
    data: {
        recommendations: string[];
        advice: string;
    };
}

export const getCareerAdvice = async (userId: string): Promise<CareerAdviceResponse> => {
    return invokeInsightAgent<CareerAdviceResponse>({
        action_type: 'career_match',
        // user_id handled by invoke wrapper
    });
};
