import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Crown, Check, ArrowRight, Lock } from 'lucide-react-native';

interface ProUpgradePromptProps {
    /** 잠긴 기능 이름 (예: "Publica Nexus Edit") */
    featureName: string;
    /** 이 기능으로 할 수 있는 것들 */
    benefits?: string[];
    /** 요금제 페이지로 이동 */
    onUpgrade: () => void;
}

const DEFAULT_BENEFITS = [
    '사업계획서 AI 자동 초안 작성',
    '공고 양식 자동 추출 및 섹션별 작성',
    'HWPX · DOCX 정부 양식 즉시 다운로드',
    '무제한 AI 전략 분석 · 프로젝트 저장',
];

export const ProUpgradePrompt: React.FC<ProUpgradePromptProps> = ({
    featureName,
    benefits = DEFAULT_BENEFITS,
    onUpgrade,
}) => {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <View style={styles.lockBadge}>
                    <Lock size={20} color="#7C3AED" />
                </View>

                <View style={styles.proBadge}>
                    <Crown size={12} color="#7C3AED" />
                    <Text style={styles.proBadgeText}>PREMIUM PRO 전용 기능</Text>
                </View>

                <Text style={styles.title}>{featureName}</Text>
                <Text style={styles.subtitle}>
                    이 기능은 Premium Pro 구독자만 사용할 수 있습니다.{'\n'}
                    지금 업그레이드하고 모든 기능을 잠금 해제하세요.
                </Text>

                <View style={styles.benefitList}>
                    {benefits.map((b, i) => (
                        <View key={i} style={styles.benefitRow}>
                            <View style={styles.checkCircle}>
                                <Check size={12} color="#FFFFFF" strokeWidth={3} />
                            </View>
                            <Text style={styles.benefitText}>{b}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
                    <Crown size={16} color="#FFFFFF" />
                    <Text style={styles.upgradeBtnText}>7일 무료 체험 후 업그레이드</Text>
                    <ArrowRight size={16} color="#FFFFFF" strokeWidth={3} />
                </TouchableOpacity>

                <Text style={styles.note}>7일 무료 체험 · 언제든 해지 가능</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 80 },
    card: {
        width: '100%',
        maxWidth: 520,
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
        padding: 48,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#7C3AED',
        shadowOpacity: 0.08,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 20 },
        elevation: 8,
    },
    lockBadge: {
        width: 64, height: 64, borderRadius: 24,
        backgroundColor: '#F5F3FF',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1, borderColor: '#DDD6FE',
    },
    proBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
        backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE',
        marginBottom: 20,
    },
    proBadgeText: { color: '#7C3AED', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    title: { fontSize: 28, fontWeight: '900', color: '#0F172A', textAlign: 'center', letterSpacing: -0.5, marginBottom: 12 },
    subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 32, fontWeight: '500' },
    benefitList: { width: '100%', gap: 14, marginBottom: 32 },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
    benefitText: { flex: 1, fontSize: 14, color: '#334155', fontWeight: '600', lineHeight: 22 },
    upgradeBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#7C3AED', paddingVertical: 18, paddingHorizontal: 28,
        borderRadius: 18, width: '100%',
        shadowColor: '#7C3AED', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    },
    upgradeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
    note: { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginTop: 16 },
});
