import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet } from 'react-native';
import { X, FileText } from 'lucide-react-native';

export const DetailPanel = ({ node, onClose }: any) => {
    const slideAnim = useRef(new Animated.Value(450)).current;

    useEffect(() => {
        if (node) Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 12 }).start();
    }, [node]);

    if (!node) return null;

    return (
        <Animated.View style={[styles.detailPanel, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.detailHeader}>
                <Text style={styles.detailLabel}>INSIGHT DETAILS</Text>
                <TouchableOpacity onPress={onClose}><X size={20} color="#94A3B8" /></TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, padding: 24 }}>
                <Text style={styles.detailTitle}>{node.label}</Text>
                <Text style={styles.detailText}>{node.description}</Text>

                {node.references && (
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionLabel}>SOURCES</Text>
                        {node.references.map((ref: string, i: number) => (
                            <View key={i} style={styles.refItem}>
                                <FileText size={14} color="#10B981" style={{ marginTop: 2 }} />
                                <Text style={styles.refText}>{ref}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    detailPanel: { position: 'absolute', right: 0, top: 60, bottom: 0, width: 400, backgroundColor: '#020617', borderLeftWidth: 1, borderColor: '#1E293B', zIndex: 90, shadowColor: 'black', shadowOpacity: 0.5, shadowRadius: 50 },
    detailHeader: { padding: 20, borderBottomWidth: 1, borderColor: '#1E293B', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
    detailTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 20 },
    sectionBox: { marginBottom: 30 },
    sectionLabel: { color: '#475569', fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
    detailText: { color: '#CBD5E1', lineHeight: 24, fontSize: 14 },
    refItem: { flexDirection: 'row', marginBottom: 10 },
    refText: { color: '#94A3B8', fontSize: 13, marginLeft: 10, flex: 1, lineHeight: 20 },
});
