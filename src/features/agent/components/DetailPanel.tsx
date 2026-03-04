import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { X, Search, GitBranch, MessageCircle, ChevronRight, ChevronDown, Layers, Sparkles, Send, Paperclip, ArrowRight, Minimize2, Minus, PanelRightOpen } from 'lucide-react-native';

export interface DetailPanelRef {
    setInput: (text: string) => void;
}

interface DetailPanelProps {
    node: any;
    onClose: () => void;
    onAction: (type: string, node: any) => void;
    // Chat props
    chatHistory: any[];
    onSend: (text: string) => void;
    loading: boolean;
    suggestions: any[];
    onFileUpload?: () => void;
    onCitationClick?: (page: number) => void;
    embedded?: boolean; // When true, skip wrapper/header (used inside UnifiedPanel)
}

export const DetailPanel = forwardRef<DetailPanelRef, DetailPanelProps>(({
    node,
    onClose,
    onAction,
    chatHistory,
    onSend,
    loading,
    suggestions,
    onFileUpload,
    onCitationClick,
    embedded = false,
}, ref) => {
    const slideAnim = useRef(new Animated.Value(450)).current;
    const [chatExpanded, setChatExpanded] = useState(false);
    const [input, setInputState] = useState('');
    const chatScrollRef = useRef<ScrollView>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    useImperativeHandle(ref, () => ({
        setInput: (text: string) => {
            setIsMinimized(false);
            setInputState(prev => prev + text);
            setChatExpanded(true);
        }
    }));

    useEffect(() => {
        if (node) {
            setIsMinimized(false);
            slideAnim.setValue(450);
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
        }
    }, [node]);

    // Auto-scroll chat when new messages arrive
    useEffect(() => {
        if (chatExpanded && chatScrollRef.current) {
            setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [chatHistory, chatExpanded]);

    // In standalone mode, hide when no node. In embedded mode, always show.
    if (!node && !embedded) return null;

    // Default placeholder node for embedded mode when nothing is selected
    const displayNode = node || {
        label: 'Publica Agent',
        description: '브랜치 카드를 클릭하면 상세 분석이 여기에 표시됩니다.\n채팅으로 자유롭게 질문할 수 있습니다.',
        type: 'research'
    };

    // Type-based accent color (matches TowerCard)
    const getAccentColor = () => {
        switch (displayNode.type || displayNode.action_type) {
            case 'documentation': return '#8B5CF6';
            case 'action': return '#F59E0B';
            case 'research':
            default: return '#3B82F6';
        }
    };
    const accentColor = getAccentColor();
    const typeName = (displayNode.type || displayNode.action_type || 'research').toUpperCase();

    const handleSend = (text: string = input) => {
        if (!text.trim()) return;
        onSend(text);
        setInputState('');
    };

    if (isMinimized) {
        return (
            <Animated.View style={[styles.panel, { width: 56, transform: [{ translateX: slideAnim }] }]}>
                <View style={{ alignItems: 'center', paddingTop: 16, gap: 24 }}>
                    <TouchableOpacity onPress={() => setIsMinimized(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <PanelRightOpen size={20} color="#94A3B8" />
                    </TouchableOpacity>

                    <View style={[{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: accentColor + '22' }]}>
                        <Search size={16} color={accentColor} />
                    </View>
                </View>
            </Animated.View>
        );
    }
    // When embedded inside UnifiedPanel, render content directly (no wrapper, no header, no minimize)
    const innerContent = (
        <>
            {/* Card Info Section — Always visible (embedded: always show, standalone: hide when chat open) */}
            {(embedded || !chatExpanded) && (
                <ScrollView style={{ flex: chatExpanded && embedded ? undefined : 1, maxHeight: chatExpanded && embedded ? 300 : undefined }} contentContainerStyle={{ padding: embedded ? 20 : 24 }}>
                    {/* Type Badge */}
                    <View style={[styles.typeBadge, { backgroundColor: accentColor + '22' }]}>
                        <Text style={[styles.typeBadgeText, { color: accentColor }]}>{typeName}</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.titleText}>{displayNode.label}</Text>

                    {/* Description */}
                    <Text style={styles.bodyText}>{displayNode.description || "No description available."}</Text>

                    {/* References (if any) */}
                    {displayNode.references && displayNode.references.length > 0 && (
                        <View style={styles.referencesSection}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                <Layers size={12} color="#64748B" />
                                <Text style={styles.sectionLabel}>{displayNode.references.length} SOURCES</Text>
                            </View>
                            {displayNode.references.map((refItem: string, i: number) => (
                                <View key={i} style={styles.referenceItem}>
                                    <Text style={styles.referenceText} numberOfLines={2}>{refItem}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Chat Section — Expandable */}
            {chatExpanded && (
                <View style={styles.chatSection}>
                    {/* Chat Header */}
                    <View style={styles.chatHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Sparkles size={14} color="#10B981" style={{ marginRight: 6 }} />
                            <Text style={styles.chatContext}>
                                {displayNode.label ? `분석 중: ${displayNode.label}` : 'Publica Agent'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setChatExpanded(false)}>
                            <Minimize2 size={16} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {/* Chat History */}
                    <ScrollView
                        ref={chatScrollRef}
                        style={styles.chatHistory}
                        contentContainerStyle={{ paddingBottom: 10 }}
                    >
                        {chatHistory.map((msg: any, i: number) => (
                            <View key={i} style={{ marginBottom: 12 }}>
                                <View style={[styles.msgBubble, msg.sender === 'me' ? styles.msgMe : styles.msgAi]}>
                                    <Text style={styles.msgText}>
                                        {msg.text.split(/(\[Page \d+\])/g).map((part: string, index: number) => {
                                            const match = part.match(/\[Page (\d+)\]/);
                                            if (match) {
                                                const pageNum = parseInt(match[1], 10);
                                                return (
                                                    <Text
                                                        key={index}
                                                        style={{ color: '#60A5FA', textDecorationLine: 'underline', fontWeight: 'bold' }}
                                                        onPress={() => onCitationClick && onCitationClick(pageNum)}
                                                    >
                                                        {part}
                                                    </Text>
                                                );
                                            }
                                            return <Text key={index}>{part}</Text>;
                                        })}
                                    </Text>
                                </View>
                                {msg.sender === 'ai' && (
                                    <TouchableOpacity
                                        style={styles.inlineBranchBtn}
                                        onPress={() => {
                                            // Make sure node exists to branch off of
                                            if (node) {
                                                onAction('CHAT_TO_BRANCH', { ...node, customQuery: msg.text });
                                                setChatExpanded(false);
                                            }
                                        }}
                                    >
                                        <GitBranch size={12} color="#10B981" />
                                        <Text style={styles.inlineBranchBtnText}>이 답변을 하위 브랜치로 추가</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {loading && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                <ActivityIndicator size="small" color="#10B981" />
                                <Text style={{ color: '#64748B', fontSize: 12, marginLeft: 8 }}>Thinking...</Text>
                            </View>
                        )}

                        {/* Suggested Next Steps */}
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
                        <TouchableOpacity style={styles.attachPill} onPress={onFileUpload}>
                            <Paperclip size={14} color="#10B981" />
                            <Text style={styles.attachText}>PDF</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.chatInput}
                            placeholder="이 항목에 대해 질문..."
                            placeholderTextColor="#64748B"
                            value={input}
                            onChangeText={setInputState}
                            onSubmitEditing={() => handleSend()}
                        />
                        <TouchableOpacity style={styles.sendFab} onPress={() => handleSend()}>
                            <Send size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Action Buttons — Always visible at bottom */}
            <View style={styles.actionBar}>
                <Text style={styles.actionTitle}>심층 분석</Text>

                {/* Deep Dive */}
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#3B82F6' }]}
                    onPress={() => onAction('DEEP_DIVE', node)}
                >
                    <Search size={14} color="#3B82F6" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.actionBtnTitle, { color: '#3B82F6' }]}>Deep Dive</Text>
                        <Text style={styles.actionBtnDesc}>이 항목을 더 깊이 분석합니다</Text>
                    </View>
                    <ChevronRight size={14} color="#3B82F6" />
                </TouchableOpacity>


                {/* Ask AI — Now toggles the chat section */}
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#8B5CF6' }, chatExpanded && { backgroundColor: '#8B5CF620', borderColor: '#8B5CF6' }]}
                    onPress={() => setChatExpanded(!chatExpanded)}
                >
                    <MessageCircle size={14} color="#8B5CF6" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.actionBtnTitle, { color: '#8B5CF6' }]}>Ask AI</Text>
                        <Text style={styles.actionBtnDesc}>
                            {chatExpanded ? '채팅 닫기' : '이 항목에 대해 질문합니다'}
                        </Text>
                    </View>
                    {chatExpanded ? (
                        <ChevronDown size={14} color="#8B5CF6" />
                    ) : (
                        <ChevronRight size={14} color="#8B5CF6" />
                    )}
                </TouchableOpacity>
            </View>
        </>
    );

    // When embedded in UnifiedPanel, return content directly without wrapper
    if (embedded) {
        return <View style={{ flex: 1 }}>{innerContent}</View>;
    }

    // Standalone mode: full animated panel with header
    return (
        <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.typeDot, { backgroundColor: accentColor }]} />
                    <Text style={styles.headerTitle}>INSPECTOR</Text>
                </View>
                <TouchableOpacity onPress={() => setIsMinimized(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Minus size={20} color="#64748B" />
                </TouchableOpacity>
            </View>
            {innerContent}
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    panel: {
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: 360,
        backgroundColor: '#020617',
        borderLeftWidth: 1, borderColor: '#1E293B',
        zIndex: 90,
    },
    header: {
        height: 56,
        paddingHorizontal: 20,
        borderBottomWidth: 1, borderColor: '#1E293B',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    headerTitle: { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    typeDot: { width: 8, height: 8, borderRadius: 4 },

    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 12 },
    typeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

    titleText: { color: '#F1F5F9', fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 16 },
    bodyText: { color: '#94A3B8', fontSize: 14, lineHeight: 22 },

    referencesSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderColor: '#1E293B' },
    sectionLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    referenceItem: { backgroundColor: '#0F172A', borderRadius: 6, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#1E293B' },
    referenceText: { color: '#94A3B8', fontSize: 12, lineHeight: 16 },

    // Chat Section
    chatSection: { flex: 1 },
    chatHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 12, borderBottomWidth: 1, borderColor: '#1E293B',
        backgroundColor: '#0F172A',
    },
    chatContext: { color: '#10B981', fontSize: 12, fontWeight: '600' },
    chatHistory: { flex: 1, padding: 12, backgroundColor: '#020617' },
    msgBubble: { padding: 10, borderRadius: 8, marginBottom: 8, maxWidth: '85%' },
    msgMe: { backgroundColor: '#2563EB', alignSelf: 'flex-end' },
    msgAi: { backgroundColor: '#0F172A', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#1E293B' },
    msgText: { color: '#E2E8F0', fontSize: 13, lineHeight: 18 },

    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        padding: 8, borderTopWidth: 1, borderColor: '#1E293B',
        backgroundColor: '#0F172A',
    },
    chatInput: { flex: 1, color: 'white', height: 36, paddingHorizontal: 8, fontSize: 13 },
    sendFab: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },

    attachPill: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 12, marginRight: 6,
        borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    attachText: { color: '#10B981', fontSize: 11, fontWeight: '700', marginLeft: 4 },

    suggestionContainer: { marginTop: 12, paddingHorizontal: 4 },
    suggestionTitle: { color: '#64748B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    suggestionChip: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#0F172A', paddingVertical: 10, paddingHorizontal: 14,
        borderRadius: 10, marginBottom: 6,
        borderWidth: 1, borderColor: '#1E293B',
    },
    suggestionLabel: { color: '#E2E8F0', fontSize: 12, fontWeight: '500' },

    // Action Bar
    actionBar: { padding: 12, borderTopWidth: 1, borderColor: '#1E293B', backgroundColor: '#020617', gap: 6 },
    actionTitle: { color: '#64748B', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2, textTransform: 'uppercase' },

    actionBtn: {
        flexDirection: 'row', alignItems: 'center',
        padding: 10,
        borderRadius: 8, borderWidth: 1,
        backgroundColor: '#0F172A',
    },
    actionBtnTitle: { fontSize: 13, fontWeight: '700' },
    actionBtnDesc: { color: '#64748B', fontSize: 10, marginTop: 1 },

    // Inline Branch Button in Chat
    inlineBranchBtn: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        borderWidth: 1, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 4,
    },
    inlineBranchBtnText: { color: '#10B981', fontSize: 11, fontWeight: '700', marginLeft: 6 },
});
