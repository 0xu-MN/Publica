import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';

export const BillingSuccessHandler = () => {
    const { session } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('결제 정보를 안전하게 처리하고 있습니다...');

    useEffect(() => {
        const processBilling = async () => {
            if (!session?.access_token) return;

            try {
                // URL에서 파라미터 추출 (?customerKey=...&authKey=...&plan=...)
                const urlParams = new URLSearchParams(window.location.search);
                const authKey = urlParams.get('authKey');
                const customerKey = urlParams.get('customerKey');
                const plan = urlParams.get('plan') || 'pro'; // default to pro
                const price = urlParams.get('price');

                if (!authKey || !customerKey) {
                    throw new Error('인증 정보가 올바르지 않습니다.');
                }

                // Supabase Edge Function 호출하여 빌링키 발급 및 저장 요청
                const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/toss-billing-handler`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        authKey,
                        customerKey,
                        plan,
                        price: parseInt(price || '0', 10)
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || '결제 처리 중 오류가 발생했습니다.');
                }

                setStatus('success');
                setMessage('결제 등록이 완료되었습니다. 워크스페이스로 이동합니다!');
                
                // 3초 후 메인 화면으로 리다이렉트 (쿼리 파라미터 제거)
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);

            } catch (err: any) {
                console.error('Billing Success Handler Error:', err);
                setStatus('error');
                setMessage(err.message || '알 수 없는 오류가 발생했습니다.');
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 4000);
            }
        };

        processBilling();
    }, [session]);

    return (
        <View style={{ flex: 1, backgroundColor: '#FDF8F3', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <View style={{ backgroundColor: '#FFF', padding: 40, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 }}>
                {status === 'loading' && <ActivityIndicator size="large" color="#7C3AED" style={{ marginBottom: 20 }} />}
                {status === 'success' && <CheckCircle2 size={48} color="#10B981" style={{ marginBottom: 20 }} />}
                {status === 'error' && <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 20 }} />}
                
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#18181B', marginBottom: 12 }}>
                    {status === 'loading' ? '구독 처리 중...' : status === 'success' ? '결제 등록 성공!' : '결제 실패'}
                </Text>
                <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center' }}>{message}</Text>
            </View>
        </View>
    );
};
