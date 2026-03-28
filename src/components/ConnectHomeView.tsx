import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Sparkles, AlertCircle, Briefcase, Home, RefreshCcw, Users, Building2, Search, Filter, LayoutGrid, Plus, Bell, User as UserIcon, CheckCircle2 } from 'lucide-react-native';
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { fetchGrants } from '../services/grants';
import { calculateGrantScore } from '../utils/scoring';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';
import ElectricBorder from './ElectricBorder';
import { VerticalStackCarousel } from './VerticalStackCarousel';
import { GovernmentCard } from './GovernmentCard';

interface ConnectHomeViewProps {
    onNavigateToSupport?: () => void;
    onNavigateToLounge?: () => void;
    onNavigateToWorkspace?: () => void;
    onNavigateToGrantList?: () => void;
    onProgramSelect?: (program: any) => void;
    onLoginPress?: () => void;
}

export const ConnectHomeView: React.FC<ConnectHomeViewProps> = ({
    onNavigateToSupport,
    onNavigateToLounge,
    onNavigateToWorkspace,
    onNavigateToGrantList,
    onProgramSelect,
    onLoginPress
}) => {
    const { width } = useWindowDimensions();
    const { user, profile } = useAuth();

    const getDisplayData = () => {
        if (!profile) return { keywords: ['AI_Agent', 'FinTech'], field: '정부 R&D' };

        const keywords = profile.research_keywords && profile.research_keywords.length > 0
            ? profile.research_keywords
            : ['설정 필요'];

        const field = profile.expertise || profile.major_category || profile.industry || '미설정';

        return { keywords, field };
    };

    const { keywords, field } = getDisplayData();

    // Derive remaining profile data directly
    const nickname = profile?.full_name || user?.email?.split('@')[0] || 'User';
    const role = profile?.user_type === 'business' ? (profile?.industry || 'Business') :
        profile?.user_type === 'pre_entrepreneur' ? (profile?.industry || 'Pre-Ent') :
            profile?.user_type === 'researcher' ? (profile?.major_category || 'Researcher') :
                (profile?.industry || 'AI Strategist');

    const imageUrl = profile?.avatar_url || '';
    const isDesktop = width >= 1024;
    const scrollRef = React.useRef<ScrollView>(null);
    const searchSectionRef = React.useRef<View>(null);

    const [govPrograms, setGovPrograms] = React.useState<any[]>([]);
    const [fundingPrograms, setFundingPrograms] = React.useState<any[]>([]);
    const [communityPosts, setCommunityPosts] = React.useState<any[]>([]);
    const [topGrants, setTopGrants] = React.useState<any[]>([]); // New state for top cards
    const [loading, setLoading] = React.useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch & Score Grants
            const allGrants = await fetchGrants();
            let scoredGrants = allGrants.map(g => ({
                ...g,
                // If profile is not loaded yet, score is 0
                score: profile ? calculateGrantScore(g, profile) : 0
            }));

            // Sort by Score DESC
            scoredGrants.sort((a, b) => b.score - a.score);

            // Removed strict year filtering that was accidentally wiping out crawled API data due to format parsing issues.
            const activeGrants = scoredGrants;

            // Set Top 2 for the Main Cards
            let topTwo = activeGrants.slice(0, 2);
            setTopGrants(topTwo);

            // Set Carousel items (Projects)
            let rndApps = activeGrants.filter(g => g.grant_type === 'project' || !g.grant_type);
            rndApps = rndApps.slice(0, 5);
            setGovPrograms(rndApps);

            // Set Funding items (Strictly Subsidies)
            let fundApps = activeGrants.filter(g => g.grant_type === 'subsidy');
            fundApps = fundApps.slice(0, 5);
            setFundingPrograms(fundApps);


            // Mock Community Data (Keep for now)
            setCommunityPosts([
                { title: '예비창업패키지 3번 문항 작성 팁 있을까요?', author: '박연구원', time: '54분 전', category: 'Q&A', content: '이번에 예비창업패키지 준비 중인데 3번 BM 구성이 어렵네요...', likes: 4, comments: 12 },
                { title: '이번 R&D 예산 증액안, 실제로 체감되시나요?', author: '김대표', time: '1시간 전', category: '자유게시판', content: '뉴스에서는 증액이라는데 실제로는 잘 모르겠네요.', likes: 21, comments: 45 },
                { title: '지자체 지원금 드디어 입금됐습니다!', author: '이창업', time: '3시간 전', category: 'Talk', content: '기다림 끝에 오늘 입금 확인했네요. 다들 힘내세요!', likes: 2, comments: 8 },
                { title: '시리즈 A 투자 유치 성공기 공유합니다', author: '최투자', time: '5시간 전', category: 'Insight', content: '약 1년간의 투자 유치 과정을 정리해봤습니다.', likes: 88, comments: 32 },
            ]);
        } catch (error) {
            console.error("Error loading connect hub data:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, [profile]); // Reload when profile changes

    // Auto-scroll Animation for Lounge
    const translateX = useSharedValue(0);
    const CARD_WIDTH = 420;
    const GAP = 24;
    const TOTAL_ITEMS = communityPosts.length;
    const TOTAL_WIDTH = (CARD_WIDTH + GAP) * TOTAL_ITEMS;

    useEffect(() => {
        if (communityPosts.length > 0) {
            translateX.value = 0;
            translateX.value = withRepeat(
                withTiming(-TOTAL_WIDTH, {
                    duration: 30000, // 30 seconds for one full loop
                    easing: Easing.linear,
                }),
                -1, // Infinite
                false // Don't reverse
            );
        }
        return () => cancelAnimation(translateX);
    }, [communityPosts.length, TOTAL_WIDTH]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    if (loading) {
        return (
            <View className="flex-1 bg-[#020617] items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-slate-400 mt-4 font-medium">Connect Hub 로딩 중...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            ref={scrollRef}
            className="flex-1 w-full bg-[#020617]"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
        >
            <View className="max-w-[1400px] mx-auto w-full p-6">
                {/* Header */}
                <View className="mb-8 pt-4 flex-row justify-between items-center">
                    <View>
                        <Text className="text-white text-5xl font-black tracking-tighter mb-2">CONNECT HUB</Text>
                        <Text className="text-slate-400 text-lg">{nickname || '방문자'} 연구원님의 사업 아이템에 맞춘 최적의 기회입니다.</Text>
                    </View>
                    <TouchableOpacity className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex-row items-center">
                        <Filter size={18} color="#94A3B8" />
                        <Text className="text-slate-300 ml-2 font-medium">필터링</Text>
                    </TouchableOpacity>
                </View>

                {/* Personalized Section (Unified for Visitor & User) */}
                <View className="mb-12">
                    {/* Profile Card */}
                    <View className="bg-[#0F172A] rounded-[40px] p-8 border border-white/5 flex-row items-center justify-between mb-8 shadow-xl">
                        {!user ? (
                            /* Visitor Profile Card */
                            <View className="flex-row items-center justify-between w-full">
                                <View className="flex-row items-center gap-6">
                                    <View className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700/50 items-center justify-center">
                                        <UserIcon size={40} color="#475569" />
                                    </View>
                                    <View>
                                        <Text className="text-white text-3xl font-bold mb-2">안녕하세요 방문자님!</Text>
                                        <Text className="text-slate-400 font-medium">로그인 후에 더 많은 기능을 이용하실 수 있습니다.</Text>
                                    </View>
                                </View>
                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        onPress={onLoginPress}
                                        className="bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20"
                                    >
                                        <Text className="text-white font-bold text-base">로그인</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={onLoginPress}
                                        className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10"
                                    >
                                        <Text className="text-slate-300 font-bold text-base">회원가입</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            /* Logged-in User Profile Card */
                            <>
                                <View className="flex-row items-center gap-6">
                                    <View className="relative">
                                        <View className="w-24 h-24 rounded-full bg-slate-800 overflow-hidden border-2 border-blue-500/30">
                                            {imageUrl ? (
                                                <Image source={{ uri: imageUrl }} className="w-full h-full" />
                                            ) : (
                                                <View className="w-full h-full items-center justify-center">
                                                    <UserIcon size={32} color="#475569" />
                                                </View>
                                            )}
                                        </View>
                                        <View className="absolute bottom-0 right-0 bg-emerald-500 w-6 h-6 rounded-full border-4 border-[#0F172A] items-center justify-center">
                                            <Plus size={12} color="white" strokeWidth={3} />
                                        </View>
                                    </View>
                                    <View>
                                        <View className="flex-row items-center gap-3 mb-2">
                                            <Text className="text-white text-3xl font-bold">{nickname} 연구원님</Text>
                                            <View className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/30">
                                                <Text className="text-blue-400 text-xs font-bold uppercase">{role}</Text>
                                            </View>
                                        </View>
                                        <Text className="text-slate-400 font-medium" numberOfLines={1}>
                                            보유 기술: <Text className="text-blue-400">{keywords.map((k: string) => `#${k}`).join(', ')}</Text> • 선호 분야: <Text className="text-emerald-400">{field}</Text>
                                        </Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center gap-10 pr-4">
                                    <View className="items-center">
                                        <Text className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-widest">Match Optimization</Text>
                                        <Text className="text-blue-400 text-4xl font-black">98 <Text className="text-lg">%</Text></Text>
                                    </View>
                                    <View className="items-center">
                                        <Text className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-widest">Active Projects</Text>
                                        <Text className="text-white text-4xl font-black">3 <Text className="text-lg">건</Text></Text>
                                    </View>

                                    {/* My Workspace Shortcut */}
                                    <TouchableOpacity
                                        onPress={onNavigateToWorkspace}
                                        className="bg-indigo-600/20 px-6 py-4 rounded-2xl border border-indigo-500/30 flex-row items-center gap-2"
                                    >
                                        <LayoutGrid size={20} color="#818CF8" />
                                        <Text className="text-indigo-400 font-bold text-base">My Workspace</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Top 2 Recommendations (Visible for both, but blurred for guests) */}
                    <View className="relative">
                        <View className="flex-row gap-8">
                            {topGrants.length === 0 ? (
                                <ElectricBorder
                                    color="#1E293B"
                                    speed={0.2}
                                    chaos={0.02}
                                    borderRadius={48}
                                    style={{ flex: 1, display: 'flex' }}
                                >
                                    <View className="flex-1 bg-[#0F172A] rounded-[48px] p-10 border border-slate-800/50 relative overflow-hidden items-center justify-center min-h-[340px] w-full">
                                        <Search size={48} color="#475569" className="mb-6 opacity-50" />
                                        <Text className="text-white text-3xl font-black mb-4">최적의 맞춤 지원사업 탐색 중</Text>
                                        <Text className="text-slate-400 text-lg text-center leading-relaxed max-w-2xl">
                                            현재 DB에서 연구원님의 활동 지역(<Text className="text-blue-400 font-bold">{profile?.sido || profile?.location || '전국'}</Text>)과 산업 분야(<Text className="text-[#34D399] font-bold">{field}</Text>)에 일치하는 신규 공고를 AI가 분석하고 있습니다. 새로운 공고가 수집되면 가장 먼저 안내해 드립니다.
                                        </Text>
                                    </View>
                                </ElectricBorder>
                            ) : (
                                <>
                                    {/* Card 1 */}
                                    {topGrants[0] && (
                                        <ElectricBorder
                                            color="#3B82F6"
                                            speed={0.5}
                                            chaos={0.05}
                                            borderRadius={48}
                                            style={{ flex: 1, display: 'flex' }}
                                        >
                                            <TouchableOpacity
                                                onPress={() => !user ? onLoginPress?.() : onProgramSelect?.(topGrants[0])}
                                                className="flex-1 bg-[#0F172A] rounded-[48px] p-10 border border-white/5 relative overflow-hidden group shadow-lg min-h-[340px] w-full"
                                            >
                                                <View className="absolute top-0 right-0 p-8 z-10">
                                                    <View className="items-end">
                                                        <Text className="text-blue-500 text-xs font-bold mb-1 uppercase tracking-widest">Matching Score</Text>
                                                        <Text className="text-white text-6xl font-black">{!user ? '??' : topGrants[0].score}<Text className="text-2xl">%</Text></Text>
                                                    </View>
                                                </View>
                                                <View className="w-[65%]">
                                                    <Text className="text-slate-400 font-bold mb-4 uppercase tracking-tighter">{topGrants[0].agency}</Text>
                                                    <Text className="text-white text-3xl font-bold leading-tight mb-8" numberOfLines={3}>{topGrants[0].title}</Text>
                                                </View>

                                                <View className="flex-row gap-3 mb-10">
                                                    <View className="bg-blue-500/10 px-4 py-2 rounded-xl"><Text className="text-blue-400 font-bold">{topGrants[0].category}</Text></View>
                                                    <View className="bg-slate-800 px-4 py-2 rounded-xl"><Text className="text-slate-400 font-bold">{topGrants[0].d_day}</Text></View>
                                                </View>

                                                <View className="mt-auto flex-row items-center justify-between">
                                                    <View>
                                                        <Text className="text-slate-500 text-sm mb-1">지원 분야</Text>
                                                        <Text className="text-[#34D399] text-xl font-bold">{topGrants[0].tech_field}</Text>
                                                    </View>
                                                    <View
                                                        className="bg-blue-600 px-6 py-4 rounded-2xl flex-row items-center shadow-lg shadow-blue-500/20"
                                                    >
                                                        <Sparkles size={18} color="white" />
                                                        <Text className="text-white font-bold ml-2 text-lg">상세 보기</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        </ElectricBorder>
                                    )}

                                    {/* Card 2 */}
                                    {topGrants[1] && (
                                        <ElectricBorder
                                            color="#10B981"
                                            speed={0.5}
                                            chaos={0.05}
                                            borderRadius={48}
                                            style={{ flex: 1, display: 'flex' }}
                                        >
                                            <TouchableOpacity
                                                onPress={() => !user ? onLoginPress?.() : onProgramSelect?.(topGrants[1])}
                                                className="flex-1 bg-[#0F172A] rounded-[48px] p-10 border border-white/5 relative overflow-hidden group shadow-lg min-h-[340px] w-full"
                                            >
                                                <View className="absolute top-0 right-0 p-8 z-10">
                                                    <View className="items-end">
                                                        <Text className="text-blue-500 text-xs font-bold mb-1 uppercase tracking-widest">Matching Score</Text>
                                                        <Text className="text-white text-6xl font-black">{!user ? '??' : topGrants[1].score}<Text className="text-2xl">%</Text></Text>
                                                    </View>
                                                </View>
                                                <View className="w-[65%]">
                                                    <Text className="text-slate-400 font-bold mb-4 uppercase tracking-tighter">{topGrants[1].agency}</Text>
                                                    <Text className="text-white text-3xl font-bold leading-tight mb-8" numberOfLines={3}>{topGrants[1].title}</Text>
                                                </View>

                                                <View className="flex-row gap-3 mb-10">
                                                    <View className="bg-blue-500/10 px-4 py-2 rounded-xl"><Text className="text-blue-400 font-bold">{topGrants[1].category}</Text></View>
                                                    <View className="bg-slate-800 px-4 py-2 rounded-xl"><Text className="text-slate-400 font-bold">{topGrants[1].d_day}</Text></View>
                                                </View>

                                                <View className="mt-auto flex-row items-center justify-between">
                                                    <View>
                                                        <Text className="text-slate-500 text-sm mb-1">지원 분야</Text>
                                                        <Text className="text-[#34D399] text-xl font-bold">{topGrants[1].tech_field}</Text>
                                                    </View>
                                                    <View
                                                        className="bg-blue-600 px-6 py-4 rounded-2xl flex-row items-center shadow-lg shadow-blue-500/20"
                                                    >
                                                        <Sparkles size={18} color="white" />
                                                        <Text className="text-white font-bold ml-2 text-lg">상세 보기</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        </ElectricBorder>
                                    )}
                                </>
                            )}
                        </View>

                        {/* Blur Overlay for Guest on Recommendations */}
                        {!user && (
                            <View className="absolute inset-0 bg-[#020617]/20 items-center justify-center rounded-[48px] border border-white/5 overflow-hidden">
                                <View className="absolute inset-0 bg-[#020617]/20 backdrop-blur-lg" />
                                <TouchableOpacity
                                    onPress={onLoginPress}
                                    className="bg-indigo-600 px-8 py-5 rounded-3xl shadow-2xl shadow-indigo-500/40 items-center"
                                >
                                    <Text className="text-white font-black text-xl mb-1">맞춤형 사업 추천받기</Text>
                                    <Text className="text-indigo-200 text-sm font-bold">로그인 후 나에게 딱 맞는 사업을 확인하세요</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* ROW SET 1: Gov Programs + New Opportunities */}
                <View className="flex-row gap-8 mb-12">
                    {/* Left: Government Info */}
                    <View className="flex-[1.1]">
                        <View className="flex-row items-center justify-between mb-6 px-2">
                            <View className="flex-row items-center gap-2">
                                <View className="bg-white/10 p-1.5 rounded-full">
                                    <AlertCircle size={16} color="#94A3B8" />
                                </View>
                                <Text className="text-white text-xl font-bold">정부사업 안내</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => !user ? onLoginPress?.() : onNavigateToGrantList?.()}
                                className="bg-white/5 px-3 py-1.5 rounded-md border border-white/10"
                            >
                                <Text className="text-blue-400 text-[10px] font-bold">맞춤형 공고 전체보기 {'>'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="w-full h-[500px] relative">
                            <VerticalStackCarousel
                                data={govPrograms}
                                renderItem={(item, index, progress, totalItems) => (
                                    <GovernmentCard
                                        item={item}
                                        index={index}
                                        progress={progress}
                                        totalItems={totalItems}
                                    />
                                )}
                                itemHeight={340}
                                containerHeight={500}
                            />
                        </View>
                    </View>

                    {/* Right: New Opportunities */}
                    <View className="flex-1">
                        <View className="bg-[#0F172A] p-10 rounded-[48px] border border-white/5 h-[570px] shadow-xl">
                            <View className="flex-row items-center justify-between mb-8">
                                <Text className="text-white text-xl font-black tracking-tight">NEW OPPORTUNITIES</Text>
                                <TouchableOpacity>
                                    <Text className="text-slate-500 text-[10px] font-black tracking-tighter uppercase">View All Projects</Text>
                                </TouchableOpacity>
                            </View>
                            <View className="flex-row flex-wrap gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <View key={i} className="w-[47%] bg-slate-900/50 p-6 rounded-[28px] border border-white/5 h-[160px] justify-between">
                                        <View>
                                            <View className="flex-row justify-between mb-2">
                                                <Text className="text-slate-600 text-[8px] font-bold">중소벤처기업부</Text>
                                                <Text className="text-[#34D399] text-[10px] font-black">D-12</Text>
                                            </View>
                                            <Text className="text-white text-xs font-bold leading-5" numberOfLines={3}>
                                                2026 글로벌 기술 매칭 펀드 및 바우처 지원사업 참여 기업 모집
                                            </Text>
                                        </View>
                                        <View className="flex-row gap-1">
                                            <View className="bg-slate-800 px-1.5 py-0.5 rounded-sm"><Text className="text-slate-500 text-[7px]">자금</Text></View>
                                            <View className="bg-slate-800 px-1.5 py-0.5 rounded-sm"><Text className="text-slate-500 text-[7px]">글로벌</Text></View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Horizontal Divider */}
                <View className="w-full h-[1px] bg-white/5 mb-16 relative">
                    <View className="absolute left-0 top-[-1px] w-24 h-[3px] bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                </View>

                {/* ROW SET 2: Gov Funding + Funding & Grants */}
                <View className="flex-row gap-8 mb-24">
                    {/* Left: Government Funding Rotation */}
                    <View className="flex-[1.1]">
                        <View className="flex-row items-center justify-between mb-6 px-2">
                            <View className="flex-row items-center gap-2">
                                <View className="bg-white/10 p-1.5 rounded-full">
                                    <Sparkles size={16} color="#A855F7" />
                                </View>
                                <Text className="text-white text-xl font-bold">정부지원금 로테이션</Text>
                            </View>
                            <TouchableOpacity className="bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                                <Text className="text-slate-500 text-[10px]">전체보기 {'>'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="w-full h-[500px] relative">
                            <VerticalStackCarousel
                                data={fundingPrograms}
                                renderItem={(item, index, progress, totalItems) => (
                                    <GovernmentCard
                                        item={item}
                                        index={index}
                                        progress={progress}
                                        totalItems={totalItems}
                                    />
                                )}
                                itemHeight={340}
                                containerHeight={500}
                            />
                        </View>
                    </View>

                    {/* Right: Funding & Grants */}
                    <View className="flex-1">
                        <View className="bg-[#0F172A] p-10 rounded-[48px] border border-white/5 h-[500px] shadow-xl">
                            <View className="flex-row items-center gap-3 mb-8">
                                <Sparkles size={20} color="#60A5FA" />
                                <Text className="text-white text-xl font-black uppercase tracking-tight">Funding & Grants</Text>
                            </View>
                            <View className="gap-5">
                                {[1, 2].map(i => (
                                    <View key={i} className="bg-slate-900/80 p-6 rounded-[24px] border border-white/5 flex-row justify-between items-center transition-all hover:bg-slate-800/80">
                                        <View className="flex-row items-center gap-5">
                                            <View className="w-12 h-12 bg-blue-500/10 rounded-2xl items-center justify-center border border-blue-500/20">
                                                <Briefcase size={22} color="#3B82F6" />
                                            </View>
                                            <View>
                                                <Text className="text-white text-base font-bold mb-1">청년창업 활성화 융자 지원금</Text>
                                                <Text className="text-slate-500 text-xs">중소벤처기업진흥공단 • 연 2.0% 고정금리</Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-blue-400 text-lg font-black">최대 2.0억원</Text>
                                            <Text className="text-slate-600 text-[8px]">선착순 마감 가능</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Horizontal Divider 2 */}
                <View className="w-full h-[1px] bg-white/5 mb-16 relative">
                    <View className="absolute left-0 top-[-1px] w-24 h-[3px] bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                </View>

                {/* Workspace Preview Section (New) */}
                <View className="mb-24 px-2">
                    <View className="flex-row items-center justify-between mb-8 px-2">
                        <View className="flex-row items-center gap-3">
                            <Home size={22} color="#3B82F6" />
                            <Text className="text-white text-2xl font-black">My Workspace Summary</Text>
                        </View>
                        <TouchableOpacity onPress={() => !user ? onLoginPress?.() : onNavigateToWorkspace?.()} ><Text className="text-slate-500 text-sm font-bold">워크스페이스 이동 {'>'}</Text></TouchableOpacity>
                    </View>

                    <View className="relative">
                        <View className="flex-row gap-6">
                            {[1, 2, 3].map(i => (
                                <View key={i} className="flex-1 bg-[#0F172A] p-8 rounded-[40px] border border-white/5 h-[180px] justify-between shadow-lg">
                                    <View>
                                        <Text className="text-blue-400 text-[10px] font-black uppercase mb-2">Project 0{i}</Text>
                                        <Text className="text-white text-base font-bold leading-6">전략 에이전트 기반 사업 아이템 고도화 리포트</Text>
                                    </View>
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-slate-500 text-[10px]">최종 업데이트: 2시간 전</Text>
                                        <View className="bg-blue-500/10 px-3 py-1 rounded-lg">
                                            <Text className="text-blue-400 text-[10px] font-bold">분석 완료</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Blur Overlay for Guest */}
                        {!user && (
                            <View className="absolute inset-0 bg-[#020617]/40 items-center justify-center rounded-[40px] border border-white/5 overflow-hidden">
                                <View className="absolute inset-0 bg-[#020617]/40 backdrop-blur-md" />
                                <TouchableOpacity
                                    onPress={onLoginPress}
                                    className="bg-blue-600 px-8 py-4 rounded-2xl shadow-2xl shadow-blue-500/40 items-center"
                                >
                                    <Text className="text-white font-black text-lg">로그인하고 내 사업 관리하기</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Lounge Section */}
                <View className="mb-24 px-2">
                    <View className="flex-row items-center justify-between mb-8 px-2">
                        <View className="flex-row items-center gap-3">
                            <Users size={22} color="#A855F7" />
                            <Text className="text-white text-2xl font-black">Lounge</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                if (!user) {
                                    onLoginPress?.();
                                } else {
                                    onNavigateToLounge?.();
                                }
                            }}
                        >
                            <Text className="text-slate-500 text-sm font-bold">전체보기 {'>'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="relative">
                        <View className="overflow-hidden">
                            <Animated.View
                                style={[{ flexDirection: 'row', gap: 24 }, animatedStyle]}
                            >
                                {[...communityPosts, ...communityPosts, ...communityPosts].map((post, i) => (
                                    <TouchableOpacity
                                        key={`${post.author}-${i}`}
                                        onPress={() => {
                                            if (!user) {
                                                onLoginPress?.();
                                            } else {
                                                onNavigateToLounge?.();
                                            }
                                        }}
                                        className="w-[420px] bg-[#0F172A] p-8 rounded-[40px] border border-white/5 min-h-[220px] justify-between shadow-xl"
                                    >
                                        <View>
                                            <View className="flex-row items-center gap-3 mb-6">
                                                <View className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                                                    <Image source={{ uri: `https://i.pravatar.cc/100?u=${post.author}` }} className="w-full h-full" />
                                                </View>
                                                <View>
                                                    <Text className="text-white text-sm font-bold">{post.author}</Text>
                                                    <Text className="text-slate-500 text-[10px]">{post.time}</Text>
                                                </View>
                                            </View>
                                            <Text className="text-slate-200 text-base font-bold leading-7 mb-4" numberOfLines={2}>{post.title}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-4 border-t border-white/5 pt-4">
                                            <View className="flex-row items-center gap-1.5">
                                                <Text className="text-slate-500 text-[10px]">💬 {post.comments}</Text>
                                            </View>
                                            <View className="flex-row items-center gap-1.5">
                                                <Text className="text-slate-500 text-[10px]">👍 {post.likes}</Text>
                                            </View>
                                            <View className="ml-auto bg-purple-500/10 px-3 py-1 rounded-lg">
                                                <Text className="text-purple-400 text-[10px] font-black uppercase">{post.category}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </Animated.View>
                        </View>

                        {/* Blur Overlay for Guest Removed - Content now visible */}

                    </View>
                </View>
            </View>
            <Footer />
        </ScrollView>
    );
};
