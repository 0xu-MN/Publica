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
                    className={`w-full max-w-[400px] bg-[#0F172A] rounded-2xl border border-slate-700 p-8 items-center ${Platform.OS === 'web' ? 'shadow-2xl shadow-black' : ''}`}
                    style={[
                        Platform.OS !== 'web' ? { elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 } : {}
                    ]}
                >
                    <Pressable className="absolute top-4 right-4 p-2 z-[50] opacity-70 hover:opacity-100" onPress={onClose}>
                        <X size={18} color="#94A3B8" />
                    </Pressable>

                    <View className="mb-8 items-center">
                        <Text className="text-2xl font-bold text-white mb-2 tracking-tight">환영합니다</Text>
                        <Text className="text-sm text-slate-400 text-center leading-[20px]">
                            InsightFlow에 로그인하고{'\n'}나만의 인사이트를 발견하세요.
                        </Text>
                    </View>

                    <View className="w-full gap-3 mb-6">
                        {/* Google Button - Shadcn Outline/Secondary Style */}
                        <Pressable
                            style={({ pressed }) => [
                                pressed && { opacity: 0.9, backgroundColor: '#1e293b' }
                            ]}
                            className="w-full h-11 rounded-md flex-row items-center justify-center relative bg-white border border-slate-200"
                            onPress={handleGoogleLogin}
                        >
                            <View className="absolute left-4 w-5 h-5 items-center justify-center">
                                {/* Simple Google G Icon replacement for text */}
                                <Text className="font-bold text-lg text-slate-900">G</Text>
                            </View>
                            <Text className="text-slate-900 text-sm font-medium">Google로 계속하기</Text>
                        </Pressable>

                        {/* Kakao Button - Custom Brand Brand */}
                        <Pressable
                            style={({ pressed }) => [
                                pressed && { opacity: 0.9 }
                            ]}
                            className="w-full h-11 rounded-md flex-row items-center justify-center relative bg-[#FEE500] border border-[#FEE500]"
                            onPress={handleKakaoLogin}
                        >
                            <View className="absolute left-4 w-5 h-5 items-center justify-center">
                                <Text className="font-bold text-lg text-[#3C1E1E]">K</Text>
                            </View>
                            <Text className="text-[#3C1E1E] text-sm font-medium">카카오로 계속하기</Text>
                        </Pressable>
                    </View>

                    <Text className="text-[11px] text-slate-600 text-center px-4">
                        계속 진행하면 InsightFlow의 <Text className="underline">이용약관</Text> 및 <Text className="underline">개인정보처리방침</Text>에 동의하는 것으로 간주됩니다.
                    </Text>
                </Animated.View>
            </View>
        </Modal>
    );
};
