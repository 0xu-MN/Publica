import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useSessionManager = (userId: string | undefined) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // 1. 세션 목록 불러오기 (사이드바용)
    const fetchSessions = async () => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('workspace_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (data) setSessions(data);
    };

    // 🌟 Auto-fetch on mount
    useEffect(() => {
        fetchSessions();
    }, [userId]);

    // 2. 저장하기 (Auto-Save or Manual Save) — Flow용
    const saveSession = async (title: string, mode: string, columns: any[], chatHistory: any[], pdfUrl?: string, brainstormContent?: string) => {
        if (!userId) return;

        const payload = {
            user_id: userId,
            title: title || "Untitled Project",
            mode,
            workspace_data: columns,
            chat_history: chatHistory,
            updated_at: new Date().toISOString()
        };

        const extendedPayload = {
            ...payload,
            pdf_url: pdfUrl || null,
            brainstorm_content: brainstormContent || ''
        };

        let result;
        if (currentSessionId) {
            result = await supabase
                .from('workspace_sessions')
                .update(extendedPayload)
                .eq('id', currentSessionId)
                .select();

            if (result.error) {
                console.warn("Extended payload failed, retrying with core payload...", result.error);
                result = await supabase.from('workspace_sessions').update(payload).eq('id', currentSessionId).select();
            }
        } else {
            result = await supabase
                .from('workspace_sessions')
                .insert(extendedPayload)
                .select();

            if (result.error) {
                console.warn("Extended payload failed, retrying with core payload...", result.error);
                result = await supabase.from('workspace_sessions').insert(payload).select();
            }
        }

        if (result.error) {
            console.error("Session Save Error:", result.error);
            return false;
        }

        if (result.data && result.data.length > 0) {
            setCurrentSessionId(result.data[0].id);
            fetchSessions();
            console.log("Session Saved Successfully!");
            return true;
        }

        return false;
    };

    // 2-B. 에디터 콘텐츠 저장 (NEXUS-Edit용)
    const saveEditorContent = async (sessionId: string, editorHtml: string, editorMarkdown: string) => {
        if (!userId || !sessionId) return false;

        const payload = {
            editor_content: editorHtml,
            editor_markdown: editorMarkdown,
            updated_at: new Date().toISOString(),
        };

        let result = await supabase
            .from('workspace_sessions')
            .update(payload)
            .eq('id', sessionId)
            .select();

        // Fallback: editor_content 컬럼이 아직 없으면 updated_at만 업데이트
        if (result.error && (result.error.code === '42703' || result.error.message.includes('editor_content'))) {
            console.warn("editor_content column not yet available. Saving to updated_at only.");
            result = await supabase
                .from('workspace_sessions')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', sessionId)
                .select();
        }

        if (result.error) {
            console.error("Editor Save Error:", result.error);
            return false;
        }

        console.log("Editor content saved!");
        fetchSessions();
        return true;
    };

    // 3. 불러오기
    const loadSession = async (sessionId: string) => {
        const { data } = await supabase
            .from('workspace_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        return data; // includes editor_content, editor_markdown if columns exist
    };

    // 4. 삭제하기
    const deleteSession = async (sessionId: string) => {
        await supabase.from('workspace_sessions').delete().eq('id', sessionId);
        fetchSessions();
    };

    return { sessions, currentSessionId, setCurrentSessionId, fetchSessions, saveSession, saveEditorContent, loadSession, deleteSession };
};
