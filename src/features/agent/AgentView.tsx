import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Animated, LayoutAnimation, Dimensions, Platform, PanResponder, UIManager, Alert, ScrollView, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
// 아이콘 필수!
import { RefreshCw, ZoomIn, ZoomOut, Folder, Save, X, Trash2, UploadCloud, ExternalLink, FileEdit, Zap } from 'lucide-react-native';
import { WelcomeScreen } from './components/WelcomeScreen';

import { ModeDropdown } from './components/ModeDropdown';
import { TowerCard } from './components/TowerCard';
import { DetailPanel, DetailPanelRef } from './components/DetailPanel';
// FloatingChat removed — chat is now inside DetailPanel (INSPECTOR)
import { FileUploader } from './components/FileUploader';
import { RootNodeCard } from './components/RootNodeCard';
import { SplitLayout } from './components/SplitLayout';
import { UnifiedPanel } from './components/UnifiedPanel';
import { FloatingContextMenu } from './components/FloatingContextMenu';
import { ExplanationPopover } from './components/ExplanationPopover';
import { IdeaQuestionnaire } from './components/IdeaQuestionnaire';
import { ContextDock } from './components/ContextDock';

// import { PDFViewerPanel } from './components/PDFViewerPanel'; // Lazy load for safety
const PDFViewerPanel = React.lazy(() => import('./components/PDFViewerPanel').then(module => ({ default: module.PDFViewerPanel }))) as any;
import { LAYOUT } from './AgentLayout';
import { useSessionManager } from './hooks/useSessionManager';
import { useProjectStore } from '../../store/useProjectStore';
import { useAuth } from '../../contexts/AuthContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';


const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const AgentView = ({ initialSession, onNavigateToEdit }: { initialSession?: any; onNavigateToEdit?: () => void }) => {
    // --- 1. User & Session Hook ---
    const [user, setUser] = useState<any>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);
    // AI 프로필 — IdeaQuestionnaire 자동 채움 + AI 프롬프트 주입에 사용
    const { profile: userProfile } = useAuth();

    // 세션 매니저 (저장/불러오기 담당)
    const { sessions, currentSessionId, setCurrentSessionId, saveSession, loadSession, fetchSessions, deleteSession } = useSessionManager(user?.id);

    // --- 2. UI States ---
    const [agentMode, setAgentMode] = useState('Literature Review');
    const [activeNode, setActiveNode] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // 🌟 Welcome Screen State
    const [showWelcome, setShowWelcome] = useState(true);

    const [projectTitle, setProjectTitle] = useState<string>(''); // 🌟 FIX: 전용 타이틀 상태 도입
    const [isTransitioning, setIsTransitioning] = useState(false); // 🌟 NEW: 에디터 진입 로딩 상태
    const [transitionStep, setTransitionStep] = useState(''); // 🌟 NEW: 로딩 단계 메시지

    // 🌟 File Uploader Ref (For Programmatic Access)
    const fileUploaderRef = useRef<any>(null);
    const detailPanelRef = useRef<DetailPanelRef>(null);


    const [pdfUrl, setPdfUrl] = useState<string | null>(null); // For Split View
    const [isDragging, setIsDragging] = useState(false);

    // 🌟 Grant Analysis States
    const [grantUrl, setGrantUrl] = useState<string | null>(null); // 공고문 원문 WebView URL
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);
    const [pendingGrantQuery, setPendingGrantQuery] = useState<string>('');
    const [pendingGrantTitle, setPendingGrantTitle] = useState<string>('');
    const [showGrantConfirm, setShowGrantConfirm] = useState(false);
    const [brainstormContent, setBrainstormContent] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Removed debug PDF loading to prevent irrelevant files.

    // 🌟 Context Menu State (The Nervous System Step 2)
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; text: string; type?: string; context?: any }>({
        visible: false, x: 0, y: 0, text: "", type: undefined, context: undefined
    });

    // 🌟 Explanation Popover State
    const [explanation, setExplanation] = useState<{ visible: boolean; x: number; y: number; text: string; mode: 'explain' | 'translate'; context?: any }>({
        visible: false, x: 0, y: 0, text: "", mode: 'explain', context: undefined
    });

    // 🌟 [Load Prop] 외부에서 주입된 세션 로드
    useEffect(() => {
        if (initialSession) {
            console.log("📂 Loading Session from Props:", initialSession.title);
            setAgentMode(initialSession.mode);
            setColumns(initialSession.workspace_data || []);
            setChatHistory(initialSession.chat_history || []);
            if (initialSession.pdf_url) setPdfUrl(initialSession.pdf_url);
            if (initialSession.brainstorm_content) setBrainstormContent(initialSession.brainstorm_content);
            if (initialSession.title) setProjectTitle(initialSession.title); // 🌟 FIX: 타이틀 복원
            setShowWelcome(false);

            // 🌟 Grant Analysis: Show questionnaire for grant mode
            if (initialSession.auto_run_query && initialSession.mode === 'Grant Strategist') {
                console.log("📋 Grant detected — showing questionnaire first");
                // Set grant URL if available (for WebView split)
                if (initialSession.grant_url) {
                    setGrantUrl(initialSession.grant_url);
                }
                setPendingGrantQuery(initialSession.auto_run_query);
                setPendingGrantTitle(initialSession.title || '');
                setShowGrantConfirm(true);
            } else if (initialSession.auto_run_query) {
                // Non-grant auto-run (legacy behavior)
                console.log("🚀 Auto-Run Triggered:", initialSession.auto_run_query);
                setTimeout(() => {
                    handleStart(initialSession.auto_run_query);
                }, 500);
            }
        }
    }, [initialSession]);

    // --- 3. Canvas States ---
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const scale = useRef(new Animated.Value(1)).current;
    const [scaleDisplay, setScaleDisplay] = useState(1);
    const canvasRef = useRef<View>(null);
    const [isLeftPanelMinimized, setIsLeftPanelMinimized] = useState(false);
    const [isInspectorOpen, setIsInspectorOpen] = useState(true);

    // 🌟 3.5 Active Path State for Ponder UI (Bug 5 Fix)
    // Tracks { [absoluteColumnIndex]: branchId }
    const [activePathNodes, setActivePathNodes] = useState<Record<number, string>>({});

    // --- 4. Web Zoom Fix (스크롤 방지) ---
    useEffect(() => {
        if (Platform.OS === 'web') {
            const canvasEl = canvasRef.current as unknown as HTMLElement;
            const handleWebWheel = (e: WheelEvent) => {
                if (e.ctrlKey) e.preventDefault();
                e.preventDefault();
                e.stopPropagation();
                const delta = e.deltaY * -0.002;
                let newScale = (scale as any)._value + delta;
                newScale = Math.min(Math.max(newScale, 0.3), 3);
                scale.setValue(newScale);
                setScaleDisplay(newScale);
            };
            if (canvasEl) canvasEl.addEventListener('wheel', handleWebWheel, { passive: false });
            return () => { if (canvasEl) canvasEl.removeEventListener('wheel', handleWebWheel); };
        }
    }, []);

    // 🌟 Auto-Save Logic — Only update EXISTING sessions, never create phantom new ones
    useEffect(() => {
        if (columns.length > 0 && user && currentSessionId) {
            const timer = setTimeout(() => {
                // 🌟 FIX: projectTitle이 있으면 그것을 최우선으로 사용, 없을 때만 root_node 사용 (오버라이트 방지)
                const derivedTitle = columns[0]?.root_node || "Untitled Project";
                const titleToSave = projectTitle.trim() || derivedTitle;
                saveSession(titleToSave, agentMode, columns, chatHistory, pdfUrl || undefined, brainstormContent);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [columns, chatHistory, currentSessionId, brainstormContent, pdfUrl, agentMode, projectTitle]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5,
            onPanResponderGrant: () => { pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value }); pan.setValue({ x: 0, y: 0 }); },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: () => { pan.flattenOffset(); }
        })
    ).current;

    // --- 5. AI Logic Handlers (Real AI Mode) ---
    const callAgent = async (text: string, context: string = "", targetColIdx: number = -1) => {
        try {
            console.log("🚀 [Real AI] Calling insight-agent-gateway:", text.substring(0, 80));

            let finalContext = context;
            if (targetColIdx >= 0) {
                // 🌟 Context Compiler: Fetch the root idea and active path
                let contextParts = [];
                if (columns[0]?.root_node) {
                    contextParts.push(`[System] User's Core Business Idea: ${columns[0].root_node}`);
                }

                let path = [];
                for (let i = 0; i <= targetColIdx; i++) {
                    const nodeId = activePathNodes[i];
                    if (nodeId && columns[i]?.branches) {
                        const node = columns[i].branches.find((b: any) => b.id === nodeId);
                        if (node) {
                            path.push(`${node.label}: ${node.description}`);
                        }
                    }
                }
                if (path.length > 0) {
                    contextParts.push(`[System] Current Strategic Path to this node:\n- ${path.join('\n- ')}`);
                }

                const compiledPath = contextParts.join('\n\n');
                finalContext = compiledPath + (context ? `\n\n[Specific Task Context]:\n${context}` : '');
            }

            const finalInput = finalContext ? `${text}\n\n[Context Data]:\n${finalContext}` : text;

            const { data, error } = await supabase.functions.invoke('insight-agent-gateway', {
                body: {
                    user_input: finalInput,
                    user_job: 'Strategist',
                    task_mode: 'Hypothesis Generator'
                }
            });

            // Handle Supabase/Network Errors
            if (error) {
                console.warn("⚠️ Edge Function Error detected, triggering fallback:", error);
                throw error;
            }

            if (data?.workspace_data) {
                return {
                    workspace_data: data.workspace_data,
                    suggested_actions: data.suggested_actions || [],
                    chat_message: data.chat_message || 'Analysis complete'
                };
            }

            throw new Error("Invalid response format from AI");

        } catch (e: any) {
            console.error("AI Error:", e);

            // 🌟 GEMINI DIRECT FALLBACK: Edge Function 실패 시 Gemini API 직접 호출
            try {
                const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
                if (!geminiKey) throw new Error("no key");

                const p = userProfile as any;
                const profileSnippet = p ? `사용자 아이템: ${p.item_one_liner || ''}\n핵심 기술: ${p.core_technology || ''}\n목표 시장: ${p.target_market || ''}` : '';

                const fallbackPrompt = `당신은 한국 정부 지원사업 전문 컨설턴트입니다.
${profileSnippet ? `\n[사용자 정보]\n${profileSnippet}\n` : ''}
[요청]\n${text}${context ? `\n\n[맥락]\n${context.substring(0, 3000)}` : ''}

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이):
{
  "workspace_data": {
    "root_node": "핵심 전략 한 줄 요약",
    "branches": [
      {"id":"b-1","step_number":1,"label":"단계 제목","description":"구체적인 실행 내용 (2-3문장)","type":"research"},
      {"id":"b-2","step_number":2,"label":"단계 제목","description":"구체적인 실행 내용 (2-3문장)","type":"research"},
      {"id":"b-3","step_number":3,"label":"단계 제목","description":"구체적인 실행 내용 (2-3문장)","type":"strategy"},
      {"id":"b-4","step_number":4,"label":"단계 제목","description":"구체적인 실행 내용 (2-3문장)","type":"documentation"}
    ]
  },
  "suggested_actions": [
    {"label":"세부 계획 수립","type":"PLAN","query":"세부 실행 계획을 수립해주세요"},
    {"label":"근거 자료 검색","type":"VERIFY","query":"관련 근거 자료를 찾아주세요"}
  ],
  "chat_message": "분석 완료"
}`;

                const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: fallbackPrompt }] }], generationConfig: { temperature: 0.7 } })
                });

                const json = await resp.json();
                const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const parsed = JSON.parse(cleaned);

                if (parsed?.workspace_data?.branches?.length > 0) {
                    setChatHistory(prev => [...prev, { text: "AI가 맞춤형 전략을 생성했습니다.", sender: 'ai' }]);
                    return parsed;
                }
                throw new Error("empty branches");
            } catch (fallbackErr) {
                console.error("Gemini fallback also failed:", fallbackErr);
            }

            // 🛡️ LAST-RESORT FALLBACK: API 전부 실패 시 사용자 데이터 기반 템플릿 생성
            // → 항상 브랜치 카드를 표시하여 blank/welcome 화면 방지
            const p = userProfile as any;
            const grantName = pendingGrantTitle || text.split('\n')[0].substring(0, 40) || '지원사업';
            const itemName = p?.item_one_liner || p?.company_name || '아이템';
            const tech = p?.core_technology || '핵심 기술';
            const market = p?.target_market || '목표 시장';
            const industry = p?.industry || p?.major_category || '해당 업종';

            setChatHistory(prev => [...prev, {
                text: `📋 AI 서버 연결이 원활하지 않아 기본 전략 프레임워크를 불러왔습니다.\n브랜치를 클릭하여 AI 심층 분석을 진행할 수 있습니다.`,
                sender: 'ai'
            }]);

            return {
                workspace_data: {
                    root_node: `${grantName} — ${itemName} 맞춤 전략`,
                    branches: [
                        {
                            id: 'lr-1', step_number: 1,
                            label: '지원 자격 및 적합성 검토',
                            description: `${grantName}의 신청 자격 요건을 ${industry} 분야 기준으로 검토합니다. 사업자 유형, 업력, 지역 제한 등 필수 조건을 확인하고 가점 항목을 파악합니다.`,
                            type: 'research'
                        },
                        {
                            id: 'lr-2', step_number: 2,
                            label: '핵심 차별성 어필 전략',
                            description: `${tech}을 중심으로 기존 시장 대비 기술적 독창성을 부각합니다. 평가 위원이 주목하는 '문제 인식 → 솔루션 → 임팩트' 스토리라인을 구성합니다.`,
                            type: 'strategy'
                        },
                        {
                            id: 'lr-3', step_number: 3,
                            label: '시장성 및 사업화 계획',
                            description: `${market}을 대상으로 한 구체적인 매출 계획과 BM을 수립합니다. TAM/SAM/SOM 분석과 3년 성장 로드맵을 수치 기반으로 작성합니다.`,
                            type: 'strategy'
                        },
                        {
                            id: 'lr-4', step_number: 4,
                            label: '제출 서류 체크리스트',
                            description: `${grantName} 제출을 위한 필수 서류 목록을 점검합니다. 사업계획서, 재무제표, 팀원 이력서 등 누락 시 감점·탈락으로 이어지는 항목을 우선 확인합니다.`,
                            type: 'documentation'
                        }
                    ]
                },
                suggested_actions: [
                    { label: '심층 분석', type: 'PLAN', query: `${grantName}에 대해 더 자세한 전략을 수립해주세요` },
                    { label: '서류 준비 가이드', type: 'VERIFY', query: `${grantName} 제출 서류를 구체적으로 안내해주세요` }
                ],
                chat_message: '기본 전략 프레임워크 로드 완료'
            };
        }
    };

    // 🧠 [핵심 변경] 문서 파싱 후 실제 AI 백엔드 호출
    const processWithBrain = async (markdown: string) => {
        try {
            setLoading(true);
            setShowWelcome(false); // Hide welcome
            setChatHistory(prev => [...prev, {
                text: "AI가 문서를 정밀 분석하여 맞춤형 인사이트를 추출합니다...",
                sender: 'ai'
            }]);

            // Call the real Agent with the document text as Context
            const contextStr = 'Upload Document Markdown Payload:\n' + markdown.substring(0, 30000);
            const res = await callAgent(
                "내가 업로드한 문서를 분석하고, 이를 바탕으로 핵심 전략 프레임워크 4단계를 도출해줘.",
                contextStr
            );

            if (res?.workspace_data) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setColumns([{ ...res.workspace_data, parentIndex: -1 }]);
                setChatHistory(prev => [...prev, {
                    text: res.chat_message || "✅ 문서 기반 세부 전략 도출이 완료되었습니다.",
                    sender: 'ai'
                }]);

                if (res.suggested_actions) {
                    setSuggestions(res.suggested_actions);
                }
            } else {
                throw new Error("Invalid format");
            }

        } catch (error: any) {
            console.error("Brain Processing Error:", error);
            setChatHistory(prev => [...prev, { text: `❌ 문서 분석 중 오류가 발생했습니다: ${error.message}`, sender: 'ai' }]);
        } finally {
            setLoading(false);
        }
    };

    // 🌟 [Real AI] 시작 함수
    const handleStart = async (text: string) => {
        if (!text.trim()) return;
        setLoading(true); setColumns([]); setActiveNode(null); setSuggestions([]);

        // Call Real AI
        const res = await callAgent(text);

        if (res?.workspace_data) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setColumns([{ ...res.workspace_data, parentIndex: -1 }]);

            if (res.suggested_actions && res.suggested_actions.length > 0) {
                setSuggestions(res.suggested_actions);
            } else {
                setSuggestions([
                    { label: "🔍 심층 분석", type: "EXPAND", query: `Analyze '${text}' in depth` },
                    { label: "🗓️ 실행 계획 수립", type: "PLAN", query: "Create action plan" }
                ]);
            }
        }
        setLoading(false);
    };

    // 🌟 [Grant AI] 사업 아이디어 포함 분석 시작
    const handleStartWithIdea = async (grantQuery: string, businessIdea: any) => {
        setShowQuestionnaire(false);
        setLoading(true); setColumns([]); setActiveNode(null); setSuggestions([]);

        // ── 회사 AI 프로필 블록 (Step 3에서 입력한 정보) ──────────────────────
        const p = userProfile as any;
        const companyProfileSection = p ? [
            p.company_name ? `• 회사/아이템명: ${p.company_name}` : '',
            p.item_one_liner ? `• 핵심 정의: ${p.item_one_liner}` : '',
            p.core_technology ? `• 핵심 기술/차별점: ${p.core_technology}` : '',
            p.current_achievements ? `• 현재 성과: ${p.current_achievements}` : '',
            p.team_background ? `• 팀 역량: ${p.team_background}` : '',
            p.target_market ? `• 목표 시장: ${p.target_market}` : '',
            p.industry ? `• 업종: ${p.industry}` : '',
        ].filter(Boolean).join('\n') : '';

        // ── 사업 아이디어를 포함한 강화된 프롬프트 ──────────────────────────
        const enhancedQuery = [
            grantQuery,
            '',
            '## 사용자 사업 정보',
            companyProfileSection,
            `- 아이디어 설명: ${businessIdea.description || '(미입력)'}`,
            `- 팀 구성: ${businessIdea.teamComposition || '(미입력)'}`,
            `- 현재 단계: ${businessIdea.currentStage || '(미입력)'}`,
            `- 타겟 시장: ${businessIdea.targetMarket || '(미입력)'}`,
            `- 핵심 차별점: ${businessIdea.differentiator || '(미입력)'}`,
            '',
            'IMPORTANT: 위 사용자의 실제 사업 정보를 핵심 근거로 사용하여 이 공고에 최적화된 전략을 수립하세요.',
            '각 브랜치의 description은 이 회사/아이디어에 맞는 구체적이고 실질적인 3~4문장 실행 계획으로 작성하세요.',
            '절대 일반적인 예시나 할루시네이션 없이, 위 정보에 기반한 맞춤형 내용만 작성하세요.',
        ].filter(l => l !== undefined).join('\n');

        setChatHistory(prev => [...prev, {
            text: `📝 사업 아이디어가 반영된 맞춤형 분석을 시작합니다...\n• 아이디어: ${businessIdea.description}\n• 팀: ${businessIdea.teamComposition}\n• 단계: ${businessIdea.currentStage}`,
            sender: 'ai'
        }]);

        const res = await callAgent(enhancedQuery);

        if (res?.workspace_data) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

            // 🔥 UX FIX: 명시적으로 공고명을 뿌리 노드에 박아넣음
            const rootTitle = pendingGrantTitle ? `[공고명: ${pendingGrantTitle}] 맞춤형 사업 전략` : res.workspace_data.root_node;

            setColumns([{ ...res.workspace_data, root_node: rootTitle, parentIndex: -1 }]);
            if (res.suggested_actions && res.suggested_actions.length > 0) {
                setSuggestions(res.suggested_actions);
            }
        }
        setLoading(false);
    };

    // 🌟 [Real AI] 채팅 함수
    const handleChatSend = async (text: string) => {
        setChatHistory(prev => [...prev, { text, sender: 'me' }]);
        setLoading(true);
        setSuggestions([]); // 칩 숨기기

        const contextStr = activeNode
            ? `Current Node: ${activeNode.label}\nDescription: ${activeNode.description}`
            : "General Context";

        const res = await callAgent(text, contextStr);

        if (res) {
            if (res.workspace_data?.branches && res.workspace_data.branches.length > 0) {
                // Tag branches with unique IDs
                const chatBranches = res.workspace_data.branches.map((b: any, i: number) => ({
                    ...b,
                    source: 'chat_response',
                    id: b.id || `chat_branch_${Date.now()}_${i}`
                }));

                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

                if (!activeNode) {
                    // 🌟 ROOT LEVEL INJECTION: append directly to main brainstorm panel
                    setColumns(prev => {
                        if (prev.length === 0) {
                            return [{
                                root_node: "맞춤형 전략 브레인스톰",
                                branches: chatBranches,
                            }];
                        }
                        const updated = [...prev];
                        const existingIds = new Set((updated[0].branches || []).map((b: any) => b.id));
                        const uniqueNewBranches = chatBranches.filter((b: any) => !existingIds.has(b.id));
                        updated[0] = {
                            ...updated[0],
                            branches: [...(updated[0].branches || []), ...uniqueNewBranches]
                        };
                        return updated;
                    });
                } else {
                    // 🌟 NESTED COLUMN INJECTION: User is chatting within a specific node
                    const colIdx = columns.findIndex(col => col.branches?.some((b: any) => b.id === activeNode.id));
                    const bIdx = colIdx !== -1 ? columns[colIdx].branches.findIndex((b: any) => b.id === activeNode.id) : 0;

                    setColumns(prev => {
                        const existingChildIdx = prev.findIndex(c =>
                            c.sourceColumnIndex === (colIdx !== -1 ? colIdx : 0) && c.parentIndex === bIdx
                        );
                        if (existingChildIdx !== -1) {
                            // MERGE: append chat branches, filtering out duplicates by ID
                            const updated = [...prev];
                            const existingIds = new Set((updated[existingChildIdx].branches || []).map((b: any) => b.id));
                            const uniqueNewBranches = chatBranches.filter((b: any) => !existingIds.has(b.id));
                            updated[existingChildIdx] = {
                                ...updated[existingChildIdx],
                                branches: [...(updated[existingChildIdx].branches || []), ...uniqueNewBranches],
                            };
                            return updated;
                        }
                        return [
                            ...prev,
                            {
                                ...res.workspace_data,
                                branches: chatBranches,
                                parentIndex: bIdx,
                                sourceColumnIndex: colIdx !== -1 ? colIdx : 0
                            }
                        ];
                    });

                    // Force-set parent node active so visibleColumns includes new child
                    if (colIdx !== -1) {
                        setActivePathNodes(prev => ({ ...prev, [colIdx]: activeNode.id }));
                    }
                }
            }
            // Chat message response
            if (res.chat_message) {
                setChatHistory(prev => [...prev, { text: res.chat_message, sender: 'ai' }]);
            } else if (res.workspace_data?.branches?.length > 0) {
                // Fallback: generate summary from branches if no chat_message
                const summary = res.workspace_data.branches.map((b: any) => `• ${b.label}`).join('\n');
                setChatHistory(prev => [...prev, { text: `분석 결과:\n${summary}`, sender: 'ai' }]);
            } else {
                setChatHistory(prev => [...prev, { text: '응답을 생성하지 못했습니다. 다시 시도해주세요.', sender: 'ai' }]);
            }
            if (res.suggested_actions) {
                setSuggestions(res.suggested_actions);
            }
        } else {
            setChatHistory(prev => [...prev, { text: '⚠️ AI 연결에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.', sender: 'ai' }]);
        }
        setLoading(false);
    };

    // 🌟 3.6 Visible Columns Logic (Bug 5 Fix)
    // Computes which columns are actually visible based on the active path lineage
    const { visibleColumns, absColIndices } = useMemo(() => {
        if (!columns || columns.length === 0) return { visibleColumns: [], absColIndices: [] };
        const result: any[] = [columns[0]];
        const absIndices = [0];

        let currentAbsColIdx = 0;
        let visibleDepth = 0;

        while (true) {
            const activeNodeId = activePathNodes[currentAbsColIdx];
            if (!activeNodeId) break;

            const currentCol = columns[currentAbsColIdx];
            const activeBIdx = currentCol?.branches?.findIndex((b: any) => b.id === activeNodeId);
            if (activeBIdx === undefined || activeBIdx === -1) break;

            const childAbsIdx = columns.findIndex(
                (c, i) => i > currentAbsColIdx && c.parentIndex === activeBIdx && c.sourceColumnIndex === currentAbsColIdx
            );

            if (childAbsIdx !== -1) {
                result.push(columns[childAbsIdx]);
                absIndices.push(childAbsIdx);
                currentAbsColIdx = childAbsIdx;
                visibleDepth++;
            } else {
                break;
            }
        }
        return { visibleColumns: result, absColIndices: absIndices };
    }, [columns, activePathNodes]);

    // Used by handleExpand, Deep Dive, and Branching
    // 🌟 FIX: Auto-restore child path when revisiting a previously-expanded node
    const handleSelectNode = (node: any, absoluteColIdx: number, parentIndex?: number) => {
        setActivePathNodes(prev => {
            const newPath = { ...prev };
            // If already active, toggle it off (collapse) and prune deeper
            if (newPath[absoluteColIdx] === node.id) {
                for (let k in newPath) {
                    if (Number(k) >= absoluteColIdx) delete newPath[k];
                }
                setActiveNode(null);
                return newPath;
            }
            // Prune deeper paths when switching to a different node
            for (let k in newPath) {
                if (Number(k) >= absoluteColIdx) delete newPath[k];
            }
            newPath[absoluteColIdx] = node.id;

            // 🌟 Auto-restore FIX: Re-activate existing child paths recursively
            let currentAbsIdx = absoluteColIdx;
            let currentParentNodeId = node.id;
            let activeBIdx = parentIndex !== undefined ? parentIndex : columns[currentAbsIdx]?.branches?.findIndex((b: any) => b.id === node.id);

            while (activeBIdx !== undefined && activeBIdx !== -1) {
                const childAbsIdx = columns.findIndex(
                    (c, i) => i > currentAbsIdx && c.parentIndex === activeBIdx && c.sourceColumnIndex === currentAbsIdx
                );
                
                if (childAbsIdx !== -1) {
                    const childCol = columns[childAbsIdx];
                    if (childCol?.branches?.length > 0) {
                        // Restore the first branch of the child column by default or previously selected
                        const childBranchId = childCol.branches[0].id; // Simple auto-restore to first child
                        newPath[childAbsIdx] = childBranchId;
                        
                        // Move pointers down the tree
                        currentAbsIdx = childAbsIdx;
                        currentParentNodeId = childBranchId;
                        activeBIdx = 0; // Since we picked the first branch
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            return newPath;
        });
        setActiveNode(node);
    };

    const handleExpand = async (branch: any, absColIdx: number, branchIndex: number) => {
        const existingChildIdx = columns.findIndex(
            (col, i) => i > absColIdx && col.parentIndex === branchIndex && col.sourceColumnIndex === absColIdx
        );

        if (existingChildIdx !== -1) {
            // Already fetched, just toggle visibility AND restore its children
            handleSelectNode(branch, absColIdx, branchIndex);
            return;
        }

        handleSelectNode(branch, absColIdx, branchIndex);
        setLoading(true);
        setSuggestions([]);

        const contextStr = `Expand on: ${branch.label}\nDescription: ${branch.description}`;
        const res = await callAgent(`Provide detailed next steps for: ${branch.label}`, contextStr);

        if (res?.workspace_data) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setColumns(prev => [
                ...prev,
                {
                    ...res.workspace_data,
                    parentIndex: branchIndex,
                    sourceColumnIndex: absColIdx,
                }
            ]);
        }
        if (res?.suggested_actions) setSuggestions(res.suggested_actions);
        setLoading(false);
    };

    // 💾 저장 버튼 로직 (DB에 저장 -> 파일 관리자에 뜸)
    const handleSave = async () => {
        if (!user) { Alert.alert("오류", "로그인이 필요합니다."); return; }
        if (columns.length === 0) { Alert.alert("알림", "빈 화면은 저장할 수 없습니다."); return; }

        const defaultTitle = pendingGrantTitle || columns[0]?.root_node || "Untitled Project";
        const finalTitle = projectTitle.trim() || defaultTitle; // 🌟 FIX: window.prompt 제거, UI 입력된 projectTitle 우선 적용

        // Pass pdfUrl as 5th argument, brainstormContent as 6th
        const success = await saveSession(finalTitle, agentMode, columns, chatHistory, pdfUrl || undefined, brainstormContent);

        if (success) {
            setToastMessage("성공적으로 저장되었습니다.");
            setTimeout(() => setToastMessage(null), 3000);
        } else {
            Alert.alert("오류", "저장에 실패했습니다.");
        }
    };

    // 🌟 사업계획서 자동 생성 로직 (Phase 6)
    const handleGenerateBusinessPlan = async (): Promise<string | null> => {
        if (!columns || columns.length === 0) {
            Alert.alert("오류", "먼저 AI 브랜칭 분석을 진행해주세요.");
            return null;
        }

        try {
            // 🌟 1. 전체 마인드맵 트리 취합 (모든 PSST 기둥과 하위 딥다이브 포함)
            const fullTreeContext = columns.map((col, idx) => {
                return {
                    layer: idx === 0 ? "Core PSST Pillars" : `Depth ${idx} Elaborations`,
                    nodes: (col.branches || []).map((b: any) => ({
                        label: b.label,
                        insight: b.description
                    }))
                };
            });

            if (fullTreeContext.length === 0 || fullTreeContext[0].nodes.length === 0) {
                Alert.alert("알림", "마인드맵 데이터가 없습니다. 먼저 AI 분석을 진행해주세요.");
                return null;
            }

            const payload = {
                business_idea: columns[0]?.root_node || "비즈니스 전략 제안",
                selected_nodes_context: fullTreeContext,
                pdf_context: pdfUrl ? "첨부된 PDF(공고문)의 핵심 요건에 맞춘 전략" : "정부지원사업 표준 PSST 양식 적용"
            };

            const { data, error } = await supabase.functions.invoke('generate-business-plan', {
                body: payload
            });

            if (error) {
                console.error("Supabase Edge Function Error:", error);
                throw error;
            }
            if (data?.markdown) return data.markdown;

            return null;

        } catch (error: any) {
            console.error("문서 생성 오류:", error);
            Alert.alert("생성 실패", "사업계획서 초안을 작성하는 데 실패했습니다.");
            return null;
        }
    };

    // ... (omitted)

    const handleOpenHistory = () => setShowHistory(true);

    // 🔄 불러오기 로직
    const handleLoad = async (sessionId: string) => {
        const data = await loadSession(sessionId);
        if (data) {
            setCurrentSessionId(sessionId); // 🌟 FIX: 현재 세션 ID 유지 (덮어쓰기 위해)
            setAgentMode(data.mode);
            setColumns(data.workspace_data);
            setChatHistory(data.chat_history || []);
            if (data.pdf_url) setPdfUrl(data.pdf_url);
            if (data.brainstorm_content) setBrainstormContent(data.brainstorm_content);
            if (data.title) setProjectTitle(data.title); // 🌟 FIX: 타이틀 복원
            setShowHistory(false);
            setShowWelcome(false);
            setIsLeftPanelMinimized(false);
        }
    };

    // 🚀 Planner 전환 (맥락 유지)
    const handleSmartAction = async (type: string, node: any) => {
        if (type === 'PLAN') {
            setAgentMode('Research Planner');
            setChatHistory(prev => [...prev, { text: `[System] '${node.label}' 기반 실행 계획 수립 시작.`, sender: 'ai' }]);

            setColumns([{
                root_node: `Plan: ${node.label}`,
                branches: [node]
            }]);

            handleStart(`Create a detailed action plan for: ${node.label}`);
            setActiveNode(null);
        } else if (type === 'DEEP_DIVE') {
            // 🔍 Deep Dive — deep-analyze 호출 후 결과를 새 브랜치 플로우 카드로 생성
            setChatHistory(prev => [...prev, { text: `🔍 '${node.label}' 심층 분석 중... 새 플로우가 생성됩니다.`, sender: 'ai' }]);
            setLoading(true);
            setActiveNode(node);

            try {
                const colIdx = columns.findIndex(col => col.branches?.some((b: any) => b.id === node.id));
                const bIdx = colIdx !== -1 ? columns[colIdx].branches.findIndex((b: any) => b.id === node.id) : 0;

                const contextStr = `Deep dive analysis: Break down "${node.label}" into detailed sub-steps with technical specifics, risks, and implementation details. Description: ${node.description || ''}\nFocus heavily on making the output highly specific and actionable.`;
                const res = await callAgent(
                    `Perform a deep dive analysis on: ${node.label}`,
                    contextStr,
                    colIdx
                );

                if (res?.workspace_data?.branches && res.workspace_data.branches.length > 0) {
                    console.log(`✅ Deep Dive returned ${res.workspace_data.branches.length} branches`);
                    const deepDiveBranches = res.workspace_data.branches.map((b: any, i: number) => ({
                        ...b,
                        source: 'deep_dive',  // 🏷️ Blue badge
                        id: `deep_${node.id}_${i}_${Date.now()}`
                    }));

                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setColumns(prev => {
                        // Find existing child column for this node (handleExpand might have created one)
                        const existingChildIdx = prev.findIndex(c =>
                            c.sourceColumnIndex === colIdx && c.parentIndex === bIdx
                        );
                        if (existingChildIdx !== -1) {
                            // REPLACE: Deep Dive replaces existing child branches (prevents duplication on repeat)
                            const updated = [...prev];
                            updated[existingChildIdx] = {
                                ...updated[existingChildIdx],
                                branches: deepDiveBranches,
                            };
                            return updated;
                        }
                        return [
                            ...prev,
                            {
                                root_node: `🔍 ${node.label} 심층 분석`,
                                branches: deepDiveBranches,
                                parentIndex: bIdx,
                                sourceColumnIndex: colIdx,
                            }
                        ];
                    });

                    setChatHistory(prev => [...prev, { text: `✅ '${node.label}' 심층 분석 완료! ${deepDiveBranches.length}개의 세부 항목이 추가되었습니다.`, sender: 'ai' }]);

                    // 🌟 FIX: Force-set parent node active (no toggle!) so visibleColumns includes new column
                    setActivePathNodes(prev => ({ ...prev, [colIdx]: node.id }));

                } else {
                    console.error('❌ Deep Dive response had no branches:', JSON.stringify(res).substring(0, 200));
                    setChatHistory(prev => [...prev, { text: `⚠️ 분석 결과를 파싱할 수 없습니다. 다시 시도해주세요.`, sender: 'ai' }]);
                }
            } catch (err: any) {
                setChatHistory(prev => [...prev, { text: `❌ 심층 분석 오류: ${err.message}. 상태를 보존합니다.`, sender: 'ai' }]);
            } finally {
                setLoading(false);
            }
        } else if (type === 'BRANCH') {
            setChatHistory(prev => [...prev, { text: `🌿 '${node.label}' 하위 실행 단계를 생성합니다...`, sender: 'ai' }]);
            setLoading(true);
            setActiveNode(node);

            try {
                const colIdx = columns.findIndex(col => col.branches?.some((b: any) => b.id === node.id));
                const bIdx = colIdx !== -1 ? columns[colIdx].branches.findIndex((b: any) => b.id === node.id) : 0;

                const contextStr = `Expand on: ${node.label}\nDescription: ${node.description}`;
                const res = await callAgent(
                    `Provide detailed next steps for: ${node.label}. Generate distinct new steps that build upon the existing context.`,
                    contextStr,
                    colIdx
                );

                if (res?.workspace_data?.branches && res.workspace_data.branches.length > 0) {
                    console.log(`✅ Branch returned ${res.workspace_data.branches.length} branches`);
                    const newBranches = res.workspace_data.branches.map((b: any, i: number) => ({
                        ...b,
                        source: 'branching', // 🏷️ Green badge
                        id: `branch_${node.id}_${Date.now()}_${i}` // unique ID
                    }));

                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setColumns(prev => {
                        // Find existing child column for this node (handleExpand might have created one)
                        const existingChildIdx = prev.findIndex(c =>
                            c.sourceColumnIndex === colIdx && c.parentIndex === bIdx
                        );
                        if (existingChildIdx !== -1) {
                            // REPLACE: Branch replaces existing child branches (prevents duplication on repeat)
                            const updated = [...prev];
                            updated[existingChildIdx] = {
                                ...updated[existingChildIdx],
                                branches: newBranches,
                            };
                            return updated;
                        }
                        return [
                            ...prev,
                            {
                                root_node: `🌿 ${node.label} 세부 단계`,
                                branches: newBranches,
                                parentIndex: bIdx,
                                sourceColumnIndex: colIdx,
                            }
                        ];
                    });
                    setChatHistory(prev => [...prev, { text: `✅ '${node.label}' 하위 단계 생성이 완료되었습니다.`, sender: 'ai' }]);

                    // 🌟 FIX: Force-set parent node active (no toggle!) so visibleColumns includes new column
                    setActivePathNodes(prev => ({ ...prev, [colIdx]: node.id }));
                } else {
                    console.error('❌ Branch response had no branches:', JSON.stringify(res).substring(0, 200));
                    setChatHistory(prev => [...prev, { text: `❌ 하위 단계를 생성하지 못했습니다. 다시 시도해주세요.`, sender: 'ai' }]);
                }
            } catch (err: any) {
                setChatHistory(prev => [...prev, { text: `❌ 브랜치 생성 오류: ${err.message}`, sender: 'ai' }]);
            } finally {
                setLoading(false);
            }
        } else if (type === 'ASK') {
            // Ask AI → open chat section inside INSPECTOR panel
            if (detailPanelRef.current) {
                detailPanelRef.current.setInput(`[${node.label}] 에 대해 질문: `);
            }
        } else if (type === 'CHAT_TO_BRANCH') {
            // 💬 CHAT_TO_BRANCH — User clicked "Save this answer as a branch" inside the AI Chat bubble
            // node.customQuery contains the AI's actual text response we want to branch off.
            const chatResponseText = node.customQuery || "새로운 인사이트";

            // Create a single branch off this answer
            const newBranches = [{
                id: `chat_${node.id}_${Date.now()}`,
                label: chatResponseText.substring(0, 40) + (chatResponseText.length > 40 ? "..." : ""),
                description: chatResponseText,
                type: 'insight',
                source: 'ask_ai', // 🏷️ Purple badge for Chat-based branches
                completed: false
            }];

            const colIdx = columns.findIndex(col => col.branches?.some((b: any) => b.id === node.id));
            const bIdx = colIdx !== -1 ? columns[colIdx].branches.findIndex((b: any) => b.id === node.id) : 0;
            const existingChildColIdx = columns.findIndex(col => col.parentIndex === bIdx && col.sourceColumnIndex === colIdx);

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

            // 🧠 Auto-Select Logic: Determine the absolute column index where this will go
            const targetAbsColIdx = existingChildColIdx !== -1 ? existingChildColIdx : columns.length;

            setColumns(prev => {
                if (existingChildColIdx !== -1) {
                    const newCols = [...prev];
                    newCols[existingChildColIdx] = {
                        ...newCols[existingChildColIdx],
                        branches: [...(newCols[existingChildColIdx].branches || []), ...newBranches]
                    };
                    return newCols;
                } else {
                    return [
                        ...prev,
                        {
                            root_node: `💬 AI 인사이트`,
                            branches: newBranches,
                            parentIndex: bIdx,
                            sourceColumnIndex: colIdx,
                        }
                    ];
                }
            });

            // 🔥 Auto-expand the newly created chat branch
            handleSelectNode(newBranches[0], targetAbsColIdx);
            setChatHistory(prev => [...prev, { text: `✅ 해당 채팅 답변이 대시보드 브랜치로 저장되었습니다!`, sender: 'system' }]);
        }
    };

    const manualZoom = (delta: number) => {
        let newScale = (scale as any)._value + delta;
        newScale = Math.min(Math.max(newScale, 0.3), 3);
        Animated.spring(scale, { toValue: newScale, useNativeDriver: false, friction: 7 }).start();
        setScaleDisplay(newScale);
    };

    // 🌟 PDF Viewer Controller
    const pdfViewerRef = useRef<any>(null);

    const handleCitationClick = (page: number) => {
        console.log(`🔗 Jumping to PDF Page: ${page}`);
        pdfViewerRef.current?.scrollToPage(page);
    };

    // 🧠 Action: Pin to Canvas (Add to Mind Map)
    const handlePinToCanvas = (text: string) => {
        const newNode = {
            id: `pin-${Date.now()}`,
            label: "Pinned Note",
            description: text,
            type: 'note', // Distinct type for notes
            step_number: 0
        };

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (columns.length === 0) {
            // Create Root
            setColumns([{
                root_node: "My Research Notes",
                branches: [{ ...newNode, step_number: 1 }]
            }]);
        } else {
            // Append to the last active column or create a new branch in it
            const lastColIdx = columns.length - 1;
            const updatedColumns = [...columns];
            const lastCol = updatedColumns[lastColIdx];

            // Add to branches
            lastCol.branches = [...(lastCol.branches || []), { ...newNode, step_number: (lastCol.branches?.length || 0) + 1 }];
            setColumns(updatedColumns);
        }

        // Feedback (Moonlight style toast or sound could trigger here)
        console.log("📌 Node added to Mind Map:", text);
    };

    // 🧠 Action: Ask AI (Deep Dive)
    const handleAskAI = (text: string) => {
        detailPanelRef.current?.setInput(`"${text}"\n\n`);
    };

    // 🧠 Action: Summarize
    const handleSummarize = (text: string) => {
        detailPanelRef.current?.setInput(`Please summarize this section:\n"${text}"`);
        // Optional: Auto-submit? handleChatSend(...)
    };

    // 🌟 Workspace Render Helper (Extract for Split View Reuse)
    const renderWorkspace = () => (
        <View
            style={{ flex: 1, backgroundColor: '#FDF8F3' }}
            {...(Platform.OS === 'web' ? {
                onDragOver: (e: any) => { e.preventDefault(); },
                onDragEnter: () => setIsDragging(true),
                onDragLeave: () => setIsDragging(false),
                onDrop: (e: any) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) {
                        console.log("📂 Dropped File:", file.name);
                        // 🚀 Send to FileUploader for processing (LlamaParse or Text)
                        if (fileUploaderRef.current) {
                            fileUploaderRef.current.uploadFile(file);
                        } else {
                            Alert.alert("오류", "파일 업로더가 준비되지 않았습니다.");
                        }
                    }
                }
            } : {})}
        >
            {/* Drag Overlay */}
            {isDragging && (
                <View style={styles.dragOverlay}>
                    <UploadCloud size={48} color="#3B82F6" />
                    <Text style={styles.dragText}>Drop PDF here to analyze</Text>
                </View>
            )}

            {/* 🌟 Welcome Screen Overlay */}
            {showWelcome && columns.length === 0 && !loading ? (
                <WelcomeScreen
                    onStartChat={() => {
                        setAgentMode('Research Planner');
                        setShowWelcome(false);
                    }}
                    onUploadFile={() => {
                        setAgentMode('Literature Review');
                        // Don't auto-expand chat here, let user drag & drop or use pill
                        Alert.alert("Tip", "파일을 화면에 드래그하거나, 채팅창의 첨부 버튼을 이용하세요.");
                        setTimeout(() => fileUploaderRef.current?.pickDocument(), 500); // Trigger after slight delay
                    }}
                    onResumeWorks={handleOpenHistory}
                />
            ) : (
                <View style={{ flex: 1 }}>

                    {/* 🌟 Empty State Placeholder (Literature Review Only) */}
                    {columns.length === 0 && !loading && agentMode === 'Literature Review' && !pdfUrl && (
                        <View style={styles.emptyPlaceholder}>
                            <UploadCloud size={48} color="#334155" />
                            <Text style={styles.emptyTitle}>Drag & Drop PDF</Text>
                            <Text style={styles.emptySub}>분석할 문서를 여기에 놓아주세요</Text>
                        </View>
                    )}

                    {/* Canvas Viewport */}
                    <View ref={canvasRef} style={styles.canvasViewport} {...panResponder.panHandlers}>
                        <Animated.View style={[styles.canvasWorld, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scale }] }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                {columns.length > 0 && columns[0]?.root_node && (
                                    <View style={{ alignSelf: 'center', marginRight: 20 }}>
                                        <RootNodeCard
                                            hypothesis={columns[0].root_node}
                                            branchCount={columns[0].branches?.length || 0}
                                        />
                                    </View>
                                )}
                                {visibleColumns.map((col, idx) => {
                                    const absColIdx = absColIndices[idx];
                                    const activeBranchIdInThisCol = activePathNodes[absColIdx];

                                    return (
                                        <View key={absColIdx} style={styles.columnWrapper}>
                                            <View style={styles.nodeList}>
                                                {col.branches?.map((branch: any, bIdx: number) => {
                                                    const isSelected = activeBranchIdInThisCol === branch.id;
                                                    const anySelectedInCol = !!activeBranchIdInThisCol;
                                                    const isCollapsed = anySelectedInCol && !isSelected;

                                                    // To draw the perfect bezier curve, we need the exact Y coordinate of both the parent and child card's center points.
                                                    // Since cards can be either expanded (160px) or collapsed (48px), we must iterate through the column and sum up the exact heights and gaps to find the absolute Y position of any card's center relative to the top of its column.
                                                    const getCardY = (targetColItem: any, targetAbsColIdx: number, targetItemIdx: number) => {
                                                        if (!targetColItem || !targetColItem.branches) return 0;

                                                        let totalY = 0;
                                                        const targetActiveBranchId = activePathNodes[targetAbsColIdx];

                                                        // Sum up the total space taken by all cards ABOVE the target card
                                                        for (let i = 0; i < targetItemIdx; i++) {
                                                            const iBranchId = targetColItem.branches[i]?.id;
                                                            const iIsSelected = targetActiveBranchId === iBranchId;
                                                            const iAnySelectedInCol = !!targetActiveBranchId;
                                                            const iIsCollapsed = iAnySelectedInCol && !iIsSelected;

                                                            const iHeight = iIsCollapsed ? 48 : 160;
                                                            totalY += iHeight + 20; // 20px gap
                                                        }

                                                        // Now add HALF of the target card's own height to find its center
                                                        const myBranchId = targetColItem.branches[targetItemIdx]?.id;
                                                        const myIsSelected = targetActiveBranchId === myBranchId;
                                                        const myAnySibSelected = !!targetActiveBranchId;
                                                        const myIsCollapsed = myAnySibSelected && !myIsSelected;

                                                        const myHeight = myIsCollapsed ? 48 : 160;
                                                        totalY += myHeight / 2;

                                                        return totalY;
                                                    };

                                                    const sourceAbsColIdx = col.sourceColumnIndex !== undefined ? col.sourceColumnIndex : -1;
                                                    const sourceColItem = sourceAbsColIdx !== -1 ? columns[sourceAbsColIdx] : null;

                                                    // We subtract the parent's absolute Y from our absolute Y.
                                                    // Positive diff = parent is ABOVE us. Negative diff = parent is BELOW us.
                                                    const verticalDiff = sourceColItem
                                                        ? getCardY(sourceColItem, sourceAbsColIdx, col.parentIndex) - getCardY(col, absColIdx, bIdx)
                                                        : 0;

                                                    return (
                                                        <TowerCard
                                                            key={branch.id}
                                                            data={branch}
                                                            idx={absColIdx}
                                                            myIndex={bIdx}
                                                            parentIndex={col.parentIndex}
                                                            selected={isSelected}
                                                            collapsed={isCollapsed}
                                                            verticalDiff={verticalDiff}
                                                            onSelect={() => handleExpand(branch, absColIdx, bIdx)}
                                                        />
                                                    );
                                                })}

                                                {/* Loading Card inside column */}
                                                {loading && idx === visibleColumns.length - 1 && (
                                                    <View style={{ marginTop: 20 }}>
                                                        <View style={[styles.nodeList, { opacity: 0.5 }]}>
                                                            <View style={styles.loadingCard}>
                                                                <ActivityIndicator color="#3B82F6" />
                                                                <Text style={styles.loadingText}>Analyzing...</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}

                                {loading && visibleColumns.length === 0 && (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#3B82F6" />
                                        <Text style={styles.loadingText}>Thinking...</Text>
                                    </View>
                                )}
                            </View>
                        </Animated.View>
                    </View>



                </View>
            )}

            {/* DetailPanel removed — now embedded inside UnifiedPanel (left panel) */}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Zap size={16} color="#7C3AED" />
                        <Text style={{ color: '#27272a', fontSize: 14, fontWeight: '900', letterSpacing: -0.3 }}>Publica NEXUS</Text>
                        <Text style={{ color: '#7C3AED', fontSize: 13, fontWeight: '700' }}>— Flow</Text>
                    </View>
                    
                    {/* 🌟 FIX: 방해되는 window.prompt 대신 네이티브 헤더 UI에 이름 입력창 배치 */}
                    {!showWelcome && columns.length > 0 && (
                        <View style={{ marginLeft: 8 }}>
                            <TextInput 
                                value={projectTitle}
                                onChangeText={setProjectTitle}
                                placeholder="프로젝트 이름 설정..."
                                placeholderTextColor="#94A3B8"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    color: '#27272a',
                                    borderWidth: 1,
                                    borderColor: '#E2E8F0',
                                    borderRadius: 8,
                                    paddingHorizontal: 12,
                                    paddingVertical: 5,
                                    fontSize: 13,
                                    fontWeight: '700',
                                    minWidth: 200,
                                    outlineStyle: 'none',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2
                                } as any}
                            />
                        </View>
                    )}

                    {/* 🌟 Panel Toggle Buttons — In header for easy access */}
                    {!showWelcome && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                            <TouchableOpacity
                                style={[
                                    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
                                    !isLeftPanelMinimized
                                        ? { backgroundColor: 'rgba(124, 58, 237, 0.08)', borderColor: '#7C3AED' }
                                        : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
                                ]}
                                onPress={() => setIsLeftPanelMinimized(!isLeftPanelMinimized)}
                            >
                                <Text style={{ fontSize: 12 }}>✏️</Text>
                                <Text style={{ color: !isLeftPanelMinimized ? '#7C3AED' : '#64748B', fontSize: 11, fontWeight: '800' }}>
                                    에디터
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
                                    isInspectorOpen
                                        ? { backgroundColor: 'rgba(124, 58, 237, 0.08)', borderColor: '#7C3AED' }
                                        : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
                                ]}
                                onPress={() => setIsInspectorOpen(!isInspectorOpen)}
                            >
                                <Text style={{ fontSize: 12 }}>🔍</Text>
                                <Text style={{ color: isInspectorOpen ? '#7C3AED' : '#64748B', fontSize: 11, fontWeight: '800' }}>
                                    분석
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* 🌟 Zoom Slider — shadcn-inspired */}
                    {!showWelcome && Platform.OS === 'web' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 16, backgroundColor: '#111827', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#1E293B' }}>
                            <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '700' }}>🔍</Text>
                            <input
                                type="range"
                                min="30"
                                max="200"
                                value={Math.round(scaleDisplay * 100)}
                                onChange={(e: any) => {
                                    const newScale = parseInt(e.target.value) / 100;
                                    scale.setValue(newScale);
                                    setScaleDisplay(newScale);
                                }}
                                style={{
                                    width: 100, height: 4,
                                    accentColor: '#10B981',
                                    cursor: 'pointer',
                                    appearance: 'auto',
                                } as any}
                            />
                            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600', minWidth: 36, textAlign: 'center' }}>
                                {Math.round(scaleDisplay * 100)}%
                            </Text>
                        </View>
                    )}
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginRight: 10, alignItems: 'center' }}>
                    {/* CTA: 서류 작성하러 가기 (visible when 3+ branches) */}
                    {columns.length >= 2 && onNavigateToEdit && (
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: '#4F46E5', borderWidth: 1, borderColor: '#6366F1' }}
                            disabled={isTransitioning}
                            onPress={async () => {
                                if (isTransitioning) return;
                                setIsTransitioning(true);
                                setTransitionStep('브레인스톰 데이터를 수합하고 있습니다...');

                                try {
                                    // 1. 수합된 마크다운 데이터 준비
                                    let compiledMarkdown = brainstormContent || '';
                                    if (!compiledMarkdown) {
                                        compiledMarkdown = columns.map(col => {
                                            return col.branches?.map((b: any) => `### ${b.label}\n${b.description || ''}`).join('\n\n') || '';
                                        }).join('\n\n');
                                    }

                                    // 2. Build draft HTML using AI (Gemini Direct REST API)
                                    setTransitionStep('AI가 브레인스톰 데이터를 바탕으로 사업계획서 초안을 작성하고 있습니다... (약 10초)');
                                    
                                    const docTitle = projectTitle.trim() || pendingGrantTitle || '사업계획서';
                                    let aiDraftHtml = `<h1>${docTitle}</h1><p>초안 생성에 실패했습니다. 내용을 직접 작성해주세요.</p>`;
                                    
                                    let branchCount = 0;
                                    const allBranches: any[] = [];
                                    columns.forEach((col: any) => {
                                        if (col.branches) {
                                            allBranches.push(...col.branches.filter((b: any) => b.type !== 'root'));
                                            branchCount += col.branches.length;
                                        }
                                    });

                                    if (allBranches.length > 0) {
                                        try {
                                            const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
                                            if (!geminiKey) throw new Error("GEMINI_API_KEY가 없습니다.");

                                            const brainstormText = allBranches.map(b => `[${b.label}]\n${b.description || '내용 없음'}`).join('\n\n');
                                            
                                            const systemPrompt = `당신은 대한민국 최고 수준의 공공/정부지원사업 사업계획서 대필 전문가(AI 에이전트)입니다.
사용자가 제공한 [브레인스톰 내용]을 바탕으로, 각 항목에 전문적인 살을 붙여 정식 사업계획서 본문(초안)을 작성해주세요.

**[매우 중요한 지시사항]**
1. 반드시 HTML 형식으로만 출력하세요. (Markdown 불가) 허용 태그: <h1>, <h2>, <h3>, <p>, <strong>, <ul>, <ol>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>.
2. 경쟁사와 비교, 일정, 예산 계획, 기대효과 등 구조화가 필요한 부분은 **반드시 <table> 태그를 사용하여 깔끔한 표(Table)로 시각화** 하세요. (예: 추진 일정표, 예산 소요 계획표 등)
3. 문체는 '명사형 맺음(~함, ~임, ~구축 계획임)' 또는 '정중한 비즈니스 경어(~합니다)'로 일관성 있게 작성하세요.
4. 내용이 부실한 브레인스톰 항목이 있더라도, 주제를 추론하여 그럴듯한 기대효과나 전략을 **스스로 창작하여 덧붙여주세요**.
5. 내용 없이 "작성해주세요"만 있는 부분도 AI가 직접 가상의(하지만 논리적인) 사업 내용을 지어내서라도 풍성하게 작성하세요.
\n\n[브레인스톰 내용]\n${brainstormText}`;

                                            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                                                    generationConfig: { temperature: 0.7 }
                                                })
                                            });

                                            const data = await response.json();
                                            if (data.candidates && data.candidates[0].content.parts[0].text) {
                                                let text = data.candidates[0].content.parts[0].text;
                                                text = text.replace(/```html\s*/g, '').replace(/```\s*$/g, '').trim();
                                                aiDraftHtml = text;
                                            } else {
                                                throw new Error("Gemini API error");
                                            }
                                        } catch (apiError) {
                                            console.error("AgentView Gemini API Error:", apiError);
                                            // Fallback
                                            aiDraftHtml = `<h1>${docTitle}</h1><p>AI 초안 작성 중 오류가 발생했습니다. 브레인스톰 내용만 단순 복사했습니다.</p>`;
                                            allBranches.forEach(b => {
                                                aiDraftHtml += `<h2>${b.label}</h2><p>${b.description || ''}</p>`;
                                            });
                                        }
                                    }
                                    
                                    console.log('📝 Flow→Edit: Built draft from', branchCount, 'branches, HTML length:', aiDraftHtml.length);

                                    // 3. 현재 세션 저장 (초안 포함)
                                    setTransitionStep('에디터 세션을 동기화하고 있습니다...');
                                    const finalTitle = projectTitle.trim() || pendingGrantTitle || columns[0]?.root_node || 'Untitled';
                                    
                                    await saveSession(finalTitle, agentMode, columns, chatHistory, pdfUrl || undefined, brainstormContent, aiDraftHtml, aiDraftHtml);

                                    // 4. 스토어 설정 및 이동
                                    useProjectStore.getState().setProject(null, {
                                        id: currentSessionId || undefined,
                                        title: finalTitle,
                                        workspace_data: columns,
                                        chat_history: chatHistory,
                                        brainstorm_content: compiledMarkdown,
                                        editor_content: aiDraftHtml, // 🌟 핵심: 생성된 초안을 넘김
                                        pdf_url: pdfUrl || '',
                                    });

                                    onNavigateToEdit();
                                } catch (err) {
                                    console.error('Transition failed:', err);
                                    Alert.alert("알림", "AI 초안 생성 중 오류가 발생했습니다. 기본 양식으로 이동합니다.");
                                    onNavigateToEdit();
                                } finally {
                                    setIsTransitioning(false);
                                }
                            }}
                        >
                            <FileEdit size={14} color="#FFF" />
                            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>서류 작성하러 가기</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleOpenHistory}><Folder size={22} color="#94A3B8" /></TouchableOpacity>
                    <TouchableOpacity onPress={handleSave}><Save size={22} color="#10B981" /></TouchableOpacity>
                </View>
            </View>
            <FileUploader
                ref={fileUploaderRef}
                style={{ display: 'none' }}
                onFileSelect={(fileUrl) => {
                    console.log("🚀 AgentView: Immediate PDF Load:", fileUrl);
                    setPdfUrl(fileUrl);
                    setShowWelcome(false);
                    setAgentMode('Literature Review');
                    setLoading(true);
                }}
                onUploadComplete={async (markdown, fileUrl) => {
                    // PDF URL is already set by onFileSelect, but we ensure it here just in case
                    if (fileUrl && !pdfUrl) {
                        setPdfUrl(fileUrl);
                        setShowWelcome(false);
                        setAgentMode('Literature Review');
                    }

                    if (!markdown || markdown.length === 0) {
                        // Alert.alert("오류", "문서 파싱 결과가 비어있습니다.");
                        // Force mock process if real parsing fails or takes time, but here we assume success
                        processWithBrain("Analyze the uploaded document.");
                    } else {
                        processWithBrain(markdown);
                    }
                }}
            />

            {/* History Sidebar */}
            {showHistory && (
                <View style={styles.historySidebar}>
                    <View style={styles.sidebarHeader}>
                        <Text style={styles.sidebarTitle}>Saved Projects</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}><X size={20} color="#94A3B8" /></TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        {(!sessions || sessions.length === 0) ? (
                            <Text style={{ color: '#64748B', padding: 20, textAlign: 'center' }}>저장된 프로젝트가 없습니다.</Text>
                        ) : (
                            sessions.map((session: any) => (
                                <TouchableOpacity key={session.id} style={styles.sessionItem} onPress={() => handleLoad(session.id)}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sessionTitle}>{session.title || "Untitled"}</Text>
                                        <Text style={styles.sessionDate}>{new Date(session.updated_at).toLocaleDateString()}</Text>
                                    </View>
                                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); deleteSession(session.id); }}>
                                        <Trash2 size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>
            )}

            {/* 🌟 Split View Logic */}
            {!showWelcome ? (
                <>
                    <SplitLayout
                        isLeftMinimized={false}
                        leftNode={
                            <UnifiedPanel
                                activeNode={activeNode}
                                onCloseNode={() => setActiveNode(null)}
                                onAction={handleSmartAction}
                                chatHistory={chatHistory}
                                onChatSend={handleChatSend}
                                loading={loading}
                                suggestions={suggestions}
                                onFileUpload={() => fileUploaderRef.current?.pickDocument()}
                                onCitationClick={handleCitationClick}
                                detailPanelRef={detailPanelRef}
                                isEditorMinimized={isLeftPanelMinimized}
                                onEditorMinimizeChange={(minimized) => setIsLeftPanelMinimized(minimized)}
                                isInspectorOpen={isInspectorOpen}
                                onInspectorOpenChange={(open) => setIsInspectorOpen(open)}
                                onAppendToMemo={(text) => {
                                    setBrainstormContent(prev => prev ? prev + '\n\n' + text : text);
                                    // Make sure memo panel is open to visibly show the text dropping in
                                    setIsLeftPanelMinimized(false);
                                }}
                                editorNode={
                                    <ContextDock
                                        grantUrl={grantUrl}
                                        grantTitle={pendingGrantTitle || ''}
                                        pdfUrl={pdfUrl}
                                        onClose={() => {
                                            setPdfUrl(null);
                                            setGrantUrl(null);
                                            setIsLeftPanelMinimized(true);
                                        }}
                                        onMinimizeToggle={(minimized) => setIsLeftPanelMinimized(minimized)}
                                        onQuote={(text: string, x: number, y: number, type?: string, context?: any) => {
                                            const px = x || 400;
                                            const py = y || 300;
                                            setContextMenu({ visible: true, x: px, y: py, text, type, context });
                                        }}
                                        onExplainSection={(text: string, x: number, y: number, context?: any) => {
                                            setContextMenu({ visible: false, x: 0, y: 0, text: '', type: '', context: null });
                                            setExplanation({
                                                visible: true,
                                                x: (x || 400),
                                                y: (y || 300),
                                                text,
                                                mode: 'explain',
                                                context
                                            });
                                        }}
                                        onAIGenerate={handleGenerateBusinessPlan}
                                        brainstormContent={brainstormContent}
                                        onBrainstormChange={(text) => setBrainstormContent(text)}
                                    />
                                }
                            />
                        }
                        rightNode={renderWorkspace()}
                        initialLeftWidth={Dimensions.get('window').width * 0.55}
                    />

                    {/* 🌟 Floating Context Menu (Lifted to Root for Z-Index) */}
                    <FloatingContextMenu
                        visible={contextMenu.visible}
                        x={contextMenu.x}
                        y={contextMenu.y}
                        text={contextMenu.text}
                        type={contextMenu.type}
                        onAskAI={handleAskAI}
                        onPinToCanvas={handlePinToCanvas}
                        onSummarize={handleSummarize}
                        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
                        onExplain={() => {
                            setContextMenu({ ...contextMenu, visible: false });
                            setExplanation({ visible: true, x: contextMenu.x, y: contextMenu.y, text: contextMenu.text, mode: 'explain', context: contextMenu.context });
                        }}
                        onTranslate={() => {
                            setContextMenu({ ...contextMenu, visible: false });
                            setExplanation({ visible: true, x: contextMenu.x, y: contextMenu.y, text: contextMenu.text, mode: 'translate', context: contextMenu.context });
                        }}
                    />

                    {/* 🌟 In-Place Explanation Popover */}
                    <ExplanationPopover
                        visible={explanation.visible}
                        x={explanation.x}
                        y={explanation.y}
                        text={explanation.text}
                        mode={explanation.mode}
                        onClose={() => setExplanation({ ...explanation, visible: false })}
                        onAskFurther={(context) => {
                            setExplanation({ ...explanation, visible: false });
                            handleAskAI(context); // Open Chat
                        }}
                        onSaveToNote={(content) => {
                            handlePinToCanvas(content);
                            setExplanation({ ...explanation, visible: false });
                        }}
                        context={explanation.context}
                    />
                </>
            ) : (
                renderWorkspace()
            )}

            {/* 🌟 Grant Confirmation Modal */}
            {showGrantConfirm && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <View style={{
                        backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, maxWidth: 420, width: '90%',
                        borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1, shadowRadius: 30
                    }}>
                        <Text style={{ color: '#27272a', fontSize: 20, fontWeight: '900', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 }}>
                            공고 분석 시작
                        </Text>
                        <Text style={{ color: '#64748B', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24, fontWeight: '500' }}>
                            '{pendingGrantTitle}'{'\n'}기반의 맞춤형 사업 전략을 도출하시겠습니까?
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center' }}
                                onPress={() => {
                                    setShowGrantConfirm(false);
                                    setShowWelcome(true);
                                    setPendingGrantQuery('');
                                    setPendingGrantTitle('');
                                }}
                            >
                                <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '700' }}>나중에</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: '#7C3AED', alignItems: 'center' }}
                                onPress={() => {
                                    setShowGrantConfirm(false);
                                    setShowQuestionnaire(true);
                                }}
                            >
                                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>분석 시작</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* 🌟 Save Success Toast */}
            {toastMessage && (
                <View style={{
                    position: 'absolute', bottom: 40, alignSelf: 'center', left: 0, right: 0,
                    backgroundColor: '#7C3AED', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 32,
                    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20,
                    zIndex: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    maxWidth: 320, marginHorizontal: 'auto'
                }}>
                    <Save size={18} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>{toastMessage}</Text>
                </View>
            )}

            <IdeaQuestionnaire
                visible={showQuestionnaire}
                grantTitle={pendingGrantTitle}
                profileDefaults={userProfile ? {
                    description: (userProfile as any).item_description || (userProfile as any).item_one_liner || '',
                    teamComposition: (userProfile as any).team_background || '',
                    currentStage: (userProfile as any).business_years ? '매출 발생' : '',
                    targetMarket: (userProfile as any).target_market || '',
                    differentiator: (userProfile as any).core_technology || '',
                } : undefined}
                onComplete={(businessIdea) => {
                    handleStartWithIdea(pendingGrantQuery, businessIdea);
                }}
                onSkip={() => {
                    setShowQuestionnaire(false);
                    handleStart(pendingGrantQuery);
                }}
                onClose={() => {
                    setShowQuestionnaire(false);
                    if (columns.length === 0) {
                        const blankNode = {
                            id: `root_${Date.now()}`,
                            label: pendingGrantTitle ? `${pendingGrantTitle} 리서치` : '새로운 워크스페이스',
                            description: '이 캔버스에서 초기 아이디어를 구상하거나 AI에게 자유롭게 질문을 던져보세요.',
                            type: 'insight',
                            source: 'system',
                            completed: false
                        };
                        setColumns([{
                            root_node: pendingGrantTitle || 'Workspace',
                            branches: [blankNode],
                            sourceColumnIndex: -1,
                            parentIndex: -1
                        }]);
                        setActiveNode(blankNode);
                        setActivePathNodes({ 0: blankNode.id });
                    }
                }}
            />

            {/* 🌟 Transition Overlay */}
            {isTransitioning && (
                <View style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(253, 248, 243, 0.95)',
                    zIndex: 9999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40
                }}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                    <Text style={{ color: '#27272a', fontSize: 20, fontWeight: '900', marginTop: 24, textAlign: 'center' }}>
                        Publica AI
                    </Text>
                    <Text style={{ color: '#7C3AED', fontSize: 15, fontWeight: '700', marginTop: 8, textAlign: 'center' }}>
                        {transitionStep}
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 13, marginTop: 20, textAlign: 'center', lineHeight: 22, fontWeight: '500' }}>
                        브레인스톰 데이터를 통합하여{'\n'}전문적인 사업계획서 본문을 구성하고 있습니다.
                    </Text>
                </View>
            )}
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF8F3' },
    header: { height: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 100, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FDF8F3' },
    logo: { color: '#27272a', fontWeight: '900', fontSize: 20, letterSpacing: -0.5 },
    contextBar: { backgroundColor: '#FDF8F3', borderBottomWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 24, zIndex: 90 },
    canvasViewport: { flex: 1, overflow: 'hidden', backgroundColor: '#FDF8F3' },
    canvasWorld: { padding: 100, flexDirection: 'row', alignItems: 'flex-start' },
    zoomContainer: { position: 'absolute', bottom: 30, left: 30, flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 8, alignItems: 'center', zIndex: 40, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    zoomText: { color: '#64748B', fontSize: 12, fontWeight: '700', width: 45, textAlign: 'center' },
    columnWrapper: { flexDirection: 'column', marginRight: 60, width: 240, justifyContent: 'flex-start' },
    loadingCard: { width: 240, height: LAYOUT.CARD_HEIGHT, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
    loadingText: { color: '#7C3AED', fontSize: 13, fontWeight: '800' },
    nodeList: {},
    startBtn: { marginTop: 100, marginLeft: 50, backgroundColor: '#7C3AED', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, shadowColor: '#7C3AED', shadowOpacity: 0.3, shadowRadius: 15 },
    startBtnText: { color: 'white', fontWeight: '900', fontSize: 15 },

    // Left Navigation Sidebar Styles
    sidebar: {
        width: 80,
        backgroundColor: '#FFFFFF',
        borderRightWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 20
    },
    sidebarItem: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        marginBottom: 10
    },
    sidebarItemActive: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 1.5,
        borderColor: '#7C3AED',
    },

    // Sidebar Styles
    historySidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 320, backgroundColor: '#FDF8F3', zIndex: 200, borderRightWidth: 1, borderColor: '#E2E8F0', padding: 24, shadowColor: '#000', shadowOffset: { width: 10, height: 0 }, shadowOpacity: 0.05, shadowRadius: 20 },
    sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    sidebarTitle: { color: '#27272a', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    sessionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1, borderColor: '#F1F5F9' },
    sessionTitle: { color: '#27272a', fontSize: 14, fontWeight: '700' },
    sessionDate: { color: '#94A3B8', fontSize: 12, marginTop: 4, fontWeight: '500' },

    // 🌟 Empty State Placeholder
    emptyPlaceholder: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center',
        zIndex: 1, // On top
        pointerEvents: 'none', // Allow drops through
        backgroundColor: '#FDF8F3'
    },
    emptyTitle: { color: '#27272a', fontSize: 20, fontWeight: '900', marginTop: 20, letterSpacing: -0.5 },
    emptySub: { color: '#64748B', fontSize: 14, marginTop: 8, fontWeight: '500' },

    // 🌟 Loading Container
    loadingContainer: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20 },

    // 🌟 Drag Overlay
    dragOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(124, 58, 237, 0.08)',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 50,
        borderWidth: 3, borderColor: '#7C3AED', borderStyle: 'dashed'
    },
    dragText: { color: '#7C3AED', fontSize: 20, fontWeight: '900', marginTop: 16 }
});
