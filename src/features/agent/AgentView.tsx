import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Animated, Dimensions, Platform, PanResponder, UIManager, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
// 🌟 [필수] 아이콘 누락되면 하얀 화면 뜹니다. 꼭 확인하세요!
import { RefreshCw, ZoomIn, ZoomOut, Folder, Save, X, Trash2 } from 'lucide-react-native';

import { ModeDropdown } from './components/ModeDropdown';
import { TowerCard } from './components/TowerCard';
import { DetailPanel } from './components/DetailPanel';
import { FloatingChat } from './components/FloatingChat';
import { FileUploader } from './components/FileUploader';
import { LAYOUT } from './AgentLayout';
import { useSessionManager } from './hooks/useSessionManager';

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const AgentView = () => {
    // 1. User & Session Hook
    const [user, setUser] = useState<any>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    // 🌟 [Hook] 세션 매니저 연결
    const { sessions, saveSession, loadSession, fetchSessions, deleteSession } = useSessionManager(user?.id);

    // 2. UI States
    const [agentMode, setAgentMode] = useState("Hypothesis Generator");
    const [columns, setColumns] = useState<any[]>([]);
    const [selectedPath, setSelectedPath] = useState<any>({});
    const [activeNode, setActiveNode] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // 3. Canvas States
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const scale = useRef(new Animated.Value(1)).current;
    const [scaleDisplay, setScaleDisplay] = useState(1);
    const canvasRef = useRef<View>(null);

    // 4. Web Zoom Fix
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

    // 5. Logic Handlers
    const handleStart = async (text: string) => {
        setLoading(true); setColumns([]); setActiveNode(null); setSuggestions([]);

        // Mock Response for Testing (백엔드 없어도 작동하게)
        setTimeout(() => {
            const mockData = {
                root_node: text,
                branches: [{ id: '1', label: 'Test Node', description: 'This is a test node.', type: 'Insight' }]
            };
            setColumns([mockData]);
            setSuggestions([
                { label: "실행 계획 수립", type: "PLAN", query: "Plan" },
                { label: "관련 논문 검색", type: "VERIFY", query: "Verify" }
            ]);
            setLoading(false);
        }, 1000);
    };

    const handleExpand = (branch: any, idx: number) => {
        setActiveNode(branch); // 패널 열기
    };

    const handleChatSend = (text: string) => {
        setChatHistory(prev => [...prev, { text, sender: 'me' }]);
        setLoading(true);
        setTimeout(() => {
            setChatHistory(prev => [...prev, { text: "AI 응답 테스트입니다.", sender: 'ai' }]);
            setLoading(false);
        }, 800);
    };

    // 🌟 [FIXED] 저장 버튼 로직
    const handleSave = async () => {
        if (!user) { Alert.alert("오류", "로그인이 필요합니다."); return; }
        if (columns.length === 0) { Alert.alert("알림", "빈 화면은 저장할 수 없습니다."); return; }

        const title = columns[0]?.branches?.[0]?.label || columns[0]?.root_node || "Untitled Project";
        console.log("Saving Project:", title); // 로그 확인

        await saveSession(title, agentMode, columns, chatHistory);
        Alert.alert("성공", "프로젝트가 저장되었습니다.");
    };

    // 🌟 [FIXED] 히스토리 열기 (에러 방지)
    const handleOpenHistory = () => {
        if (!user) { Alert.alert("오류", "로그인 상태를 확인해주세요."); return; }
        fetchSessions(); // 목록 갱신
        setShowHistory(true);
    };

    // 🌟 [FIXED] 불러오기 로직
    const handleLoad = async (sessionId: string) => {
        const data = await loadSession(sessionId);
        if (data) {
            setAgentMode(data.mode);
            setColumns(data.workspace_data);
            setChatHistory(data.chat_history || []);
            setShowHistory(false);
        }
    };

    // 🌟 [FIXED] Planner 전환 로직 (맥락 유지)
    const handleSmartAction = (type: string, node: any) => {
        console.log("Action Triggered:", type); // 로그 확인
        if (type === 'PLAN') {
            setAgentMode('Research Planner');
            setChatHistory(prev => [...prev, { text: `[System] '${node.label}' 기반 실행 계획 수립 시작.`, sender: 'ai' }]);

            // 🔥 핵심: 기존 노드를 유지한 채로 새 맵 시작
            setColumns([{
                root_node: `Plan: ${node.label}`,
                branches: [node] // 선택한 노드를 루트로
            }]);

            setActiveNode(null); // 패널 닫기
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

            {/* 🌟 [Safety] History Sidebar (하얀 화면 방지 처리) */}
            {showHistory && (
                <View style={styles.historySidebar}>
                    <View style={styles.sidebarHeader}>
                        <Text style={styles.sidebarTitle}>Saved Projects</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}><X size={20} color="#94A3B8" /></TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        {/* sessions가 undefined여도 에러 안 나게 처리 */}
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

            {/* Canvas */}
            <View ref={canvasRef} style={styles.canvasViewport} {...panResponder.panHandlers}>
                <Animated.View style={[styles.canvasWorld, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scale }] }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        {columns.length === 0 && !loading && (
                            <TouchableOpacity style={styles.startBtn} onPress={() => handleStart("전기차 배터리")}>
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
                                            parentIndex={0} // 임시 고정
                                            selected={false}
                                            onSelect={() => handleExpand(branch, idx)}
                                        />
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                </Animated.View>
            </View>

            {/* Zoom Controls */}
            <View style={styles.zoomContainer}>
                <TouchableOpacity onPress={() => manualZoom(-0.2)}><ZoomOut size={16} color="#94A3B8" /></TouchableOpacity>
                <Text style={styles.zoomText}>{Math.round(scaleDisplay * 100)}%</Text>
                <TouchableOpacity onPress={() => manualZoom(0.2)}><ZoomIn size={16} color="#94A3B8" /></TouchableOpacity>
            </View>

            {/* Panels & Chat */}
            {activeNode && (
                <DetailPanel
                    node={activeNode}
                    onClose={() => setActiveNode(null)}
                    onAction={handleSmartAction} // 👈 이게 연결되어야 버튼이 작동함!
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
    columnWrapper: { flexDirection: 'column', marginRight: 50, width: 220, justifyContent: 'center' },
    nodeList: { gap: 20 },
    startBtn: { marginTop: 100, marginLeft: 50, backgroundColor: '#2563EB', padding: 15, borderRadius: 8 },
    startBtnText: { color: 'white', fontWeight: 'bold' },

    // History Sidebar
    historySidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 300, backgroundColor: '#0F172A', zIndex: 200, borderRightWidth: 1, borderColor: '#334155', padding: 20 },
    sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    sidebarTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    sessionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#1E293B', marginBottom: 5 },
    sessionTitle: { color: 'white', fontWeight: 'bold', marginBottom: 5 },
    sessionDate: { color: '#64748B', fontSize: 12 },
});
