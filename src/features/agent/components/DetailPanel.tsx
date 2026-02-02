import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Dimensions } from 'react-native';
import { X, Zap, Calendar, FileText, MessageCircle } from 'lucide-react-native';

// 🌟 [중요] onAction props가 있어야 버튼이 작동함
export const DetailPanel = ({ node, onClose, onAction }: any) => {
    const slideAnim = useRef(new Animated.Value(450)).current;

    useEffect(() => {
        if (node) Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
    }, [node]);

    if (!node) return null;

    return (
        <Animated.View style={styles.detailPanel}>
            {/* Header */}
            <View style={styles.detailHeader}>
                <Text style={styles.headerTitle}>INSPECTOR</Text>
                <TouchableOpacity onPress={onClose}><X size={20} color="#64748B" /></TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
                <Text style={styles.titleText}>{node.label}</Text>
                <Text style={styles.bodyText}>{node.description || "No description."}</Text>
            </ScrollView>

            {/* 🌟 [FIXED] Smart Action Buttons */}
            <View style={styles.actionBar}>
                <Text style={styles.actionTitle}>WHAT'S NEXT?</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* 👇 PLAN 버튼 */}
                    <TouchableOpacity
                        style={[styles.smartBtn, { backgroundColor: '#7C3AED' }]}
                        onPress={() => {
                            console.log("Plan Clicked!"); // 클릭 확인용 로그
                            if (onAction) onAction('PLAN', node);
                            else console.error("onAction prop is missing!");
                        }}
                    >
                        <Calendar size={14} color="white" />
                        <Text style={styles.smartBtnText}>Make Plan</Text>
                    </TouchableOpacity>

                    {/* 👇 REPORT 버튼 */}
                    <TouchableOpacity
                        style={[styles.smartBtn, { backgroundColor: '#2563EB' }]}
                        onPress={() => onAction && onAction('REPORT', node)}
                    >
                        <FileText size={14} color="white" />
                        <Text style={styles.smartBtnText}>Report</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    detailPanel: { position: 'absolute', right: 0, top: 60, bottom: 0, width: 400, backgroundColor: '#020617', borderLeftWidth: 1, borderColor: '#1E293B', zIndex: 90 },
    detailHeader: { height: 60, paddingHorizontal: 24, borderBottomWidth: 1, borderColor: '#1E293B', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#64748B', fontWeight: 'bold' },
    titleText: { color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 20 },
    bodyText: { color: '#CBD5E1', fontSize: 15, lineHeight: 24 },
    actionBar: { padding: 20, borderTopWidth: 1, borderColor: '#1E293B', backgroundColor: '#020617' },
    actionTitle: { color: '#64748B', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
    smartBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 6 },
    smartBtnText: { color: 'white', fontSize: 12, fontWeight: '700' }
});
