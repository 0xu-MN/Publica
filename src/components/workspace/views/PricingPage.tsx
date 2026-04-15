import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Platform, useColorScheme } from 'react-native';
import { Check, X, Sparkles, Zap, Crown, Shield, ArrowRight, Clock, CreditCard, Gift } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PricingPageProps {
    onSelectPlan?: (plan: 'free' | 'pro') => void;
    currentPlan?: 'free' | 'pro' | 'trial';
    onRequireAuth?: () => void;
}

import { useAuth } from '../../../contexts/AuthContext';
import { TossPaymentModal } from './TossPaymentModal';
import Footer from '../../Footer';

export const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan, currentPlan = 'free', onRequireAuth }) => {
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);

    
    const theme = {
        bg: '#FFFFFF',
        card: '#FFFFFF',
        text: '#27272a',
        subtext: '#64748B',
        border: '#E2E8F0',
        cardProText: '#27272a',
        amount: '#27272a',
        faqQ: '#27272a',
        toggleBg: '#FFFFFF',
        toggleBorder: '#E2E8F0',
        toggleText: '#64748B',
    };

    const monthlyPrice = 39000;
    const yearlyPrice = 390000;
    const yearlyMonthly = Math.round(yearlyPrice / 12);
    const savingsPercent = Math.round((1 - yearlyMonthly / monthlyPrice) * 100);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const hasTestMode = window.location.href.includes('mode=toss_test') || window.location.href.includes('mode=test');
            if (hasTestMode) {
                // Short delay to ensure rendering before modal pops up
                setTimeout(() => setPaymentModalVisible(true), 500);
            }
        }
    }, []);

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
        <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.badge}>
                    <Crown size={12} color="#7C3AED" />
                    <Text style={styles.badgeText}>PUBLICA PREMIUM</Text>
                </View>
                <Text style={[styles.title, { color: theme.text }]}>당신의 사업을 위한{'\n'}가장 스마트한 투자</Text>
                <Text style={styles.subtitle}>
                    AI 기반 정부지원사업 전략 분석 · 사업계획서 자동 작성 · 맞춤 공고 매칭
                </Text>
            </View>

            {/* Billing Toggle */}
            <View style={styles.toggleContainer}>
                <View style={[styles.toggle, { backgroundColor: theme.toggleBg, borderColor: theme.toggleBorder }]}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleBtnActive]}
                        onPress={() => setBillingCycle('monthly')}
                    >
                        <Text style={[styles.toggleText, { color: billingCycle === 'monthly' ? '#FFF' : theme.toggleText }]}>
                            월간 결제
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, billingCycle === 'yearly' && styles.toggleBtnActive]}
                        onPress={() => setBillingCycle('yearly')}
                    >
                        <Text style={[styles.toggleText, { color: billingCycle === 'yearly' ? '#FFF' : theme.toggleText }]}>
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
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.planIcon}>
                            <Zap size={20} color="#94A3B8" />
                        </View>
                        <Text style={[styles.planName, { color: theme.text }]}>Free</Text>
                        <Text style={styles.planTagline}>기본 기능 시작하기</Text>
                    </View>

                    <View style={styles.priceSection}>
                        <Text style={[styles.priceAmount, { color: theme.amount }]}>₩0</Text>
                        <Text style={styles.pricePeriod}>영구 무료</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.planBtn, styles.planBtnFree]}
                        onPress={() => onSelectPlan?.('free')}
                        disabled={currentPlan === 'free'}
                    >
                        <Text style={styles.planBtnFreeText}>
                            {currentPlan === 'free' ? '사용 중인 플랜' : '무료로 시작'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.featureList}>
                        {features.map((f, i) => (
                            <View key={i} style={styles.featureRow}>
                                {f.free ? (
                                    <Check size={14} color="#10B981" strokeWidth={3} />
                                ) : (
                                    <X size={14} color="#CBD5E1" strokeWidth={3} />
                                )}
                                <Text style={[styles.featureText, !f.free && styles.featureDisabled]}>
                                    {typeof f.free === 'string' ? `${f.name} (${f.free})` : f.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Pro Plan */}
                <View style={[styles.card, styles.cardPro, { backgroundColor: theme.card }]}>
                    {/* Popular Badge */}
                    <View style={styles.popularBadge}>
                        <Sparkles size={10} color="#FFF" />
                        <Text style={styles.popularText}>BEST CHOICE</Text>
                    </View>

                    <View style={styles.cardHeader}>
                        <View style={[styles.planIcon, styles.planIconPro]}>
                            <Crown size={20} color="#7C3AED" />
                        </View>
                        <Text style={[styles.planName, styles.planNamePro, { color: theme.cardProText }]}>Premium Pro</Text>
                        <Text style={styles.planTagline}>전문가 수준의 결과물</Text>
                    </View>

                    <View style={styles.priceSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={[styles.priceAmount, styles.priceAmountPro, { color: '#7C3AED' }]}>
                                ₩{formatPrice(price)}
                            </Text>
                            <Text style={[styles.pricePeriod, { color: '#94A3B8' }]}>/월</Text>
                        </View>
                        {billingCycle === 'yearly' && (
                            <Text style={styles.yearlyTotal}>연 ₩{formatPrice(totalPrice)} (월 ₩{formatPrice(yearlyMonthly)})</Text>
                        )}
                        {billingCycle === 'monthly' && (
                            <Text style={styles.yearlyTotal}>연간 결제 시 {savingsPercent}% 할인 혜택</Text>
                        )}
                    </View>

                    {/* Trial CTA */}
                    <TouchableOpacity
                        style={[styles.planBtn, styles.planBtnPro]}
                        onPress={() => {
                            if (!user) {
                                if (onRequireAuth) onRequireAuth();
                                return;
                            }
                            setPaymentModalVisible(true);
                        }}
                    >
                        <Gift size={16} color="#FFF" />
                        <Text style={styles.planBtnProText}>7일 무료 체험 후 시작</Text>
                        <ArrowRight size={16} color="#FFF" strokeWidth={3} />
                    </TouchableOpacity>
                    <View style={styles.trialNoteContainer}>
                        <Clock size={12} color="#94A3B8" />
                        <Text style={styles.trialNote}>7일 무료 체험 · 언제든 해지 가능</Text>
                    </View>

                    <View style={[styles.featureList, { borderTopColor: '#F1F5F9' }]}>
                        {features.map((f, i) => (
                            <View key={i} style={styles.featureRow}>
                                <Check size={14} color="#7C3AED" strokeWidth={3} />
                                <Text style={[styles.featureText, { color: '#475569', fontWeight: '600' }]}>
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
                        <Shield size={16} color="#7C3AED" />
                        <Text style={styles.trustText}>보안 결제 (SSL)</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <CreditCard size={16} color="#7C3AED" />
                        <Text style={styles.trustText}>토스페이먼츠 연동</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <Clock size={16} color="#7C3AED" />
                        <Text style={styles.trustText}>자유로운 구독 해지</Text>
                    </View>
                </View>
            </View>

            {/* FAQ Section */}
            <View style={styles.faqSection}>
                <Text style={[styles.faqTitle, { color: theme.text }]}>자주 묻는 질문</Text>
                <View style={styles.faqList}>
                    {[
                        { q: 'Q. 무료 체험 후 자동 결제되나요?', a: '네, 7일 무료 체험 종료 후 선택하신 결제 주기(월간/연간)에 따라 자동 결제됩니다. 체험 기간 중 언제든 취소할 수 있으며, 취소 시 요금이 청구되지 않습니다.' },
                        { q: 'Q. 환불 정책은 어떻게 되나요?', a: '결제 후 환불은 불가합니다. 단, 구독을 취소하시면 이미 결제된 주기의 남은 기간 동안은 Premium Pro 기능을 그대로 이용하실 수 있으며, 다음 결제일부터는 요금이 청구되지 않습니다.' },
                        { q: 'Q. 플랜을 변경할 수 있나요?', a: '언제든 설정에서 플랜 업그레이드 또는 다운그레이드가 가능합니다. 업그레이드 시 즉시 적용되며, 다운그레이드 시 다음 결제일부터 공제됩니다.' }
                    ].map((item, idx) => (
                        <View key={idx} style={[styles.faqCard, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}>
                            <Text style={styles.faqQ}>{item.q}</Text>
                            <Text style={styles.faqA}>{item.a}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Terms */}
            <View style={styles.termsSection}>
                <Text style={styles.termsText}>
                    결제 시 <Text style={styles.termsLink}>이용약관</Text> 및 <Text style={styles.termsLink}>개인정보처리방침</Text>에 동의하게 됩니다.{'\n'}
                    모든 서비스는 AI 기술을 기반으로 하며, 결과물의 최종 확인 책임은 사용자에게 있습니다.
                </Text>
            </View>

            <Footer />
            <View style={{ height: 60 }} />

            <TossPaymentModal
                visible={isPaymentModalVisible}
                onClose={() => setPaymentModalVisible(false)}
                planType={billingCycle}
                price={price}
                userEmail={user?.email || 'test@example.com'}
                userName={user?.user_metadata?.nickname || user?.user_metadata?.full_name || '사용자'}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: '#7C3AED10',
        borderWidth: 1,
        borderColor: '#7C3AED20',
        marginBottom: 24,
    },
    badgeText: {
        color: '#7C3AED',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 52,
        marginBottom: 20,
        letterSpacing: -1.5,
    },
    subtitle: {
        color: '#64748B',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 26,
        maxWidth: 500,
        fontWeight: '500',
    },
    toggleContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    toggle: {
        flexDirection: 'row',
        borderRadius: 100,
        padding: 6,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 100,
    },
    toggleBtnActive: {
        backgroundColor: '#7C3AED',
        shadowColor: '#7C3AED',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 6 },
    },
    toggleText: {
        fontSize: 15,
        fontWeight: '800',
    },
    savingsBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
    },
    savingsText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    cardsRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 24,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    card: {
        flex: 1,
        minWidth: 340,
        maxWidth: 440,
        borderRadius: 48,
        padding: 48,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 30,
        elevation: 8,
    },
    cardPro: {
        borderColor: '#7C3AED',
        borderWidth: 2,
        shadowColor: '#7C3AED',
        shadowOpacity: 0.1,
        shadowRadius: 50,
        shadowOffset: { width: 0, height: 24 },
        elevation: 20,
    },
    popularBadge: {
        position: 'absolute',
        top: -14,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#7C3AED',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        shadowColor: '#7C3AED',
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    popularText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    planIcon: {
        width: 64,
        height: 64,
        borderRadius: 24,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    planIconPro: {
        backgroundColor: '#7C3AED10',
        borderColor: '#7C3AED30',
    },
    planName: {
        fontSize: 28,
        fontWeight: '900',
    },
    planNamePro: {
        color: '#27272a',
    },
    planTagline: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 6,
    },
    priceSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    priceAmount: {
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: -1,
    },
    priceAmountPro: {
        color: '#7C3AED',
    },
    pricePeriod: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 4,
    },
    yearlyTotal: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 8,
    },
    planBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 20,
        borderRadius: 24,
        marginBottom: 16,
    },
    planBtnFree: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    planBtnPro: {
        backgroundColor: '#7C3AED',
        shadowColor: '#7C3AED',
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
    },
    planBtnFreeText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '800',
    },
    planBtnProText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
    },
    trialNoteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 32,
    },
    trialNote: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
    },
    featureList: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 32,
        gap: 16,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 14,
        flex: 1,
        fontWeight: '500',
    },
    featureDisabled: {
        color: '#CBD5E1',
    },
    trustSection: {
        paddingHorizontal: 24,
        paddingTop: 64,
        paddingBottom: 32,
    },
    trustRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 48,
        flexWrap: 'wrap',
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    trustText: {
        color: '#7C3AED',
        fontSize: 13,
        fontWeight: '800',
    },
    faqSection: {
        maxWidth: 900,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    faqTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 32,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    faqList: {
        gap: 16,
    },
    faqCard: {
        borderRadius: 32,
        padding: 32,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 15,
        elevation: 2,
    },
    faqQ: {
        color: '#27272a',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 12,
    },
    faqA: {
        color: '#64748B',
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
    termsSection: {
        paddingHorizontal: 24,
        paddingTop: 64,
        paddingBottom: 32,
    },
    termsText: {
        color: '#94A3B8',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
    termsLink: {
        color: '#7C3AED',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
