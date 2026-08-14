import React from 'react';
import { Modal, Text, View, Pressable, Platform, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

interface AuthModalProps {
    visible: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
    const { signInWithGoogle, signInWithKakao } = useAuth();

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
            onClose();
        } catch (e) {
            // Handle error (maybe show toast)
            alert('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleKakaoLogin = async () => {
        try {
            await signInWithKakao();
            onClose();
        } catch (e) {
            alert('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View
                className="flex-1 justify-center items-center p-6"
                style={{ backgroundColor: 'rgba(15, 15, 20, 0.75)' }}
            >
                <Pressable className="absolute inset-0" onPress={onClose} />

                <Animated.View
                    entering={SlideInDown.springify()}
                    className="w-full max-w-[400px] rounded-3xl items-center"
                    style={[
                        {
                            // 🌟 Tailwind의 bg-[#FFFFFF] 같은 임의값 클래스가 웹에서 간헐적으로
                            // 적용 안 돼서 카드가 반투명하게 배경에 묻히던 버그 — 인라인 style로 확실히 고정.
                            // + 글래스 스타일: 반투명 화이트 + blur + 은은한 테두리로 배경 위에 붕 뜬 느낌.
                            backgroundColor: 'rgba(255,255,255,0.92)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.6)',
                            padding: 40,
                            ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } as any : {}),
                        },
                        Platform.OS === 'web'
                            ? { boxShadow: '0 24px 60px rgba(0,0,0,0.35)' } as any
                            : { elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 30 },
                    ]}
                >
                    <Pressable className="absolute top-6 right-6 p-2 z-[50] opacity-50 hover:opacity-100" onPress={onClose}>
                        <X size={20} color="#64748B" />
                    </Pressable>

                    <View className="mb-10 items-center">
                        <Image
                            source={require('../../assets/p_logo_test_5.png')}
                            style={{ width: 140, height: 40 }}
                            resizeMode="contain"
                        />
                        <View className="h-4" />
                        <Text className="text-[26px] font-black text-[#0f172a] mb-3 tracking-tighter">반갑습니다</Text>
                        <Text className="text-[15px] text-[#334155] text-center leading-[24px] font-semibold">
                            Publica에 로그인하고{'\n'}나만의 인사이트를 발견하세요.
                        </Text>
                    </View>

                    <View className="w-full gap-4 mb-8">
                        {/* Google Button */}
                        <Pressable
                            style={({ pressed }) => [
                                pressed && { opacity: 0.9, backgroundColor: '#F8FAFC' }
                            ]}
                            className="w-full h-12 rounded-xl flex-row items-center justify-center relative bg-white border border-[#E2E8F0] shadow-sm shadow-black/5"
                            onPress={handleGoogleLogin}
                        >
                            <View className="absolute left-4 w-6 h-6 items-center justify-center">
                                <Text className="font-bold text-lg text-[#27272a]">G</Text>
                            </View>
                            <Text className="text-[#27272a] text-[15px] font-semibold">Google로 계속하기</Text>
                        </Pressable>

                        {/* Kakao Button */}
                        <Pressable
                            style={({ pressed }) => [
                                { backgroundColor: '#FEE500' },
                                pressed && { opacity: 0.95 }
                            ]}
                            className="w-full h-12 rounded-xl flex-row items-center justify-center relative"
                            onPress={handleKakaoLogin}
                        >
                            <View className="absolute left-4 w-6 h-6 items-center justify-center">
                                <Text className="font-bold text-lg text-[#3C1E1E]">K</Text>
                            </View>
                            <Text className="text-[#3C1E1E] text-[15px] font-semibold">카카오로 계속하기</Text>
                        </Pressable>
                    </View>

                    <Text className="text-[12px] text-[#94A3B8] text-center px-4 leading-[18px]">
                        로그인 시 PUBLICA의 <Text className="underline font-medium text-[#7C3AED]">서비스 이용약관</Text> 및 <Text className="underline font-medium text-[#7C3AED]">개인정보 처리방침</Text>에 동의하게 됩니다.
                    </Text>
                </Animated.View>
            </View>
        </Modal>
    );
};
