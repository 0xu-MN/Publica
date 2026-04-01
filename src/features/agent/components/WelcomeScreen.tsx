import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Linking } from 'react-native';
import { MessageSquare, FileText, Sparkles, ArrowRight, Folder } from 'lucide-react-native';

interface WelcomeScreenProps {
    onStartChat: () => void;
    onUploadFile: () => void;
    onResumeWorks?: () => void;
    onViewRecommendations?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartChat, onUploadFile, onResumeWorks, onViewRecommendations }) => {
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
        <View className="flex-1 items-center justify-center bg-[#FDF8F3] px-8">
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{
                        translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [30, 0]
                        })
                    }],
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: 520
                }}
            >
                {/* 1. App Icon / Logo */}
                <View className="mb-10 p-8 bg-purple-500/10 rounded-[32px] border border-purple-200 shadow-2xl shadow-purple-500/10">
                    <Sparkles size={56} color="#7C3AED" />
                </View>

                {/* 2. Headline */}
                <Text style={{ color: '#27272a', fontSize: 42, fontWeight: '900', marginBottom: 16, textAlign: 'center', letterSpacing: -1 }}>
                    안녕하세요, Publica입니다.
                </Text>

                {/* 3. Subheadline */}
                <Text className="text-slate-500 text-lg mb-14 text-center leading-relaxed px-6 font-medium">
                    정부 지원사업 공고 분석부터 사업계획서 자동 생성까지,{'\n'}
                    당신의 비즈니스 성공을 위한 가장 스마트한 도구입니다.
                </Text>

                {/* 4. Action Cards */}
                <View className="w-full gap-5 mb-12">
                    {/* Primary: Start Chat */}
                    <TouchableOpacity
                        onPress={onStartChat}
                        activeOpacity={0.9}
                        className="w-full bg-purple-600 py-6 px-8 rounded-3xl flex-row items-center justify-between shadow-2xl shadow-purple-500/30"
                    >
                        <View className="flex-row items-center gap-5 flex-1">
                            <View className="p-3 bg-white/20 rounded-2xl">
                                <MessageSquare size={28} color="white" fill="white" fillOpacity={0.2} />
                            </View>
                            <View>
                                <Text className="text-white text-xl font-extrabold tracking-tight">AI 리서치 시작하기</Text>
                                <Text className="text-purple-100/90 text-sm mt-0.5 font-medium">자유로운 브레인스톰과 시장 조사를 시작합니다</Text>
                            </View>
                        </View>
                        <View className="bg-white/10 p-2 rounded-full">
                            <ArrowRight size={22} color="white" />
                        </View>
                    </TouchableOpacity>

                    {/* Secondary: Upload File */}
                    <TouchableOpacity
                        onPress={onUploadFile}
                        activeOpacity={0.8}
                        className="w-full bg-white py-6 px-8 rounded-3xl flex-row items-center justify-between border border-slate-200 shadow-sm"
                    >
                        <View className="flex-row items-center gap-5 flex-1">
                            <View className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <FileText size={28} color="#7C3AED" />
                            </View>
                            <View>
                                <Text className="text-[#27272a] text-xl font-bold tracking-tight">공고문 분석 및 로드</Text>
                                <Text className="text-slate-500 text-sm mt-0.5 font-medium">PDF, HWP 파일을 정밀 분석하여 전략을 도출합니다</Text>
                            </View>
                        </View>
                        <View className="bg-slate-50 p-2 rounded-full border border-slate-100">
                            <ArrowRight size={22} color="#94A3B8" />
                        </View>
                    </TouchableOpacity>

                    {/* Tertiary: Resume Previous Work */}
                    {onResumeWorks && (
                        <TouchableOpacity
                            onPress={onResumeWorks}
                            activeOpacity={0.8}
                            className="w-full bg-white py-6 px-8 rounded-3xl flex-row items-center justify-between border border-slate-200 shadow-sm"
                        >
                            <View className="flex-row items-center gap-5 flex-1">
                                <View className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Folder size={28} color="#64748B" />
                                </View>
                                <View>
                                    <Text className="text-[#27272a] text-xl font-bold tracking-tight">진행 중인 프로젝트</Text>
                                    <Text className="text-slate-500 text-sm mt-0.5 font-medium">최근에 이어서 작업하던 워크스페이스를 엽니다</Text>
                                </View>
                            </View>
                            <View className="bg-slate-50 p-2 rounded-full border border-slate-100">
                                <ArrowRight size={22} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 5. Tertiary Link */}
                {onViewRecommendations && (
                    <TouchableOpacity
                        onPress={onViewRecommendations}
                        className="py-3 px-6 rounded-full border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all"
                    >
                        <Text className="text-slate-600 text-sm font-bold">
                            실시간 맞춤형 지원사업 공고 확인하기 →
                        </Text>
                    </TouchableOpacity>
                )}

            </Animated.View>
        </View>
    );
};
