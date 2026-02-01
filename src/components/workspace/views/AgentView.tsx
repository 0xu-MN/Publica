import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Animated, TextInput, Easing, Platform, UIManager, KeyboardAvoidingView, Dimensions, Keyboard, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { ChevronDown, Check, Zap, BookOpen, Map, X, Send, Paperclip, ZoomIn, ZoomOut, RefreshCw, FileText, Minimize2, MessageSquare, File, Layers } from 'lucide-react-native';
// ⚠️ [필수] npm install react-native-svg
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

// � [CRITICAL: PRESERVED LOGIC] --------------------------------------------------
// This layout logic (BranchLine, constants, parentIndex calculation) is finalized and verified.
// DO NOT MODIFY the geometric calculations or constants below without explicit user authorization.
// The "Perfect Branch" logic depends on these exact values and Svg structure.
// ---------------------------------------------------------------------------------

// �📏 [MATH CONSTANTS] 칼각 정렬을 위한 절대 상수
const CARD_HEIGHT = 160;        // 카드 높이
const CARD_GAP = 20;            // 카드 사이 간격
const NODE_HEIGHT = CARD_HEIGHT + CARD_GAP; // 노드 하나가 차지하는 실제 수직 공간
const CONNECTOR_WIDTH = 80;     // 부모-자식 가로 거리

// Enable LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ------------------------------------------------------------------
// 1. 🧬 VISUAL COMPONENTS (Geometric Logic)
// ------------------------------------------------------------------

// ⚡️ [Connector] The Precision Branch
// 자식 노드의 왼쪽에 위치. 부모의 실제 인덱스를 받아 정확한 높이 차이를 계산함.
const BranchLine = ({ isSelected, myIndex, parentIndex }: any) => {

    // 1. 부모와 나 사이의 수직 거리(Delta Y) 계산
    // 예: 부모가 0번(맨위), 내가 2번(아래) -> 부모는 나보다 2칸 위에 있음.
    // diff = (0 - 2) * 180 = -360.
    const verticalDiff = (parentIndex - myIndex) * NODE_HEIGHT;

    // 2. 좌표 정의 (SVG 캔버스 내부 좌표)
    // 캔버스는 자식 카드(나)의 왼쪽 중앙을 기준으로 그려짐.
    // 나의 연결점(Left Dot)은 (CONNECTOR_WIDTH, 50%) = (80, 80)
    // 부모의 연결점(Right Dot)은 (0, 80 + verticalDiff)

    const centerY = CARD_HEIGHT / 2; // 카드 높이의 절반 (80)

    const startX = 0;
    const startY = centerY + verticalDiff; // 부모의 Y 위치 (상대좌표)

    const endX = CONNECTOR_WIDTH;
    const endY = centerY; // 나의 Y 위치

    // 3. 베지에 곡선 핸들 (부드러운 S자)
    // 시작점과 끝점의 중간 X지점에서 꺾임
    const cp1X = CONNECTOR_WIDTH * 0.5;
    const cp1Y = startY;
    const cp2X = CONNECTOR_WIDTH * 0.5;
    const cp2Y = endY;

    const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

    // 4. SVG Viewport 설정
    // 선이 위/아래로 길게 뻗을 수 있으므로 overflow: visible 필수
    return (
        <View style={styles.connectorPos}>
            <Svg width={CONNECTOR_WIDTH} height={CARD_HEIGHT} style={{ overflow: 'visible' }}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor={isSelected ? "#10B981" : "#334155"} stopOpacity="0.6" />
                        <Stop offset="1" stopColor={isSelected ? "#10B981" : "#334155"} stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                <Path
                    d={pathData}
                    stroke={isSelected ? "#10B981" : "#334155"}
                    strokeWidth={isSelected ? "2" : "1"} // 선택되면 두껍게
                    fill="none"
                />
            </Svg>
        </View>
    );
};

// 🔻 [Agent Selector]
const ModeDropdown = ({ currentMode, onSelectMode }: any) => {
    const [visible, setVisible] = useState(false);
    const modes = [
        { id: 'Hypothesis Generator', icon: <Zap size={14} color="#F59E0B" /> },
        { id: 'Literature Review', icon: <BookOpen size={14} color="#3B82F6" /> },
        { id: 'Research Planner', icon: <Map size={14} color="#10B981" /> },
    ];
    const activeMode = modes.find(m => m.id === currentMode) || modes[0];

    return (
        <View style={{ zIndex: 100 }}>
            <TouchableOpacity style={styles.modeTrigger} onPress={() => setVisible(!visible)}>
                {activeMode.icon}
                <Text style={styles.modeTriggerText}>{activeMode.id}</Text>
                <ChevronDown size={12} color="#94A3B8" />
            </TouchableOpacity>
            {visible && (
                <View style={styles.dropdownMenu}>
                    {modes.map((mode) => (
                        <TouchableOpacity
                            key={mode.id}
                            style={[styles.dropdownItem, currentMode === mode.id && { backgroundColor: '#334155' }]}
                            onPress={() => { onSelectMode(mode.id); setVisible(false); }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 24, alignItems: 'center' }}>{mode.icon}</View>
                                <Text style={[styles.dropdownItemTitle, currentMode === mode.id && { color: 'white' }]}>{mode.id}</Text>
                            </View>
                            {currentMode === mode.id && <Check size={14} color="#10B981" />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

// 🃏 [Tower Card] with Parent Index Prop
const TowerCard = ({ data, selected, onSelect, idx, myIndex, parentIndex }: any) => (
    <View style={styles.nodeWrapper}>

        {/* 1. Branch Line (루트 제외) - 부모 인덱스 전달! */}
        {idx > 0 && (
            <BranchLine
                isSelected={selected}
                myIndex={myIndex}
                parentIndex={parentIndex} // 📍 핵심: 부모가 몇 번째인지 알려줌
            />
        )}

        {/* 2. Left Anchor Dot */}
        {idx > 0 && <View style={[styles.anchorDot, styles.anchorLeft, selected && styles.anchorActive]} />}

        <TouchableOpacity
            style={[styles.card, selected && styles.cardSelected]}
            onPress={onSelect}
            activeOpacity={0.95}
        >
            {/* Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.stepLabel}>STEP {idx + 1}</Text>
                {selected && <View style={styles.statusIndicator} />}
            </View>

            {/* Title */}
            <Text style={[styles.cardTitle, selected && { color: '#10B981' }]} numberOfLines={2}>
                {data.label}
            </Text>

            <View style={styles.divider} />

            {/* Body */}
            <View style={styles.cardBody}>
                <View style={styles.listItem}>
                    <View style={[styles.bullet, selected && { backgroundColor: '#10B981' }]} />
                    <Text style={styles.listText} numberOfLines={4}>
                        {data.description || "Analysis provided..."}
                    </Text>
                </View>
            </View>

            {/* Footer */}
            {data.references && (
                <View style={styles.cardFooter}>
                    <Layers size={10} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.metaText}>{data.references.length} Sources</Text>
                </View>
            )}
        </TouchableOpacity>

        {/* 3. Right Anchor Dot */}
        <View style={[styles.anchorDot, styles.anchorRight, selected && styles.anchorActive]} />

    </View>
);

// 🖥️ [Detail Panel]
const DetailPanel = ({ node, onClose }: any) => {
    const slideAnim = useRef(new Animated.Value(450)).current;

    useEffect(() => {
        if (node) Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 12 }).start();
    }, [node]);

    if (!node) return null;

    return (
        <Animated.View style={[styles.detailPanel, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.detailHeader}>
                <Text style={styles.detailLabel}>INSIGHT DETAILS</Text>
                <TouchableOpacity onPress={onClose}><X size={20} color="#94A3B8" /></TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, padding: 24 }}>
                <Text style={styles.detailTitle}>{node.label}</Text>
                <Text style={styles.detailText}>{node.description}</Text>

                {node.references && (
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionLabel}>SOURCES</Text>
                        {node.references.map((ref: string, i: number) => (
                            <View key={i} style={styles.refItem}>
                                <FileText size={14} color="#10B981" style={{ marginTop: 2 }} />
                                <Text style={styles.refText}>{ref}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </Animated.View>
    );
};

// 💬 [Chat] Floating
const FloatingChat = ({ onSend, loading, contextLabel, chatHistory, onFileUpload }: any) => {
    const [expanded, setExpanded] = useState(false);
    const [input, setInput] = useState("");
    const widthAnim = useRef(new Animated.Value(140)).current;
    const heightAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(widthAnim, { toValue: expanded ? 500 : 140, duration: 250, useNativeDriver: false }),
            Animated.timing(heightAnim, { toValue: expanded ? 450 : 50, duration: 250, useNativeDriver: false })
        ]).start();
    }, [expanded]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput("");
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.floatingContainer}>
            <Animated.View style={[styles.chatBox, { width: widthAnim, height: heightAnim }]}>
                {!expanded ? (
                    <TouchableOpacity style={styles.collapsedContent} onPress={() => setExpanded(true)}>
                        <MessageSquare size={18} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.chatBtnText}>AI Chat</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.expandedContent}>
                        <View style={styles.chatHeader}>
                            <Text style={styles.chatContext}>{contextLabel ? `Context: ${contextLabel}` : "InsightFlow Agent"}</Text>
                            <TouchableOpacity onPress={() => { setExpanded(false); Keyboard.dismiss(); }}>
                                <Minimize2 size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.historyArea} contentContainerStyle={{ paddingBottom: 10 }}>
                            {chatHistory.map((msg: any, i: number) => (
                                <View key={i} style={[styles.msgBubble, msg.sender === 'me' ? styles.msgMe : styles.msgAi]}>
                                    <Text style={styles.msgText}>{msg.text}</Text>
                                </View>
                            ))}
                            {loading && <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 10 }} />}
                        </ScrollView>
                        <View style={styles.inputRow}>
                            <TouchableOpacity style={{ padding: 8 }} onPress={onFileUpload}><Paperclip size={20} color="#94A3B8" /></TouchableOpacity>
                            <TextInput
                                style={styles.chatInput}
                                placeholder="Type to analyze..."
                                placeholderTextColor="#64748B"
                                value={input}
                                onChangeText={setInput}
                                onSubmitEditing={handleSend}
                            />
                            <TouchableOpacity style={styles.sendFab} onPress={handleSend}>
                                <Send size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

// ------------------------------------------------------------------
// 2. MAIN LOGIC
// ------------------------------------------------------------------

export const AgentView = () => {
    const [userJob, setUserJob] = useState("Strategist");
    const [agentMode, setAgentMode] = useState("Hypothesis Generator");
    const [columns, setColumns] = useState<any[]>([]);
    const [selectedPath, setSelectedPath] = useState<any>({}); // { colIdx: branchId }
    const [activeNode, setActiveNode] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [zoomScale, setZoomScale] = useState(1);
    const scrollViewRef = useRef<ScrollView>(null);

    // Initial Load
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase.from('profiles').select('job_title').eq('id', user.id).single();
                    if (data?.job_title) setUserJob(data.job_title);
                }
            } catch (e) { }
        };
        fetchProfile();
    }, []);

    const callAgent = async (text: string) => {
        try {
            const response = await fetch('https://ltoqdapmhyxwosxbpaip.supabase.co/functions/v1/insight-agent-gateway', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}` },
                body: JSON.stringify({ user_input: text, user_job: userJob, task_mode: agentMode })
            });
            return await response.json();
        } catch (e) { return null; }
    };

    const handleStart = async (text: string) => {
        setLoading(true); setColumns([]); setActiveNode(null); setZoomScale(1); setChatHistory([]);
        const res = await callAgent(text);
        if (res?.workspace_data) setColumns([res.workspace_data]);
        setLoading(false);
    };

    const handleExpand = async (branch: any, depth: number) => {
        setActiveNode(branch);
        setSelectedPath((prev: any) => {
            const newPath = { ...prev };
            Object.keys(newPath).forEach(k => { if (parseInt(k) > depth) delete newPath[k]; });
            newPath[depth] = branch.id;
            return newPath;
        });

        const newColumns = columns.slice(0, depth + 1);
        setColumns(newColumns);
        setLoading(true);

        const res = await callAgent(`[CONTEXT: ${branch.label}] Expand deeply.`);
        if (res?.workspace_data) {
            setColumns([...newColumns, res.workspace_data]);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 500);
        }
        setLoading(false);
    };

    const handleChatSend = async (text: string) => {
        setChatHistory(prev => [...prev, { text, sender: 'me' }]);
        setLoading(true);
        const res = await callAgent(text);
        if (res?.workspace_data) {
            setColumns(prev => [...prev, res.workspace_data]);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 500);
        }
        const answer = res?.chat_message || res?.workspace_data?.summary || "Dashboard updated.";
        setChatHistory(prev => [...prev, { text: answer, sender: 'ai' }]);
        setLoading(false);
    };

    const handleFileUpload = async () => {
        Alert.alert("Attached", "market_data.pdf uploaded.", [
            {
                text: "OK", onPress: () => {
                    setChatHistory(prev => [...prev, { text: "Uploaded: market_data.pdf", sender: 'me', type: 'file' }]);
                    setTimeout(() => {
                        setChatHistory(prev => [...prev, { text: "Analyzed PDF.", sender: 'ai' }]);
                    }, 800);
                }
            }
        ]);
    };

    // 🚀 [Helper] 이전 컬럼에서 선택된 부모의 인덱스를 찾는 함수
    const getParentIndex = (colIdx: number) => {
        if (colIdx === 0) return 0; // 루트는 부모 없음 (0 처리)
        const parentCol = columns[colIdx - 1];
        const parentId = selectedPath[colIdx - 1];
        return parentCol.branches.findIndex((b: any) => b.id === parentId);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={styles.logo}>InsightFlow</Text>
                    <ModeDropdown currentMode={agentMode} onSelectMode={setAgentMode} />
                </View>
                <TouchableOpacity onPress={() => handleStart("Reset")}><RefreshCw size={16} color="#64748B" /></TouchableOpacity>
            </View>

            {/* Canvas */}
            <View style={styles.canvasContainer}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    style={styles.canvas}
                    contentContainerStyle={[styles.canvasContent, { minWidth: width * zoomScale }]}
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={{
                        transform: [{ scale: zoomScale }],
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        transformOrigin: 'top left',
                    }}>
                        {columns.length === 0 && !loading && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTitle}>The Production Lab</Text>
                                <TouchableOpacity style={styles.startBtn} onPress={() => handleStart("전기차 배터리")}>
                                    <Text style={styles.startBtnText}>Start Demo</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {columns.map((col, idx) => {
                            // 📍 여기서 부모 인덱스를 계산해서 자식들에게 뿌려줍니다.
                            const parentIndex = getParentIndex(idx);

                            return (
                                <View key={idx} style={styles.columnWrapper}>
                                    <View style={styles.nodeList}>
                                        {col.branches?.map((branch: any, bIdx: number) => (
                                            <TowerCard
                                                key={branch.id}
                                                data={branch}
                                                idx={idx}
                                                myIndex={bIdx}
                                                parentIndex={parentIndex} // 부모 위치 전달!
                                                selected={selectedPath[idx] === branch.id}
                                                onSelect={() => handleExpand(branch, idx)}
                                            />
                                        ))}
                                    </View>
                                </View>
                            );
                        })}
                        {loading && <View style={{ justifyContent: 'center', padding: 40 }}><ActivityIndicator size="large" color="#10B981" /></View>}
                    </View>
                </ScrollView>

                {/* Zoom */}
                <View style={styles.zoomContainer}>
                    <TouchableOpacity onPress={() => setZoomScale(s => Math.max(s - 0.1, 0.5))}><ZoomOut size={16} color="#94A3B8" /></TouchableOpacity>
                    <Text style={styles.zoomText}>{Math.round(zoomScale * 100)}%</Text>
                    <TouchableOpacity onPress={() => setZoomScale(s => Math.min(s + 0.1, 2))}><ZoomIn size={16} color="#94A3B8" /></TouchableOpacity>
                </View>
            </View>

            {activeNode && <DetailPanel node={activeNode} onClose={() => setActiveNode(null)} />}
            <FloatingChat onSend={handleChatSend} loading={loading} contextLabel={activeNode?.label} chatHistory={chatHistory} onFileUpload={handleFileUpload} />
        </SafeAreaView>
    );
};

// ------------------------------------------------------------------
// 3. STYLES
// ------------------------------------------------------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    header: { height: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 100, borderBottomWidth: 1, borderColor: '#111' },
    logo: { color: 'white', fontWeight: 'bold', fontSize: 18 },

    modeTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
    modeTriggerText: { color: 'white', fontSize: 13, fontWeight: '600', marginLeft: 8, marginRight: 8 },
    dropdownMenu: { position: 'absolute', top: 45, left: 0, width: 220, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#333', padding: 4 },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 6 },
    dropdownItemTitle: { color: '#94A3B8', fontSize: 13, marginLeft: 10 },

    canvasContainer: { flex: 1, overflow: 'hidden' },
    canvas: { flex: 1 },
    canvasContent: { padding: 50, paddingBottom: 200, paddingRight: 400 },

    zoomContainer: { position: 'absolute', bottom: 30, left: 30, flexDirection: 'row', backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#222', padding: 6, alignItems: 'center', zIndex: 40, gap: 10 },
    zoomText: { color: '#888', fontSize: 11, fontWeight: '600', width: 40, textAlign: 'center' },

    emptyState: { marginTop: 150, marginLeft: 50 },
    emptyTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 20 },
    startBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
    startBtnText: { color: 'white', fontWeight: 'bold' },

    columnWrapper: { flexDirection: 'column', marginRight: CONNECTOR_WIDTH, width: 220, justifyContent: 'center' },
    nodeList: { gap: CARD_GAP },

    // Connector: Absolute positioning is critical here
    connectorPos: { position: 'absolute', left: -CONNECTOR_WIDTH, top: 0, width: CONNECTOR_WIDTH, zIndex: -1, overflow: 'visible' },

    anchorDot: { position: 'absolute', top: '50%', marginTop: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#000', borderWidth: 1.5, borderColor: '#475569', zIndex: 10 },
    anchorLeft: { left: -4 },
    anchorRight: { right: -4 },
    anchorActive: { backgroundColor: '#10B981', borderColor: '#10B981' },

    nodeWrapper: { position: 'relative', alignItems: 'center', height: CARD_HEIGHT },
    card: { width: 220, height: CARD_HEIGHT, backgroundColor: '#050505', borderRadius: 4, padding: 16, borderWidth: 1, borderColor: '#222', justifyContent: 'flex-start' },
    cardSelected: { borderColor: '#10B981', backgroundColor: '#080808', borderWidth: 1.5, shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 15 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    stepLabel: { fontSize: 9, fontWeight: 'bold', color: '#475569', letterSpacing: 1 },
    statusIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },

    cardTitle: { color: '#E2E8F0', fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 8 },
    divider: { height: 1, backgroundColor: '#1E293B', marginBottom: 10 },

    cardBody: { flex: 1 },
    listItem: { flexDirection: 'row', alignItems: 'flex-start' },
    bullet: { width: 3, height: 3, backgroundColor: '#475569', borderRadius: 1.5, marginTop: 7, marginRight: 8 },
    listText: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },

    cardFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#111', flexDirection: 'row', alignItems: 'center' },
    metaText: { color: '#475569', fontSize: 10, fontWeight: '600' },

    detailPanel: { position: 'absolute', right: 0, top: 60, bottom: 0, width: 400, backgroundColor: '#020617', borderLeftWidth: 1, borderColor: '#1E293B', zIndex: 90, shadowColor: 'black', shadowOpacity: 0.5, shadowRadius: 50 },
    detailHeader: { padding: 20, borderBottomWidth: 1, borderColor: '#1E293B', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
    detailTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 20 },
    sectionBox: { marginBottom: 30 },
    sectionLabel: { color: '#475569', fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
    detailText: { color: '#CBD5E1', lineHeight: 24, fontSize: 14 },
    refItem: { flexDirection: 'row', marginBottom: 10 },
    refText: { color: '#94A3B8', fontSize: 13, marginLeft: 10, flex: 1, lineHeight: 20 },
    emptyRef: { color: '#475569', fontStyle: 'italic' },

    floatingContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center', zIndex: 200 },
    chatBox: { backgroundColor: '#0F172A', borderRadius: 20, borderWidth: 1, borderColor: '#334155', overflow: 'hidden', shadowColor: 'black', shadowOpacity: 0.5, shadowRadius: 20 },
    collapsedContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
    chatBtnText: { color: 'white', fontWeight: 'bold' },
    expandedContent: { flex: 1, padding: 0 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#334155', backgroundColor: '#1E293B' },
    chatContext: { color: '#10B981', fontSize: 12, fontWeight: '600' },
    historyArea: { flex: 1, padding: 16, backgroundColor: '#0F172A' },
    emptyChatText: { color: '#475569', textAlign: 'center', marginTop: 20, fontSize: 13 },
    msgBubble: { padding: 12, borderRadius: 8, marginBottom: 10, maxWidth: '85%' },
    msgMe: { backgroundColor: '#2563EB', alignSelf: 'flex-end' },
    msgAi: { backgroundColor: '#1E293B', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#334155' },
    msgText: { color: '#E2E8F0', fontSize: 13, lineHeight: 18 },
    inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderColor: '#334155', backgroundColor: '#1E293B' },
    chatInput: { flex: 1, color: 'white', height: 40, paddingHorizontal: 10 },
    sendFab: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});
