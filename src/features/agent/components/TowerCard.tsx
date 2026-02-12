import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Layers, ChevronRight } from 'lucide-react-native';
import { BranchLine } from './BranchLine';
import { LAYOUT } from '../AgentLayout';

interface TowerCardProps {
    data: any;
    selected: boolean;
    onSelect: () => void;
    idx: number;
    myIndex: number;
    parentIndex: number;
    loading?: boolean;
}

export const TowerCard = ({ data, selected, onSelect, idx, myIndex, parentIndex, loading }: TowerCardProps) => {
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    // Type-based accent colors
    const getAccentColor = () => {
        switch (data.type || data.action_type) {
            case 'documentation': return '#8B5CF6'; // Purple
            case 'action': return '#F59E0B';         // Amber
            case 'research':
            default: return '#3B82F6';                // Blue
        }
    };
    const accentColor = getAccentColor();
    const selectedColor = '#10B981'; // Green for selected state

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

    return (
        <View style={styles.nodeWrapper}>

            {/* Branch Line (루트 제외) */}
            {idx > 0 && (
                <BranchLine
                    isSelected={selected}
                    myIndex={myIndex}
                    parentIndex={parentIndex}
                />
            )}

            {/* Left Anchor Dot */}
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
                        <Text style={[styles.stepLabel, { color: accentColor }]}>STEP {stepNumber}</Text>
                        {selected && <View style={[styles.statusIndicator, { backgroundColor: selectedColor }, loading && { backgroundColor: accentColor }]} />}
                    </View>

                    <Text style={[styles.cardTitle, selected && { color: selectedColor }, loading && { color: accentColor }]} numberOfLines={2}>
                        {data.label}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.cardBody}>
                        <View style={styles.listItem}>
                            <View style={[styles.bullet, { backgroundColor: accentColor }, selected && { backgroundColor: selectedColor }]} />
                            <Text style={styles.listText} numberOfLines={4}>
                                {data.description || "Analysis provided..."}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={[styles.typeBadge, { backgroundColor: accentColor + '22' }]}>
                            <Text style={[styles.typeBadgeText, { color: accentColor }]}>
                                {(data.type || data.action_type || 'research').toUpperCase()}
                            </Text>
                        </View>
                        {data.references && data.references.length > 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Layers size={10} color="#64748B" style={{ marginRight: 4 }} />
                                <Text style={styles.metaText}>{data.references.length} Sources</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Right Expand Indicator */}
            <View style={[styles.expandIndicator, selected && styles.expandIndicatorActive]}>
                <ChevronRight size={12} color={selected ? '#10B981' : '#475569'} />
            </View>

            {/* Right Anchor Dot */}
            <View style={[styles.anchorDot, styles.anchorRight, selected && styles.anchorActive, loading && styles.anchorLoading]} />
        </View>
    );
};

const styles = StyleSheet.create({
    nodeWrapper: { position: 'relative', alignItems: 'center', height: LAYOUT.CARD_HEIGHT },

    card: { width: 220, height: LAYOUT.CARD_HEIGHT, backgroundColor: '#050505', borderRadius: 4, padding: 16, borderWidth: 1, borderColor: '#222', justifyContent: 'flex-start' },
    cardSelected: { borderColor: '#10B981', backgroundColor: '#080808', borderWidth: 1.5, shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 15 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    stepLabel: { fontSize: 9, fontWeight: 'bold', color: '#3B82F6', letterSpacing: 1 },
    statusIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },

    cardTitle: { color: '#E2E8F0', fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 8 },
    divider: { height: 1, backgroundColor: '#1E293B', marginBottom: 10 },

    cardBody: { flex: 1 },
    listItem: { flexDirection: 'row', alignItems: 'flex-start' },
    bullet: { width: 3, height: 3, backgroundColor: '#3B82F6', borderRadius: 1.5, marginTop: 7, marginRight: 8 },
    listText: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },

    cardFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#111', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    metaText: { color: '#475569', fontSize: 10, fontWeight: '600' },
    typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
    typeBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

    anchorDot: { position: 'absolute', top: '50%', marginTop: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#000', borderWidth: 1.5, borderColor: '#475569', zIndex: 10 },
    anchorLeft: { left: -4 },
    anchorRight: { right: -4 },
    anchorActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    anchorLoading: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },

    expandIndicator: { position: 'absolute', right: 8, top: '50%', marginTop: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
    expandIndicatorActive: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
});
