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
    const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
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
        console.log('📝 generateAutoDraft START', {
            title: session.title,
            hasBrainstorm: !!session.brainstorm_content,
            workspaceDataLen: session.workspace_data?.length,
        });

        try {
            // 1. Template metadata (for progress tracker only)
            const defaultSections = getDefaultPSSTTemplate();
            const mockTemplate: GrantTemplate = {
                id: 'default', grant_id: 'default', sections: defaultSections, source_markdown: null, parsed_at: new Date().toISOString()
            };
            setActiveTemplate(mockTemplate);

            // ──────────────────────────────────────────────────────────
            // 🔥 AI 초안 생성: Gemini API 직접 호출 (백엔드 에러 원천 차단)
            // 브레인스톰 내용을 기반으로 "살을 붙여서" 정식 사업계획서 작성
            // ──────────────────────────────────────────────────────────
            const allBranches: any[] = [];
            if (session.workspace_data && Array.isArray(session.workspace_data)) {
                for (const col of session.workspace_data) {
                    if (col.branches && Array.isArray(col.branches)) {
                        allBranches.push(...col.branches);
                    }
                }
            }

            console.log('📝 Found branches for AI drafting:', allBranches.length);
            const docTitle = session.title || '사업계획서';
            
            let draftHtml = `<h1>${docTitle}</h1><p>초안 생성에 실패했습니다. 내용을 직접 작성해주세요.</p>`;

            if (allBranches.length > 0) {
                try {
                    const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
                    if (!geminiKey) throw new Error("GEMINI_API_KEY가 없습니다.");

                    const brainstormText = allBranches.map(b => `[${b.label}]\n${b.description || '내용 없음'}`).join('\n\n');
                    
                    const systemPrompt = `당신은 대한민국 최고 수준의 공공/정부지원사업 사업계획서 대필 전문가(AI 에이전트)입니다.
사용자가 제공한 [브레인스톰 내용]을 바탕으로, 각 항목에 전문적인 살을 붙여 정식 사업계획서 본문(초안)을 작성해주세요.

**[매우 중요한 지시사항]**
1. 사용자의 인사말이나 부연 설명 없이, 오직 완성된 문서만 출력해야 합니다.
2. 문서는 절대 마크다운(Markdown) 기호(#, **, -, *)를 쓰지 말고, 오직 순수 HTML 태그(<h1>, <h2>, <p>, <strong>, <ul>, <li>)로만 구성하세요.
3. 경쟁사와 비교, 일정, 예산 계획, 기대효과 등 복잡한 데이터나 구조화가 필요한 부분은 **반드시 <table>, <thead>, <tbody>, <tr>, <th>, <td> 태그를 사용하여 깔끔하게 도표화(시각화)** 하세요.
4. 문체는 '명사형 맺음(~함, ~임, ~구축 계획임)' 또는 '정중한 비즈니스 경어(~합니다)'로 일관성 있게 작성하세요.
5. 반드시 아래의 순수 JSON 포맷으로만 응답해야 합니다. 코멘트나 마크다운 블록(\`\`\`json) 조차 넣지 말고 오직 중괄호 {} 로 시작하고 끝나는 JSON만 출력하세요.

응답 JSON 규격:
{
    "document_html": "앞서 지시한 완벽한 순수 HTML 코드의 전체 문자열"
}

[브레인스톰 내용]\n${brainstormText}`;

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                            generationConfig: { temperature: 0.2 }
                        })
                    });

                    const data = await response.json();
                    if (data.candidates && data.candidates[0].content.parts[0].text) {
                        let aiResponseText = data.candidates[0].content.parts[0].text;
                        // Clean up markdown markers if Gemini ignores the prompt
                        aiResponseText = aiResponseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
                        
                        try {
                            const parsed = JSON.parse(aiResponseText);
                            if (parsed.document_html) {
                                draftHtml = parsed.document_html;
                            } else {
                                throw new Error("JSON payload missing document_html");
                            }
                        } catch (e) {
                            console.error("Draft JSON Parse Error:", e, aiResponseText);
                            // Fallback heuristic: Try to extract HTML directly 
                            const htmlMatch = aiResponseText.match(/<h[1-6].*/s);
                            if (htmlMatch) {
                                draftHtml = htmlMatch[0];
                            } else {
                                throw new Error("Could not extract HTML from generative response");
                            }
                        }
                    } else {
                        throw new Error("Gemini 응답 구조가 올바르지 않습니다.");
                    }
                } catch (apiError) {
                    console.error("Gemini API Error:", apiError);
                    draftHtml = `<h1>${docTitle}</h1><p>AI 초안 작성 중 오류가 발생했습니다. 브레인스톰 내용만 단순 결합합니다.</p>`;
                    // Fallback: 단순 복붙
                    allBranches.forEach((b: any) => {
                        draftHtml += `<h2>${b.label}</h2><p>${b.description || ''}</p>`;
                    });
                }
            } else if (!session.brainstorm_content) {
                // No data at all — use template
                draftHtml = templateToEditorHtml(mockTemplate, docTitle);
            }

            console.log('📝 Generated draft HTML length:', draftHtml.length);

            // ── DEFINITIVE STRATEGY: window global + interval watchdog ──
            // This CANNOT be overwritten by React re-renders because it runs continuously
            
            // Step 1: Store in ref + React state
            pendingDraftRef.current = draftHtml;
            setEditorContent(draftHtml);
            setEditorMarkdown(draftHtml);
            setDraftCompleted(true);
            setHasUnsavedChanges(true);
            
            if (Platform.OS === 'web') {
                // Step 2: Write to window global (survives React re-renders)
                (window as any).__nexusDraft = draftHtml;
                (window as any).__nexusDraftExpiry = Date.now() + 5000; // 5 second window
                
                // Step 3: Watchdog interval — re-injects every 200ms for 5 seconds
                // This guarantees the draft always wins, even if React template overwrites it
                const watchdog = setInterval(() => {
                    if (!(window as any).__nexusDraft) {
                        clearInterval(watchdog);
                        return;
                    }
                    if (Date.now() > (window as any).__nexusDraftExpiry) {
                        console.log('📝 Watchdog: expiry reached, stopping');
                        (window as any).__nexusDraft = null;
                        clearInterval(watchdog);
                        return;
                    }
                    const editorEl = document.getElementById('nexus-editor-content');
                    if (editorEl) {
                        const currentLen = editorEl.innerHTML.length;
                        const targetHtml = (window as any).__nexusDraft;
                        if (editorEl.innerHTML !== targetHtml) {
                            console.log(`📝 Watchdog: injecting draft (current=${currentLen} target=${targetHtml.length})`);
                            editorEl.innerHTML = targetHtml;
                        }
                    }
                }, 200);
                
                // Step 4: Also remount NotionEditor once
                setTimeout(() => {
                    setEditorKey(prev => prev + 1);
                }, 300);
            }

            // Chat confirmation
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `✅ 초안 작성이 완료되었습니다! ${allBranches.length}개의 브레인스톰 섹션을 문서로 변환했습니다. 오른쪽 에디터 패널에 표시됩니다.`
            }]);

        } catch (err) {
            console.error('📝 Draft generation failed:', err);
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
            
            const prompt = `당신은 대한민국 최고 수준의 공공/정부지원사업 사업계획서 대필 전문가(AI 에이전트)입니다.
사용자의 요청에 따라 사업계획서를 직접 수정해 주어야 합니다.

[작업 지시사항]
1. 사용자의 요청이 원본 문서(현재 에디터 내용)의 특정 부분 수정/추가/삭제를 원한다면, 해당 부분을 정밀하게 반영하여 **전체 HTML 코드**를 다시 작성해 \`modified_html\` 필드에 담아주세요.
2. 만약 수정 요청이 아니라 단순 질문이나 대화라면, \`modified_html\`은 null로 설정하세요.
3. **[가장 중요]** \`modified_html\`안에는 절대로 마크다운(#, **)이나 인사말을 넣지 마세요! 반드시 <h1>, <h2>, <p>, <ul>, <table>, <thead>, <tbody>, <tr>, <th>, <td> 태그만을 사용한 **순수 HTML**로만 작성하세요.
4. 경쟁사와 비교, 일정, 예산 계획, 기대효과 등 구조화가 필요한 부분은 **반드시 <table> 태그를 사용하여 깔끔한 표(Table)로 시각화** 하세요.
5. 반드시 아래의 순수 JSON 포맷으로만 응답해야 합니다. 코멘트나 마크다운 블록(\`\`\`json) 조차 넣지 말고 오직 중괄호 {} 로 시작하고 끝나는 JSON만 출력하세요.

응답 JSON 규격:
{
    "reply": "사용자에게 할 친절한 채팅 답변 (예: 네, 요청하신 대로 성장전략 표를 추가했습니다.)",
    "modified_html": "HTML 코드 (수정이 필요 없는 경우 null)"
}

[현재 에디터 내용 (HTML)]
${editorContext}

[관련 브레인스톰 데이터]
${brainstormContext}

사용자 요청: ${userMsg}`;

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
                aiResponseText = aiResponseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
                
                try {
                    const parsed = JSON.parse(aiResponseText);
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
        
        const isDocx = file.name.endsWith('.docx');
        const isHwpx = file.name.endsWith('.hwpx');
        
        if (!isDocx && !isHwpx) {
            alert("공고문 양식은 반드시 .docx 또는 .hwpx 형식이어야 합니다.");
            return;
        }

        setHwpxLoading(true);
        // Temporary UI update during processing
        setChatMessages(prev => [...prev, { role: 'assistant', content: `⏳ 업로드된 ${isDocx ? 'DOCX' : 'HWPX'} 원본 양식을 분석하고 AI 작성 데이터를 매핑하고 있습니다... (약 10초 소요)` }]);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("payload", editorContent);

            const endpoint = isDocx ? "http://localhost:8000/api/autofill-docx" : "http://localhost:8000/api/upload-hwpx";
            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "문서 매핑 서버 통신 실패 (Python Backend 확인 필요)");
            }

            if (isDocx) {
                // Handle Blob response for DOCX (file download)
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `[Publica_완성본]_${file.name}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                alert(`🎉 DOCX 매핑 성공!\n원본: ${file.name}\n설명: AI 초안이 매핑된 DOCX 파일이 다운로드 폴더에 저장되었습니다.`);
                setChatMessages(prev => [...prev, { role: 'assistant', content: `✅ DOCX 완성본 병합이 완료되었습니다. 내 컴퓨터 폴더에서 확인해 보세요!` }]);
            } else {
                // Handling HWPX PoC response (JSON preview)
                const data = await response.json();
                console.log("HWPX Engine Response:", data);
                
                alert(`🎉 HWPX 매핑 엔진(Python) 연동 성공!\n원본: ${file.name}\n결과: ${data.message}\n설명: 현재 파일 분해/조립 엔진(Ph.2 PoC)이 완벽하게 가동되었습니다.\n(실제 자동완성본 다운로드는 UI/V2에서 연결됩니다)`);
                setChatMessages(prev => [...prev, { role: 'assistant', content: `✅ HWPX 원본 구조 분석이 완료되었습니다. (성공)\n진짜 자동완성본 다운로드는 Phase 2에서 완벽하게 활성화됩니다.` }]);
            }
            
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
                                <View style={{ padding: 16, backgroundColor: 'rgba(79, 70, 229, 0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(79, 70, 229, 0.25)', marginBottom: 16 }}>
                                    <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '700', marginBottom: 6 }}>✨ AI가 초안을 작성해 드릴까요?</Text>
                                    <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 14, lineHeight: 18 }}>브레인스톰 메모와 마인드맵 데이터를 분석하여 PSST 양식의 사업계획서 초안을 작성합니다.</Text>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                                        onPress={() => generateAutoDraft(selectedSession)}
                                    >
                                        <Sparkles size={16} color="#FFF" />
                                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>AI 초안 작성 시작</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {draftGenerating && (
                                <View style={{ padding: 16, backgroundColor: 'rgba(129, 140, 248, 0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)', marginBottom: 16, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#818CF8" />
                                    <Text style={{ color: '#818CF8', fontSize: 13, fontWeight: '700', marginTop: 8 }}>AI 초안 작성 중...</Text>
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
                                            <Text style={styles.chatBubbleText}>{msg.content}</Text>
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

                                {/* Loading Overlay during Auto Draft Generation */}
                                {draftGenerating && (
                                    <View style={styles.draftLoadingOverlay as any}>
                                        <ActivityIndicator size="large" color="#818CF8" />
                                        <Text style={styles.draftLoadingText}>✨ AI 통합 초안 작성 중...</Text>
                                        <Text style={styles.draftLoadingSubtext}>브레인스톰 메모와 마인드맵을 바탕으로{'\n'}사업계획서를 구성하고 있습니다.</Text>
                                    </View>
                                )}
                            </View>
                            {/* Progress Tracker Strip */}
                            <View style={styles.progressStrip}>
                                <Text style={styles.progressStripTitle}>작성 진행</Text>
                                {[
                                    { id: 1, label: '문제인식', key: '문제인식' },
                                    { id: 2, label: '실현가능성', key: '실현가능성' },
                                    { id: 3, label: '성장전략', key: '성장전략' },
                                    { id: 4, label: '팀 구성', key: '팀' },
                                    { id: 5, label: '사업비', key: '사업비' },
                                ].map((step, idx, arr) => {
                                    const isCompleted = editorContent.toLowerCase().includes(step.key.toLowerCase()) && editorContent.length > 100;
                                    const isActive = !isCompleted && (idx === 0 || editorContent.toLowerCase().includes(arr[idx - 1]?.key.toLowerCase()));
                                    return (
                                        <View key={step.id} style={styles.progressStep}>
                                            {/* Connecting Line (above) */}
                                            {idx > 0 && (
                                                <View style={[styles.progressLine, isCompleted && styles.progressLineCompleted]} />
                                            )}
                                            {/* Circle */}
                                            <View style={[
                                                styles.progressCircle,
                                                isCompleted && styles.progressCircleCompleted,
                                                isActive && styles.progressCircleActive,
                                            ]}>
                                                {isCompleted ? (
                                                    <Text style={styles.progressCheckmark}>✓</Text>
                                                ) : (
                                                    <Text style={[styles.progressNumber, isActive && { color: '#818CF8' }]}>{step.id}</Text>
                                                )}
                                            </View>
                                            {/* Label */}
                                            <Text style={[
                                                styles.progressLabel,
                                                isCompleted && styles.progressLabelCompleted,
                                                isActive && styles.progressLabelActive,
                                            ]}>{step.label}</Text>
                                            {/* Connecting Line (below) */}
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
        backgroundColor: '#020617',
    },

    // Header
    header: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: '#1E293B',
        backgroundColor: '#0F172A',
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
        backgroundColor: '#1E293B',
    },
    headerBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        color: '#818CF8',
        fontSize: 13,
        fontWeight: '600',
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
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
    },
    saveBtnText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
    },

    // Main
    main: {
        flex: 1,
        flexDirection: 'row',
    },

    // Left Panel
    leftPanel: {
        borderRightWidth: 1,
        borderColor: '#1E293B',
        backgroundColor: '#0B1120',
        overflow: 'hidden',
    },

    // Resume Banner
    resumeBanner: {
        padding: 16,
        backgroundColor: 'rgba(129,140,248,0.08)',
        borderBottomWidth: 1,
        borderColor: 'rgba(129,140,248,0.15)',
    },
    resumeText: {
        color: '#C7D2FE',
        fontSize: 13,
        fontWeight: '700',
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
        backgroundColor: '#4F46E5',
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
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '800',
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
        color: '#475569',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#111827',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    sessionItemTitle: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '700',
    },
    sessionItemMeta: {
        color: '#475569',
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
        color: '#60A5FA',
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
        backgroundColor: '#111827',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    branchCardRoot: {
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79,70,229,0.08)',
    },
    branchLabel: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 4,
    },
    branchDesc: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 18,
    },
    branchInsertHint: {
        color: '#4F46E5',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 6,
    },

    // Chat Section
    chatSection: {
        height: 280,
        borderTopWidth: 1,
        borderColor: '#1E293B',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#1E293B',
    },
    chatHeaderText: {
        color: '#C7D2FE',
        fontSize: 12,
        fontWeight: '700',
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
        color: '#475569',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    chatBubble: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 10,
        marginBottom: 8,
        maxWidth: '90%',
    },
    chatBubbleUser: {
        backgroundColor: '#1E293B',
        alignSelf: 'flex-end',
    },
    chatBubbleAI: {
        backgroundColor: 'rgba(129,140,248,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(129,140,248,0.15)',
        alignSelf: 'flex-start',
    },
    chatBubbleText: {
        color: '#CBD5E1',
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
        borderColor: '#1E293B',
    },
    chatInput: {
        flex: 1,
        height: 36,
        backgroundColor: '#111827',
        borderRadius: 10,
        paddingHorizontal: 12,
        color: '#E2E8F0',
        fontSize: 13,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    chatSendBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E293B',
    },
    chatSendBtnActive: {
        backgroundColor: 'rgba(129,140,248,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(129,140,248,0.3)',
    },

    // Right Panel
    rightPanel: {
        flex: 1,
        backgroundColor: '#020617',
    },
    draftLoadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    draftLoadingText: {
        color: '#E2E8F0',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    draftLoadingSubtext: {
        color: '#94A3B8',
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
        color: '#334155',
        fontSize: 18,
        fontWeight: '700',
    },
    placeholderDesc: {
        color: '#475569',
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
        borderColor: '#1E293B',
        backgroundColor: '#0B1120',
    },
    progressStripTitle: {
        color: '#64748B',
        fontSize: 9,
        fontWeight: '800',
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
        backgroundColor: '#1E293B',
    },
    progressLineBelow: {
        width: 2,
        height: 20,
        backgroundColor: '#1E293B',
    },
    progressLineCompleted: {
        backgroundColor: '#818CF8',
    },
    progressCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
        borderWidth: 2,
        borderColor: '#1E293B',
    },
    progressCircleCompleted: {
        backgroundColor: 'rgba(129,140,248,0.15)',
        borderColor: '#818CF8',
    },
    progressCircleActive: {
        borderColor: '#818CF8',
        backgroundColor: 'rgba(129,140,248,0.08)',
    },
    progressCheckmark: {
        color: '#818CF8',
        fontSize: 14,
        fontWeight: '800',
    },
    progressNumber: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '700',
    },
    progressLabel: {
        color: '#475569',
        fontSize: 9,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
    progressLabelCompleted: {
        color: '#818CF8',
    },
    progressLabelActive: {
        color: '#C7D2FE',
    },
});
