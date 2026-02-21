import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Linking } from 'react-native';
import { MessageSquare, FileText, Sparkles, ArrowRight } from 'lucide-react-native';

interface WelcomeScreenProps {
    onStartChat: () => void;
    onUploadFile: () => void;
    onViewRecommendations?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartChat, onUploadFile, onViewRecommendations }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Simple Entrance Animation
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View className="flex-1 items-center justify-center bg-[#020617] px-8">
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{
                        translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                        })
                    }],
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: 480
                }}
            >
                {/* 1. App Icon / Logo */}
                <View className="mb-8 p-6 bg-blue-500/10 rounded-full border border-blue-400/20 shadow-lg shadow-blue-500/20">
                    <Sparkles size={48} color="#60A5FA" />
                </View>

                {/* 2. Headline */}
                <Text className="text-white text-4xl font-bold mb-4 text-center tracking-tight">
                    안녕하세요, Publica입니다.
                </Text>

                {/* 3. Subheadline */}
                <Text className="text-slate-400 text-lg mb-12 text-center leading-relaxed px-4">
                    정부 지원사업 공고부터 복잡한 문서 분석까지,{'\n'}
                    당신의 전략 파트너가 되어드릴게요.
                </Text>

                {/* 4. Action Cards via Buttons */}
                <View className="w-full gap-4 mb-10">
                    {/* Primary: Start Chat */}
                    <TouchableOpacity
                        onPress={onStartChat}
                        activeOpacity={0.8}
                        className="w-full bg-blue-600 py-5 px-6 rounded-2xl flex-row items-center justify-between shadow-lg shadow-blue-900/40 border border-blue-500/50"
                    >
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="p-2.5 bg-white/20 rounded-xl">
                                <MessageSquare size={24} color="white" fill="white" fillOpacity={0.2} />
                            </View>
                            <View>
                                <Text className="text-white text-lg font-bold">바로 대화 시작하기</Text>
                                <Text className="text-blue-100/80 text-sm mt-0.5">궁금한 점을 자유롭게 물어보세요</Text>
                            </View>
                        </View>
                        <ArrowRight size={20} color="white" className="opacity-70" />
                    </TouchableOpacity>

                    {/* Secondary: Upload File */}
                    <TouchableOpacity
                        onPress={onUploadFile}
                        activeOpacity={0.8}
                        className="w-full bg-[#1E293B] hover:bg-slate-800 py-5 px-6 rounded-2xl flex-row items-center justify-between border border-white/10 shadow-sm"
                    >
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="p-2.5 bg-slate-700/50 rounded-xl border border-white/5">
                                <FileText size={24} color="#94A3B8" />
                            </View>
                            <View>
                                <Text className="text-slate-200 text-lg font-semibold">문서 업로드 및 분석</Text>
                                <Text className="text-slate-500 text-sm mt-0.5">PDF, HWP 파일을 심층 분석합니다</Text>
                            </View>
                        </View>
                        <ArrowRight size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* 5. Tertiary Link */}
                {onViewRecommendations && (
                    <TouchableOpacity
                        onPress={onViewRecommendations}
                        className="py-2 px-4 rounded-full border border-white/5 bg-white/5 hover:bg-white/10"
                    >
                        <Text className="text-slate-400 text-sm font-medium">
                            맞춤형 지원사업 공고 추천 보기 →
                        </Text>
                    </TouchableOpacity>
                )}

            </Animated.View>
        </View>
    );
};
