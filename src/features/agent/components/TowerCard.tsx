import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Layers } from 'lucide-react-native';
import { BranchLine } from './BranchLine';
import { LAYOUT } from '../AgentLayout';

interface TowerCardProps {
    data: any;
    selected: boolean;
    onSelect: () => void;
    idx: number;
    myIndex: number;
    parentIndex: number;
}

export const TowerCard = ({ data, selected, onSelect, idx, myIndex, parentIndex }: TowerCardProps) => (
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

        <TouchableOpacity
            style={[styles.card, selected && styles.cardSelected]}
            onPress={onSelect}
            activeOpacity={0.95}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.stepLabel}>STEP {idx + 1}</Text>
                {selected && <View style={styles.statusIndicator} />}
            </View>

            <Text style={[styles.cardTitle, selected && { color: '#10B981' }]} numberOfLines={2}>
                {data.label}
            </Text>

            <View style={styles.divider} />

            <View style={styles.cardBody}>
                <View style={styles.listItem}>
                    <View style={[styles.bullet, selected && { backgroundColor: '#10B981' }]} />
                    <Text style={styles.listText} numberOfLines={4}>
                        {data.description || "Analysis provided..."}
                    </Text>
                </View>
            </View>

            {data.references && (
                <View style={styles.cardFooter}>
                    <Layers size={10} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.metaText}>{data.references.length} Sources</Text>
                </View>
            )}
        </TouchableOpacity>

        {/* Right Anchor Dot */}
        <View style={[styles.anchorDot, styles.anchorRight, selected && styles.anchorActive]} />
    </View>
);

const styles = StyleSheet.create({
    nodeWrapper: { position: 'relative', alignItems: 'center', height: LAYOUT.CARD_HEIGHT },

    card: { width: 220, height: LAYOUT.CARD_HEIGHT, backgroundColor: '#050505', borderRadius: 4, padding: 16, borderWidth: 1, borderColor: '#222', justifyContent: 'flex-start' },
    cardSelected: { borderColor: '#10B981', backgroundColor: '#080808', borderWidth: 1.5, shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 15 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    stepLabel: { fontSize: 9, fontWeight: 'bold', color: '#475569', letterSpacing: 1 },
    statusIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },

    cardTitle: { color: '#E2E8F0', fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 8 },
    divider: { height: 1, backgroundColor: '#1E293B', marginBottom: 10 },

    cardBody: { flex: 1 },
    listItem: { flexDirection: 'row', alignItems: 'flex-start' },
    bullet: { width: 3, height: 3, backgroundColor: '#475569', borderRadius: 1.5, marginTop: 7, marginRight: 8 },
    listText: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },

    cardFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#111', flexDirection: 'row', alignItems: 'center' },
    metaText: { color: '#475569', fontSize: 10, fontWeight: '600' },

    anchorDot: { position: 'absolute', top: '50%', marginTop: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#000', borderWidth: 1.5, borderColor: '#475569', zIndex: 10 },
    anchorLeft: { left: -4 },
    anchorRight: { right: -4 },
    anchorActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
});
