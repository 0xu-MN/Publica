import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { ChevronRight, ChevronDown, Search, GitBranch } from 'lucide-react-native';
import { BranchLine } from './BranchLine';
import { LAYOUT } from '../AgentLayout';

interface TowerCardProps {
    data: any;
    selected: boolean;
    collapsed?: boolean;     // 🌟 NEW: title-only mode
    verticalDiff?: number;   // 🌟 NEW: explicit Y difference to parent
    onSelect: () => void;
    idx: number;
    myIndex: number;
    parentIndex: number;
    loading?: boolean;
}

const COLLAPSED_HEIGHT = 48;

export const TowerCard = ({ data, selected, collapsed = false, verticalDiff, onSelect, idx, myIndex, parentIndex, loading }: TowerCardProps) => {
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    // Type-based accent colors
    const getAccentColor = () => {
        switch (data.type || data.action_type) {
            case 'documentation': return '#7C3AED';
            case 'action': return '#F59E0B';
            case 'research':
            default: return '#7C3AED';
        }
    };
    const accentColor = getAccentColor();
    const selectedColor = '#7C3AED';

    // 🏷️ Source badge colors
    const getSourceBadge = () => {
        switch (data.source) {
            case 'deep_dive':
                return { label: '🔍 Deep Dive', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)' };
            case 'branching':
                return { label: '🌿 Branch', color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' };
            case 'user':
                return { label: '✏️ User', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.08)' };
            case 'ask_ai':
                return { label: '💬 Ask AI', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.08)' };
            default:
                return null; // AI-generated, no badge
        }
    };
    const sourceBadge = getSourceBadge();

    React.useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [loading]);

    const stepNumber = data.step_number || (myIndex + 1);

    // 🌟 COLLAPSED MODE — Title-only compact card
    if (collapsed) {
        return (
            <View style={[styles.nodeWrapper, { height: COLLAPSED_HEIGHT }]}>
                {idx > 0 && (
                    <BranchLine isSelected={false} myIndex={myIndex} parentIndex={parentIndex} verticalDiff={verticalDiff} />
                )}
                {idx > 0 && <View style={[styles.anchorDot, styles.anchorLeft]} />}

                <TouchableOpacity
                    style={[styles.collapsedCard, { borderLeftColor: accentColor }]}
                    onPress={onSelect}
                    activeOpacity={0.85}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Text style={[styles.stepLabel, { color: accentColor }]}>S{stepNumber}</Text>
                        {sourceBadge && (
                            <View style={[styles.sourceBadge, { backgroundColor: sourceBadge.bg }]}>
                                <Text style={[styles.sourceBadgeText, { color: sourceBadge.color }]}>{sourceBadge.label}</Text>
                            </View>
                        )}
                        <Text style={styles.collapsedTitle} numberOfLines={1}>{data.label}</Text>
                    </View>
                    <ChevronRight size={12} color="#475569" />
                </TouchableOpacity>

                <View style={[styles.anchorDot, styles.anchorRight]} />
            </View>
        );
    }

    // 🌟 FULL MODE — Expanded card with content
    return (
        <View style={[styles.nodeWrapper, { height: LAYOUT.CARD_HEIGHT }]}>
            {idx > 0 && (
                <BranchLine isSelected={selected} myIndex={myIndex} parentIndex={parentIndex} verticalDiff={verticalDiff} />
            )}
            {idx > 0 && <View style={[styles.anchorDot, styles.anchorLeft, selected && styles.anchorActive]} />}

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                    style={[
                        styles.card,
                        { borderLeftWidth: 3, borderLeftColor: accentColor },
                        selected && [styles.cardSelected, { borderLeftColor: selectedColor }],
                        loading && { borderColor: accentColor }
                    ]}
                    onPress={onSelect}
                    activeOpacity={0.95}
                >
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.stepLabel, { color: accentColor }]}>STEP {stepNumber}</Text>
                            <View style={[styles.typeBadge, { backgroundColor: accentColor + '22' }]}>
                                <Text style={[styles.typeBadgeText, { color: accentColor }]}>
                                    {(data.type || data.action_type || 'research').toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        {selected && <View style={[styles.statusIndicator, { backgroundColor: selectedColor }, loading && { backgroundColor: accentColor }]} />}
                    </View>

                    {/* Source Badge (Deep Dive / Branching / User) */}
                    {sourceBadge && (
                        <View style={[styles.sourceBadgeRow]}>
                            <View style={[styles.sourceBadge, { backgroundColor: sourceBadge.bg }]}>
                                <Text style={[styles.sourceBadgeText, { color: sourceBadge.color }]}>{sourceBadge.label}</Text>
                            </View>
                        </View>
                    )}

                    <Text style={[styles.cardTitle, selected && { color: selectedColor }, loading && { color: accentColor }]} numberOfLines={2}>
                        {data.label}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.cardBody}>
                        <View style={styles.listItem}>
                            <View style={[styles.bullet, { backgroundColor: accentColor }, selected && { backgroundColor: selectedColor }]} />
                            <Text style={styles.listText} numberOfLines={3}>
                                {data.description || "Analysis provided..."}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Right Expand Indicator */}
            <View style={[styles.expandIndicator, selected && styles.expandIndicatorActive]}>
                {selected ? (
                    <ChevronDown size={12} color="#7C3AED" />
                ) : (
                    <ChevronRight size={12} color="#94A3B8" />
                )}
            </View>

            <View style={[styles.anchorDot, styles.anchorRight, selected && styles.anchorActive, loading && styles.anchorLoading]} />
        </View>
    );
};

const styles = StyleSheet.create({
    nodeWrapper: { position: 'relative', alignItems: 'center', height: LAYOUT.CARD_HEIGHT, marginBottom: 20 },

    // Full card
    card: { width: 240, height: LAYOUT.CARD_HEIGHT, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    cardSelected: { borderColor: '#7C3AED', backgroundColor: '#FFFFFF', borderWidth: 2, shadowColor: '#7C3AED', shadowOpacity: 0.15, shadowRadius: 20 },

    // Collapsed card
    collapsedCard: {
        width: 240, height: COLLAPSED_HEIGHT - 4,
        backgroundColor: '#FFFFFF', borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: '#E2E8F0',
        borderLeftWidth: 4,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        opacity: 0.7,
    },
    collapsedTitle: { color: '#64748B', fontSize: 13, fontWeight: '700', flex: 1 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    stepLabel: { fontSize: 10, fontWeight: '900', color: '#7C3AED', letterSpacing: 1 },
    statusIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C3AED' },

    cardTitle: { color: '#27272a', fontSize: 15, fontWeight: '900', lineHeight: 22, marginBottom: 10, trackingTight: -0.3 } as any,
    divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },

    cardBody: { flex: 1 },
    listItem: { flexDirection: 'row', alignItems: 'flex-start' },
    bullet: { width: 4, height: 4, backgroundColor: '#7C3AED', borderRadius: 2, marginTop: 8, marginRight: 10 },
    listText: { color: '#64748B', fontSize: 13, lineHeight: 20, fontWeight: '500' },

    typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
    typeBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

    // Source badge (Deep Dive / Branching / User)
    sourceBadgeRow: { marginBottom: 6 },
    sourceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
    sourceBadgeText: { fontSize: 9, fontWeight: '700' },

    anchorDot: { position: 'absolute', top: '50%', marginTop: -5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#CBD5E1', zIndex: 10 },
    anchorLeft: { left: -5 },
    anchorRight: { right: -5 },
    anchorActive: { backgroundColor: '#FFFFFF', borderColor: '#7C3AED' },
    anchorLoading: { backgroundColor: '#FFFFFF', borderColor: '#7C3AED' },

    expandIndicator: { position: 'absolute', right: 10, top: '50%', marginTop: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    expandIndicatorActive: { backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.2)' },
});
