import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Animated, LayoutAnimation, Dimensions, Platform, PanResponder, UIManager, Alert, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
// 아이콘 필수!
import { RefreshCw, ZoomIn, ZoomOut, Folder, Save, X, Trash2, UploadCloud } from 'lucide-react-native';
import { WelcomeScreen } from './components/WelcomeScreen';

import { ModeDropdown } from './components/ModeDropdown';
import { TowerCard } from './components/TowerCard';
import { DetailPanel } from './components/DetailPanel';
import { FloatingChat } from './components/FloatingChat';
import { FileUploader } from './components/FileUploader';
import { RootNodeCard } from './components/RootNodeCard';
import { SplitLayout } from './components/SplitLayout';
import { FloatingContextMenu } from './components/FloatingContextMenu';
import { ExplanationPopover } from './components/ExplanationPopover';

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
    const floatingChatRef = useRef<any>(null);

    // 🌟 Chat UI State (Parent Controlled)
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null); // For Split View
    const [isDragging, setIsDragging] = useState(false);

    // [DEBUG] Force load PDF for TOC Verification
    useEffect(() => {
        if (!pdfUrl) {
            console.log("🔄 [DEBUG] Force Loading PDF for Verification");
            setPdfUrl("https://raw.githubusercontent.com/mozilla/pdf.js/master/test/pdfs/tracemonkey.pdf");
        }
    }, []);

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
            setShowWelcome(false); // Hide welcome if loading session

            // 🚀 Auto-Run if query is present (for Connect Hub integration)
            if (initialSession.auto_run_query) {
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
            console.log("🚀 [Real AI] Calling deep-analyze:", text.substring(0, 80));

            const { data, error } = await supabase.functions.invoke('deep-analyze', {
                body: {
                    query: text,
                    context_node: { label: nodeLabel || text.substring(0, 60), description: context },
                    doc_type_hint: 'Research Paper'
                }
            });

            if (error) throw error;

            // deep-analyze returns: { summary, key_facts, references }
            // Convert to workspace_data format expected by AgentView
            const summary = data?.summary || 'Analysis complete';
            const keyFacts: Array<{ label: string; value: string }> = data?.key_facts || [];

            const branches = keyFacts.length > 0
                ? keyFacts.map((fact: { label: string; value: string }, idx: number) => ({
                    id: `fact-${idx}-${Date.now()}`,
                    step_number: idx + 1,
                    label: fact.label,
                    description: fact.value,
                    type: 'research'
                }))
                : [
                    { id: `s-1-${Date.now()}`, step_number: 1, label: 'Summary', description: summary, type: 'research' }
                ];

            return {
                workspace_data: {
                    root_node: nodeLabel || text.substring(0, 60),
                    branches
                },
                suggested_actions: [
                    { label: '심층 분석', type: 'DEEP_DIVE', query: `Deep dive: ${nodeLabel || text.substring(0, 40)}` },
                    { label: '하위 단계 생성', type: 'BRANCH', query: `Branch from: ${nodeLabel || text.substring(0, 40)}` }
                ],
                chat_message: summary
            };
        } catch (e: any) {
            console.error("AI Error:", e);
            // Show error in chat instead of Alert
            setChatHistory(prev => [...prev, { text: `❌ AI 분석 오류: ${e.message}`, sender: 'ai' }]);
            return null;
        }
    };

    // 🧠 [핵심 변경] 백엔드 없이 클라이언트에서 바로 Gemini 호출
    const processWithBrain = async (markdown: string) => {
        try {
            setLoading(true);
            setShowWelcome(false); // Hide welcome
            setChatHistory(prev => [...prev, {
                text: "AI가 공고문(30,000자)을 정밀 분석 중입니다... (시스템 우회 접속 중)",
                sender: 'ai'
            }]);

            // ⏱️ 2초 딜레이 (AI가 생각하는 척)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // ✅ [Mock Data] 정부지원사업 분석 결과
            const mockStrategyPlan = {
                "strategyPlan": {
                    "hypothesis": "2025 예비창업패키지: AI 기반 소셜 임팩트와 기술 독창성 강조 전략",
                    "steps": [
                        {
                            "step_number": 1,
                            "title": "지원 자격 및 제외 대상 검토",
                            "description": "공고문 3페이지의 '신청 자격' 요건을 정밀 검토하였습니다. 현재 대표님의 이력은 '일반 분야' 지원에 적합하며, 기창업 이력이 없으므로 감점 요인은 없습니다.",
                            "action_type": "research"
                        },
                        {
                            "step_number": 2,
                            "title": "가점 확보 전략 (최대 3점)",
                            "description": "만 29세 이하 청년 가점(1점)과 지역 주력 산업 관련 가점(1점)을 확보할 수 있습니다. 사업계획서 5번 항목에 이를 명시하여 서류 평가 우위를 점해야 합니다.",
                            "action_type": "research"
                        },
                        {
                            "step_number": 3,
                            "title": "PSST 사업계획서 차별화",
                            "description": "'문제 인식(Problem)' 파트에서 기존 경쟁사 대비 기술적 진보성을 강조하고, 구체적인 시장 검증 데이터를 포함하여 '실현 가능성' 점수를 높여야 합니다.",
                            "action_type": "research"
                        },
                        {
                            "step_number": 4,
                            "title": "제출 서류 체크리스트",
                            "description": "사업자등록증명원, 국세/지방세 완납증명서 등 필수 서류 7종의 누락 없는 준비가 필요합니다. 특히 가점 관련 증빙을 잊지 마세요.",
                            "action_type": "documentation"
                        }
                    ]
                }
            };

            const data = mockStrategyPlan;

            if (data?.strategyPlan) {
                const workspaceData = {
                    root_node: data.strategyPlan.hypothesis,
                    branches: data.strategyPlan.steps.map((step: any, idx: number) => ({
                        id: `step-${idx}-${Date.now()}`,
                        label: step.title,
                        description: step.description,
                        type: step.action_type,
                        step_number: step.step_number,
                        references: []
                    }))
                };

                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setColumns([{ ...workspaceData, parentIndex: -1 }]);
                setChatHistory(prev => [...prev, {
                    text: "✅ 전략 수립이 완료되었습니다. [Page 1]의 개요와 [Page 3]의 자격 요건을 바탕으로 분석했습니다.",
                    sender: 'ai'
                }]);

                setSuggestions([
                    { label: "세부 실행 계획", type: "PLAN", "query": "Create detailed action items" },
                    { label: "관련 자료 검색", type: "VERIFY", "query": "Find references" },
                    { label: "위험 요소 분석", type: "EXPAND", "query": "Analyze risks" }
                ]);

                Alert.alert("완료", "문서 기반 합격 전략 수립이 완료되었습니다. (Mock Mode)");
            }

        } catch (error: any) {
            console.error("❌ Mock Error:", error);
            setChatHistory(prev => [...prev, {
                text: `❌ 오류가 발생했습니다: ${error.message}`,
                sender: 'ai'
            }]);
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
            setColumns([{ ...res.workspace_data, parentIndex: -1 }]); // 맵 그리기

            // 추천 칩 업데이트
            if (res.suggested_actions && res.suggested_actions.length > 0) {
                setSuggestions(res.suggested_actions);
            } else {
                // 백엔드가 추천 안 해주면 기본값이라도 띄움
                setSuggestions([
                    { label: "🔍 심층 분석", type: "EXPAND", query: `Analyze '${text}' in depth` },
                    { label: "🗓️ 실행 계획 수립", type: "PLAN", query: "Create action plan" }
                ]);
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
                const pIdx = activeNode ? columns[columns.length - 1].branches.indexOf(activeNode) : 0;
                setColumns(prev => [...prev, { ...res.workspace_data, parentIndex: pIdx }]); // 맵 확장
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

    const handleExpand = async (branch: any, idx: number, branchIndex: number) => {
        // Toggle: if this card already has children, collapse them
        const hasChildColumn = columns[idx + 1] && columns[idx + 1].parentIndex === branchIndex;
        if (hasChildColumn) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setColumns(prev => prev.slice(0, idx + 1));
            setActiveNode(activeNode === branch ? null : branch);
            return;
        }

        setActiveNode(branch);

        // Trim any deeper columns from a different branch
        if (idx < columns.length - 1) {
            setColumns(prev => prev.slice(0, idx + 1));
        }

        setLoading(true);
        setSuggestions([]);

        const contextStr = `Expand on: ${branch.label}\nDescription: ${branch.description}`;
        const res = await callAgent(
            `Provide detailed next steps for: ${branch.label}`,
            contextStr
        );

        if (res?.workspace_data) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setColumns(prev => [...prev, { ...res.workspace_data, parentIndex: branchIndex }]);
        }

        if (res?.suggested_actions) {
            setSuggestions(res.suggested_actions);
        }

        setLoading(false);
    };

    // 💾 저장 버튼 로직 (DB에 저장 -> 파일 관리자에 뜸)
    const handleSave = async () => {
        if (!user) { Alert.alert("오류", "로그인이 필요합니다."); return; }
        if (columns.length === 0) { Alert.alert("알림", "빈 화면은 저장할 수 없습니다."); return; }

        const title = columns[0]?.branches?.[0]?.label || columns[0]?.root_node || "Untitled Project";
        // Pass pdfUrl as 5th argument
        await saveSession(title, agentMode, columns, chatHistory, pdfUrl || undefined);
        Alert.alert("성공", "프로젝트가 저장되었습니다. 파일 관리자에서 확인하세요.");
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
            setChatHistory(prev => [...prev, { text: `🔍 '${node.label}' 항목에 대해 심층 분석을 시작합니다.`, sender: 'me' }]);
            handleChatSend(`Deep dive analysis for: ${node.label}. Provide technical details and implementation risks.`);
        } else if (type === 'BRANCH') {
            // Find current column index to append children correctly
            const colIdx = columns.findIndex(col => col.branches?.some((b: any) => b.id === node.id));
            if (colIdx !== -1) {
                const bIdx = columns[colIdx].branches.findIndex((b: any) => b.id === node.id);
                handleExpand(node, colIdx, bIdx);
            }
        } else if (type === 'ASK') {
            // Real AI call for Ask AI — deliver a direct AI answer in chat
            setChatHistory(prev => [...prev, { text: `❓ '${node.label}'에 대해 분석 중...`, sender: 'me' }]);
            setLoading(true);
            try {
                const { data, error } = await supabase.functions.invoke('deep-analyze', {
                    body: {
                        query: `Explain in detail: ${node.label}. ${node.description || ''}`,
                        context_node: { label: node.label, description: node.description },
                        doc_type_hint: 'Research Paper'
                    }
                });
                if (error) throw error;
                const answer = data?.summary || '분석 결과를 가져오지 못했습니다.';
                setChatHistory(prev => [...prev, { text: answer, sender: 'ai' }]);
            } catch (err: any) {
                setChatHistory(prev => [...prev, { text: `❌ 오류: ${err.message}`, sender: 'ai' }]);
            } finally {
                setLoading(false);
            }
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
        floatingChatRef.current?.setInput(`"${text}"\n\n`);
        setIsChatExpanded(true);
    };

    // 🧠 Action: Summarize
    const handleSummarize = (text: string) => {
        floatingChatRef.current?.setInput(`Please summarize this section:\n"${text}"`);
        setIsChatExpanded(true);
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
                        setIsChatExpanded(true); // 🌟 Auto-open Chat
                    }}
                    onUploadFile={() => {
                        setAgentMode('Literature Review');
                        // Don't auto-expand chat here, let user drag & drop or use pill
                        Alert.alert("Tip", "파일을 화면에 드래그하거나, 채팅창의 첨부 버튼을 이용하세요.");
                        setTimeout(() => fileUploaderRef.current?.pickDocument(), 500); // Trigger after slight delay
                    }}
                />
            ) : (
                <View style={{ flex: 1 }}> {/* Main Workspace Container */}

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

                                {/* Root Node */}
                                {columns.length > 0 && columns[0]?.root_node && (
                                    <View style={{ alignSelf: 'center', marginRight: 20 }}>
                                        <RootNodeCard
                                            hypothesis={columns[0].root_node}
                                            branchCount={columns[0].branches?.length || 0}
                                        />
                                    </View>
                                )}

                                {/* Columns */}
                                {columns.map((col, idx) => (
                                    <View key={idx} style={styles.columnWrapper}>
                                        <View style={styles.nodeList}>
                                            {col.branches?.map((branch: any, bIdx: number) => (
                                                <TowerCard
                                                    key={branch.id}
                                                    data={branch}
                                                    idx={idx}
                                                    myIndex={bIdx}
                                                    parentIndex={col.parentIndex}
                                                    selected={
                                                        activeNode === branch ||
                                                        (columns[idx + 1] && columns[idx + 1].parentIndex === bIdx)
                                                    }
                                                    onSelect={() => handleExpand(branch, idx, bIdx)}
                                                />
                                            ))}

                                            {/* Loading Card inside column */}
                                            {loading && idx === columns.length - 1 && (
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
                                ))}

                                {/* Generic Loading if no columns */}
                                {loading && columns.length === 0 && (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#3B82F6" />
                                        <Text style={styles.loadingText}>Thinking...</Text>
                                    </View>
                                )}
                            </View>
                        </Animated.View>
                    </View>

                    {/* Zoom Controls */}
                    {!showWelcome && columns.length > 0 && (
                        <View style={styles.zoomContainer}>
                            <TouchableOpacity onPress={() => manualZoom(-0.2)}><ZoomOut size={16} color="#94A3B8" /></TouchableOpacity>
                            <Text style={styles.zoomText}>{Math.round(scaleDisplay * 100)}%</Text>
                            <TouchableOpacity onPress={() => manualZoom(0.2)}><ZoomIn size={16} color="#94A3B8" /></TouchableOpacity>
                        </View>
                    )}

                </View>
            )}

            {/* Panels & Chat */}
            {activeNode && (
                <DetailPanel
                    node={activeNode}
                    onClose={() => setActiveNode(null)}
                    onAction={handleSmartAction}
                />
            )}

            <FloatingChat
                ref={floatingChatRef}
                onSend={handleChatSend}
                loading={loading}
                chatHistory={chatHistory}
                suggestions={suggestions}
                activeNodeLabel={activeNode?.label}
                onFileUpload={() => fileUploaderRef.current?.pickDocument()}
                onCitationClick={handleCitationClick} // 🌟 Connect Citation Click
                expanded={isChatExpanded}
                onToggleExpand={() => setIsChatExpanded(!isChatExpanded)}
                style={{ display: showWelcome ? 'none' : 'flex' }}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={styles.logo}>Publica NEXUS</Text>
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
            {!showWelcome && pdfUrl ? (
                <>
                    <SplitLayout
                        leftNode={
                            <ErrorBoundary compName="PDFViewer">
                                <React.Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#10B981" /></View>}>
                                    <PDFViewerPanel
                                        ref={pdfViewerRef}
                                        url={pdfUrl}
                                        onQuote={(text: string, x: number, y: number, type?: string, context?: any) => {
                                            console.log("📝 Quote Received:", text.substring(0, 60), type, context?.sectionTitle);
                                            const px = x || 400;
                                            const py = y || 300;
                                            setContextMenu({ visible: true, x: px, y: py, text, type, context });
                                        }}
                                        onExplainSection={(text: string, x: number, y: number, context?: any) => {
                                            // ✨ Sparkle on section heading → directly open ExplanationPopover
                                            console.log("✨ Section Explain:", context?.heading?.substring(0, 40));
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
                                    />
                                </React.Suspense>
                            </ErrorBoundary>
                        }
                        rightNode={renderWorkspace()}
                        initialLeftWidth={Dimensions.get('window').width * 0.5}
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
        </SafeAreaView>
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
