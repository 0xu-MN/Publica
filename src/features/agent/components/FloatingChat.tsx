import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Animated, KeyboardAvoidingView, Platform, StyleSheet, ScrollView } from 'react-native';
import { MessageSquare, Minimize2, Paperclip, Send } from 'lucide-react-native';

export const FloatingChat = ({ onSend, loading, contextLabel, chatHistory, onFileUpload }: any) => {
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
});
