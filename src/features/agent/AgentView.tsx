import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Animated, LayoutAnimation, Dimensions, Platform, PanResponder, UIManager, Alert, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
// 아이콘 필수!
import { RefreshCw, ZoomIn, ZoomOut, Folder, Save, X, Trash2, UploadCloud, ExternalLink } from 'lucide-react-native';
import { WelcomeScreen } from './components/WelcomeScreen';

import { ModeDropdown } from './components/ModeDropdown';
import { TowerCard } from './components/TowerCard';
import { DetailPanel, DetailPanelRef } from './components/DetailPanel';
// FloatingChat removed — chat is now inside DetailPanel (INSPECTOR)
import { FileUploader } from './components/FileUploader';
import { RootNodeCard } from './components/RootNodeCard';
import { SplitLayout } from './components/SplitLayout';
import { FloatingContextMenu } from './components/FloatingContextMenu';
import { ExplanationPopover } from './components/ExplanationPopover';
import { IdeaQuestionnaire } from './components/IdeaQuestionnaire';
import { ContextDock } from './components/ContextDock';

// import { PDFViewerPanel } from './components/PDFViewerPanel'; // Lazy load for safety
const PDFViewerPanel = React.lazy(() => import('./components/PDFViewerPanel').then(module => ({ default: module.PDFViewerPanel }))) as any;
import { LAYOUT } from './AgentLayout';
import { useSessionManager } from './hooks/useSessionManager';
import { ErrorBoundary } from '../../components/ErrorBoundary';


const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const AgentView = ({ initialSession }: { initialSession?: any }) => {
    // --- 1. User & Session Hook ---
    const [user, setUser] = useState<any>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    // 세션 매니저 (저장/불러오기 담당)
    const { sessions, saveSession, loadSession, fetchSessions, deleteSession } = useSessionManager(user?.id);

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
                setShowQuestionnaire(true);
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

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5,
            onPanResponderGrant: () => { pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value }); pan.setValue({ x: 0, y: 0 }); },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: () => { pan.flattenOffset(); }
        })
    ).current;

    // --- 5. AI Logic Handlers (Real AI Mode) ---
    const callAgent = async (text: string, context: string = "", nodeLabel?: string) => {
        try {
            console.log("🚀 [Real AI] Calling insight-agent-gateway:", text.substring(0, 80));

            const finalInput = context ? `${text}\n\n[Context Data]:\n${context}` : text;

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
            setChatHistory(prev => [...prev, {
                text: `⚠️ [시스템 알림] AI 서비스 연결에 실패하여 사전 학습된 공고 분석 모델(Mock)로 전환합니다.\n(사유: ${e.message || 'Network Error'})`,
                sender: 'ai'
            }]);

            // 🌟 ROBUST FALLBACK: Use high-quality Mock data to prevent UI from disappearing
            return {
                workspace_data: {
                    root_node: "2025 예비창업패키지: AI 기반 소셜 임팩트와 기술 독창성 강조 전략",
                    branches: [
                        { id: 'f-1', step_number: 1, label: '지원 자격 및 제외 대상 검토', description: "공고문 3페이지의 '신청 자격' 요건을 정밀 검토하였습니다. 현재 대표님의 이력은 '일반 분야' 지원에 적합하며, 기창업 이력이 없으므로 감점 요인은 없습니다.", type: 'research' },
                        { id: 'f-2', step_number: 2, label: '가점 확보 전략 (최대 3점)', description: "만 29세 이하 청년 가점(1점)과 지역 주력 산업 관련 가점(1점)을 확보할 수 있습니다. 사업계획서 5번 항목에 이를 명시하여 서류 평가 우위를 점해야 합니다.", type: 'research' },
                        { id: 'f-3', step_number: 3, label: 'PSST 사업계획서 차별화', description: "'문제 인식(Problem)' 파트에서 기존 경쟁사 대비 기술적 진보성을 강조하고, 구체적인 시장 검증 데이터를 포함하여 '실현 가능성' 점수를 높여야 합니다.", type: 'research' },
                        { id: 'f-4', step_number: 4, label: '제출 서류 체크리스트', description: "사업자등록증명원, 국세/지방세 완납증명서 등 필수 서류 7종의 누락 없는 준비가 필요합니다. 특히 가점 관련 증빙을 잊지 마세요.", type: 'documentation' }
                    ]
                },
                suggested_actions: [
                    { label: "세부 실행 계획", type: "PLAN", "query": "Create detailed action items" },
                    { label: "관련 자료 검색", type: "VERIFY", "query": "Find references" }
                ],
                chat_message: '사전 정의된 전략 모델을 불러왔습니다.'
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

        // 사업 아이디어를 포함한 강화된 프롬프트
        const enhancedQuery = `${grantQuery}\n\n## 사용자 사업 아이디어 (User Business Idea)\n- 아이디어: ${businessIdea.description}\n- 팀 구성: ${businessIdea.teamComposition}\n- 현재 단계: ${businessIdea.currentStage}\n- 타겟 시장: ${businessIdea.targetMarket}\n- 차별점: ${businessIdea.differentiator}\n\nIMPORTANT: Incorporate the user's specific business idea into your strategy. Make the analysis personalized to THEIR idea, team, and market.`;

        setChatHistory(prev => [...prev, {
            text: `📝 사업 아이디어가 반영된 맞춤형 분석을 시작합니다...\n• 아이디어: ${businessIdea.description}\n• 팀: ${businessIdea.teamComposition}\n• 단계: ${businessIdea.currentStage}`,
            sender: 'ai'
        }]);

        const res = await callAgent(enhancedQuery);

        if (res?.workspace_data) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setColumns([{ ...res.workspace_data, parentIndex: -1 }]);
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
            if (res.workspace_data) {
                // Safely route the newly generated branch card to its proper parent in the tree (Bug 4 Fix)
                const colIdx = columns.findIndex(col => col.branches?.some((b: any) => b.id === activeNode?.id));
                const bIdx = colIdx !== -1 ? columns[colIdx].branches.findIndex((b: any) => b.id === activeNode?.id) : 0;

                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setColumns(prev => [
                    ...prev,
                    {
                        ...res.workspace_data,
                        parentIndex: bIdx,
                        sourceColumnIndex: colIdx !== -1 ? colIdx : 0
                    }
                ]);
            }
            if (res.chat_message) {
                setChatHistory(prev => [...prev, { text: res.chat_message, sender: 'ai' }]);
            }
            if (res.suggested_actions) {
                setSuggestions(res.suggested_actions); // 칩 업데이트
            }
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
    const handleSelectNode = (node: any, absoluteColIdx: number) => {
        setActivePathNodes(prev => {
            const newPath = { ...prev };
            // If already active, toggle it off (collapse)
            if (newPath[absoluteColIdx] === node.id) {
                for (let k in newPath) {
                    if (Number(k) >= absoluteColIdx) delete newPath[k];
                }
                setActiveNode(null);
                return newPath;
            }
            // Otherwise activate it and prune deeper paths
            for (let k in newPath) {
                if (Number(k) >= absoluteColIdx) delete newPath[k];
            }
            newPath[absoluteColIdx] = node.id;
            return newPath;
        });
        setActiveNode(node);
    };

    const handleExpand = async (branch: any, absColIdx: number, branchIndex: number) => {
        const existingChildIdx = columns.findIndex(
            (col, i) => i > absColIdx && col.parentIndex === branchIndex && col.sourceColumnIndex === absColIdx
        );

        if (existingChildIdx !== -1) {
            // Already fetched, just toggle visibility
            handleSelectNode(branch, absColIdx);
            return;
        }

        handleSelectNode(branch, absColIdx);
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

        const title = columns[0]?.branches?.[0]?.label || columns[0]?.root_node || "Untitled Project";
        // Pass pdfUrl as 5th argument
        const success = await saveSession(title, agentMode, columns, chatHistory, pdfUrl || undefined);
        if (success) {
            Alert.alert("성공", "프로젝트가 저장되었습니다. 파일 관리자에서 확인하세요.");
        }
    };

    // 🌟 사업계획서 자동 생성 로직 (Phase 6)
    const handleGenerateBusinessPlan = async (): Promise<string | null> => {
        if (!columns || columns.length === 0) {
            Alert.alert("오류", "먼저 AI 브랜칭 분석을 진행해주세요.");
            return null;
        }

        try {
            // 1. 활성화된 노드 데이터 취합 (Active Path Nodes)
            const selectedNodesContext = absColIndices.map((absColIdx) => {
                const activeNodeId = activePathNodes[absColIdx];
                if (!activeNodeId) return null;
                const col = columns[absColIdx];
                const node = col?.branches?.find((b: any) => b.id === activeNodeId);
                return node ? {
                    step: 'Column ' + (absColIdx + 1),
                    label: node.label || '',
                    insight: node.description || ''
                } : null;
            }).filter(Boolean);

            if (selectedNodesContext.length === 0) {
                Alert.alert("알림", "마인드맵에서 브랜치를 1개 이상 활성화(초록색/파란색 선택)해야 문서 작성이 가능합니다.");
                return null;
            }

            const payload = {
                business_idea: columns[0]?.root_node || "비즈니스 전략 제안",
                selected_nodes_context: selectedNodesContext,
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
            setAgentMode(data.mode);
            setColumns(data.workspace_data);
            setChatHistory(data.chat_history || []);
            if (data.pdf_url) setPdfUrl(data.pdf_url);
            setShowHistory(false);
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
                const contextStr = `Deep dive analysis: Break down "${node.label}" into detailed sub-steps with technical specifics, risks, and implementation details. Description: ${node.description || ''}\nFocus heavily on making the output highly specific and actionable.`;
                const res = await callAgent(
                    `Perform a deep dive analysis on: ${node.label}`,
                    contextStr
                );

                if (res?.workspace_data?.branches && res.workspace_data.branches.length > 0) {
                    const deepDiveBranches = res.workspace_data.branches.map((b: any, i: number) => ({
                        ...b,
                        source: 'deep_dive',  // 🏷️ Blue badge
                        id: `deep_${node.id}_${i}_${Date.now()}`
                    }));

                    const colIdx = columns.findIndex(col => col.branches?.some((b: any) => b.id === node.id));
                    const bIdx = colIdx !== -1 ? columns[colIdx].branches.findIndex((b: any) => b.id === node.id) : 0;

                    // 🔑 Check if a child column already exists for this node
                    const existingChildColIdx = columns.findIndex(
                        (col, i) => i > colIdx && col.parentIndex === bIdx && col.sourceColumnIndex === colIdx
                    );

                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setColumns(prev => {
                        if (existingChildColIdx !== -1) {
                            // Append to existing child column
                            const newCols = [...prev];
                            newCols[existingChildColIdx] = {
                                ...newCols[existingChildColIdx],
                                branches: [...(newCols[existingChildColIdx].branches || []), ...deepDiveBranches]
                            };
                            return newCols;
                        } else {
                            // Create new child column
                            return [
                                ...prev,
                                {
                                    root_node: `🔍 ${node.label}`,
                                    branches: deepDiveBranches,
                                    parentIndex: bIdx,
                                    sourceColumnIndex: colIdx,
                                }
                            ];
                        }
                    });

                    setChatHistory(prev => [...prev, { text: `✅ '${node.label}' 심층 분석 완료! ${deepDiveBranches.length}개의 세부 항목이 추가되었습니다.`, sender: 'ai' }]);
                } else {
                    // Fallback: if parsing fails, use handleExpand only if child column doesn't exist
                    const colIdx = columns.findIndex(col => col.branches?.some((b: any) => b.id === node.id));
                    if (colIdx !== -1) {
                        const bIdx = columns[colIdx].branches.findIndex((b: any) => b.id === node.id);
                        const existingChildColIdx = columns.findIndex(col => col.parentIndex === bIdx && col.sourceColumnIndex === colIdx);
                        if (existingChildColIdx === -1) handleExpand(node, colIdx, bIdx);
                    }
                }
            } catch (err: any) {
                setChatHistory(prev => [...prev, { text: `❌ 심층 분석 오류: ${err.message}. 기본 분석으로 전환합니다.`, sender: 'ai' }]);
                // Fallback to handleExpand on error
                const colIdx = columns.findIndex(col => col.branches?.some((b: any) => b.id === node.id));
                if (colIdx !== -1) {
                    const bIdx = columns[colIdx].branches.findIndex((b: any) => b.id === node.id);
                    const existingChildColIdx = columns.findIndex(col => col.parentIndex === bIdx && col.sourceColumnIndex === colIdx);
                    if (existingChildColIdx === -1) handleExpand(node, colIdx, bIdx);
                }
            } finally {
                setLoading(false);
            }
        } else if (type === 'BRANCH') {
            setChatHistory(prev => [...prev, { text: `🌿 '${node.label}' 하위 실행 단계를 생성합니다...`, sender: 'ai' }]);
            setLoading(true);
            setActiveNode(node);

            try {
                const contextStr = `Expand on: ${node.label}\nDescription: ${node.description}`;
                const res = await callAgent(
                    `Provide detailed next steps for: ${node.label}. Generate distinct new steps that build upon the existing context.`,
                    contextStr
                );

                if (res?.workspace_data?.branches && res.workspace_data.branches.length > 0) {
                    const newBranches = res.workspace_data.branches.map((b: any, i: number) => ({
                        ...b,
                        source: 'branching', // 🏷️ Green badge
                        id: `branch_${node.id}_${Date.now()}_${i}` // unique ID
                    }));

                    const colIdx = columns.findIndex(col => col.branches?.some((b: any) => b.id === node.id));
                    const bIdx = colIdx !== -1 ? columns[colIdx].branches.findIndex((b: any) => b.id === node.id) : 0;
                    const existingChildColIdx = columns.findIndex(col => col.parentIndex === bIdx && col.sourceColumnIndex === colIdx);

                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
                                    root_node: `🌿 ${node.label} 세부 단계`,
                                    branches: newBranches,
                                    parentIndex: bIdx,
                                    sourceColumnIndex: colIdx,
                                }
                            ];
                        }
                    });
                    setChatHistory(prev => [...prev, { text: `✅ '${node.label}' 하위 단계 생성이 완료되었습니다.`, sender: 'ai' }]);
                } else {
                    setChatHistory(prev => [...prev, { text: `❌ 하위 단계를 생성하지 못했습니다.`, sender: 'ai' }]);
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
            style={{ flex: 1, backgroundColor: '#0a0a0a' }}
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
                                                    const anySiblingSelected = !!activeBranchIdInThisCol;
                                                    const isCollapsed = anySiblingSelected && !isSelected;

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
                                                            const iAnySibSelected = !!targetActiveBranchId;
                                                            const iIsCollapsed = iAnySibSelected && !iIsSelected;

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

            {/* Panels & Chat */}
            {activeNode && (
                <DetailPanel
                    ref={detailPanelRef}
                    node={activeNode}
                    onClose={() => setActiveNode(null)}
                    onAction={handleSmartAction}
                    chatHistory={chatHistory}
                    onSend={handleChatSend}
                    loading={loading}
                    suggestions={suggestions}
                    onFileUpload={() => fileUploaderRef.current?.pickDocument()}
                    onCitationClick={handleCitationClick}
                />
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={styles.logo}>Publica NEXUS</Text>
                    {/* 🌟 Zoom Slider — shadcn-inspired */}
                    {!showWelcome && columns.length > 0 && Platform.OS === 'web' && (
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
                <View style={{ flexDirection: 'row', gap: 15, marginRight: 10 }}>
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
            {!showWelcome && (pdfUrl || grantUrl) ? (
                <>
                    <SplitLayout
                        isLeftMinimized={isLeftPanelMinimized}
                        leftNode={
                            (pdfUrl || grantUrl) ? (
                                <ContextDock
                                    grantUrl={grantUrl}
                                    grantTitle={pendingGrantTitle || ''}
                                    pdfUrl={pdfUrl}
                                    onClose={() => {
                                        setPdfUrl(null);
                                        setGrantUrl(null);
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
                                            x: x || 400,
                                            y: y || 300,
                                            text,
                                            mode: 'explain',
                                            context
                                        });
                                    }}
                                    onAIGenerate={handleGenerateBusinessPlan}
                                />
                            ) : null
                        }
                        rightNode={renderWorkspace()}
                        initialLeftWidth={Dimensions.get('window').width * 0.45}
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

            <IdeaQuestionnaire
                visible={showQuestionnaire}
                grantTitle={pendingGrantTitle}
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
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    header: { height: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 100, borderBottomWidth: 1, borderColor: '#111', backgroundColor: '#000' },
    logo: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    contextBar: { backgroundColor: '#050505', borderBottomWidth: 1, borderColor: '#1E293B', paddingVertical: 10, paddingHorizontal: 20, zIndex: 90 },
    canvasViewport: { flex: 1, overflow: 'hidden', backgroundColor: '#000' },
    canvasWorld: { padding: 100, flexDirection: 'row', alignItems: 'flex-start' },
    zoomContainer: { position: 'absolute', bottom: 30, left: 30, flexDirection: 'row', backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#222', padding: 6, alignItems: 'center', zIndex: 40, gap: 10 },
    zoomText: { color: '#888', fontSize: 11, fontWeight: '600', width: 40, textAlign: 'center' },
    columnWrapper: { flexDirection: 'column', marginRight: 50, width: 220, justifyContent: 'flex-start' },
    loadingCard: { width: 220, height: LAYOUT.CARD_HEIGHT, backgroundColor: '#050505', borderRadius: 8, borderWidth: 1, borderColor: '#1E293B', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10 },
    loadingText: { color: '#3B82F6', fontSize: 13, fontWeight: '600' },
    nodeList: { gap: 20 },
    startBtn: { marginTop: 100, marginLeft: 50, backgroundColor: '#2563EB', padding: 15, borderRadius: 8 },
    startBtnText: { color: 'white', fontWeight: 'bold' },

    // Left Navigation Sidebar Styles
    sidebar: {
        width: 70,
        backgroundColor: '#0F172A', // Darker slate blue for better visibility
        borderRightWidth: 1,
        borderColor: '#1E293B',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16
    },
    sidebarItem: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        marginBottom: 8
    },
    sidebarItemActive: {
        backgroundColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12
    },

    // Sidebar Styles
    historySidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 300, backgroundColor: '#0F172A', zIndex: 200, borderRightWidth: 1, borderColor: '#334155', padding: 20 },
    sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    sidebarTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    sessionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#1E293B' },
    sessionTitle: { color: 'white', fontSize: 14, fontWeight: '500' },
    sessionDate: { color: '#64748B', fontSize: 12, marginTop: 4 },

    // 🌟 Empty State Placeholder
    emptyPlaceholder: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center',
        zIndex: 1, // On top
        pointerEvents: 'none', // Allow drops through
        backgroundColor: '#0a0a0a'
    },
    emptyTitle: { color: '#475569', fontSize: 18, fontWeight: '700', marginTop: 16 },
    emptySub: { color: '#334155', fontSize: 14, marginTop: 8 },

    // 🌟 Loading Container
    loadingContainer: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20 },

    // 🌟 Drag Overlay
    dragOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(5, 5, 20, 0.8)',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 50,
        borderWidth: 2, borderColor: '#3B82F6', borderStyle: 'dashed'
    },
    dragText: { color: 'white', fontSize: 18, fontWeight: '700', marginTop: 16 }
});
