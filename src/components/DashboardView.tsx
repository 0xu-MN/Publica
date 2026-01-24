import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Defs, LinearGradient as SvgLinearGradient, Stop, Line, Rect, Text as SvgText } from 'react-native-svg';
import { Newspaper, TrendingUp, Zap, Calendar, ExternalLink, ArrowRight, BookOpen, Clock, PlayCircle, Activity, Layers } from 'lucide-react-native';
import Footer from './Footer';
import { NewsItem } from '../services/newsService';
import { MarketCarouselWidget } from './MarketWidgets';

import { DecryptedText } from './DecryptedText';
import { FloatingLines } from './FloatingLines';

interface DashboardViewProps {
    newsData: NewsItem[];
    hotKeywords: string[];
    user?: any;
    onLoginPress: () => void;
    onInsightClick: (item: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ newsData, hotKeywords, user, onLoginPress, onInsightClick }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    // State
    const [currentTime, setCurrentTime] = useState(new Date());

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // Derived Data & Logic
    // Mock: Sort by "importance" (simulated by string length or random for now)
    const sortedByImportance = useMemo(() => [...newsData].sort((a, b) => b.title.length - a.title.length), [newsData]);

    const scienceTop = useMemo(() => sortedByImportance.find(i => i.category === 'Science') || newsData[0], [sortedByImportance, newsData]);
    const economyTop = useMemo(() => sortedByImportance.find(i => i.category === 'Economy') || newsData[1], [sortedByImportance, newsData]);

    const trendingTopics = useMemo(() => sortedByImportance.slice(0, 5), [sortedByImportance]);

    // Mock Real-time Rising (Randomly picked from keywords for demo)
    const risingKeywords = useMemo(() => ['#CES2026', '#AI_Agent', '#NVIDIA', '#Kospi2800'], []);

    return (
        <View className="flex-1 max-w-[1400px] w-full mx-auto px-6 pt-4 gap-4 pb-6">

            <View className="flex-1 flex-row gap-4 min-h-[600px]">
                {/* Left Column */}
                <View className="flex-[2] gap-4 justify-end">
                    {/* Animated Header Text */}
                    <View className="flex-row items-center justify-center mb-6">
                        <Text className="text-slate-300 text-3xl font-bold mr-2">오늘의</Text>
                        <DecryptedText
                            words={['과학', '경제', 'AI', '반도체', '우주', '바이오', '에너지', '투자']}
                            interval={800}
                            className="text-blue-400 text-3xl font-bold"
                        />
                        <Text className="text-slate-300 text-3xl font-bold ml-2">인사이트</Text>
                    </View>
                    {/* 1. Split Top Cards (Science & Economy) */}
                    <View className="flex-row gap-4 h-[320px]">
                        {/* Science Card */}
                        <TouchableOpacity
                            className="flex-1 relative overflow-hidden rounded-[32px] shadow-lg shadow-black/20 group cursor-pointer"
                            onPress={() => scienceTop && onInsightClick(scienceTop)}
                        >
                            {/* Background Image with Dark Overlay */}
                            <Image source={{ uri: scienceTop?.imageUrl || 'https://via.placeholder.com/400' }} className="absolute inset-0 w-full h-full opacity-60" resizeMode="cover" />
                            <LinearGradient colors={['rgba(15, 23, 42, 0.3)', 'rgba(15, 23, 42, 0.95)']} className="absolute inset-0" />

                            <View className="flex-1 p-6 justify-between">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-2 h-2 rounded-full bg-sky-500 shadow-sm shadow-sky-500" />
                                    <Text className="text-sky-400 text-xs font-bold uppercase tracking-wider">Science Top 1</Text>
                                </View>

                                <View>
                                    <Text className="text-white text-xl font-bold leading-8 mb-2" numberOfLines={3}>
                                        {scienceTop?.title || "로딩중..."}
                                    </Text>
                                    <View className="flex-row items-center mt-2">
                                        <Text className="text-slate-400 text-xs font-medium mr-1">{scienceTop?.source}</Text>
                                        <Text className="text-slate-600 text-[10px]">•</Text>
                                        <Text className="text-slate-400 text-xs font-medium ml-1">지금 읽기</Text>
                                        <ArrowRight size={12} color="#94A3B8" style={{ marginLeft: 4 }} />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>


                        {/* Economy Card */}
                        <TouchableOpacity
                            className="flex-1 relative overflow-hidden rounded-[32px] shadow-lg shadow-black/20 group cursor-pointer"
                            onPress={() => economyTop && onInsightClick(economyTop)}
                        >
                            {/* Background Image with Dark Overlay */}
                            <Image source={{ uri: economyTop?.imageUrl || 'https://via.placeholder.com/400' }} className="absolute inset-0 w-full h-full opacity-60" resizeMode="cover" />
                            <LinearGradient colors={['rgba(15, 23, 42, 0.3)', 'rgba(15, 23, 42, 0.95)']} className="absolute inset-0" />

                            <View className="flex-1 p-6 justify-between">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
                                    <Text className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Economy Top 1</Text>
                                </View>

                                <View>
                                    <Text className="text-white text-xl font-bold leading-8 mb-2" numberOfLines={3}>
                                        {economyTop?.title || "로딩중..."}
                                    </Text>
                                    <View className="flex-row items-center mt-2">
                                        <Text className="text-slate-400 text-xs font-medium mr-1">{economyTop?.source}</Text>
                                        <Text className="text-slate-600 text-[10px]">•</Text>
                                        <Text className="text-slate-400 text-xs font-medium ml-1">지금 읽기</Text>
                                        <ArrowRight size={12} color="#94A3B8" style={{ marginLeft: 4 }} />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* 5. Market Data Carousel (Replaces Traffic Chart) */}
                    <View className="h-[280px] justify-center">
                        <MarketCarouselWidget />
                    </View>
                </View>

                {/* Right Column (Sidebar) */}
                <View className="flex-[0.8] h-full min-h-[600px] justify-between">

                    {/* 1. Top Section: Date & Auth (Moved from Header) */}
                    <View className="bg-slate-900/50 rounded-[32px] p-6 border border-white/5 relative mb-4">
                        <View className="absolute inset-0 bg-white/2 rounded-[32px] pointer-events-none" />
                        {/* Date Info */}
                        <View className="mb-6">
                            <Text className="text-slate-400 text-xs font-medium mb-1">오늘의 인사이트</Text>
                            <View className="flex-row items-baseline gap-2">
                                <Text className="text-white text-xl font-bold">{formatDate(currentTime)}</Text>
                                <Text className="text-slate-400 text-sm font-medium">{formatTime(currentTime)}</Text>
                            </View>
                        </View>

                        {/* Auth Info */}
                        <View>
                            {user ? (
                                <View>
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className="text-slate-400 text-xs">Welcome back,</Text>
                                        <View className="bg-blue-600/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                                            <Text className="text-blue-400 text-[10px] font-bold">Premium</Text>
                                        </View>
                                    </View>
                                    <Text className="text-white text-sm font-bold">{user.email?.split('@')[0]}님 반갑습니다 👋</Text>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={onLoginPress} className="w-full bg-blue-600 py-3 rounded-xl hover:bg-blue-500 transition-colors items-center">
                                    <Text className="text-white font-bold text-sm">로그인</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* 2. Sidebar Hot Content (Keywords, Rising, Topics) */}
                    <View className="bg-slate-900/50 rounded-[32px] p-6 border border-white/5 gap-6 relative flex-1">
                        <View className="absolute inset-0 bg-white/2 rounded-[32px] pointer-events-none" />

                        {/* Hot Keywords */}
                        <View>
                            <View className="flex-row items-center mb-3">
                                <Activity size={14} color="#60A5FA" />
                                <Text className="text-slate-200 text-xs font-bold ml-2">이번 주 HOT 키워드</Text>
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                                {hotKeywords.slice(0, 5).map((keyword, i) => (
                                    <View key={i} className="bg-blue-500/10 px-2.5 py-1.5 rounded-full border border-blue-500/20">
                                        <Text className="text-blue-200 text-[11px] font-medium">{keyword}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Divider */}
                        <View className="h-[1px] w-full bg-slate-700/50" />

                        {/* Real-time Rising (NEW) */}
                        <View>
                            <View className="flex-row items-center mb-3">
                                <TrendingUp size={14} color="#F87171" />
                                <Text className="text-slate-200 text-xs font-bold ml-2">실시간 급상승</Text>
                                <View className="bg-red-500/20 px-1.5 py-0.5 rounded ml-2">
                                    <Text className="text-red-400 text-[9px] font-bold">LIVE</Text>
                                </View>
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                                {risingKeywords.map((tag, i) => (
                                    <View key={i} className="flex-row items-center bg-slate-800/80 px-2 py-1 rounded-md border border-white/5">
                                        <Text className="text-slate-300 text-[10px]">{tag}</Text>
                                        <Text className="text-red-400 text-[8px] ml-1 font-bold">▲</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Divider */}
                        <View className="h-[1px] w-full bg-slate-700/50" />

                        {/* Weekly Topics with Category Badge */}
                        <View>
                            <View className="flex-row items-center mb-3">
                                <Layers size={14} color="#34D399" />
                                <Text className="text-slate-200 text-xs font-bold ml-2">주간 핫 토픽</Text>
                            </View>
                            <View className="gap-3">
                                {trendingTopics.map((item, i) => (
                                    <TouchableOpacity key={i} className="flex-row items-start group">
                                        {/* Category Badge */}
                                        <View className={`px-1.5 py-0.5 rounded mr-2 mt-0.5 ${item.category === 'Science' ? 'bg-sky-500/20' : 'bg-emerald-500/20'}`}>
                                            <Text className={`text-[9px] font-bold ${item.category === 'Science' ? 'text-sky-400' : 'text-emerald-400'}`}>
                                                {item.category === 'Science' ? '과학' : '경제'}
                                            </Text>
                                        </View>
                                        <Text className="text-slate-400 text-[11px] leading-4 flex-1 group-hover:text-slate-200 transition-colors" numberOfLines={2}>
                                            {item.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>

    );
};
