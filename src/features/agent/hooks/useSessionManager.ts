import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Alert } from 'react-native';

export const useSessionManager = (userId: string | undefined) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // 1. 세션 목록 불러오기 (사이드바용)
    const fetchSessions = async () => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('workspace_sessions')
            .select('*')
            .order('updated_at', { ascending: false });

        if (data) setSessions(data);
    };

    // 2. 저장하기 (Auto-Save or Manual Save)
    const saveSession = async (title: string, mode: string, columns: any[], chatHistory: any[], pdfUrl?: string) => {
        if (!userId) return;

        const payload = {
            user_id: userId,
            title: title || "Untitled Project",
            mode,
            workspace_data: columns,
            chat_history: chatHistory,
            pdf_url: pdfUrl || null,
            updated_at: new Date().toISOString()
        };

        let result;
        if (currentSessionId) {
            // 기존 세션 업데이트
            result = await supabase
                .from('workspace_sessions')
                .update(payload)
                .eq('id', currentSessionId)
                .select();
        } else {
            // 새 세션 생성
            result = await supabase
                .from('workspace_sessions')
                .insert(payload)
                .select();
        }

        if (result.data) {
            setCurrentSessionId(result.data[0].id);
            fetchSessions(); // 목록 갱신
            console.log("Session Saved!");
        }
    };

    // 3. 불러오기
    const loadSession = async (sessionId: string) => {
        const { data } = await supabase
            .from('workspace_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        return data; // AgentView에서 받아서 state 업데이트
    };

    // 4. 삭제하기
    const deleteSession = async (sessionId: string) => {
        await supabase.from('workspace_sessions').delete().eq('id', sessionId);
        fetchSessions();
    };

    return { sessions, currentSessionId, setCurrentSessionId, fetchSessions, saveSession, loadSession, deleteSession };
};
