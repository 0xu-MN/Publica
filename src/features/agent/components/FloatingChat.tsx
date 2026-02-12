import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Animated, KeyboardAvoidingView, Platform, StyleSheet, ScrollView } from 'react-native';
import { MessageSquare, Minimize2, Paperclip, Send, Sparkles, ArrowRight } from 'lucide-react-native';

export const FloatingChat = ({ onSend, loading, contextLabel, chatHistory, onFileUpload, suggestions, activeNodeLabel }: any) => {
    const [expanded, setExpanded] = useState(false);
    const [input, setInput] = useState("");
    const widthAnim = useRef(new Animated.Value(140)).current;
    const heightAnim = useRef(new Animated.Value(50)).current;

    // 제안 버튼(Chips)이 부드럽게 뜨도록 애니메이션
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(widthAnim, { toValue: expanded ? 500 : 140, duration: 250, useNativeDriver: false }),
            Animated.timing(heightAnim, { toValue: expanded ? 500 : 50, duration: 250, useNativeDriver: false }) // 높이 좀 더 키움
        ]).start();
    }, [expanded]);

    useEffect(() => {
        if (suggestions && suggestions.length > 0) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [suggestions]);

    const handleSend = (text: string = input) => {
        if (!text.trim()) return;
        onSend(text);
        setInput("");
        fadeAnim.setValue(0); // 전송하면 제안 숨기기
    };

    const handleSuggestionClick = (query: string) => {
        onSend(query); // 버튼 누르면 바로 질문 전송
        fadeAnim.setValue(0); // 누르면 사라짐
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
                        {/* Header */}
                        <View style={styles.chatHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Sparkles size={14} color="#10B981" style={{ marginRight: 6 }} />
                                <Text style={styles.chatContext}>
                                    {activeNodeLabel ? `분석 중: ${activeNodeLabel}` : contextLabel ? `Context: ${contextLabel}` : "Publica Agent"}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setExpanded(false)}><Minimize2 size={18} color="#94A3B8" /></TouchableOpacity>
                        </View>

                        {/* History Area */}
                        <ScrollView style={styles.historyArea} contentContainerStyle={{ paddingBottom: 20 }}>
                            {chatHistory.map((msg: any, i: number) => (
                                <View key={i} style={[styles.msgBubble, msg.sender === 'me' ? styles.msgMe : styles.msgAi]}>
                                    <Text style={styles.msgText}>{msg.text}</Text>
                                </View>
                            ))}

                            {loading && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                    <ActivityIndicator size="small" color="#10B981" />
                                    <Text style={{ color: '#64748B', fontSize: 12, marginLeft: 8 }}>Thinking...</Text>
                                </View>
                            )}

                            {/* 🌟 [NEW] AI 추천 칩 (Grok Style) - Force Visible */}
                            {!loading && suggestions && suggestions.length > 0 && (
                                <View style={styles.suggestionContainer}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 12 }}>
                                        <Sparkles size={12} color="#10B981" style={{ marginRight: 6 }} />
                                        <Text style={styles.suggestionTitle}>Suggested Next Steps</Text>
                                    </View>

                                    {suggestions.map((item: any, idx: number) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.suggestionChip}
                                            onPress={() => onSend(item.query)}
                                        >
                                            <Text style={styles.suggestionLabel}>{item.label}</Text>
                                            <ArrowRight size={14} color="#64748B" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        {/* Input Area */}
                        <View style={styles.inputRow}>
                            <TouchableOpacity style={{ padding: 8 }} onPress={onFileUpload}><Paperclip size={20} color="#94A3B8" /></TouchableOpacity>
                            <TextInput
                                style={styles.chatInput}
                                placeholder="Ask follow-up questions..."
                                placeholderTextColor="#64748B"
                                value={input}
                                onChangeText={setInput}
                                onSubmitEditing={() => handleSend()}
                            />
                            <TouchableOpacity style={styles.sendFab} onPress={() => handleSend()}>
                                <Send size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    floatingContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center', zIndex: 200 },
    chatBox: { backgroundColor: '#0F172A', borderRadius: 20, borderWidth: 1, borderColor: '#334155', overflow: 'hidden', shadowColor: 'black', shadowOpacity: 0.5, shadowRadius: 20 },
    collapsedContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
    chatBtnText: { color: 'white', fontWeight: 'bold' },
    expandedContent: { flex: 1, padding: 0 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#334155', backgroundColor: '#1E293B' },
    chatContext: { color: '#10B981', fontSize: 12, fontWeight: '600' },
    historyArea: { flex: 1, padding: 16, backgroundColor: '#0F172A' },
    msgBubble: { padding: 12, borderRadius: 8, marginBottom: 10, maxWidth: '85%' },
    msgMe: { backgroundColor: '#2563EB', alignSelf: 'flex-end' },
    msgAi: { backgroundColor: '#1E293B', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#334155' },
    msgText: { color: '#E2E8F0', fontSize: 13, lineHeight: 18 },
    inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderColor: '#334155', backgroundColor: '#1E293B' },
    chatInput: { flex: 1, color: 'white', height: 40, paddingHorizontal: 10 },
    sendFab: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

    // 🌟 Check these styles carefully
    suggestionContainer: { marginTop: 15, paddingHorizontal: 4 },
    suggestionTitle: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    suggestionChip: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#1E293B',
        paddingVertical: 12, paddingHorizontal: 16,
        borderRadius: 12, marginBottom: 8,
        borderWidth: 1, borderColor: '#334155'
    },
    suggestionLabel: { color: '#E2E8F0', fontSize: 13, fontWeight: '500' }
});
