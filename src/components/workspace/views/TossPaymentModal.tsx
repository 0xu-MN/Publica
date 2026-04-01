import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Modal } from 'react-native';
import { X, ShieldCheck } from 'lucide-react-native';
import { loadTossPayments, TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';

interface TossPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    planType: 'monthly' | 'yearly';
    price: number;
    userEmail: string;
    userName: string;
}

const clientKey = process.env.EXPO_PUBLIC_TOSS_CLIENT_KEY || 'test_gck_QbgMGZzorzjJAkvZvRo7rl5E1em4';

export const TossPaymentModal: React.FC<TossPaymentModalProps> = ({ visible, onClose, planType, price, userEmail, userName }) => {
    const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentReady, setPaymentReady] = useState(false);
    
    useEffect(() => {
        if (!visible || Platform.OS !== 'web') return;

        let isMounted = true;

        const initializeToss = async () => {
            try {
                const customerKey = `customer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
                const tossPayments = await loadTossPayments(clientKey);
                const initializedWidgets = tossPayments.widgets({ customerKey });
                
                if (isMounted) {
                    setWidgets(initializedWidgets);
                }
            } catch (err) {
                console.error("Failed to load Toss Payments SDK:", err);
                setLoading(false);
            }
        };

        setLoading(true);
        setPaymentReady(false);
        initializeToss();

        return () => {
            isMounted = false;
        };
    }, [visible]);

    useEffect(() => {
        if (!widgets || Platform.OS !== 'web') return;

        const renderWidgets = async () => {
            try {
                await widgets.setAmount({
                    currency: 'KRW',
                    value: price,
                });

                await Promise.all([
                    widgets.renderPaymentMethods({
                        selector: '#payment-method',
                        variantKey: 'DEFAULT',
                    }),
                    widgets.renderAgreement({
                        selector: '#agreement',
                        variantKey: 'AGREEMENT',
                    })
                ]);
                
                setPaymentReady(true);
                setLoading(false);
            } catch (err) {
                console.error("Failed to render Toss widgets:", err);
                setLoading(false);
            }
        };

        renderWidgets();
    }, [widgets, price]);

    const handlePaymentRequest = async () => {
        if (!widgets) return;

        try {
            await widgets.requestPayment({
                orderId: `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                orderName: planType === 'yearly' ? 'Publica Pro (연간)' : 'Publica Pro (월간)',
                successUrl: window.location.origin + '/payment/success',
                failUrl: window.location.origin + '/payment/fail',
                customerEmail: userEmail,
                customerName: userName,
            });
        } catch (error) {
            console.error('Payment request failed:', error);
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
                    <View style={{ flex: 1, position: 'relative' }}>
                        {loading && (
                            <View style={[styles.loadingBox, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: '#FFFFFF' }]}>
                                <ActivityIndicator size="large" color="#7C3AED" />
                                <Text style={styles.loadingText}>보안 결제 모듈을 불러오고 있습니다...</Text>
                            </View>
                        )}
                        
                        <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 8, minHeight: 400 }}>
                            <View nativeID="payment-method" style={{ minHeight: 400, width: '100%' }} />
                            <View nativeID="agreement" style={{ minHeight: 140, width: '100%' }} />
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View>
                        <Text style={styles.priceLabel}>최종 결제 금액</Text>
                        <Text style={styles.priceAmount}>{price.toLocaleString('ko-KR')}원</Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.payBtn, (!paymentReady || loading) && styles.payBtnDisabled]} 
                        onPress={handlePaymentRequest}
                        disabled={!paymentReady || loading}
                    >
                        <Text style={styles.payBtnText}>결제하기</Text>
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
        maxWidth: 580,
        maxHeight: '90%',
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
        flex: 1,
        padding: 20,
        overflow: 'hidden',
    },
    loadingBox: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
    },
    loadingText: {
        color: '#94A3B8',
        marginTop: 16,
        fontSize: 13,
        fontWeight: '700',
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
    },
    payBtnDisabled: {
        backgroundColor: '#E2E8F0',
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
