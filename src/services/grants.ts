import { supabase } from '../lib/supabase';
import axios from 'axios';

export interface Grant {
    id: string;
    title: string;
    agency: string;
    d_day: string;
    deadline_date?: string;
    target_audience: string;
    tech_field: string;
    summary: string;
    description: string;
    category: 'R&D' | 'Commercialization' | 'Voucher' | 'Policy Fund';
    location?: string;
    link?: string;
    original_url?: string;
    file_url?: string;
    budget?: string;
    eligibility?: string;
    exclusions?: string;
    support_details?: string;
    application_period?: string;
    application_method?: string;
    region?: string;
    department?: string;
    contact_info?: string;
    application_url?: string;
    matching_score?: number;
    matching_reason?: string;
    grant_type?: 'project' | 'subsidy';
    created_at?: string;
}

export const fetchGrants = async (): Promise<Grant[]> => {
    // Filter out old grants: only fetch grants with deadline >= 2024-01-01 or NULL deadline
    const cutoffDate = '2024-01-01';

    // Try with is_active filter first (requires migration 20260304)
    let { data, error } = await supabase
        .from('grants')
        .select('*')
        .neq('is_active', false)
        .or(`deadline_date.gte.${cutoffDate},deadline_date.is.null`)
        .order('deadline_date', { ascending: true, nullsFirst: false });

    // Fallback: if is_active column doesn't exist yet, query without filter
    if (error) {
        console.warn('Grants query with is_active filter failed, using fallback:', error.message);
        const fallback = await supabase
            .from('grants')
            .select('*')
            .or(`deadline_date.gte.${cutoffDate},deadline_date.is.null`)
            .order('deadline_date', { ascending: true, nullsFirst: false });

        if (fallback.error) {
            console.error('Error fetching grants:', fallback.error);
            return [];
        }
        return fallback.data as Grant[];
    }

    return data as Grant[];
};

export const saveGrantToWorkspace = async (userId: string, grantId: string) => {
    // This assumes a 'workspace_items' or similar table exists to track user interests
    const { data, error } = await supabase
        .from('workspace_sessions')
        .insert([
            {
                user_id: userId,
                title: `Project: Grant ${grantId}`,
                workspace_data: [], // Initial empty workspace
            }
        ]);

    if (error) throw error;
    return data;
};
