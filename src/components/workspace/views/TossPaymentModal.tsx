import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Modal, SafeAreaView } from 'react-native';
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
    
    // Toss Payments is primarily designed for Web environments.
    // In React Native Web, we can utilize nativeID to target the DOM node.

    useEffect(() => {
        if (!visible || Platform.OS !== 'web') return;

        let isMounted = true;

        const initializeToss = async () => {
            try {
                // Customer key must be alphanumeric, -, _ and unique
                const customerKey = `customer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
                
                const tossPayments = await loadTossPayments(clientKey);
                // In v2, we initialize widget with customerKey
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
                // amount object
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
                        <Text style={{color: '#FFF'}}>모바일 앱 환경 (iOS/Android) 결제는 추후 지원됩니다.</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={{color: '#FFF'}}>닫기</Text>
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
                        <ShieldCheck size={20} color="#10B981" />
                        <Text style={styles.title}>안전 결제 (Toss Payments)</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                        <X size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={{ flex: 1, position: 'relative' }}>
                        {loading && (
                            <View style={[styles.loadingBox, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: '#0F172A' }]}>
                                <ActivityIndicator size="large" color="#4F46E5" />
                                <Text style={styles.loadingText}>결제 모듈을 불러오는 중...</Text>
                            </View>
                        )}
                        
                        {/* DOM Nodes for Toss Widgets Native Web mapping */}
                        <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, minHeight: 400 }}>
                            {/* React Native Web maps nativeID to standard HTML ID props */}
                            <View nativeID="payment-method" style={{ minHeight: 400, width: '100%' }} />
                            <View nativeID="agreement" style={{ minHeight: 140, width: '100%' }} />
                        </View>
                    </View>

                </View>

                <View style={styles.footer}>
                    <Text style={styles.priceLabel}>총 결제 금액</Text>
                    <Text style={styles.priceAmount}>{price.toLocaleString('ko-KR')}원</Text>
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
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 24,
    },
    modalBox: {
        width: '100%',
        maxWidth: 540,
        maxHeight: '90%',
        backgroundColor: '#0F172A',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#1E293B',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        color: '#E2E8F0',
        fontSize: 18,
        fontWeight: '700',
    },
    closeIcon: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 24,
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
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
        backgroundColor: '#0B1120',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceLabel: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    priceAmount: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '800',
    },
    payBtn: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    payBtnDisabled: {
        backgroundColor: '#334155',
    },
    payBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    mobileOverlay: {
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        alignItems: 'center', 
        justifyContent: 'center'
    },
    mobileBox: {
        backgroundColor: '#0F172A', 
        padding: 24, borderRadius: 16, 
        borderColor: '#1E293B', borderWidth: 1
    },
    closeBtn: {
        backgroundColor: '#334155', 
        padding: 12, borderRadius: 8, 
        marginTop: 16, alignItems: 'center'
    }
});
