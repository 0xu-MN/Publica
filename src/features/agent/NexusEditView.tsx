import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Platform, Animated } from 'react-native';
import { FileText, MessageCircle, ChevronLeft, ChevronRight, Save, FolderOpen, Sparkles, Send, Bot, User as UserIcon, ArrowLeft, Zap, X, PanelLeftClose, PanelLeftOpen, Upload } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useSessionManager } from './hooks/useSessionManager';
import { useProjectStore } from '../../store/useProjectStore';
import { fetchTemplate, templateToEditorHtml, getDefaultPSSTTemplate, TemplateSection, GrantTemplate } from '../../services/templateService';
import { NotionEditor } from './components/NotionEditor';

// ═══════════════════════════════════════════════════
// NEXUS-Edit: Document Editor Page
// Left: Brainstorm Viewer + AI Chat
// Right: Notion-like Editor
// ═══════════════════════════════════════════════════

export const NexusEditView = () => {
    // --- Auth ---
    const [user, setUser] = useState<any>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }: any) => setUser(data.user));
    }, []);

    const { sessions, saveEditorContent, loadSession, fetchSessions } = useSessionManager(user?.id);

    // --- State ---
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [editorContent, setEditorContent] = useState('');
    const [editorMarkdown, setEditorMarkdown] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<{ role: string; content: string; files?: {name: string; url: string}[] }[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
    const [showSessionList, setShowSessionList] = useState(true);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [lastSessionId, setLastSessionId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const leftPanelWidth = useRef(new Animated.Value(420)).current;
    const chatScrollRef = useRef<ScrollView>(null);
    const autoSaveTimerRef = useRef<any>(null);
    const [activeTemplate, setActiveTemplate] = useState<GrantTemplate | null>(null);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [draftGenerating, setDraftGenerating] = useState(false);
    const [draftCompleted, setDraftCompleted] = useState(false); // Track if AI has generated content
    const [draftCurrentStep, setDraftCurrentStep] = useState<{ current: number; total: number; label: string } | null>(null); // 순차 작성 진행 상태
    const [draftBranchLabels, setDraftBranchLabels] = useState<string[]>([]); // 실제 브랜치 라벨 목록
    const [draftCompletedSteps, setDraftCompletedSteps] = useState<Set<number>>(new Set()); // 완료된 스텝 인덱스 집합
    const [hwpxLoading, setHwpxLoading] = useState(false);
    // 🔑 Key counter to force NotionEditor remount when content changes externally
    const [editorKey, setEditorKey] = useState(0);
    // 🔑 Ref that holds the definitive draft HTML — bypasses state batching issues
    const pendingDraftRef = useRef<string>('');

    // --- Load last session from localStorage on mount ---
    useEffect(() => {
        if (Platform.OS === 'web') {
            const lastId = localStorage.getItem('NEXUS_EDIT_LAST_SESSION');
            if (lastId) {
                setLastSessionId(lastId);
                setShowResumePrompt(true);
            }
        }
    }, []);

    // --- Auto-load brainstorm content from Flow (via useProjectStore) ---
    useEffect(() => {
        const session = useProjectStore.getState().agentSession;
        if (session) {
            console.log('📝 Edit: Loading data from Flow session:', session.title);

            // Set the active session so the Editor and Left Panel render correctly
            setSelectedSession(session);

            if (session.chat_history) {
                setChatMessages(session.chat_history.map((m: any) => ({ role: m.sender === 'me' ? 'user' : 'assistant', content: m.text })));
            }
            setShowSessionList(false);
            setShowResumePrompt(false);

            // 🌟 Sync Logic: Prioritize editor_content if it exists (meaning AI draft was already created)
            if (session.editor_content && session.editor_content.length > 20) {
                console.log('📝 Edit: Using pre-generated editor_content, length=', session.editor_content.length);
                // Store in ref AND state, then trigger remount
                pendingDraftRef.current = session.editor_content;
                setEditorContent(session.editor_content);
                setEditorMarkdown(session.editor_markdown || session.editor_content);
                setDraftCompleted(true);
                loadTemplateForSession(session, true); // Load template meta only
                // Force remount so initialContent is definitely applied
                setTimeout(() => setEditorKey(prev => prev + 1), 50);
            } else if (session.brainstorm_content || (session.workspace_data && session.workspace_data.length > 0)) {
                // 🔥 Auto Draft Generation: Only if editor_content is missing
                console.log('📝 Edit: No editor_content found, triggering auto-draft...');
                generateAutoDraft(session);
            } else {
                // FORCE Load PSST Template as the default Bowl
                loadTemplateForSession(session, false);
            }

            // 🌟 FIX: Don't clear immediately, or clear only after successful mount
            // setTimeout(() => useProjectStore.getState().clearProject(), 1000);
        }
    }, []);

    // 🌟 Cleanup Store on Unmount to prevent phantom loading next time
    useEffect(() => {
        return () => {
            useProjectStore.getState().clearProject();
        };
    }, []);

    // --- AI Auto Draft Generation (100% LOCAL — no gateway dependency) ---
    const generateAutoDraft = async (session: any) => {
        if (!session) return;
        setDraftGenerating(true);
        setDraftCurrentStep(null);
        setDraftCompletedSteps(new Set());

        try {
            const defaultSections = getDefaultPSSTTemplate();
            const mockTemplate: GrantTemplate = {
                id: 'default', grant_id: 'default', sections: defaultSections, source_markdown: null, parsed_at: new Date().toISOString()
            };
            setActiveTemplate(mockTemplate);

            const allBranches: any[] = [];
            if (session.workspace_data && Array.isArray(session.workspace_data)) {
                for (const col of session.workspace_data) {
                    if (col.branches && Array.isArray(col.branches)) {
                        allBranches.push(...col.branches);
                    }
                }
            }

            // 오른쪽 진행 플로우를 실제 브랜치 라벨로 세팅
            setDraftBranchLabels(allBranches.map(b => b.label || ''));

            const docTitle = session.title || '사업계획서';
            let draftHtml = `<h1>${docTitle}</h1>`;

            if (allBranches.length > 0) {
                const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
                if (!geminiKey) throw new Error('GEMINI_API_KEY가 없습니다.');

                // 🌟 플로우 카드별 순차 작성
                for (let i = 0; i < allBranches.length; i++) {
                    const branch = allBranches[i];

                    // 진행 스텝 업데이트 (오른쪽 플로우 트래커 + 로딩 오버레이)
                    setDraftCurrentStep({ current: i + 1, total: allBranches.length, label: branch.label });

                    setChatMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `⏳ [${i + 1}/${allBranches.length}] '${branch.label}' 구역을 작성하고 있습니다...`
                    }]);

                    try {
                        const systemPrompt = `당신은 대한민국 최고 수준의 공공/정부지원사업 사업계획서 대필 전문가(AI 에이전트)입니다.
사용자의 전체 사업계획서 중 다음 구역을 전담해서 작성해주세요.

[작성할 주제]: ${branch.label}
[핵심 내용요약]: ${branch.description || '내용 없음'}

**[지시사항]**
1. 이 주제에 대해 충분한 분량의 상세하고 전문적인 사업계획서 문단(섹션)을 작성하세요.
2. 인사말이나 부연 설명 없이 오직 본문만 출력해야 합니다.
3. 큰 섹션 제목은 <h2>, 소제목은 <h3> 태그를 사용하고 중요 키워드는 **굵은 글씨** 문법으로 강조하세요.
4. 표기할 항목이 3개 이상이거나 비교 데이터가 있다면 반드시 <table>, <thead>, <tbody>, <tr>, <th>, <td> 태그를 사용하여 표로 만드세요.
5. 반드시 아래 순수 JSON 포맷으로만 응답하세요.
{"document_html": "결과물 HTML 문자열"}`;

                        const response = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                                    generationConfig: { temperature: 0.2 }
                                })
                            }
                        );

                        const data = await response.json();
                        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                            const aiText = data.candidates[0].content.parts[0].text;
                            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                try {
                                    const parsed = JSON.parse(jsonMatch[0]);
                                    if (parsed.document_html) draftHtml += parsed.document_html;
                                } catch {
                                    draftHtml += `<h2>${branch.label}</h2><p>${branch.description || ''}</p>`;
                                }
                            } else {
                                const htmlMatch = aiText.match(/<h[2-6][\s\S]*/i);
                                draftHtml += htmlMatch ? htmlMatch[0] : `<h2>${branch.label}</h2><p>${branch.description || ''}</p>`;
                            }
                        } else {
                            throw new Error('Invalid Gemini response');
                        }
                    } catch (apiError) {
                        console.error(`Branch ${i} error:`, apiError);
                        draftHtml += `<h2>${branch.label}</h2><p>${branch.description || ''}</p>`;
                    }

                    // 완료된 스텝 추가 (체크 표시)
                    setDraftCompletedSteps(prev => new Set([...prev, i]));

                    // 에디터 실시간 업데이트
                    setEditorContent(draftHtml);
                    setEditorMarkdown(draftHtml);
                    pendingDraftRef.current = draftHtml;
                    if (Platform.OS === 'web') {
                        const editorEl = document.getElementById('nexus-editor-content');
                        if (editorEl) editorEl.innerHTML = draftHtml;
                    }
                }

            } else if (!session.brainstorm_content) {
                draftHtml = templateToEditorHtml(mockTemplate, docTitle);
            }

            // 완료 처리 (remount 없이 상태만 업데이트)
            setEditorContent(draftHtml);
            setEditorMarkdown(draftHtml);
            pendingDraftRef.current = draftHtml;
            setDraftCompleted(true);
            setHasUnsavedChanges(true);
            setDraftCurrentStep(null); // 로딩 오버레이 종료

            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `✅ 초안 작성 완료! 총 ${allBranches.length}개 섹션을 문서로 변환했습니다.`
            }]);

        } catch (err) {
            console.error('📝 Draft generation failed:', err);
            setDraftCurrentStep(null);
            loadTemplateForSession(session, false);
        } finally {
            setDraftGenerating(false);
        }
    };

    // --- Load template for a session ---
    const loadTemplateForSession = async (session: any, isBackgroundLoad: boolean = false) => {
        setTemplateLoading(true);
        try {
            const defaultSections = getDefaultPSSTTemplate();
            const mockTemplate: GrantTemplate = {
                id: 'default',
                grant_id: 'default',
                sections: defaultSections,
                source_markdown: null,
                parsed_at: new Date().toISOString(),
            };
            setActiveTemplate(mockTemplate);

            if (!isBackgroundLoad) {
                const html = templateToEditorHtml(mockTemplate, session.title || session.grant_title || "맞춤형 사업계획서");
                setEditorContent(html);
            }
        } catch (err) {
            console.error('Template load failed:', err);
        } finally {
            setTemplateLoading(false);
        }
    };

    // --- Toggle Left Panel ---
    const toggleLeftPanel = () => {
        Animated.spring(leftPanelWidth, {
            toValue: isLeftPanelOpen ? 0 : 420,
            useNativeDriver: false,
            friction: 12,
            tension: 65,
        }).start();
        setIsLeftPanelOpen(!isLeftPanelOpen);
    };

    const handleLoadSession = async (sessionId: string) => {
        const data = await loadSession(sessionId);
        if (data) {
            setSelectedSession(data);
            setChatMessages(data.chat_history || []);
            setShowSessionList(false);
            setShowResumePrompt(false);

            // Prioritize saved editor_content, fallback to brainstorm branches
            if (data.editor_content && data.editor_content.length > 50) {
                setEditorContent(data.editor_content);
                setDraftCompleted(true);
            } else {
                const branches = data.workspace_data || [];
                const content = buildEditorContentFromBranches(branches);
                setEditorContent(content);
                setDraftCompleted(false); // Show the "AI 초안 작성" button
            }

            setHasUnsavedChanges(false);
            setLastSaved(null);

            // Save last session ID
            if (Platform.OS === 'web') {
                localStorage.setItem('NEXUS_EDIT_LAST_SESSION', sessionId);
            }
        }
    };

    // --- Build Editor Content from Brainstorm Branches ---
    const buildEditorContentFromBranches = (columns: any[]): string => {
        let html = '';
        for (const col of columns) {
            if (!col.branches) continue;
            for (const node of col.branches) {
                if (node.type === 'root') {
                    html += `<h1>${node.label || 'Untitled'}</h1>`;
                    if (node.description) html += `<p>${node.description}</p>`;
                } else {
                    html += `<h2>${node.label || ''}</h2>`;
                    if (node.description) html += `<p>${node.description}</p>`;
                }
            }
        }
        return html || '<h1>새 문서</h1><p>브레인스톰 데이터를 불러오거나, 직접 작성을 시작하세요.</p>';
    };

    // --- AI Chat ---
    const handleChatSend = async () => {
        if (!chatInput.trim() || chatLoading) return;

        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput('');
        setChatLoading(true);

        // 🌟 Feature: Detect "Write" or "Draft" request to trigger auto-drafting
        // Allow re-drafting even if draftCompleted=true, as user may want to regenerate
        // Remove overly broad generic keywords to prevent accidental full-document resets
        const draftingKeywords = ['초안 작성 시작', '전체 문서 작성', '처음부터 다시 작성'];
        if (draftingKeywords.some(kw => userMsg.includes(kw)) && selectedSession) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: '알겠습니다. 브레인스톰 데이터를 분석하여 전체 사업계획서 초안을 새로 작성하겠습니다...' }]);
            await generateAutoDraft(selectedSession);
            setChatLoading(false);
            return;
        }

        try {
            // Build Context
            const brainstormContext = (selectedSession?.workspace_data || []).flatMap((col: any) =>
                (col.branches || []).map((node: any) => `[${node.label}] ${node.description || ''}`)
            ).join('\n');
            const editorContext = editorMarkdown || editorContent;
            
            const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
            
            const prompt = `당신은 대한민국 최고 수준의 공공/정부지원사업 사업계획서 대필 전문가이자 에디터 보조 AI입니다.
사용자가 기존 사업계획서를 부분 수정해 달라고 요청했습니다.

[가장 중요한 수정 원칙 - 엄격 준수]
1. 타겟 수정: 사용자가 요청한 **특정 구역이나 특정 문단만** 집중적으로 자세하게 살을 붙이거나 수정하세요.
2. 기존 내용 보존: 사용자가 언급하지 않은 **나머지 모든 기존 내용(섹션 제목, 기존 글, 구조 등)은 절대로 임의로 갈아엎거나 축약/삭제하지 마세요.** 원본을 100% 그대로 유지해야 합니다.
3. 전체 문서 반환: 부분 수정된 내용을 기존 내용과 다시 합쳐서 **하나의 완성된 전체 HTML 코드**로 반환하세요. 이 코드가 에디터 전체를 덮어씌울 것이므로 기존에 있던 다른 구역이 누락되면 절대 안 됩니다.
4. 순수 HTML: <h1>, <h2>, <p>, <table> 등 순수 HTML 태그만 사용하고, 마크다운 기호(#, **)는 쓰지 마세요.
5. 반드시 아래의 순수 JSON 포맷으로만 응답해야 합니다. 어떤 코멘트도 앞뒤에 붙이지 마세요.

응답 JSON 규격:
{
    "reply": "사용자에게 할 친절한 채팅 답변 (예: 네, 요청하신 부분만 더 구체적으로 확장하여 텍스트를 보강했습니다. 나머지 부분은 원본을 유지했습니다.)",
    "modified_html": "부분 수정이 반영된 전체 문서의 HTML 코드 문자열 (수정이 필요 없는 답변일 경우 null)"
}

[현재 에디터 내용 (HTML 본문 원본)]
${editorContext}

[관련 브레인스톰 데이터]
${brainstormContext}

[사용자의 구체적 수정 요청사항]
${userMsg}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2 } // Lower temp for strict JSON
                })
            });

            const data = await response.json();
            
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                let aiResponseText = data.candidates[0].content.parts[0].text.trim();
                
                try {
                    // JSON 데이터만 추출 (AI가 인사말을 붙이더라도 무시)
                    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) throw new Error("No JSON object found in response");
                    
                    const parsed = JSON.parse(jsonMatch[0]);
                    setChatMessages(prev => [...prev, { role: 'assistant', content: parsed.reply || "요청하신 작업을 완료했습니다." }]);
                    
                    if (parsed.modified_html) {
                        setEditorContent(parsed.modified_html);
                        setEditorMarkdown(parsed.modified_html);
                        setHasUnsavedChanges(true);
                        
                        // Force a React re-mount of NotionEditor to apply the upstream update instantly
                        setTimeout(() => {
                            setEditorKey(prev => prev + 1);
                        }, 50);
                    }
                } catch (parseError) {
                    console.error("JSON Parse Error:", parseError, "Raw Response:", aiResponseText);
                    setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponseText }]); // Fallback to raw text
                }
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', content: '응답을 생성할 수 없습니다.' }]);
            }
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ AI 응답 오류가 발생했습니다. "초안 작성해줘"로 다시 시도해 주세요.' }]);
        } finally {
            setChatLoading(false);
            setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    // --- Editor onChange ---
    const handleEditorChange = useCallback((html: string, markdown: string) => {
        setEditorContent(html);
        setEditorMarkdown(markdown);
        setHasUnsavedChanges(true);
    }, []);

    // --- Save Handler ---
    const handleSave = async () => {
        if (!selectedSession?.id || isSaving) return;
        setIsSaving(true);
        const success = await saveEditorContent(selectedSession.id, editorContent, editorMarkdown);
        setIsSaving(false);
        if (success) {
            setHasUnsavedChanges(false);
            const now = new Date();
            setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        }
    };

    // --- Document Upload & Auto-Fill ---
    const handleDocumentAutoFill = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        const fileExt = file.name.toLowerCase();
        const isDocx = fileExt.endsWith('.docx');
        const isHwpx = fileExt.endsWith('.hwpx');
        
        if (!isDocx && !isHwpx) {
            alert("공고문 양식은 반드시 .docx 또는 .hwpx 형식이어야 합니다.");
            return;
        }

        setHwpxLoading(true);
        // Temporary UI update during processing
        setChatMessages(prev => [...prev, { role: 'assistant', content: `⏳ 업로드된 ${isDocx ? 'DOCX' : 'HWPX'} 원본 양식을 분석하고 AI 작성 데이터를 매핑하고 있습니다... (약 10초 소요)` }]);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('payload', JSON.stringify({ document_html: editorContent }));
            // Use env variable if set (e.g. a live Cloudflare tunnel), otherwise always localhost:8001
            const envBackendUrl = process.env.EXPO_PUBLIC_PYTHON_BACKEND_URL || '';
            const baseUrl = envBackendUrl || "http://localhost:8001";
            const endpoint = isDocx ? `${baseUrl}/api/autofill-docx` : `${baseUrl}/api/upload-hwpx`;
            
            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
                headers: {
                    "Bypass-Tunnel-Reminder": "true"
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "문서 매핑 서버 통신 실패 (Python Backend 확인 필요)");
            }

            // Handle Blob response for BOTH DOCX and HWPX (file download)
            let blob = await response.blob();
            // Force explicit MIME type
            const mimeType = isDocx 
                ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                : "application/haansofthwp";
            blob = new Blob([blob], { type: mimeType });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const ext = isDocx ? '.docx' : '.hwpx';
            let safeName = (file.name || `document${ext}`).replace(/[^a-zA-Z0-9.\-_가-힣() ]/g, '_');
            if (!safeName.toLowerCase().endsWith(ext)) safeName += ext;
            a.download = `Publica_Draft_${safeName}`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 15000); // 비동기 차단 및 파일 용량을 대비해 파기 시간 넉넉히 15초 부여
            
            alert(`🎉 ${isDocx ? 'DOCX' : 'HWPX'} 병합본 내보내기 성공!\n설명: AI 초안이 매핑된 파일이 다운로드 폴더에 자동 저장되었습니다.`);
            setChatMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `✅ ${isDocx ? 'DOCX' : 'HWPX'} 문서 매핑이 완료되었습니다. 혹시 브라우저 팝업 차단으로 인해 자동 다운로드가 안 되었다면, 아래 버튼을 눌러 수동으로 받아주세요. (링크는 15초간 유효합니다)`,
                files: [{ name: safeName, url: url }]
            }]);
        } catch (error: any) {
            console.error("Document Processing error:", error);
            alert(`문서 변환 실패: ${error.message}\n(Python 백엔드 서버가 켜져 있는지 메인 터미널을 확인해주세요)`);
            setChatMessages(prev => [...prev, { role: 'assistant', content: `❌ 문서 분석 실패: ${error.message}` }]);
        } finally {
            setHwpxLoading(false);
            if (event.target) event.target.value = '';
        }
    };

    // --- Auto-save every 30 seconds ---
    useEffect(() => {
        if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
        if (selectedSession?.id) {
            autoSaveTimerRef.current = setInterval(() => {
                if (hasUnsavedChanges && editorContent) {
                    handleSave();
                }
            }, 30000);
        }
        return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); };
    }, [selectedSession?.id, hasUnsavedChanges, editorContent]);

    // --- Render ---
    return (
        <View style={styles.container}>
            {/* ─── Header Bar ─── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={toggleLeftPanel} style={styles.headerBtn}>
                        {isLeftPanelOpen ? <PanelLeftClose size={18} color="#94A3B8" /> : <PanelLeftOpen size={18} color="#94A3B8" />}
                    </TouchableOpacity>
                    <View style={styles.headerBrand}>
                        <Zap size={16} color="#818CF8" />
                        <Text style={styles.headerTitle}>Publica NEXUS</Text>
                        <Text style={styles.headerSubtitle}>— Edit</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    {selectedSession && (
                        <>
                            {Platform.OS === 'web' && (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <input
                                        type="file"
                                        accept=".hwpx,.docx"
                                        id="hwpx-upload"
                                        style={{ display: 'none' }}
                                        onChange={handleDocumentAutoFill}
                                        disabled={hwpxLoading}
                                    />
                                    <label htmlFor="hwpx-upload" style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        marginRight: 12, padding: '8px 16px',
                                        backgroundColor: 'rgba(129, 140, 248, 0.1)',
                                        border: '1px solid rgba(129, 140, 248, 0.3)',
                                        borderRadius: 8, cursor: hwpxLoading ? 'wait' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}>
                                        {hwpxLoading ? <ActivityIndicator size="small" color="#818CF8" /> : <Upload size={16} color="#818CF8" />}
                                        <Text style={{ color: '#818CF8', fontWeight: '600', fontSize: 13 }}>원본 DOCX / HWPX 자동 완성</Text>
                                    </label>
                                </div>
                            )}
                            {lastSaved && <Text style={{ color: '#475569', fontSize: 10, fontWeight: '500' }}>저장됨 {lastSaved}</Text>}
                            {hasUnsavedChanges && !isSaving && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' }} />}
                        </>
                    )}
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={isSaving || !selectedSession}
                    >
                        <Save size={16} color="#10B981" />
                        <Text style={styles.saveBtnText}>{isSaving ? '저장 중...' : '저장'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── Main Content ─── */}
            <View style={styles.main}>
                {/* ─── Left Panel: Brainstorm + Chat ─── */}
                <Animated.View style={[styles.leftPanel, { width: leftPanelWidth }]}>
                    {isLeftPanelOpen && (
                        <View style={{ flex: 1 }}>
                            {/* Resume Prompt */}
                            {showResumePrompt && lastSessionId && (
                                <View style={styles.resumeBanner}>
                                    <Text style={styles.resumeText}>📝 이전 작업을 이어서 하시겠어요?</Text>
                                    <View style={styles.resumeActions}>
                                        <TouchableOpacity
                                            style={styles.resumeBtn}
                                            onPress={() => handleLoadSession(lastSessionId)}
                                        >
                                            <Text style={styles.resumeBtnText}>이어하기</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.resumeBtn, { backgroundColor: '#1E293B' }]}
                                            onPress={() => {
                                                setShowResumePrompt(false);
                                                if (Platform.OS === 'web') localStorage.removeItem('NEXUS_EDIT_LAST_SESSION');
                                            }}
                                        >
                                            <Text style={[styles.resumeBtnText, { color: '#94A3B8' }]}>새로 시작</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Session List or Brainstorm Viewer */}
                            {showSessionList ? (
                                <View style={styles.sessionListContainer}>
                                    <View style={styles.sectionHeader}>
                                        <FolderOpen size={16} color="#818CF8" />
                                        <Text style={styles.sectionTitle}>브레인스톰 프로젝트</Text>
                                    </View>
                                    <ScrollView style={styles.sessionScroll}>
                                        {sessions.length === 0 ? (
                                            <View style={styles.emptyState}>
                                                <FileText size={32} color="#334155" />
                                                <Text style={styles.emptyText}>NEXUS-Flow에서 브레인스톰을 먼저 진행하세요</Text>
                                            </View>
                                        ) : (
                                            sessions.map((s: any) => (
                                                <TouchableOpacity
                                                    key={s.id}
                                                    style={styles.sessionItem}
                                                    onPress={() => handleLoadSession(s.id)}
                                                >
                                                    <FileText size={16} color="#60A5FA" />
                                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                                        <Text style={styles.sessionItemTitle} numberOfLines={1}>{s.title}</Text>
                                                        <Text style={styles.sessionItemMeta}>
                                                            {s.workspace_data?.reduce((acc: number, col: any) => acc + (col.branches?.length || 0), 0) || 0} 브랜치 · {new Date(s.updated_at).toLocaleDateString('ko-KR')}
                                                        </Text>
                                                    </View>
                                                    <ChevronRight size={16} color="#475569" />
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            ) : (
                                /* Brainstorm Viewer (selected session branches) */
                                <View style={styles.brainstormViewer}>
                                    <TouchableOpacity
                                        style={styles.backToList}
                                        onPress={() => { setShowSessionList(true); setSelectedSession(null); }}
                                    >
                                        <ArrowLeft size={16} color="#60A5FA" />
                                        <Text style={styles.backToListText}>프로젝트 목록</Text>
                                    </TouchableOpacity>

                                    <View style={styles.sectionHeader}>
                                        <Sparkles size={16} color="#F59E0B" />
                                        {/* 🌟 New: Action Bar for drafting */}
                            {!draftCompleted && !draftGenerating && (
                                    <View style={{ padding: 16, backgroundColor: 'rgba(124, 58, 237, 0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.15)', marginBottom: 16 }}>
                                        <Text style={{ color: '#27272a', fontSize: 14, fontWeight: '800', marginBottom: 6 }}>✨ AI가 초안을 작성해 드릴까요?</Text>
                                        <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 14, lineHeight: 18 }}>브레인스톰 메모와 마인드맵 데이터를 분석하여 PSST 양식의 사업계획서 초안을 작성합니다.</Text>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#7C3AED', paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                                            onPress={() => generateAutoDraft(selectedSession)}
                                        >
                                            <Sparkles size={16} color="#FFF" />
                                            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>AI 초안 작성 시작</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {draftGenerating && (
                                    <View style={{ padding: 16, backgroundColor: 'rgba(124, 58, 237, 0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.1)', marginBottom: 16, alignItems: 'center' }}>
                                        <ActivityIndicator size="small" color="#7C3AED" />
                                        <Text style={{ color: '#7C3AED', fontSize: 13, fontWeight: '700', marginTop: 8 }}>AI 초안 작성 중...</Text>
                                    </View>
                                )}

                            <Text style={styles.sectionTitle}>브레인스톰 데이터</Text>
                                    </View>

                                    <ScrollView style={styles.branchScroll}>
                                        {(selectedSession?.workspace_data || []).map((col: any, ci: number) => (
                                            <View key={ci}>
                                                {(col.branches || []).map((node: any, ni: number) => (
                                                    <TouchableOpacity
                                                        key={node.id || ni}
                                                        style={[styles.branchCard, node.type === 'root' && styles.branchCardRoot]}
                                                        onPress={() => {
                                                            // Insert this branch content into editor
                                                            const insertHtml = `<h2>${node.label || ''}</h2><p>${node.description || ''}</p>`;
                                                            setEditorContent(prev => prev + insertHtml);
                                                        }}
                                                    >
                                                        <Text style={styles.branchLabel}>{node.label || 'Untitled'}</Text>
                                                        <Text style={styles.branchDesc} numberOfLines={2}>{node.description || ''}</Text>
                                                        <Text style={styles.branchInsertHint}>탭하여 에디터에 삽입</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* ─── Chat Section ─── */}
                            <View style={styles.chatSection}>
                                <View style={styles.chatHeader}>
                                    <Bot size={16} color="#818CF8" />
                                    <Text style={styles.chatHeaderText}>AI 작성 도우미</Text>
                                </View>

                                <ScrollView ref={chatScrollRef} style={styles.chatMessages}>
                                    {chatMessages.length === 0 && (
                                        <View style={styles.chatEmpty}>
                                            <Text style={styles.chatEmptyText}>💡 문서 작성 중 궁금한 점이나 도움이 필요하면 질문하세요</Text>
                                        </View>
                                    )}
                                    {chatMessages.map((msg, i) => (
                                        <View key={i} style={[styles.chatBubble, msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI]}>
                                            {msg.role === 'assistant' && <Bot size={14} color="#818CF8" style={{ marginRight: 6, marginTop: 2 }} />}
                                            <View style={{ flex: 1 }}>
                                                <Text style={[
                                                    styles.chatBubbleText, 
                                                    msg.role === 'user' && { color: '#000000', fontWeight: '800' } // 사용자 폰트 블랙 및 볼드 처리
                                                ]}>
                                                    {msg.content}
                                                </Text>
                                                {/* Fallback 다운로드 링크 UI 제공 */}
                                                {msg.files && msg.files.map((f, fi) => (
                                                    <View key={fi} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                                                        {Platform.OS === 'web' ? (
                                                            <a href={f.url} download={f.name} style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', backgroundColor: '#818CF8', padding: '6px 12px', borderRadius: 6, color: 'white', fontSize: 12, fontWeight: '700' }}>
                                                                <Upload size={14} color="white" style={{ transform: [{ rotate: '180deg' }] }} /> {f.name} 다운로드
                                                            </a>
                                                        ) : (
                                                            <View style={{ backgroundColor: '#818CF8', padding: 6, borderRadius: 6 }}>
                                                                <Text style={{ color: 'white', fontSize: 12 }}>다운로드: {f.name}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                                    {chatLoading && (
                                        <View style={[styles.chatBubble, styles.chatBubbleAI]}>
                                            <ActivityIndicator size="small" color="#818CF8" />
                                            <Text style={[styles.chatBubbleText, { marginLeft: 8 }]}>작성 중...</Text>
                                        </View>
                                    )}
                                </ScrollView>

                                <View style={styles.chatInputRow}>
                                    <TextInput
                                        style={styles.chatInput}
                                        value={chatInput}
                                        onChangeText={setChatInput}
                                        placeholder="문서 작성 도움 요청..."
                                        placeholderTextColor="#475569"
                                        onSubmitEditing={handleChatSend}
                                        returnKeyType="send"
                                    />
                                    <TouchableOpacity
                                        style={[styles.chatSendBtn, chatInput.trim() && styles.chatSendBtnActive]}
                                        onPress={handleChatSend}
                                        disabled={!chatInput.trim() || chatLoading}
                                    >
                                        <Send size={16} color={chatInput.trim() ? '#818CF8' : '#475569'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* ─── Right Panel: Editor + Progress Tracker ─── */}
                <View style={styles.rightPanel}>
                    {selectedSession ? (
                        <View style={{ flex: 1, flexDirection: 'row' as any }}>
                            {/* Editor */}
                            <View style={{ flex: 1, position: 'relative' }}>
                                <NotionEditor
                                    key={editorKey}
                                    initialContent={pendingDraftRef.current || editorContent}
                                    onChange={handleEditorChange}
                                    placeholder="/ 를 입력하여 블록 타입을 선택하세요..."
                                />

                                {/* Loading Overlay — 순차 작성 중 현재 단계 표시 */}
                                {draftGenerating && draftCurrentStep && (
                                    <View style={styles.draftLoadingOverlay as any}>
                                        <ActivityIndicator size="large" color="#818CF8" />
                                        <Text style={styles.draftLoadingText}>
                                            ✨ [{draftCurrentStep.current}/{draftCurrentStep.total}] 작성 중...
                                        </Text>
                                        <Text style={styles.draftLoadingSubtext}>
                                            {draftCurrentStep.label}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {/* Progress Tracker Strip — 실제 브랜치 라벨 기반 동적 렌더링 */}
                            <View style={styles.progressStrip}>
                                <Text style={styles.progressStripTitle}>작성 진행</Text>
                                {(draftBranchLabels.length > 0 ? draftBranchLabels : ['문제인식', '실현가능성', '성장전략', '팀 구성', '사업비']).map((label, idx, arr) => {
                                    const isCompleted = draftCompletedSteps.has(idx) || (!draftGenerating && draftCompleted);
                                    const isActive = draftGenerating && draftCurrentStep?.current === idx + 1;
                                    return (
                                        <View key={idx} style={styles.progressStep}>
                                            {idx > 0 && (
                                                <View style={[styles.progressLine, isCompleted && styles.progressLineCompleted]} />
                                            )}
                                            <View style={[
                                                styles.progressCircle,
                                                isCompleted && styles.progressCircleCompleted,
                                                isActive && styles.progressCircleActive,
                                            ]}>
                                                {isCompleted ? (
                                                    <Text style={styles.progressCheckmark}>✓</Text>
                                                ) : isActive ? (
                                                    <ActivityIndicator size="small" color="#818CF8" />
                                                ) : (
                                                    <Text style={[styles.progressNumber, isActive && { color: '#818CF8' }]}>{idx + 1}</Text>
                                                )}
                                            </View>
                                            <Text style={[
                                                styles.progressLabel,
                                                isCompleted && styles.progressLabelCompleted,
                                                isActive && styles.progressLabelActive,
                                            ]} numberOfLines={2}>{label}</Text>
                                            {idx < arr.length - 1 && (
                                                <View style={[styles.progressLineBelow, isCompleted && styles.progressLineCompleted]} />
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.editorPlaceholder}>
                            <FileText size={48} color="#1E293B" />
                            <Text style={styles.placeholderTitle}>문서 작성 준비</Text>
                            <Text style={styles.placeholderDesc}>
                                왼쪽 패널에서 브레인스톰 프로젝트를 선택하거나{'\n'}
                                NEXUS-Flow에서 "서류 작성하러 가기"를 클릭하세요
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

// ═══════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDF8F3',
    },

    // Header
    header: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    headerBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        color: '#27272a',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        color: '#7C3AED',
        fontSize: 13,
        fontWeight: '700',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sessionTitle: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
        maxWidth: 200,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.15)',
    },
    saveBtnText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '800',
    },

    // Main
    main: {
        flex: 1,
        flexDirection: 'row',
    },

    // Left Panel
    leftPanel: {
        borderRightWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FDF8F3',
        overflow: 'hidden',
    },

    // Resume Banner
    resumeBanner: {
        padding: 16,
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
        borderBottomWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.1)',
    },
    resumeText: {
        color: '#27272a',
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 10,
    },
    resumeActions: {
        flexDirection: 'row',
        gap: 8,
    },
    resumeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#7C3AED',
    },
    resumeBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // Session List
    sessionListContainer: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 10,
    },
    sectionTitle: {
        color: '#27272a',
        fontSize: 13,
        fontWeight: '900',
    },
    sessionScroll: {
        flex: 1,
        paddingHorizontal: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    sessionItemTitle: {
        color: '#27272a',
        fontSize: 13,
        fontWeight: '800',
    },
    sessionItemMeta: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },

    // Brainstorm Viewer
    brainstormViewer: {
        flex: 1,
    },
    backToList: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    backToListText: {
        color: '#7C3AED',
        fontSize: 12,
        fontWeight: '700',
    },
    branchScroll: {
        flex: 1,
        padding: 12,
    },
    branchCard: {
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    branchCardRoot: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.03)',
    },
    branchLabel: {
        color: '#27272a',
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 4,
    },
    branchDesc: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 18,
    },
    branchInsertHint: {
        color: '#7C3AED',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 6,
    },

    // Chat Section
    chatSection: {
        height: 280,
        borderTopWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
    },
    chatHeaderText: {
        color: '#27272a',
        fontSize: 12,
        fontWeight: '800',
    },
    chatMessages: {
        flex: 1,
        padding: 12,
    },
    chatEmpty: {
        padding: 16,
        alignItems: 'center',
    },
    chatEmptyText: {
        color: '#94A3B8',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    chatBubble: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 12,
        marginBottom: 8,
        maxWidth: '90%',
    },
    chatBubbleUser: {
        backgroundColor: 'rgba(124, 58, 237, 0.15)', // 가독성을 위해 연한 보라색 배경으로 조정
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.3)',
        alignSelf: 'flex-end',
    },
    chatBubbleAI: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignSelf: 'flex-start',
    },
    chatBubbleText: {
        color: '#475569',
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
    },
    chatInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
        borderTopWidth: 1,
        borderColor: '#F1F5F9',
    },
    chatInput: {
        flex: 1,
        height: 36,
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        paddingHorizontal: 12,
        color: '#27272a',
        fontSize: 13,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chatSendBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    chatSendBtnActive: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.2)',
    },

    // Right Panel
    rightPanel: {
        flex: 1,
        backgroundColor: '#FDF8F3',
    },
    draftLoadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(253, 248, 243, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    draftLoadingText: {
        color: '#27272a',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 16,
    },
    draftLoadingSubtext: {
        color: '#64748B',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },

    // Editor Placeholder
    editorPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    placeholderTitle: {
        color: '#27272a',
        fontSize: 18,
        fontWeight: '800',
    },
    placeholderDesc: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },

    // ─── Progress Tracker Strip ───
    progressStrip: {
        width: 80,
        paddingVertical: 24,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderLeftWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FDF8F3',
    },
    progressStripTitle: {
        color: '#94A3B8',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 20,
    },
    progressStep: {
        alignItems: 'center',
    },
    progressLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E2E8F0',
    },
    progressLineBelow: {
        width: 2,
        height: 20,
        backgroundColor: '#E2E8F0',
    },
    progressLineCompleted: {
        backgroundColor: '#7C3AED',
    },
    progressCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    progressCircleCompleted: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderColor: '#7C3AED',
    },
    progressCircleActive: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
    },
    progressCheckmark: {
        color: '#7C3AED',
        fontSize: 14,
        fontWeight: '900',
    },
    progressNumber: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
    },
    progressLabel: {
        color: '#94A3B8',
        fontSize: 9,
        fontWeight: '700',
        marginTop: 4,
        textAlign: 'center',
    },
    progressLabelCompleted: {
        color: '#7C3AED',
    },
    progressLabelActive: {
        color: '#27272a',
    },
});
