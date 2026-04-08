import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Modal } from 'react-native';
import { X, ShieldCheck, CreditCard, Lock } from 'lucide-react-native';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

interface TossPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    planType: 'monthly' | 'yearly';
    price: number;
    userEmail: string;
    userName: string;
}

// API 개별 연동 클라이언트 키 (payment.requestBillingAuth 방식)
const clientKey = process.env.EXPO_PUBLIC_TOSS_CLIENT_KEY || 'live_ck_KNbdOvk5rko4YbeDpL92rn07xlzm';

export const TossPaymentModal: React.FC<TossPaymentModalProps> = ({ visible, onClose, planType, price, userEmail, userName }) => {
    const [loading, setLoading] = useState(false);

    // 빌링키 관리를 위해 이메일 기반의 고정된 customerKey 생성
    const customerKey = `customer_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const handlePaymentRequest = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const tossPayments = await loadTossPayments(clientKey);
            // 빌링(정기결제): widgets가 아닌 payment 객체로 requestBillingAuth 호출
            const payment = tossPayments.payment({ customerKey });

            await payment.requestBillingAuth({
                method: 'CARD',
                successUrl: window.location.origin + `/payment/billing-success?plan=${planType}&price=${price}`,
                failUrl: window.location.origin + '/payment/fail',
                customerEmail: userEmail,
                customerName: userName,
            });
            // 정상 흐름에서는 이 줄에 도달하지 않음 (토스 페이지로 리다이렉트됨)
        } catch (error) {
            console.error('Billing authorization request failed:', error);
            alert('결제 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            setLoading(false);
        }
    };

    if (Platform.OS !== 'web') {
        return (
            <Modal visible={visible} animationType="slide" transparent={true}>
                <View style={styles.mobileOverlay}>
                    <View style={styles.mobileBox}>
                        <ShieldCheck size={48} color="#7C3AED" strokeWidth={1.5} style={{ marginBottom: 16 }} />
                        <Text style={{ color: '#27272a', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>준비 중인 기능입니다</Text>
                        <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20 }}>모바일 앱 환경의 결제 기능은 현재 개발 중입니다. 웹 브라우저를 통해 프리미엄 플랜을 이용하실 수 있습니다.</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={{ color: '#FFF', fontWeight: '800' }}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.modalBox}>
                <View style={styles.header}>
                    <View style={styles.headerTitle}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#7C3AED15', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={18} color="#7C3AED" strokeWidth={2.5} />
                        </View>
                        <View>
                            <Text style={styles.title}>안전 결제</Text>
                            <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Toss Payments</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                        <X size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.planCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <CreditCard size={20} color="#7C3AED" />
                            <Text style={styles.planTitle}>
                                {planType === 'monthly' ? '월간 구독' : '연간 구독'} 카드 등록
                            </Text>
                        </View>
                        <Text style={styles.planDesc}>
                            카드를 등록하면 매 {planType === 'monthly' ? '월' : '년'}마다 자동으로 결제됩니다.
                            언제든지 구독을 해지할 수 있습니다.
                        </Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabelInCard}>자동 결제 금액</Text>
                            <Text style={styles.priceAmountInCard}>
                                {price.toLocaleString('ko-KR')}원 / {planType === 'monthly' ? '월' : '년'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.secureNotice}>
                        <Lock size={13} color="#94A3B8" />
                        <Text style={styles.secureText}>토스페이먼츠 보안 결제로 카드 정보가 안전하게 처리됩니다.</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View>
                        <Text style={styles.priceLabel}>최종 결제 금액</Text>
                        <Text style={styles.priceAmount}>{price.toLocaleString('ko-KR')}원</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.payBtn, loading && styles.payBtnDisabled]}
                        onPress={handlePaymentRequest}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.payBtnText}>카드 등록하기</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(253, 248, 243, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 24,
    },
    modalBox: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 28,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        color: '#27272a',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    closeIcon: {
        padding: 8,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
    },
    content: {
        padding: 28,
        gap: 16,
    },
    planCard: {
        backgroundColor: '#F8F5FF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    planTitle: {
        color: '#27272a',
        fontSize: 16,
        fontWeight: '800',
    },
    planDesc: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#DDD6FE',
    },
    priceLabelInCard: {
        color: '#7C3AED',
        fontSize: 12,
        fontWeight: '700',
    },
    priceAmountInCard: {
        color: '#7C3AED',
        fontSize: 15,
        fontWeight: '900',
    },
    secureNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    secureText: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '500',
        flex: 1,
    },
    footer: {
        padding: 28,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FDF8F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceLabel: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    priceAmount: {
        color: '#27272a',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -1,
    },
    payBtn: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
        minWidth: 140,
        alignItems: 'center',
    },
    payBtnDisabled: {
        backgroundColor: '#C4B5FD',
    },
    payBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    mobileOverlay: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    mobileBox: {
        backgroundColor: '#FFFFFF',
        padding: 32,
        borderRadius: 32,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        alignItems: 'center',
        maxWidth: 400,
    },
    closeBtn: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
        marginTop: 24,
        alignItems: 'center',
        width: '100%',
    }
});
