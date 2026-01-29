import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, ScrollView, Platform, UIManager } from 'react-native';
import { MindMapRenderer } from './renderers/MindMapRenderer';
import {
    PanelRightClose, PanelRightOpen, Send, Paperclip, Mic, Sparkles, Maximize2,
    Bot, FileText, Network, ChevronDown, Workflow, Brain, Search, FlaskConical, PenTool, BarChart3,
    Lightbulb
} from 'lucide-react-native';
import { interactWithAgent, TaskMode } from '../../../services/insightService';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --------------------------------------------------------------------------
// Universal Menu Structure
// --------------------------------------------------------------------------
interface UniversalViewMode {
    id: TaskMode;
    label: string;
    icon: React.ElementType;
    description: string;
}

const UNIVERSAL_MODES: UniversalViewMode[] = [
    { id: 'hypothesis', label: 'Hypothesis Generator', icon: Lightbulb, description: 'Generate insights & core questions' },
    { id: 'ref_check', label: 'Literature Review', icon: Search, description: 'Verify facts & find references' },
    { id: 'experiment', label: 'Methodology Design', icon: FlaskConical, description: 'Plan strategy & execution steps' },
    { id: 'drafting', label: 'Drafting Assistant', icon: PenTool, description: 'Write reports & documentation' },
    { id: 'analysis', label: 'Data Insight', icon: BarChart3, description: 'Analyze data & interpret results' },
];

export const AgentView = () => {
    const [workspaceData, setWorkspaceData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [inputText, setInputText] = useState('');
    const [currentMode, setCurrentMode] = useState<UniversalViewMode>(UNIVERSAL_MODES[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [chatHistory, setChatHistory] = useState<{ role: 'ai' | 'user', content: string, tags?: string[] }[]>([
        { role: 'ai', content: `Welcome. I am ready to analyze **${currentMode.label}** tasks.\nPlease provide your context or data.` }
    ]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsg = inputText;
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputText('');
        setLoading(true);

        try {
            console.log("🚀 Sending Request to Backend:", userMsg);

            // 1. Call Backend
            const response: any = await interactWithAgent(currentMode.id, userMsg);

            console.log("🔥 [DEBUG] RECEIVED RAW RESPONSE:", JSON.stringify(response, null, 2));

            // 2. Update Chat
            const aiContent = response.chat_message || response.data?.response || "Analysis complete.";
            setChatHistory(prev => [...prev, {
                role: 'ai',
                content: aiContent,
                tags: []
            }]);

            // 3. Update Workspace
            const wsData = response.workspace_data || (response.data && response.data.workspace_data);

            if (wsData) {
                console.log("✅ Workspace Data Found. Updating State...");
                console.log("📂 Type:", wsData.type);
                console.log("🌳 Branches:", wsData.branches?.length);
                setWorkspaceData(wsData);
            } else {
                console.error("❌ RESPONSE MISSING 'workspace_data'. Server sent:", response);
            }

        } catch (error: any) {
            console.error("🔥 Error in handleSendMessage:", error);
            setChatHistory(prev => [...prev, { role: 'ai', content: "System Error: " + error.message }]);
        } finally {
            setLoading(false);
        }
    };

    const toggleRightPanel = () => {
        setIsRightPanelOpen(!isRightPanelOpen);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 1. Header (High Z-Index for Dropdown) */}
            <View style={styles.headerContainer}>
                <View className="flex-row items-center gap-3 px-6">
                    {/* Universal Mode Selector */}
                    <View className="relative">
                        <TouchableOpacity
                            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex-row items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 active:bg-blue-500/20"
                        >
                            <currentMode.icon size={14} color="#60A5FA" />
                            <Text className="text-blue-400 text-xs font-semibold">{currentMode.label}</Text>
                            <ChevronDown size={12} color="#60A5FA" />
                        </TouchableOpacity>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <View className="absolute top-10 left-0 w-64 bg-[#0F172A] border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden py-1 z-50">
                                {UNIVERSAL_MODES.map((mode) => (
                                    <TouchableOpacity
                                        key={mode.id}
                                        onPress={() => {
                                            setCurrentMode(mode);
                                            setIsDropdownOpen(false);
                                            setChatHistory([{ role: 'ai', content: `Switched to **${mode.label}**.\nHow can I assist you with this task?` }]);
                                            setWorkspaceData(null);
                                        }}
                                        className={`flex-row items-center gap-3 px-4 py-3 hover:bg-slate-800 ${currentMode.id === mode.id ? 'bg-blue-500/10' : ''}`}
                                    >
                                        <mode.icon size={16} color={currentMode.id === mode.id ? '#60A5FA' : '#94A3B8'} />
                                        <View>
                                            <Text className={`text-xs font-bold ${currentMode.id === mode.id ? 'text-blue-400' : 'text-slate-200'}`}>
                                                {mode.label}
                                            </Text>
                                            <Text className="text-[10px] text-slate-500">{mode.description}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <Text className="text-slate-500 text-sm">|</Text>
                    <Text className="text-slate-300 text-sm font-medium">InsightFlow Agent</Text>
                </View>
                {/* Toolbar Actions */}
                <View className="flex-row items-center gap-2 px-6">
                    {!isRightPanelOpen && (
                        <TouchableOpacity onPress={toggleRightPanel} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white">
                            <PanelRightOpen size={20} color="currentColor" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.contentContainer}>
                {/* 2. LEFT PANEL (Workspace) */}
                <View style={styles.leftPanel}>
                    {loading ? (
                        <View style={styles.placeholder}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text style={styles.placeholderText}>Analyzing Structure...</Text>
                        </View>
                    ) : workspaceData && workspaceData.type === 'mind_map' ? (
                        <MindMapRenderer
                            data={workspaceData}
                            onNodeClick={(label) => {
                                console.log("Clicked:", label);
                                setInputText(`Deep dive into: ${label}`);
                            }}
                        />
                    ) : (
                        <View style={styles.placeholder}>
                            <Text style={styles.placeholderText}>No Data Yet.</Text>
                            <Text style={{ color: '#4b5563', fontSize: 10, marginTop: 10 }}>
                                (Check Console if you sent a message)
                            </Text>
                        </View>
                    )}
                </View>

                {/* 3. RIGHT PANEL (Chat) */}
                {isRightPanelOpen && (
                    <View style={styles.rightPanel}>
                        {/* Header */}
                        <View className="h-14 px-5 border-b border-white/5 flex-row items-center justify-between bg-[#0F172A]">
                            <View className="flex-row items-center gap-2">
                                <Bot size={18} color="#3B82F6" />
                                <Text className="text-white font-bold text-sm">Insight Agent</Text>
                            </View>
                            <TouchableOpacity onPress={toggleRightPanel} className="p-1 rounded hover:bg-slate-800">
                                <PanelRightClose size={18} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Chat History */}
                        <ScrollView className="flex-1 p-5">
                            {chatHistory.map((msg, idx) => (
                                <View key={idx} className={`flex-row gap-3 mb-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <View className={`w-8 h-8 rounded-full items-center justify-center mt-1 ${msg.role === 'ai' ? 'bg-blue-600' : 'bg-slate-600'}`}>
                                        {msg.role === 'ai' ? <Sparkles size={14} color="white" /> : <Text className="text-white text-[10px] font-bold">ME</Text>}
                                    </View>
                                    <View className={`flex-1 p-4 rounded-2xl border ${msg.role === 'ai' ? 'bg-slate-800/50 rounded-tl-none border-white/5' : 'bg-blue-600/10 rounded-tr-none border-blue-500/20'}`}>
                                        <Text className={`${msg.role === 'ai' ? 'text-slate-300' : 'text-blue-100'} text-sm leading-6`}>{msg.content}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Input Area */}
                        <View className="p-5 border-t border-white/10 bg-[#0F172A]">
                            <View className="bg-[#020617] border border-white/10 rounded-2xl p-2">
                                <TextInput
                                    className="text-white text-sm px-3 py-2 min-h-[40px] max-h-[120px]"
                                    placeholder="Type your request here..."
                                    placeholderTextColor="#475569"
                                    multiline
                                    value={inputText}
                                    onChangeText={setInputText}
                                />
                                <View className="flex-row items-center justify-between px-2 pb-1 mt-2">
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity className="p-2 hover:bg-white/5 rounded-lg"><Paperclip size={18} color="#64748B" /></TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleSendMessage}
                                        className={`${inputText ? 'bg-blue-600' : 'bg-slate-700'} p-2 rounded-xl transition-all`}
                                    >
                                        <Send size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050B14', flexDirection: 'column' },
    headerContainer: {
        height: 60,
        zIndex: 100,
        backgroundColor: '#0A1628',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: '#1e293b'
    },
    contentContainer: { flex: 1, flexDirection: 'row' },
    leftPanel: { flex: 1, borderRightWidth: 1, borderColor: '#1e293b', padding: 0 },
    rightPanel: { width: 400, backgroundColor: '#0A1628', borderLeftWidth: 1, borderLeftColor: '#1e293b' },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: '#6b7280' }
});
