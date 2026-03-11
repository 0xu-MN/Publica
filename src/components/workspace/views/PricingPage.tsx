import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Check, X, Sparkles, Zap, Crown, Shield, ArrowRight, Clock, CreditCard, Gift } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PricingPageProps {
    onSelectPlan?: (plan: 'free' | 'pro') => void;
    currentPlan?: 'free' | 'pro' | 'trial';
}

import { useAuth } from '../../../contexts/AuthContext';
import { TossPaymentModal } from './TossPaymentModal';

export const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan, currentPlan = 'free' }) => {
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);

    const monthlyPrice = 29900;
    const yearlyPrice = 299000;
    const yearlyMonthly = Math.round(yearlyPrice / 12);
    const savingsPercent = Math.round((1 - yearlyMonthly / monthlyPrice) * 100);

    const price = billingCycle === 'monthly' ? monthlyPrice : yearlyMonthly;
    const totalPrice = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;

    const formatPrice = (p: number) => p.toLocaleString('ko-KR');

    const features = [
        { name: '정부지원 공고 탐색', free: true, pro: true, desc: 'K-Startup 공고 실시간 조회' },
        { name: 'AI 전략 분석 (Flow)', free: '3회/월', pro: '무제한', desc: 'AI 기반 사업 전략 분석' },
        { name: '사업계획서 작성 (Edit)', free: false, pro: true, desc: 'PSST 프레임워크 기반 자동 작성' },
        { name: '브레인스톰 메모', free: '1개', pro: '무제한', desc: '아이디어 정리 및 전략 메모' },
        { name: 'PDF 내보내기', free: false, pro: true, desc: '완성된 문서 PDF/DOC 다운로드' },
        { name: '공고 양식 자동 추출', free: false, pro: true, desc: '공고별 맞춤 양식 AI 파싱' },
        { name: '섹션별 AI 작성', free: false, pro: true, desc: '양식 섹션 단위 AI 초안 생성' },
        { name: '프로젝트 저장', free: '1개', pro: '무제한', desc: '워크스페이스 세션 저장/복원' },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.badge}>
                    <Crown size={12} color="#F59E0B" />
                    <Text style={styles.badgeText}>PUBLICA PRO</Text>
                </View>
                <Text style={styles.title}>당신의 사업을 위한{'\n'}가장 스마트한 투자</Text>
                <Text style={styles.subtitle}>
                    AI 기반 정부지원사업 전략 분석 · 사업계획서 자동 작성 · 맞춤 공고 매칭
                </Text>
            </View>

            {/* Billing Toggle */}
            <View style={styles.toggleContainer}>
                <View style={styles.toggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleBtnActive]}
                        onPress={() => setBillingCycle('monthly')}
                    >
                        <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>
                            월간 결제
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, billingCycle === 'yearly' && styles.toggleBtnActive]}
                        onPress={() => setBillingCycle('yearly')}
                    >
                        <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>
                            연간 결제
                        </Text>
                        {savingsPercent > 0 && (
                            <View style={styles.savingsBadge}>
                                <Text style={styles.savingsText}>{savingsPercent}% 할인</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Plan Cards */}
            <View style={styles.cardsRow}>
                {/* Free Plan */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.planIcon}>
                            <Zap size={20} color="#64748B" />
                        </View>
                        <Text style={styles.planName}>Free</Text>
                        <Text style={styles.planTagline}>시작하기</Text>
                    </View>

                    <View style={styles.priceSection}>
                        <Text style={styles.priceAmount}>₩0</Text>
                        <Text style={styles.pricePeriod}>영구 무료</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.planBtn, styles.planBtnFree]}
                        onPress={() => onSelectPlan?.('free')}
                        disabled={currentPlan === 'free'}
                    >
                        <Text style={styles.planBtnFreeText}>
                            {currentPlan === 'free' ? '현재 플랜' : '무료로 시작'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.featureList}>
                        {features.map((f, i) => (
                            <View key={i} style={styles.featureRow}>
                                {f.free ? (
                                    <Check size={14} color="#10B981" />
                                ) : (
                                    <X size={14} color="#334155" />
                                )}
                                <Text style={[styles.featureText, !f.free && styles.featureDisabled]}>
                                    {typeof f.free === 'string' ? `${f.name} (${f.free})` : f.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Pro Plan */}
                <View style={[styles.card, styles.cardPro]}>
                    {/* Popular Badge */}
                    <View style={styles.popularBadge}>
                        <Sparkles size={10} color="#FFF" />
                        <Text style={styles.popularText}>가장 인기</Text>
                    </View>

                    <View style={styles.cardHeader}>
                        <View style={[styles.planIcon, styles.planIconPro]}>
                            <Crown size={20} color="#F59E0B" />
                        </View>
                        <Text style={[styles.planName, styles.planNamePro]}>Pro</Text>
                        <Text style={styles.planTagline}>전문가용</Text>
                    </View>

                    <View style={styles.priceSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                            <Text style={[styles.priceAmount, styles.priceAmountPro]}>
                                ₩{formatPrice(price)}
                            </Text>
                            <Text style={styles.pricePeriod}>/월</Text>
                        </View>
                        {billingCycle === 'yearly' && (
                            <Text style={styles.yearlyTotal}>연 ₩{formatPrice(totalPrice)} (월 ₩{formatPrice(yearlyMonthly)})</Text>
                        )}
                        {billingCycle === 'monthly' && (
                            <Text style={styles.yearlyTotal}>연간 결제 시 {savingsPercent}% 할인</Text>
                        )}
                    </View>

                    {/* Trial CTA */}
                    <TouchableOpacity
                        style={[styles.planBtn, styles.planBtnPro]}
                        onPress={() => setPaymentModalVisible(true)}
                    >
                        <Gift size={14} color="#FFF" />
                        <Text style={styles.planBtnProText}>7일 무료 체험 시작 (결제 진행)</Text>
                        <ArrowRight size={14} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.trialNote}>
                        <Clock size={10} color="#94A3B8" /> 7일 무료 체험 · 언제든 취소 가능
                    </Text>

                    <View style={styles.featureList}>
                        {features.map((f, i) => (
                            <View key={i} style={styles.featureRow}>
                                <Check size={14} color="#818CF8" />
                                <Text style={[styles.featureText, styles.featureTextPro]}>
                                    {typeof f.pro === 'string' ? `${f.name} (${f.pro})` : f.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustSection}>
                <View style={styles.trustRow}>
                    <View style={styles.trustItem}>
                        <Shield size={16} color="#10B981" />
                        <Text style={styles.trustText}>SSL 보안 결제</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <CreditCard size={16} color="#10B981" />
                        <Text style={styles.trustText}>토스페이먼츠</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <Clock size={16} color="#10B981" />
                        <Text style={styles.trustText}>언제든 해지</Text>
                    </View>
                </View>
            </View>

            {/* FAQ Section */}
            <View style={styles.faqSection}>
                <Text style={styles.faqTitle}>자주 묻는 질문</Text>
                <View style={styles.faqCard}>
                    <Text style={styles.faqQ}>Q. 무료 체험 후 자동 결제되나요?</Text>
                    <Text style={styles.faqA}>
                        네, 7일 무료 체험 종료 후 선택하신 결제 주기(월간/연간)에 따라 자동 결제됩니다. 체험 기간 중 언제든 취소할 수 있으며, 취소 시 요금이 청구되지 않습니다.
                    </Text>
                </View>
                <View style={styles.faqCard}>
                    <Text style={styles.faqQ}>Q. 환불 정책은 어떻게 되나요?</Text>
                    <Text style={styles.faqA}>
                        결제 후 환불은 불가합니다. 단, 구독을 취소하시면 이미 결제된 주기의 남은 기간 동안은 Pro 플랜을 그대로 이용하실 수 있으며, 다음 결제일부터는 요금이 청구되지 않고 Free 플랜으로 자동 전환됩니다.
                    </Text>
                </View>
                <View style={styles.faqCard}>
                    <Text style={styles.faqQ}>Q. 플랜을 변경할 수 있나요?</Text>
                    <Text style={styles.faqA}>
                        언제든 설정에서 플랜 업그레이드 또는 다운그레이드가 가능합니다. 업그레이드 시 차액이 즉시 청구되며, 다운그레이드 시 다음 결제일부터 적용됩니다.
                    </Text>
                </View>
            </View>

            {/* Terms */}
            <View style={styles.termsSection}>
                <Text style={styles.termsText}>
                    결제를 진행하면 Publica의{' '}
                    <Text style={styles.termsLink}>이용약관</Text> 및{' '}
                    <Text style={styles.termsLink}>개인정보처리방침</Text>에 동의하는 것으로 간주됩니다.
                </Text>
                <Text style={styles.termsText}>
                    구독은 자동 갱신되며, 결제 주기 종료 최소 24시간 전에 취소하지 않으면 자동으로 갱신됩니다.
                </Text>
            </View>

            {/* Spacer */}
            <View style={{ height: 60 }} />

            {/* Toss Payments Modal */}
            <TossPaymentModal
                visible={isPaymentModalVisible}
                onClose={() => setPaymentModalVisible(false)}
                planType={billingCycle}
                price={price}
                userEmail={user?.email || 'test@example.com'}
                userName={user?.user_metadata?.nickname || user?.user_metadata?.full_name || '테스트 유저'}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    content: {
        paddingBottom: 40,
    },

    // Header
    header: {
        alignItems: 'center',
        paddingTop: 48,
        paddingBottom: 32,
        paddingHorizontal: 24,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(245,158,11,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.2)',
        marginBottom: 20,
    },
    badgeText: {
        color: '#F59E0B',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    title: {
        color: '#F8FAFC',
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 42,
        marginBottom: 12,
    },
    subtitle: {
        color: '#64748B',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 400,
    },

    // Toggle
    toggleContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    toggle: {
        flexDirection: 'row',
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    toggleBtnActive: {
        backgroundColor: '#1E293B',
    },
    toggleText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#E2E8F0',
    },
    savingsBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    savingsText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
    },

    // Cards
    cardsRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 16,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    card: {
        flex: 1,
        minWidth: 280,
        maxWidth: 400,
        backgroundColor: '#0F172A',
        borderRadius: 20,
        padding: 28,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    cardPro: {
        backgroundColor: '#0F172A',
        borderColor: '#4F46E5',
        borderWidth: 2,
        shadowColor: '#4F46E5',
        shadowOpacity: 0.15,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 10 },
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#4F46E5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    popularText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },

    // Card Header
    cardHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    planIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    planIconPro: {
        backgroundColor: 'rgba(245,158,11,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.2)',
    },
    planName: {
        color: '#E2E8F0',
        fontSize: 22,
        fontWeight: '800',
    },
    planNamePro: {
        color: '#F8FAFC',
    },
    planTagline: {
        color: '#64748B',
        fontSize: 12,
        marginTop: 2,
    },

    // Price
    priceSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    priceAmount: {
        color: '#E2E8F0',
        fontSize: 36,
        fontWeight: '800',
    },
    priceAmountPro: {
        color: '#FFF',
    },
    pricePeriod: {
        color: '#64748B',
        fontSize: 14,
        marginLeft: 4,
        marginBottom: 4,
    },
    yearlyTotal: {
        color: '#475569',
        fontSize: 11,
        marginTop: 4,
    },

    // Plan Buttons
    planBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 8,
    },
    planBtnFree: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    planBtnPro: {
        backgroundColor: '#4F46E5',
        shadowColor: '#4F46E5',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    planBtnFreeText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
    },
    planBtnProText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    trialNote: {
        color: '#64748B',
        fontSize: 11,
        textAlign: 'center',
        marginBottom: 20,
    },

    // Features
    featureList: {
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
        paddingTop: 16,
        gap: 12,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        color: '#94A3B8',
        fontSize: 13,
        flex: 1,
    },
    featureTextPro: {
        color: '#CBD5E1',
    },
    featureDisabled: {
        color: '#334155',
    },

    // Trust
    trustSection: {
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    trustRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        flexWrap: 'wrap',
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trustText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },

    // FAQ
    faqSection: {
        paddingHorizontal: 24,
        paddingTop: 48,
    },
    faqTitle: {
        color: '#E2E8F0',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 16,
        textAlign: 'center',
    },
    faqCard: {
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 18,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    faqQ: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6,
    },
    faqA: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 18,
    },

    // Terms
    termsSection: {
        paddingHorizontal: 24,
        paddingTop: 32,
        gap: 8,
    },
    termsText: {
        color: '#334155',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },
    termsLink: {
        color: '#6366F1',
        textDecorationLine: 'underline',
    },
});
