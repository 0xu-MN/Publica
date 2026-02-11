import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Animated, Dimensions, Platform, PanResponder, UIManager, Alert, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
// 아이콘 필수!
import { RefreshCw, ZoomIn, ZoomOut, Folder, Save, X, Trash2 } from 'lucide-react-native';

import { ModeDropdown } from './components/ModeDropdown';
import { TowerCard } from './components/TowerCard';
import { DetailPanel } from './components/DetailPanel';
import { FloatingChat } from './components/FloatingChat';
import { FileUploader } from './components/FileUploader';
import { LAYOUT } from './AgentLayout';
import { useSessionManager } from './hooks/useSessionManager';

// New feature imports can go here later if needed

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
    const [agentMode, setAgentMode] = useState("Hypothesis Generator");
    const [columns, setColumns] = useState<any[]>([]);
    const [selectedPath, setSelectedPath] = useState<any>({});
    const [activeNode, setActiveNode] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // 🌟 [Load Prop] 외부에서 주입된 세션 로드
    useEffect(() => {
        if (initialSession) {
            console.log("📂 Loading Session from Props:", initialSession.title);
            setAgentMode(initialSession.mode);
            setColumns(initialSession.workspace_data);
            setChatHistory(initialSession.chat_history || []);
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

    // --- 5. AI Logic Handlers (Real) ---

    // 🌟 [Real AI] 백엔드 호출 함수
    const callAgent = async (text: string, context: string = "") => {
        try {
            console.log("🚀 Calling AI:", text);
            const { data, error } = await supabase.functions.invoke('insight-agent-gateway', {
                body: {
                    user_input: text,
                    user_job: "Strategist",
                    task_mode: agentMode,
                    context_history: context
                }
            });
            if (error) throw error;
            return data;
        } catch (e: any) {
            console.error("AI Error:", e);
            Alert.alert("AI Error", e.message);
            return null;
        }
    };

    // 🌟 [Real AI] 시작 함수
    const handleStart = async (text: string) => {
        if (!text.trim()) return;
        setLoading(true); setColumns([]); setActiveNode(null); setSuggestions([]);

        // Call Real AI
        const res = await callAgent(text);

        if (res?.workspace_data) {
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
        setActiveNode(branch);

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

            // 🔥 맥락 유지: 선택한 노드를 루트로 새 트리 시작
            setColumns([{
                root_node: `Plan: ${node.label}`,
                branches: [node]
            }]);

            // AI에게 바로 명령
            handleStart(`Create a detailed action plan for: ${node.label}`);
            setActiveNode(null);
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
                    <FileUploader onUploadComplete={(msg) => console.log(msg)} />
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
            <View style={{ flex: 1 }}>
                <View ref={canvasRef} style={styles.canvasViewport} {...panResponder.panHandlers}>
                    <Animated.View style={[styles.canvasWorld, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scale }] }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            {columns.length === 0 && !loading && (
                                <TouchableOpacity style={styles.startBtn} onPress={() => handleStart("전기차 배터리 시장")}>
                                    <Text style={styles.startBtnText}>Start Demo</Text>
                                </TouchableOpacity>
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
