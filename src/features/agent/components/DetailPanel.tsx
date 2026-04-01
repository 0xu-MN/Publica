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
    onAppendToMemo?: (text: string) => void;
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
    onAppendToMemo,
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
            case 'documentation': return '#7C3AED';
            case 'action': return '#F59E0B';
            case 'research':
            default: return '#7C3AED';
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
                            <Sparkles size={14} color="#7C3AED" style={{ marginRight: 6 }} />
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
                                        <GitBranch size={12} color="#7C3AED" />
                                        <Text style={styles.inlineBranchBtnText}>이 답변을 하위 브랜치로 추가</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {loading && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 12 }}>
                                <ActivityIndicator size="small" color="#7C3AED" />
                                <Text style={{ color: '#94A3B8', fontSize: 12, marginLeft: 8, fontWeight: '600' }}>분석 중...</Text>
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
                            <Paperclip size={14} color="#7C3AED" />
                            <Text style={styles.attachText}>PDF</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.chatInput}
                            placeholder="질문을 입력하세요..."
                            placeholderTextColor="#94A3B8"
                            value={input}
                            onChangeText={setInputState}
                            onSubmitEditing={() => handleSend()}
                            multiline={true}
                            numberOfLines={3}
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
                    style={[styles.actionBtn, { borderColor: '#E2E8F0' }]}
                    onPress={() => onAction('DEEP_DIVE', node)}
                >
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                        <Search size={16} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.actionBtnTitle, { color: '#27272a' }]}>Deep Dive</Text>
                        <Text style={styles.actionBtnDesc}>AI를 통해 이 항목을 더 정밀하게 분석합니다</Text>
                    </View>
                    <ChevronRight size={14} color="#94A3B8" />
                </TouchableOpacity>

                {/* Add to Memo */}
                {onAppendToMemo && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#E2E8F0' }]}
                        onPress={() => {
                            const memoText = `[${displayNode.label}]\n${displayNode.description || ''}`;
                            onAppendToMemo(memoText);
                        }}
                    >
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(124, 58, 237, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={16} color="#7C3AED" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.actionBtnTitle, { color: '#27272a' }]}>메모장에 추가</Text>
                            <Text style={styles.actionBtnDesc}>이 내용을 브레인스톰 메모로 복사합니다</Text>
                        </View>
                        <ChevronRight size={14} color="#94A3B8" />
                    </TouchableOpacity>
                )}


                {/* Ask AI — Now toggles the chat section */}
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: chatExpanded ? '#7C3AED' : '#E2E8F0' }, chatExpanded && { backgroundColor: 'rgba(124, 58, 237, 0.05)' }]}
                    onPress={() => setChatExpanded(!chatExpanded)}
                >
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(99, 102, 241, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={16} color="#6366F1" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.actionBtnTitle, { color: '#27272a' }]}>Ask AI</Text>
                        <Text style={styles.actionBtnDesc}>
                            {chatExpanded ? '채팅 닫기' : '이 항목에 대해 자유롭게 질문합니다'}
                        </Text>
                    </View>
                    {chatExpanded ? (
                        <ChevronDown size={14} color="#7C3AED" />
                    ) : (
                        <ChevronRight size={14} color="#94A3B8" />
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
        width: 380,
        backgroundColor: '#FFFFFF',
        borderLeftWidth: 1, borderColor: '#E2E8F0',
        zIndex: 90,
        shadowColor: '#000', shadowOffset: { width: -10, height: 0 }, shadowOpacity: 0.05, shadowRadius: 20,
    },
    header: {
        height: 60,
        paddingHorizontal: 20,
        borderBottomWidth: 1, borderColor: '#F1F5F9',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    headerTitle: { color: '#27272a', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    typeDot: { width: 10, height: 10, borderRadius: 5 },

    typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 16 },
    typeBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

    titleText: { color: '#27272a', fontSize: 22, fontWeight: '900', lineHeight: 30, marginBottom: 16, letterSpacing: -0.5 },
    bodyText: { color: '#64748B', fontSize: 14, lineHeight: 24, fontWeight: '500' },

    referencesSection: { marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderColor: '#F1F5F9' },
    sectionLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    referenceItem: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    referenceText: { color: '#64748B', fontSize: 12, lineHeight: 18, fontWeight: '500' },

    // Chat Section
    chatSection: { flex: 1 },
    chatHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    chatContext: { color: '#7C3AED', fontSize: 12, fontWeight: '800' },
    chatHistory: { flex: 1, padding: 16, backgroundColor: '#FDF8F3' },
    msgBubble: { padding: 14, borderRadius: 16, marginBottom: 10, maxWidth: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    msgMe: { backgroundColor: '#7C3AED', alignSelf: 'flex-end', borderTopRightRadius: 4 },
    msgAi: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#E2E8F0', borderTopLeftRadius: 4 },
    msgText: { color: '#27272a', fontSize: 14, lineHeight: 20, fontWeight: '500' },

    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        padding: 12, borderTopWidth: 1, borderColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    chatInput: { flex: 1, color: '#27272a', minHeight: 44, maxHeight: 100, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: '500', backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    sendFab: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', marginLeft: 12, shadowColor: '#7C3AED', shadowOpacity: 0.3, shadowRadius: 10 },

    attachPill: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 16, marginRight: 10,
        borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.2)',
    },
    attachText: { color: '#7C3AED', fontSize: 11, fontWeight: '800', marginLeft: 4 },

    suggestionContainer: { marginTop: 16, paddingHorizontal: 4 },
    suggestionTitle: { color: '#94A3B8', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    suggestionChip: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 16,
        borderRadius: 14, marginBottom: 8,
        borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5
    },
    suggestionLabel: { color: '#27272a', fontSize: 13, fontWeight: '700' },

    // Action Bar
    actionBar: { padding: 20, borderTopWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#FFFFFF', gap: 10 },
    actionTitle: { color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' },

    actionBtn: {
        flexDirection: 'row', alignItems: 'center',
        padding: 12,
        borderRadius: 16, borderWidth: 1.5,
        backgroundColor: '#FFFFFF',
    },
    actionBtnTitle: { fontSize: 14, fontWeight: '800' },
    actionBtnDesc: { color: '#94A3B8', fontSize: 11, marginTop: 2, fontWeight: '500' },

    // Inline Branch Button in Chat
    inlineBranchBtn: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        borderWidth: 1, borderColor: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.05)',
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, marginTop: 6,
    },
    inlineBranchBtnText: { color: '#7C3AED', fontSize: 11, fontWeight: '800', marginLeft: 6 },
});
