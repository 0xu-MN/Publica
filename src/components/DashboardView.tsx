import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions, StyleSheet, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Defs, LinearGradient as SvgLinearGradient, Stop, Line, Rect, Text as SvgText } from 'react-native-svg';
import { TrendingUp, ArrowRight, Activity, Layers, Search, Clock, Award, Star } from 'lucide-react-native';
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

    const [currentTime, setCurrentTime] = useState(new Date());

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

    const getDailyScore = (id: string, dateStr: string) => {
        let hash = 0;
        const str = id + dateStr;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const sortedByDailyPopularity = useMemo(() => {
        return [...newsData].sort((a, b) => {
            const scoreA = getDailyScore(a.id, todayStr);
            const scoreB = getDailyScore(b.id, todayStr);
            return scoreB - scoreA;
        });
    }, [newsData, todayStr]);

    const trendingTopics = useMemo(() => sortedByDailyPopularity.slice(0, 5), [sortedByDailyPopularity]);
    const risingKeywords = useMemo(() => ['#CES2026', '#AI_Agent', '#NVIDIA', '#Kospi2800'], []);

    return (
        <View style={styles.container}>
            <View style={styles.mainRow}>
                {/* LEFT COLUMN: Hero Section */}
                <View style={styles.leftCol}>
                    <View style={styles.heroHeader}>
                        <View style={styles.aiPillWrapper}>
                            <View style={styles.aiPill}>
                                <View style={styles.pillDot} />
                                <Text style={styles.pillText}>실시간 AI 큐레이션</Text>
                            </View>

                            {/* Light Rays Effect */}
                            {/* @ts-ignore */}
                            <div style={styles.lightRaysContainer}>
                                <LightRays
                                    raysOrigin="top-center"
                                    raysColor="#7C3AED"
                                    raysSpeed={1.0}
                                    lightSpread={1.5}
                                    rayLength={3.0}
                                    fadeDistance={1.8}
                                    saturation={1.5}
                                    mouseInfluence={0.15}
                                    noiseAmount={0}
                                    distortion={0}
                                    pulsating={true}
                                    followMouse={false}
                                />
                            </div>
                        </View>

                        <View style={styles.titleWrapper}>
                            <Text style={styles.titleText}>오늘의 </Text>
                            <DecryptedText
                                words={['바이오', '반도체', 'AI', '배터리', '우주항공', '로봇']}
                                interval={2000}
                                style={styles.titleAccent}
                            />
                            <Text style={styles.titleText}> 인사이트</Text>
                        </View>
                    </View>

                    <View style={styles.carouselContainer}>
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
                            containerHeight={460}
                        />
                    </View>
                </View>

                {/* RIGHT COLUMN: Info & Utility */}
                <View style={styles.rightCol}>
                    {/* 1. Date & Status Panel */}
                    <View style={styles.panel}>
                        <View style={styles.panelHeader}>
                            <View>
                                <Text style={styles.panelLabel}>CURRENT INSIGHT</Text>
                                <View style={styles.dateTimeRow}>
                                    <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
                                    <View style={styles.timeBadge}>
                                        <Clock size={12} color="#7C3AED" />
                                        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                                    </View>
                                </View>
                            </View>
                            {user && (
                                <View style={styles.premiumBadge}>
                                    <Award size={14} color="#FFFFFF" />
                                    <Text style={styles.premiumText}>PRO</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Search Bar */}
                    <TouchableOpacity style={styles.searchBar}>
                        <Search size={18} color="#94A3B8" />
                        <Text style={styles.searchText}>관심 있는 인사이트를 검색하세요</Text>
                    </TouchableOpacity>

                    {/* 2. Hot Keywords & Trends Panel */}
                    <View style={[styles.panel, { flex: 1 }]}>
                        <View style={styles.sectionHeader}>
                            <Activity size={18} color="#7C3AED" />
                            <Text style={styles.sectionTitle}>TRENDING KEYWORDS</Text>
                        </View>
                        <View style={styles.keywordGrid}>
                            {hotKeywords.slice(0, 8).map((keyword, i) => (
                                <TouchableOpacity key={i} style={styles.keywordItem}>
                                    <Text style={styles.keywordText}>#{keyword.replace('#', '')}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.sectionHeader}>
                            <TrendingUp size={18} color="#10B981" />
                            <Text style={styles.sectionTitle}>RISING TOPICS</Text>
                            <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>
                        </View>
                        <View style={styles.risingList}>
                            {risingKeywords.map((tag, i) => (
                                <View key={i} style={styles.risingItem}>
                                    <Text style={styles.risingLabel}>{tag}</Text>
                                    <Text style={styles.risingTrend}>▲</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.sectionHeader}>
                            <Layers size={18} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>WEEKLY INSIGHTS</Text>
                        </View>
                        <View style={styles.insightList}>
                            {trendingTopics.slice(0, 4).map((item, i) => (
                                <TouchableOpacity key={i} style={styles.insightListItem}>
                                    <View style={[styles.catBadge, { backgroundColor: item.category === 'Science' ? '#E0F2FE' : '#ECFDF5' }]}>
                                        <Text style={[styles.catText, { color: item.category === 'Science' ? '#0369A1' : '#047857' }]}>
                                            {item.category === 'Science' ? 'SCIENCE' : 'ECONOMY'}
                                        </Text>
                                    </View>
                                    <Text style={styles.insightItemTitle} numberOfLines={1}>{item.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.marketFooter}>
                            <View style={styles.sectionHeader}>
                                <TrendingUp size={18} color="#F59E0B" />
                                <Text style={styles.sectionTitle}>GLOBAL MARKET</Text>
                            </View>
                            <CompactMarketTicker />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, maxWidth: 1400, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, backgroundColor: '#FDF8F3' },
    mainRow: { flex: 1, flexDirection: 'row', gap: 32, minHeight: 600 },
    
    // Left Column
    leftCol: { flex: 2, gap: 24, position: 'relative', paddingTop: 48 },
    heroHeader: { alignItems: 'center', justifyContent: 'center', zIndex: 10, marginBottom: 8 },
    aiPillWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    aiPill: { backgroundColor: '#7C3AED10', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: '#7C3AED30', flexDirection: 'row', alignItems: 'center' },
    pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7C3AED', marginRight: 8 },
    pillText: { color: '#7C3AED', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    lightRaysContainer: {
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 1400,
        height: 1100,
        marginTop: -100,
        pointerEvents: 'none',
        zIndex: 1,
        // @ts-ignore
        WebkitMaskImage: 'radial-gradient(ellipse 50% 70% at 50% 35%, black 0%, black 15%, transparent 55%)',
        maskImage: 'radial-gradient(ellipse 50% 70% at 50% 35%, black 0%, black 15%, transparent 55%)'
    },
    titleWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    titleText: { color: '#18181B', fontSize: 64, fontWeight: '900', letterSpacing: -2 },
    titleAccent: { color: '#7C3AED', fontSize: 64, fontWeight: '900', letterSpacing: -2 },
    carouselContainer: { flex: 1, width: '100%', minHeight: 420 },

    // Right Column
    rightCol: { flex: 1, gap: 16 },
    panel: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 28, borderWidth: 1, borderColor: '#7C3AED10', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.04, shadowRadius: 24, elevation: 4 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    panelLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
    dateTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dateText: { color: '#18181B', fontSize: 20, fontWeight: '800' },
    timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF8F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 6 },
    timeText: { color: '#7C3AED', fontSize: 14, fontWeight: '700' },
    premiumBadge: { backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    premiumText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

    searchBar: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 24, paddingHorizontal: 24, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
    searchText: { color: '#94A3B8', fontSize: 15, fontWeight: '500' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    sectionTitle: { color: '#18181B', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
    keywordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    keywordItem: { backgroundColor: '#FDF8F3', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#7C3AED15' },
    keywordText: { color: '#7C3AED', fontSize: 12, fontWeight: '700' },
    
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 24 },
    
    liveBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
    liveText: { color: '#EF4444', fontSize: 9, fontWeight: '800' },
    risingList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    risingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    risingLabel: { color: '#475569', fontSize: 12, fontWeight: '600' },
    risingTrend: { color: '#EF4444', fontSize: 10, marginLeft: 6, fontWeight: '800' },

    insightList: { gap: 12 },
    insightListItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 4 },
    catBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    catText: { fontSize: 9, fontWeight: '800' },
    insightItemTitle: { color: '#475569', fontSize: 13, fontWeight: '600', flex: 1 },

    marketFooter: { marginTop: 'auto', paddingTop: 24 }
});
