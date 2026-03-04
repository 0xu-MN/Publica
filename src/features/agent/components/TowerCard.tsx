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
            case 'documentation': return '#8B5CF6';
            case 'action': return '#F59E0B';
            case 'research':
            default: return '#3B82F6';
        }
    };
    const accentColor = getAccentColor();
    const selectedColor = '#10B981';

    // 🏷️ Source badge colors
    const getSourceBadge = () => {
        switch (data.source) {
            case 'deep_dive':
                return { label: '🔍 Deep Dive', color: '#3B82F6', bg: '#3B82F622' };
            case 'branching':
                return { label: '🌿 Branch', color: '#10B981', bg: '#10B98122' };
            case 'user':
                return { label: '✏️ User', color: '#8B5CF6', bg: '#8B5CF622' };
            case 'ask_ai':
                return { label: '💬 Ask AI', color: '#A78BFA', bg: '#A78BFA22' };
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
                    <ChevronDown size={12} color="#10B981" />
                ) : (
                    <ChevronRight size={12} color="#475569" />
                )}
            </View>

            <View style={[styles.anchorDot, styles.anchorRight, selected && styles.anchorActive, loading && styles.anchorLoading]} />
        </View>
    );
};

const styles = StyleSheet.create({
    nodeWrapper: { position: 'relative', alignItems: 'center', height: LAYOUT.CARD_HEIGHT, marginBottom: 20 },

    // Full card
    card: { width: 220, height: LAYOUT.CARD_HEIGHT, backgroundColor: '#050505', borderRadius: 4, padding: 16, borderWidth: 1, borderColor: '#222', justifyContent: 'flex-start' },
    cardSelected: { borderColor: '#10B981', backgroundColor: '#080808', borderWidth: 1.5, shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 15 },

    // Collapsed card
    collapsedCard: {
        width: 220, height: COLLAPSED_HEIGHT - 4,
        backgroundColor: '#0A0A0A', borderRadius: 4,
        paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: '#1A1A1A',
        borderLeftWidth: 3,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        opacity: 0.7,
    },
    collapsedTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600', flex: 1 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    stepLabel: { fontSize: 9, fontWeight: 'bold', color: '#3B82F6', letterSpacing: 1 },
    statusIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },

    cardTitle: { color: '#E2E8F0', fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 8 },
    divider: { height: 1, backgroundColor: '#1E293B', marginBottom: 10 },

    cardBody: { flex: 1 },
    listItem: { flexDirection: 'row', alignItems: 'flex-start' },
    bullet: { width: 3, height: 3, backgroundColor: '#3B82F6', borderRadius: 1.5, marginTop: 7, marginRight: 8 },
    listText: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },

    typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
    typeBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

    // Source badge (Deep Dive / Branching / User)
    sourceBadgeRow: { marginBottom: 6 },
    sourceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
    sourceBadgeText: { fontSize: 9, fontWeight: '700' },

    anchorDot: { position: 'absolute', top: '50%', marginTop: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#000', borderWidth: 1.5, borderColor: '#475569', zIndex: 10 },
    anchorLeft: { left: -4 },
    anchorRight: { right: -4 },
    anchorActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    anchorLoading: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },

    expandIndicator: { position: 'absolute', right: 8, top: '50%', marginTop: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
    expandIndicatorActive: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
});
