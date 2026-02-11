import { supabase } from '../lib/supabase';
import axios from 'axios';

export interface Grant {
    id: string;
    title: string;
    agency: string;
    d_day: string;
    target_audience: string;
    tech_field: string;
    summary: string;
    description: string;
    category: 'R&D' | 'Commercialization' | 'Voucher' | 'Policy Fund';
    location?: string; // New field for strict filtering
    link?: string;
    matching_score?: number;
    matching_reason?: string;
    created_at?: string; // For sorting
}

export const fetchGrants = async (): Promise<Grant[]> => {
    const { data, error } = await supabase
        .from('grants')
        .select('*');

    if (error) {
        console.error('Error fetching grants:', error);
        return [];
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
