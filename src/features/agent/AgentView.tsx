import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Animated, LayoutAnimation, Dimensions, Platform, PanResponder, UIManager, Alert, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
// 아이콘 필수!
import { RefreshCw, ZoomIn, ZoomOut, Folder, Save, X, Trash2 } from 'lucide-react-native';

import { ModeDropdown } from './components/ModeDropdown';
import { TowerCard } from './components/TowerCard';
import { DetailPanel } from './components/DetailPanel';
import { FloatingChat } from './components/FloatingChat';
import { FileUploader } from './components/FileUploader';
import { RootNodeCard } from './components/RootNodeCard';
import { LAYOUT } from './AgentLayout';
import { useSessionManager } from './hooks/useSessionManager';


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



    // 🌟 [Load Prop] 외부에서 주입된 세션 로드
    useEffect(() => {
        if (initialSession) {
            console.log("📂 Loading Session from Props:", initialSession.title);
            setAgentMode(initialSession.mode);
            setColumns(initialSession.workspace_data || []);
            setChatHistory(initialSession.chat_history || []);

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

    // --- 5. AI Logic Handlers (Mock Mode) ---
    const callAgent = async (text: string, context: string = "") => {
        try {
            console.log("🚀 [Mock Mode] Calling AI:", text);

            // ⏱️ 1.5초 딜레이 (AI가 생각하는 척)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // ✅ [Mock Data] 일반 대화 및 요약용 응답
            return {
                "workspace_data": {
                    "root_node": "분석 결과 요약",
                    "branches": [
                        { "step_number": 1, "title": "시장 현황 분석", "description": "현재 관련 시장은 연 15% 성장 중이며, 정부의 친환경 정책 수혜가 예상됩니다.", "action_type": "research" },
                        { "step_number": 2, "title": "경쟁사 동향", "description": "A사와 B사가 주요 플레이어이나, 아직 대표님의 특화 기술 영역은 공백지입니다.", "action_type": "research" },
                        { "step_number": 3, "title": "기술적 차별점", "description": "데이터 경량화 알고리즘을 강점으로 내세워 기술성 평가에서 우위를 점할 수 있습니다.", "action_type": "research" }
                    ]
                },
                "suggested_actions": [
                    { "label": "상세 계획 수립", "type": "PLAN", "query": "사업계획서 초안 작성" }
                ],
                "chat_message": "요청하신 내용에 대한 전략적 분석을 완료했습니다. 궁금한 점이 있으시면 더 물어봐주세요!"
            };
        } catch (e: any) {
            console.error("AI Error:", e);
            Alert.alert("AI Error", e.message);
            return null;
        }
    };

    // 🧠 [핵심 변경] 백엔드 없이 클라이언트에서 바로 Gemini 호출
    const processWithBrain = async (markdown: string) => {
        try {
            setLoading(true);
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
                    text: "✅ 전략 수립이 완료되었습니다. 대시보드의 카드를 확인해보세요!",
                    sender: 'ai'
                }]);

                setSuggestions([
                    { label: "세부 실행 계획", type: "PLAN", query: "Create detailed action items" },
                    { label: "관련 자료 검색", type: "VERIFY", query: "Find references" },
                    { label: "위험 요소 분석", type: "EXPAND", query: "Analyze risks" }
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
        await saveSession(title, agentMode, columns, chatHistory);
        Alert.alert("성공", "프로젝트가 저장되었습니다. 파일 관리자에서 확인하세요.");
    };

    // 📂 히스토리 열기
    const handleOpenHistory = () => {
        if (!user) { Alert.alert("오류", "로그인이 필요합니다."); return; }
        fetchSessions();
        setShowHistory(true);
    };

    // 🔄 불러오기 로직
    const handleLoad = async (sessionId: string) => {
        const data = await loadSession(sessionId);
        if (data) {
            setAgentMode(data.mode);
            setColumns(data.workspace_data);
            setChatHistory(data.chat_history || []);
            setShowHistory(false);
        }
    };

    // 🚀 Planner 전환 (맥락 유지)
    const handleSmartAction = (type: string, node: any) => {
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
            setChatHistory(prev => [...prev, { text: `❓ '${node.label}'에 대해 궁금한 점이 있습니다.`, sender: 'me' }]);
            // This just focuses chat for now, but we could trigger a specific query
        }
    };

    const manualZoom = (delta: number) => {
        let newScale = (scale as any)._value + delta;
        newScale = Math.min(Math.max(newScale, 0.3), 3);
        Animated.spring(scale, { toValue: newScale, useNativeDriver: false, friction: 7 }).start();
        setScaleDisplay(newScale);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={styles.logo}>InsightFlow</Text>
                    <ModeDropdown currentMode={agentMode} onSelectMode={setAgentMode} />
                </View>
                <View style={{ flexDirection: 'row', gap: 15, marginRight: 10 }}>
                    <TouchableOpacity onPress={handleOpenHistory}><Folder size={22} color="#94A3B8" /></TouchableOpacity>
                    <TouchableOpacity onPress={handleSave}><Save size={22} color="#10B981" /></TouchableOpacity>
                </View>
            </View>

            {/* Context Bar */}
            {(agentMode === 'Literature Review' || agentMode === 'Research Planner') && (
                <View style={styles.contextBar}>
                    <FileUploader onUploadComplete={async (markdown) => {
                        console.log("🚀 [DEBUG 1] Starting upload pipeline...");
                        console.log("📄 [DEBUG 2] Markdown received, length:", markdown?.length);

                        if (!markdown || markdown.length === 0) {
                            console.error("❌ [DEBUG] Markdown is empty or null!");
                            Alert.alert("오류", "문서 파싱 결과가 비어있습니다.");
                            return;
                        }

                        // Set loading state with custom message
                        processWithBrain(markdown);
                    }} />
                </View>
            )}

            {/* History Sidebar (상단 폴더 아이콘용) */}
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

            {/* Main Content - Agent Workspace */}
            <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
                <View ref={canvasRef} style={styles.canvasViewport} {...panResponder.panHandlers}>
                    <Animated.View style={[styles.canvasWorld, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scale }] }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            {columns.length === 0 && !loading && (
                                <TouchableOpacity style={styles.startBtn} onPress={() => handleStart("전기차 배터리 시장")}>
                                    <Text style={styles.startBtnText}>Start Demo</Text>
                                </TouchableOpacity>
                            )}
                            {/* Root Node Card — 전략의 출발점 */}
                            {columns.length > 0 && columns[0]?.root_node && (
                                <View style={{ alignSelf: 'center', marginRight: 20 }}>
                                    <RootNodeCard
                                        hypothesis={columns[0].root_node}
                                        branchCount={columns[0].branches?.length || 0}
                                    />
                                </View>
                            )}
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
                                    </View>
                                </View>
                            ))}
                            {loading && (
                                <View style={styles.columnWrapper}>
                                    <View style={[styles.nodeList, { opacity: 0.5 }]}>
                                        <View style={styles.loadingCard}>
                                            <ActivityIndicator color="#3B82F6" />
                                            <Text style={styles.loadingText}>Analyzing...</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </View>

                <View style={styles.zoomContainer}>
                    <TouchableOpacity onPress={() => manualZoom(-0.2)}><ZoomOut size={16} color="#94A3B8" /></TouchableOpacity>
                    <Text style={styles.zoomText}>{Math.round(scaleDisplay * 100)}%</Text>
                    <TouchableOpacity onPress={() => manualZoom(0.2)}><ZoomIn size={16} color="#94A3B8" /></TouchableOpacity>
                </View>
            </View>

            {/* Panels & Chat */}
            {activeNode && (
                <DetailPanel
                    node={activeNode}
                    onClose={() => setActiveNode(null)}
                    onAction={handleSmartAction}
                />
            )}

            <FloatingChat
                onSend={handleChatSend}
                loading={loading}
                chatHistory={chatHistory}
                suggestions={suggestions}
                activeNodeLabel={activeNode?.label}
            />
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
    sessionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#1E293B', marginBottom: 5 },
    sessionTitle: { color: 'white', fontWeight: 'bold', marginBottom: 5 },
    sessionDate: { color: '#64748B', fontSize: 12 },
});
