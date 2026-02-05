import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Defs, LinearGradient as SvgLinearGradient, Stop, Line, Rect, Text as SvgText } from 'react-native-svg';
import { TrendingUp, ArrowRight, Activity, Layers, Search } from 'lucide-react-native';
import Footer from './Footer';
import { NewsItem } from '../services/newsService';
import { MarketCarouselWidget } from './MarketWidgets';
import { CompactMarketTicker } from './CompactMarketTicker';

import { DecryptedText } from './DecryptedText';
import { FloatingLines } from './FloatingLines';
import { VerticalStackCarousel } from './VerticalStackCarousel';
import { TopNewsHeroCard } from './TopNewsHeroCard';
import LightRays from './LightRays';

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

    // Seeded random generator for repeatable "daily views" simulation
    // Allows the "Top 1" to remain constant for a specifc day, but change on the next day.
    const getDailyScore = (id: string, dateStr: string) => {
        let hash = 0;
        const str = id + dateStr;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Sort by "daily score" (simulated popularity)
    const sortedByDailyPopularity = useMemo(() => {
        return [...newsData].sort((a, b) => {
            const scoreA = getDailyScore(a.id, todayStr);
            const scoreB = getDailyScore(b.id, todayStr);
            return scoreB - scoreA;
        });
    }, [newsData, todayStr]);

    const sortedByImportance = useMemo(() => sortedByDailyPopularity, [sortedByDailyPopularity]);

    // Daily Top selection for Science and Economy feeds
    const scienceTop = useMemo(() => {
        // Filter Science news from the daily sorted list
        const scienceFeeds = sortedByDailyPopularity.filter(i => i.category === 'Science');
        // The first item is deterministically the "Top 1" for today
        return scienceFeeds.length > 0 ? scienceFeeds[0] : newsData[0];
    }, [sortedByDailyPopularity, newsData]);

    const economyTop = useMemo(() => {
        // Filter Economy news from the daily sorted list
        const economyFeeds = sortedByDailyPopularity.filter(i => i.category === 'Economy');
        // The first item is deterministically the "Top 1" for today
        return economyFeeds.length > 0 ? economyFeeds[0] : newsData[1];
    }, [sortedByDailyPopularity, newsData]);

    const trendingTopics = useMemo(() => sortedByImportance.slice(0, 5), [sortedByImportance]);

    // Mock Real-time Rising (Randomly picked from keywords for demo)
    const risingKeywords = useMemo(() => ['#CES2026', '#AI_Agent', '#NVIDIA', '#Kospi2800'], []);

    return (
        <View className="flex-1 max-w-[1400px] w-full mx-auto px-6 pt-4 gap-6 pb-6">

            <View className="flex-1 flex-row gap-8 min-h-[600px]">
                {/* 
                    LEFT COLUMN: Hero Section (Stack Carousel)
                    Takes up about 66% width
                */}
                <View className="flex-[2] gap-6 relative pt-12">
                    {/* Header Text & Controls */}
                    <View className="mb-2 items-center justify-center z-10">
                        {/* AI Curation Pill with Light Rays */}
                        <View className="relative items-center justify-center mb-6 self-center">
                            {/* The Pill */}
                            <View className="bg-blue-600/20 px-4 py-2 rounded-full border border-blue-500/30 flex-row items-center">
                                <View className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 shadow-sm shadow-blue-400" />
                                <Text className="text-blue-200 text-xs font-bold">실시간 AI 큐레이션</Text>
                            </View>

                            {/* Light Rays Effect - Web only, positioned below the pill */}
                            {/* @ts-ignore - Web-specific rendering */}
                            <div style={{
                                position: 'absolute',
                                top: '0%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '1400px',
                                height: '1100px',
                                marginTop: '-100px',
                                pointerEvents: 'none',
                                zIndex: 1,
                                WebkitMaskImage: 'radial-gradient(ellipse 50% 70% at 50% 35%, black 0%, black 15%, transparent 55%)',
                                maskImage: 'radial-gradient(ellipse 50% 70% at 50% 35%, black 0%, black 15%, transparent 55%)'
                            }}>
                                <LightRays
                                    raysOrigin="top-center"
                                    raysColor="#ffffff"
                                    raysSpeed={1.6}
                                    lightSpread={1.2}
                                    rayLength={3.5}
                                    fadeDistance={2.0}
                                    saturation={2.0}
                                    mouseInfluence={0.1}
                                    noiseAmount={0}
                                    distortion={0}
                                    pulsating={false}
                                    followMouse={false}
                                />
                            </div>
                        </View>

                        {/* Title Container */}
                        <View className="flex-row items-center mb-2 justify-center">
                            <Text className="text-white text-6xl font-bold">오늘의 </Text>
                            <DecryptedText
                                words={useMemo(() => ['바이오', '반도체', 'AI', '배터리', '우주항공', '로봇'], [])}
                                interval={1500}
                                className="text-blue-400 text-6xl font-bold"
                            />
                            <Text className="text-white text-6xl font-bold"> 인사이트</Text>
                        </View>

                    </View>

                    {/* 3D Stack Carousel - Scaled down */}
                    <View className="flex-1 w-full min-h-[420px]" style={{ transform: [{ scale: 0.85 }] }}>
                        <VerticalStackCarousel
                            data={sortedByDailyPopularity.slice(0, 5)}
                            renderItem={(item, index, progress, totalItems) => (
                                <TopNewsHeroCard
                                    item={item}
                                    index={index}
                                    progress={progress}
                                    totalItems={totalItems}
                                />
                            )}
                            itemHeight={340}
                            containerHeight={420}
                        />
                    </View>
                </View>

                {/* 
                    RIGHT COLUMN: Info & Utility
                    Takes up remaining width (33%) - Reduced width
                */}
                <View className="flex-1 gap-4 -ml-12">

                    {/* 1. Date & Auth Panel */}
                    <View className="bg-slate-900/40 rounded-[28px] p-6 border border-white/5 relative">
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-slate-400 text-xs font-medium mb-1">오늘의 인사이트</Text>
                                <View className="flex-row items-baseline gap-2">
                                    <Text className="text-white text-xl font-bold">{formatDate(currentTime)}</Text>
                                    <Text className="text-slate-400 text-sm font-medium">{formatTime(currentTime)}</Text>
                                </View>
                            </View>
                            {/* Auth Status */}
                            {user && (
                                <View className="items-end">
                                    <View className="bg-blue-600/20 px-2 py-0.5 rounded-full border border-blue-500/30 mb-1">
                                        <Text className="text-blue-400 text-[10px] font-bold">Premium</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                    {/* User Welcome Removed */}

                    {/* Search Bar - Moved to Right Column */}
                    <View className="bg-slate-900/40 border border-white/10 rounded-[28px] px-6 py-4 flex-row items-center">
                        <Search size={16} color="#64748B" style={{ marginRight: 10 }} />
                        <Text className="text-slate-500 text-sm">관심있는 키워드를 검색해보세요</Text>
                    </View>

                    {/* 2. Hot Keywords & Topics & Market Ticker */}
                    <View className="flex-1 bg-slate-900/40 rounded-[28px] p-6 border border-white/5 relative min-h-[300px]">

                        {/* Hot Keywords */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-3">
                                <Activity size={16} color="#60A5FA" />
                                <Text className="text-slate-200 text-sm font-bold ml-2">이번 주 HOT 키워드</Text>
                                <Text className="text-blue-500 font-bold ml-1">#{hotKeywords[0] || '의대 증원'}</Text>
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                                {hotKeywords.slice(0, 5).map((keyword, i) => (
                                    <View key={i} className="bg-blue-500/10 px-2.5 py-1.5 rounded-full border border-blue-500/20">
                                        <Text className="text-blue-200 text-[11px] font-medium">#{keyword.replace('#', '')}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Real-time Rising */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-3">
                                <TrendingUp size={14} color="#F87171" />
                                <Text className="text-slate-200 text-xs font-bold ml-2">실시간 급상승</Text>
                                <View className="bg-red-500/20 px-1.5 py-0.5 rounded ml-2">
                                    <Text className="text-red-400 text-[9px] font-bold">LIVE</Text>
                                </View>
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                                {risingKeywords.map((tag, i) => (
                                    <View key={i} className="flex-row items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-white/5">
                                        <Text className="text-slate-300 text-[11px] font-medium">{tag}</Text>
                                        <Text className="text-red-400 text-[9px] ml-1.5 font-bold">▲</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Weekly Topics */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-3">
                                <Layers size={14} color="#34D399" />
                                <Text className="text-slate-200 text-xs font-bold ml-2">주간 핫 토픽</Text>
                            </View>
                            <View className="gap-3">
                                {trendingTopics.slice(0, 4).map((item, i) => (
                                    <TouchableOpacity key={i} className="flex-row items-start group">
                                        <View className={`px-1.5 py-0.5 rounded mr-2 mt-0.5 ${item.category === 'Science' ? 'bg-sky-500/20' : 'bg-emerald-500/20'}`}>
                                            <Text className={`text-[9px] font-bold ${item.category === 'Science' ? 'text-sky-400' : 'text-emerald-400'}`}>
                                                {item.category === 'Science' ? '과학' : '경제'}
                                            </Text>
                                        </View>
                                        <Text className="text-slate-400 text-[11px] leading-4 flex-1 group-hover:text-slate-200 transition-colors" numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 3. Global Market Trend (Integrated at bottom of panel) */}
                        <View className="flex-1">
                            <View className="flex-row items-center mb-3">
                                <TrendingUp size={14} color="#Fcd34d" />
                                <Text className="text-slate-200 text-xs font-bold ml-2">글로벌 마켓 트렌드</Text>
                            </View>
                            <View className="w-full">
                                <CompactMarketTicker />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View >
    );

};
