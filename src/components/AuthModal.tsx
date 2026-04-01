import React from 'react';
import { Modal, Text, View, Pressable, Platform } from 'react-native';
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
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            >
                <Pressable className="absolute inset-0" onPress={onClose} />

                <Animated.View
                    entering={SlideInDown.springify()}
                    className={`w-full max-w-[400px] bg-[#FDF8F3] rounded-3xl border border-[#E2E8F0] p-10 items-center ${Platform.OS === 'web' ? 'shadow-xl shadow-black/5' : ''}`}
                    style={[
                        Platform.OS !== 'web' ? { elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24 } : {}
                    ]}
                >
                    <Pressable className="absolute top-6 right-6 p-2 z-[50] opacity-50 hover:opacity-100" onPress={onClose}>
                        <X size={20} color="#64748B" />
                    </Pressable>

                    <View className="mb-10 items-center">
                        <View className="w-16 h-16 bg-[#7C3AED]/10 rounded-2xl items-center justify-center mb-6">
                            <Text className="text-3xl font-black text-[#7C3AED]">P</Text>
                        </View>
                        <Text className="text-2xl font-bold text-[#27272a] mb-3 tracking-tight">반갑습니다</Text>
                        <Text className="text-sm text-[#64748B] text-center leading-[22px] font-medium">
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
                                pressed && { opacity: 0.95 }
                            ]}
                            className="w-full h-12 rounded-xl flex-row items-center justify-center relative bg-[#FEE500]"
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
