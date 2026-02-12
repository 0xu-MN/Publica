import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Dimensions } from 'react-native';
import { X, Zap, Search, GitBranch, MessageCircle, ChevronRight, Target, Layers } from 'lucide-react-native';

interface DetailPanelProps {
    node: any;
    onClose: () => void;
    onAction: (type: string, node: any) => void;
}

export const DetailPanel = ({ node, onClose, onAction }: DetailPanelProps) => {
    const slideAnim = useRef(new Animated.Value(450)).current;

    useEffect(() => {
        if (node) {
            slideAnim.setValue(450);
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
        }
    }, [node]);

    if (!node) return null;

    // Type-based accent color (matches TowerCard)
    const getAccentColor = () => {
        switch (node.type || node.action_type) {
            case 'documentation': return '#8B5CF6';
            case 'action': return '#F59E0B';
            case 'research':
            default: return '#3B82F6';
        }
    };
    const accentColor = getAccentColor();
    const typeName = (node.type || node.action_type || 'research').toUpperCase();

    return (
        <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.typeDot, { backgroundColor: accentColor }]} />
                    <Text style={styles.headerTitle}>INSPECTOR</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
                {/* Type Badge */}
                <View style={[styles.typeBadge, { backgroundColor: accentColor + '22' }]}>
                    <Text style={[styles.typeBadgeText, { color: accentColor }]}>{typeName}</Text>
                </View>

                {/* Title */}
                <Text style={styles.titleText}>{node.label}</Text>

                {/* Description */}
                <Text style={styles.bodyText}>{node.description || "No description available."}</Text>

                {/* References (if any) */}
                {node.references && node.references.length > 0 && (
                    <View style={styles.referencesSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Layers size={12} color="#64748B" />
                            <Text style={styles.sectionLabel}>{node.references.length} SOURCES</Text>
                        </View>
                        {node.references.map((ref: string, i: number) => (
                            <View key={i} style={styles.referenceItem}>
                                <Text style={styles.referenceText} numberOfLines={2}>{ref}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Smart Action Buttons */}
            <View style={styles.actionBar}>
                <Text style={styles.actionTitle}>심층 분석</Text>

                {/* Deep Dive — re-analyze this node's content in depth */}
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

                {/* Branching — spawn AI-generated sub-branches from this node */}
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#10B981' }]}
                    onPress={() => onAction('BRANCH', node)}
                >
                    <GitBranch size={14} color="#10B981" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.actionBtnTitle, { color: '#10B981' }]}>Branching</Text>
                        <Text style={styles.actionBtnDesc}>하위 실행 단계를 생성합니다</Text>
                    </View>
                    <ChevronRight size={14} color="#10B981" />
                </TouchableOpacity>

                {/* Ask AI — contextual question about this node */}
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#8B5CF6' }]}
                    onPress={() => onAction('ASK', node)}
                >
                    <MessageCircle size={14} color="#8B5CF6" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.actionBtnTitle, { color: '#8B5CF6' }]}>Ask AI</Text>
                        <Text style={styles.actionBtnDesc}>이 항목에 대해 질문합니다</Text>
                    </View>
                    <ChevronRight size={14} color="#8B5CF6" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    panel: {
        position: 'absolute', right: 0, top: 60, bottom: 0,
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

    actionBar: { padding: 16, borderTopWidth: 1, borderColor: '#1E293B', backgroundColor: '#020617', gap: 8 },
    actionTitle: { color: '#64748B', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' },

    actionBtn: {
        flexDirection: 'row', alignItems: 'center',
        padding: 12,
        borderRadius: 8, borderWidth: 1,
        backgroundColor: '#0F172A',
    },
    actionBtnTitle: { fontSize: 13, fontWeight: '700' },
    actionBtnDesc: { color: '#64748B', fontSize: 10, marginTop: 2 },
});
