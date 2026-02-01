import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions, Alert, Platform, UIManager } from 'react-native';
import { supabase } from '../../lib/supabase';
import { RefreshCw, ZoomIn, ZoomOut } from 'lucide-react-native';

// 분리된 컴포넌트 임포트
import { ModeDropdown } from './components/ModeDropdown';
import { TowerCard } from './components/TowerCard';
import { DetailPanel } from './components/DetailPanel';
import { FloatingChat } from './components/FloatingChat';
import { LAYOUT } from './AgentLayout';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const AgentView = () => {
    const [userJob, setUserJob] = useState("Strategist");
    const [agentMode, setAgentMode] = useState("Hypothesis Generator");
    const [columns, setColumns] = useState<any[]>([]);
    const [selectedPath, setSelectedPath] = useState<any>({});
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

    // API Call
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

    // Helper: Find Parent Index
    const getParentIndex = (colIdx: number) => {
        if (colIdx === 0) return 0;
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
                    <View style={{ transform: [{ scale: zoomScale }], flexDirection: 'row', alignItems: 'flex-start', transformOrigin: 'top left' }}>
                        {columns.length === 0 && !loading && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTitle}>The Production Lab</Text>
                                <TouchableOpacity style={styles.startBtn} onPress={() => handleStart("전기차 배터리")}>
                                    <Text style={styles.startBtnText}>Start Demo</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {columns.map((col, idx) => {
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
                                                parentIndex={parentIndex}
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

                {/* Zoom Controls */}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    header: { height: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 100, borderBottomWidth: 1, borderColor: '#111' },
    logo: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    canvasContainer: { flex: 1, overflow: 'hidden' },
    canvas: { flex: 1 },
    canvasContent: { padding: 50, paddingBottom: 200, paddingRight: 400 },
    zoomContainer: { position: 'absolute', bottom: 30, left: 30, flexDirection: 'row', backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#222', padding: 6, alignItems: 'center', zIndex: 40, gap: 10 },
    zoomText: { color: '#888', fontSize: 11, fontWeight: '600', width: 40, textAlign: 'center' },
    emptyState: { marginTop: 150, marginLeft: 50 },
    emptyTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 20 },
    startBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
    startBtnText: { color: 'white', fontWeight: 'bold' },
    columnWrapper: { flexDirection: 'column', marginRight: LAYOUT.CONNECTOR_WIDTH, width: 220, justifyContent: 'center' },
    nodeList: { gap: LAYOUT.CARD_GAP },
});
