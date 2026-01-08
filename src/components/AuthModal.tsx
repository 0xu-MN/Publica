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
                    className={`max-w-[400px] rounded-[40px] p-8 items-center border border-white/10 ${Platform.OS === 'web' ? 'shadow-2xl shadow-black/50' : ''}`}
                    style={[
                        { backgroundColor: '#0F172A', width: 400 },
                        Platform.OS !== 'web' ? { elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 } : {}
                    ]}
                >
                    <Pressable className="absolute top-5 right-5 p-2" onPress={onClose}>
                        <X size={20} color="#94A3B8" />
                    </Pressable>

                    <Text className="text-2xl font-extrabold text-white mb-3 text-center">InsightFlow 시작하기</Text>
                    <Text className="text-[15px] text-slate-400 text-center leading-[22px] mb-8">
                        로그인하고 관심 뉴스를 저장하거나{'\n'}나만의 인사이트를 관리하세요.
                    </Text>

                    <View className="w-full gap-3 mb-6">
                        {/* Google Button */}
                        <Pressable
                            style={({ pressed }) => [
                                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                            ]}
                            className="w-full h-[52px] rounded-[14px] flex-row items-center justify-center relative bg-white"
                            onPress={handleGoogleLogin}
                        >
                            <View className="absolute left-5 w-6 h-6 items-center justify-center">
                                <Text style={{ fontSize: 18 }}>G</Text>
                            </View>
                            <Text className="text-slate-800 text-base font-semibold">Google로 계속하기</Text>
                        </Pressable>

                        {/* Kakao Button */}
                        <Pressable
                            style={({ pressed }) => [
                                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                            ]}
                            className="w-full h-[52px] rounded-[14px] flex-row items-center justify-center relative bg-[#FEE500]"
                            onPress={handleKakaoLogin}
                        >
                            <View className="absolute left-5 w-6 h-6 items-center justify-center bg-transparent">
                                <Text style={{ fontSize: 18, color: '#3C1E1E' }}>K</Text>
                            </View>
                            <Text className="text-[#3C1E1E] text-base font-semibold">카카오로 계속하기</Text>
                        </Pressable>
                    </View>

                    <Text className="text-xs text-slate-500 text-center leading-[18px]">
                        로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                    </Text>
                </Animated.View>
            </View>
        </Modal>
    );
};
