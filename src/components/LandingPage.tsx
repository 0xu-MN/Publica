import React, { useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    useWindowDimensions, Animated, Image, Platform
} from 'react-native';
import { Icons } from '../utils/icons';
import { LinearGradient } from 'expo-linear-gradient';

interface LandingPageProps {
    onLoginPress: () => void;
    onStartFree: () => void;
    onNavigateToPricing: () => void;
}

const FEATURES = [
    {
        icon: 'Sparkles',
        tag: 'AI 전략 수립',
        title: 'NEXUS Flow',
        subtitle: 'AI가 공고를 분석하고\n맞춤형 합격 전략을 설계합니다',
        description: '정부지원사업 공고문을 업로드하면 AI가 지원 자격, 가점 요소, 핵심 평가 항목을 자동 분석합니다. 브레인스토밍 결과를 시각적 전략 트리로 펼쳐 보여주어, 사업 아이디어를 체계적으로 구조화할 수 있습니다.',
        gradient: ['#7C3AED', '#4F46E5'] as [string, string],
        accentColor: '#A78BFA',
    },
    {
        icon: 'FileEdit',
        tag: '자동 작성',
        title: 'NEXUS Edit',
        subtitle: '전략을 사업계획서로\n자동 변환합니다',
        description: 'AI가 수립한 전략을 기반으로 PSST(문제인식-실현가능성-성장전략-팀구성) 프레임워크에 맞는 정식 사업계획서 초안을 자동 생성합니다. 리치 텍스트 에디터에서 즉시 수정 및 보완이 가능합니다.',
        gradient: ['#0EA5E9', '#0284C7'] as [string, string],
        accentColor: '#38BDF8',
    },
    {
        icon: 'Download',
        tag: '양식 매핑',
        title: '공고 양식 자동 완성',
        subtitle: '실제 정부 서식에\n내용을 자동으로 채워넣습니다',
        description: '예비창업패키지, TIPS, 초기창업패키지 등 주요 정부지원사업의 실제 DOCX/HWP 양식 파일에 AI가 작성한 내용을 정확한 셀 좌표에 자동 삽입합니다. 양식 깨짐 없이 제출 가능한 완성 파일을 즉시 다운로드하세요.',
        gradient: ['#10B981', '#059669'] as [string, string],
        accentColor: '#34D399',
    },
];

const STATS = [
    { number: '10분', label: '사업계획서 초안 완성' },
    { number: '5개', label: '주요 공고 양식 지원' },
    { number: '80%', label: '서류 작성 시간 절감' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
    onLoginPress,
    onStartFree,
    onNavigateToPricing,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const fadeAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;
    const slideAnims = useRef(FEATURES.map(() => new Animated.Value(40))).current;
    const heroFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Hero animation
        Animated.parallel([
            Animated.timing(heroFade, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(heroSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();

        // Stagger feature card animations
        const featureAnimations = FEATURES.map((_, i) =>
            Animated.parallel([
                Animated.timing(fadeAnims[i], { toValue: 1, duration: 600, delay: 300 + i * 200, useNativeDriver: true }),
                Animated.timing(slideAnims[i], { toValue: 0, duration: 600, delay: 300 + i * 200, useNativeDriver: true }),
            ])
        );
        Animated.stagger(100, featureAnimations).start();
    }, []);

    const renderIcon = (iconName: string, color: string, size: number = 24) => {
        const IconComponent = (Icons as any)[iconName];
        return IconComponent ? <IconComponent size={size} color={color} /> : null;
    };

    return (
        <ScrollView
            className="flex-1 bg-[#020617]"
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
        >
            {/* ═══════════ HERO SECTION ═══════════ */}
            <Animated.View
                style={{ opacity: heroFade, transform: [{ translateY: heroSlide }] }}
            >
                <View className="w-full items-center pt-16 pb-20 px-6">
                    <View className="max-w-[1200px] w-full items-center">
                        {/* Badge */}
                        <View className="bg-purple-500/15 border border-purple-500/30 px-4 py-1.5 rounded-full mb-8">
                            <Text className="text-purple-300 text-xs font-bold tracking-wider">
                                🚀 AI 기반 사업계획서 자동 완성 플랫폼
                            </Text>
                        </View>

                        {/* Main Headline */}
                        <Text
                            className="text-white font-extrabold text-center leading-tight mb-6"
                            style={{ fontSize: isDesktop ? 52 : 32, lineHeight: isDesktop ? 64 : 42 }}
                        >
                            사업계획서,{'\n'}
                            <Text style={{ color: '#A78BFA' }}>AI</Text>가 대신 써드립니다
                        </Text>

                        {/* Sub-headline */}
                        <Text
                            className="text-slate-400 text-center mb-10 leading-relaxed"
                            style={{ fontSize: isDesktop ? 18 : 15, maxWidth: 600 }}
                        >
                            공고문을 업로드하면 AI가 분석하고, 맞춤형 전략을 수립하고,{'\n'}
                            실제 정부 양식에 맞춰 완성된 문서를 바로 내보냅니다.
                        </Text>

                        {/* CTA Buttons */}
                        <View className={`${isDesktop ? 'flex-row' : 'flex-col'} items-center gap-4 mb-16`}>
                            <TouchableOpacity
                                onPress={onStartFree}
                                className="bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-2xl shadow-lg shadow-purple-600/30 active:scale-95"
                                style={{ minWidth: 200 }}
                            >
                                <Text className="text-white font-bold text-base text-center">
                                    지금 무료로 시작하기
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onNavigateToPricing}
                                className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl hover:bg-white/10 active:scale-95"
                                style={{ minWidth: 200 }}
                            >
                                <Text className="text-slate-300 font-bold text-base text-center">
                                    요금 안내 보기
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Stats Bar */}
                        <View className={`${isDesktop ? 'flex-row' : 'flex-col'} bg-white/[0.03] border border-white/[0.06] rounded-2xl px-8 py-5 gap-8`}>
                            {STATS.map((stat, i) => (
                                <View key={i} className={`flex-row items-center ${i > 0 && isDesktop ? 'border-l border-white/10 pl-8' : ''}`}>
                                    <Text className="text-purple-400 font-extrabold text-2xl mr-3">
                                        {stat.number}
                                    </Text>
                                    <Text className="text-slate-400 text-sm">{stat.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* ═══════════ FEATURES SECTION ═══════════ */}
            <View className="w-full items-center px-6 py-16">
                <View className="max-w-[1200px] w-full">
                    {/* Section Header */}
                    <View className="items-center mb-16">
                        <Text className="text-purple-400 text-sm font-bold tracking-widest mb-3">
                            HOW IT WORKS
                        </Text>
                        <Text
                            className="text-white font-extrabold text-center"
                            style={{ fontSize: isDesktop ? 36 : 26 }}
                        >
                            3단계로 완성하는{'\n'}사업계획서
                        </Text>
                    </View>

                    {/* Feature Cards */}
                    {FEATURES.map((feature, idx) => (
                        <Animated.View
                            key={idx}
                            style={{
                                opacity: fadeAnims[idx],
                                transform: [{ translateY: slideAnims[idx] }],
                                marginBottom: 32,
                            }}
                        >
                            <View
                                className={`rounded-3xl border border-white/[0.06] overflow-hidden ${isDesktop ? 'flex-row' : 'flex-col'}`}
                                style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                            >
                                {/* Left: Visual */}
                                <View
                                    className={`${isDesktop ? 'w-[45%]' : 'w-full'} p-10 items-center justify-center`}
                                    style={{ minHeight: isDesktop ? 300 : 200 }}
                                >
                                    <LinearGradient
                                        colors={feature.gradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 24,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 20,
                                        }}
                                    >
                                        {renderIcon(feature.icon, '#fff', 36)}
                                    </LinearGradient>
                                    <View className="bg-white/10 px-3 py-1 rounded-full mb-4">
                                        <Text className="text-white/70 text-xs font-bold">
                                            STEP {idx + 1}
                                        </Text>
                                    </View>
                                    <Text
                                        className="text-white/60 text-center leading-relaxed"
                                        style={{ fontSize: isDesktop ? 20 : 17 }}
                                    >
                                        {feature.subtitle}
                                    </Text>
                                </View>

                                {/* Right: Content */}
                                <View className={`${isDesktop ? 'w-[55%]' : 'w-full'} p-10 justify-center`}>
                                    <View
                                        className="px-3 py-1 rounded-full self-start mb-4"
                                        style={{ backgroundColor: feature.accentColor + '20' }}
                                    >
                                        <Text style={{ color: feature.accentColor, fontSize: 12, fontWeight: '700' }}>
                                            {feature.tag}
                                        </Text>
                                    </View>
                                    <Text
                                        className="text-white font-extrabold mb-4"
                                        style={{ fontSize: isDesktop ? 30 : 24 }}
                                    >
                                        {feature.title}
                                    </Text>
                                    <Text
                                        className="text-slate-400 leading-relaxed"
                                        style={{ fontSize: isDesktop ? 16 : 14, lineHeight: isDesktop ? 28 : 24 }}
                                    >
                                        {feature.description}
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                    ))}
                </View>
            </View>

            {/* ═══════════ SUPPORTED GRANTS SECTION ═══════════ */}
            <View className="w-full items-center px-6 py-16" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <View className="max-w-[1200px] w-full items-center">
                    <Text className="text-emerald-400 text-sm font-bold tracking-widest mb-3">
                        SUPPORTED TEMPLATES
                    </Text>
                    <Text
                        className="text-white font-extrabold text-center mb-12"
                        style={{ fontSize: isDesktop ? 32 : 24 }}
                    >
                        주요 정부지원사업 양식 지원
                    </Text>

                    <View className={`${isDesktop ? 'flex-row' : 'flex-col'} gap-4 w-full justify-center`}>
                        {[
                            { name: '예비창업패키지', status: '지원 중', color: '#10B981' },
                            { name: 'TIPS', status: '준비 중', color: '#6366F1' },
                            { name: '초기창업패키지', status: '준비 중', color: '#6366F1' },
                            { name: '창업도약패키지', status: '준비 중', color: '#6366F1' },
                            { name: '스마트공장', status: '준비 중', color: '#6366F1' },
                        ].map((grant, i) => (
                            <View
                                key={i}
                                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 items-center"
                                style={{ minWidth: isDesktop ? 0 : '100%' }}
                            >
                                <View
                                    className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                                    style={{ backgroundColor: grant.color + '20' }}
                                >
                                    <Icons.FileText size={20} color={grant.color} />
                                </View>
                                <Text className="text-white font-bold text-sm mb-1">{grant.name}</Text>
                                <View
                                    className="px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: grant.color + '20' }}
                                >
                                    <Text style={{ color: grant.color, fontSize: 10, fontWeight: '700' }}>
                                        {grant.status}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* ═══════════ FINAL CTA SECTION ═══════════ */}
            <View className="w-full items-center px-6 py-20">
                <View className="max-w-[800px] w-full items-center">
                    <Text
                        className="text-white font-extrabold text-center mb-4"
                        style={{ fontSize: isDesktop ? 36 : 26 }}
                    >
                        지금 바로 시작하세요
                    </Text>
                    <Text className="text-slate-400 text-center text-base mb-8 leading-relaxed">
                        복잡한 사업계획서 작성, 더 이상 혼자 고민하지 마세요.{'\n'}
                        Publica AI가 합격하는 사업계획서를 함께 만들어 드립니다.
                    </Text>
                    <TouchableOpacity
                        onPress={onStartFree}
                        className="bg-purple-600 hover:bg-purple-500 px-10 py-4 rounded-2xl shadow-lg shadow-purple-600/30 active:scale-95"
                    >
                        <Text className="text-white font-bold text-lg text-center">
                            무료로 시작하기 →
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ═══════════ FOOTER ═══════════ */}
            <View className="w-full border-t border-white/5 px-6 py-10">
                <View className="max-w-[1200px] w-full mx-auto">
                    <View className={`${isDesktop ? 'flex-row justify-between' : 'flex-col gap-6'}`}>
                        <View>
                            <Text className="text-white font-bold text-lg mb-2">Publica</Text>
                            <Text className="text-slate-500 text-xs leading-5">
                                AI 기반 사업계획서 자동 완성 플랫폼{'\n'}
                                © 2026 Publica. All rights reserved.
                            </Text>
                        </View>
                        <View className={`${isDesktop ? 'flex-row gap-8' : 'flex-col gap-3'}`}>
                            <TouchableOpacity>
                                <Text className="text-slate-400 text-sm">이용약관</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text className="text-slate-400 text-sm">개인정보처리방침</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text className="text-slate-400 text-sm">문의하기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};
