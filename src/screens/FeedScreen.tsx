import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, useWindowDimensions, FlatList, TextInput, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InsightCard } from '../components/InsightCard';
import { fetchNews, NewsItem } from '../services/newsService';
import { InsightDetailModal } from '../components/InsightDetailModal';
import { AuthModal } from '../components/AuthModal';
import { RotatingText } from '../components/RotatingText';
import { DashboardView } from '../components/DashboardView';
import { useAuth } from '../contexts/AuthContext';
import { Home as HomeIcon, Folder, HeartHandshake, Building2, Users, Atom, TrendingUp, Sparkles, Search, Bell, User, X as CloseIcon, LogIn } from 'lucide-react-native';
import { FloatingLines } from '../components/FloatingLines';
import { SupportScreen } from './SupportScreen';
import { PersonalDashboard } from '../components/PersonalDashboard';
import { Workspace } from '../components/Workspace';
import { AnimatedPillNav } from '../components/AnimatedPillNav';
import Footer from '../components/Footer';
import { Separator } from '../components/Separator';

// Filter categories
const CATEGORIES = ['전체', '과학', '경제'];

export const FeedScreen = () => {
    const { width } = useWindowDimensions();
    const { user } = useAuth();
    const [authModalVisible, setAuthModalVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState('전체');
    const [searchQuery, setSearchQuery] = useState(''); // Search State
    const [isSearchVisible, setIsSearchVisible] = useState(false); // Search Toggle
    const [newsData, setNewsData] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);

    // View Mode State: 'feed' | 'dashboard' | 'support' | 'workspace' | 'public_profile'
    const [viewMode, setViewMode] = useState<'feed' | 'dashboard' | 'support' | 'workspace' | 'public_profile'>('feed');
    const [supportSubMode, setSupportSubMode] = useState<'overview' | 'support' | 'connect'>('overview');
    const [targetUserId, setTargetUserId] = useState<string | null>(null);

    // Load saved state on mount
    useEffect(() => {
        const loadSavedState = async () => {
            try {
                const savedViewMode = await AsyncStorage.getItem('viewMode');
                const savedCategory = await AsyncStorage.getItem('activeCategory');

                if (savedViewMode) {
                    // PROTECT DASHBOARD & WORKSPACE: If saved mode is dashboard/workspace but not logged in, default to feed
                    if ((savedViewMode === 'workspace' || savedViewMode === 'dashboard') && !user) {
                        setViewMode('feed');
                    } else {
                        setViewMode(savedViewMode as 'feed' | 'dashboard' | 'support' | 'workspace');
                    }
                }
                if (savedCategory) {
                    setActiveCategory(savedCategory);
                }
            } catch (error) {
                console.log('Failed to load saved state:', error);
            }
        };
        loadSavedState();
    }, [user]); // Add user dependency to re-check on logout

    // Save viewMode when it changes
    useEffect(() => {
        AsyncStorage.setItem('viewMode', viewMode).catch(err => console.log('Failed to save viewMode:', err));
    }, [viewMode]);

    // Save activeCategory when it changes
    useEffect(() => {
        AsyncStorage.setItem('activeCategory', activeCategory).catch(err => console.log('Failed to save category:', err));
    }, [activeCategory]);

    // Hot Keywords State
    const [hotKeywords, setHotKeywords] = useState<string[]>([]);

    // ... (rest of the state and useEffects remain same)

    const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

    // Determines number of columns based on screen width (Responsive)
    const numColumns = width >= 1200 ? 4 : width >= 768 ? 3 : 2;
    // Constrain container width for calculation (Max 1400px, minus padding 48px if applicable, but let's assume raw width for now)
    // We want the grid to fit within 1400px. 
    // Effectively available width = Math.min(width, 1400) - (horizontal padding of container)
    // Let's assume container padding is 24px * 2 = 48px.
    const maxContentWidth = Math.min(width, 1400);
    const contentPadding = 48; // px-6 * 2
    const gap = 20;
    const availableWidth = maxContentWidth - contentPadding;
    const cardWidth = (availableWidth - (numColumns - 1) * gap) / numColumns;

    // Analyze Hot Keywords when data changes
    useEffect(() => {
        if (newsData.length > 0) {
            const tagCounts: Record<string, number> = {};
            newsData.forEach(item => {
                item.tags.forEach(tag => {
                    // Normalize tag: remove # if present
                    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
                    tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
                });
            });

            // Sort by count desc and take top 5
            const sortedTags = Object.entries(tagCounts)
                .sort(([, countA], [, countB]) => countB - countA)
                .map(([tag]) => tag)
                .slice(0, 5);

            setHotKeywords(sortedTags);
        }
    }, [newsData]);

    const getFilteredNews = () => {
        let filtered = newsData;

        // Keyword Filter (Client-Side)
        if (activeKeyword) {
            filtered = filtered.filter(item =>
                item.tags.some(t => t.includes(activeKeyword.replace('#', '')))
            );
        }

        // Search Filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.summary.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const finalNewsData = getFilteredNews();

    useEffect(() => {
        loadNews();
    }, [activeCategory]);

    const loadNews = async () => {
        setLoading(true);
        setActiveKeyword(null); // Reset keyword filter when category changes

        // Base category for fetching (Backend only knows Science/Economy)
        const fetchCategory = activeCategory === '전체' ? '전체'
            : activeCategory === '과학' ? '과학'
                : '경제'; // Both domestic and global fetch 'Economy'

        let data = await fetchNews(fetchCategory);

        // Client-side filtering for Domestic/Global
        if (activeCategory === '국내경제') {
            const koreanSources = ['연합뉴스', '한국은행', '네이버', '조선비즈', '한겨레', '매일경제'];
            data = data.filter(item => koreanSources.some(k => item.source.includes(k)));
        } else if (activeCategory === '해외경제') {
            const koreanSources = ['연합뉴스', '한국은행', '네이버', '조선비즈', '한겨레', '매일경제'];
            data = data.filter(item => !koreanSources.some(k => item.source.includes(k)));
        }

        setNewsData(data);
        setLoading(false);
    };

    const loadMoreNews = () => {
        // Pagination could be implemented here
    };

    const isDesktop = width >= 768; // Simple breakpoint for desktop, kept for InsightCard prop

    return (
        <SafeAreaView className="flex-1 bg-[#020617]">
            <StatusBar barStyle="light-content" />

            {/* Top Header */}
            <View className="px-6 py-4 z-50">
                <View className="max-w-[1400px] w-full mx-auto flex-row justify-between items-center relative">
                    {/* Left: Logo */}
                    <View className="flex-row items-center z-10">
                        <View className="w-9 h-9 bg-blue-500 rounded-lg items-center justify-center mr-3">
                            <Text className="text-white font-bold text-[22px]">I</Text>
                        </View>
                        <View>
                            <Text className="text-white font-extrabold text-lg tracking-tighter">InsightFlow</Text>
                            <Text className="text-slate-400 text-[11px] mt-0.5">AI 뉴스 큐레이션</Text>
                        </View>
                    </View>

                    {/* Centered Navigation (Desktop) */}
                    {isDesktop && (
                        <View className="absolute inset-0 flex-row justify-center items-center pointer-events-none">
                            <View className="flex-row items-center pointer-events-auto gap-4">

                                {/* 1. Left Control: Home/Dashboard/Workspace Morphing */}
                                {viewMode === 'feed' ? (
                                    /* Feed Mode: Simple Home Circle */
                                    <TouchableOpacity
                                        className="w-12 h-12 rounded-full bg-slate-800/50 border border-white/5 items-center justify-center hover:bg-slate-700 transition-all"
                                        onPress={() => {
                                            if (!user) {
                                                setAuthModalVisible(true);
                                            } else {
                                                setViewMode('dashboard');
                                            }
                                        }}
                                    >
                                        <HomeIcon size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                ) : (viewMode === 'dashboard' || viewMode === 'workspace') ? (
                                    /* Dashboard & Workspace Mode: Expanded "Home | Workspace" Pill */
                                    <View className="h-12 px-6 rounded-full bg-blue-600 flex-row items-center shadow-lg shadow-blue-500/20">
                                        <TouchableOpacity
                                            className={`flex-row items-center transition-all ${viewMode === 'dashboard' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                            onPress={() => {
                                                if (!user) {
                                                    setAuthModalVisible(true);
                                                } else {
                                                    setViewMode('dashboard');
                                                }
                                            }}
                                        >
                                            <HomeIcon size={16} color="#fff" style={{ marginRight: 6 }} />
                                            <Text className="text-white font-bold text-sm">홈</Text>
                                        </TouchableOpacity>

                                        <View className="w-[1px] h-3 bg-white/30 mx-4" />

                                        <TouchableOpacity
                                            className={`flex-row items-center transition-all ${viewMode === 'workspace' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                            onPress={() => {
                                                if (!user) {
                                                    setAuthModalVisible(true);
                                                } else {
                                                    setViewMode('workspace');
                                                }
                                            }}
                                        >
                                            <Sparkles size={16} color="#fff" style={{ marginRight: 6 }} />
                                            <Text className="text-white font-bold text-sm">Workspace</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    /* Support Mode: Show minimal home button (goes to Feed? Or Dashboard?) */
                                    /* User only mentioned Workspace/Home toggle issue, so leaving this as fallback to Feed for now OR should it go to Dashboard? 
                                       Current behavior was Feed. Keeping Feed/Dashboard safe toggle. */
                                    <TouchableOpacity
                                        className="w-12 h-12 rounded-full bg-slate-800/50 border border-white/5 items-center justify-center hover:bg-slate-700 transition-all"
                                        onPress={() => setViewMode('feed')}
                                    >
                                        <HomeIcon size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                )}

                                {/* 2. Center Control: Category Morphing */}
                                {viewMode === 'feed' ? (
                                    /* Feed Mode: Full Category Pill with Animation */
                                    <AnimatedPillNav
                                        items={CATEGORIES}
                                        activeItem={activeCategory}
                                        onItemChange={setActiveCategory}
                                        backgroundColor="rgba(15, 23, 42, 0.5)"
                                        activeBackgroundColor="#3B82F6"
                                        textColor="rgb(148, 163, 184)"
                                        activeTextColor="rgb(255, 255, 255)"
                                        borderColor="rgba(255, 255, 255, 0.1)"
                                        renderIcon={(item, isActive) => {
                                            const iconColor = isActive ? '#fff' : '#94A3B8';
                                            if (item === '전체') return <Sparkles size={14} color={iconColor} />;
                                            if (item === '과학') return <Atom size={14} color={iconColor} />;
                                            if (item === '경제') return <TrendingUp size={14} color={iconColor} />;
                                            return null;
                                        }}
                                    />
                                ) : (
                                    /* Dashboard/Support Overview/Workspace Mode: Collapsed Menu Circle */
                                    <TouchableOpacity
                                        className="w-12 h-12 rounded-full bg-slate-800/50 border border-white/5 items-center justify-center hover:bg-slate-700 transition-all"
                                        onPress={() => setViewMode('feed')}
                                    >
                                        <Folder size={20} color="#64748B" />
                                    </TouchableOpacity>
                                )}

                                {/* 3. Right Control: Support Button / Toggle */}
                                {viewMode === 'support' ? (
                                    <View className="ml-2">
                                        <AnimatedPillNav
                                            items={['Connect Hub', 'Support', 'Lounge']}
                                            activeItem={supportSubMode === 'overview' ? 'Connect Hub' : supportSubMode === 'support' ? 'Support' : 'Lounge'}
                                            onItemChange={(item) => setSupportSubMode(item === 'Connect Hub' ? 'overview' : item === 'Support' ? 'support' : 'connect')}
                                            backgroundColor="rgba(15, 23, 42, 0.5)"
                                            activeBackgroundColor="#10B981"
                                            textColor="rgb(148, 163, 184)"
                                            activeTextColor="rgb(255, 255, 255)"
                                            borderColor="rgba(255, 255, 255, 0.1)"
                                            renderIcon={(item, isActive) => {
                                                const iconColor = isActive ? '#fff' : '#94A3B8';
                                                if (item === 'Connect Hub') {
                                                    return <HomeIcon size={14} color={iconColor} />;
                                                } else if (item === 'Support') {
                                                    return <Building2 size={14} color={iconColor} />;
                                                } else {
                                                    return <Users size={14} color={iconColor} />;
                                                }
                                            }}
                                        />
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        className="w-12 h-12 rounded-full flex-row items-center justify-center bg-slate-800/50 border border-white/10 hover:bg-slate-700 transition-all"
                                        onPress={() => {
                                            setViewMode('support');
                                            setSupportSubMode('overview'); // Default to Connect Hub
                                        }}
                                    >
                                        <HeartHandshake size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                )}

                            </View>
                        </View>
                    )}

                    <View className="flex-row items-center z-10">
                        {!user ? (
                            <TouchableOpacity
                                onPress={() => setAuthModalVisible(true)}
                                className="bg-white/10 px-4 py-2 rounded-xl flex-row items-center border border-white/10"
                            >
                                <User size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text className="text-white font-semibold text-sm">로그인</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                {/* Mobile Only: Small Search Icon */}
                                {!isDesktop && (
                                    isSearchVisible ? (
                                        <View className="flex-row items-center bg-slate-800/80 rounded-2xl px-3 py-1.5 ml-2.5 border border-white/10 min-w-[200px]">
                                            <TextInput
                                                className="flex-1 text-white text-sm mr-2 min-w-[150px] p-0"
                                                placeholder="검색어 입력..."
                                                placeholderTextColor="#94A3B8"
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                                autoFocus
                                            />
                                            <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearchVisible(false); }}>
                                                <CloseIcon color="#94A3B8" size={20} />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity onPress={() => setIsSearchVisible(true)}>
                                            <Search color="#fff" size={24} className="opacity-90 ml-5" />
                                        </TouchableOpacity>
                                    )
                                )}
                                <Bell color="#fff" size={24} className="opacity-90 ml-5" />
                                <User color="#fff" size={24} className="opacity-90 ml-5" />
                            </>
                        )}
                    </View>
                </View>
            </View >

            {
                viewMode === 'dashboard' ? (
                    <PersonalDashboard />
                ) : viewMode === 'public_profile' ? (
                    <PersonalDashboard readOnly={true} targetUserId={targetUserId || undefined} onClose={() => setViewMode('feed')} />
                ) : viewMode === 'workspace' ? (
                    <Workspace onClose={() => setViewMode('dashboard')} />
                ) : null // Render nothing if not dashboard or workspace, as support and feed are handled separately
            }
            {viewMode === 'support' && (
                <View className="flex-1 mt-[60px]">
                    <SupportScreen
                        subMode={supportSubMode}
                        onSubModeChange={setSupportSubMode}
                        onLoginRequired={() => setAuthModalVisible(true)}
                        onNavigateToProfile={(userId) => {
                            setTargetUserId(userId);
                            setViewMode('public_profile');
                        }}
                    />
                </View>
            )}
            {viewMode === 'feed' && (
                /* FEED MODE */
                <View className="flex-1 w-full bg-[#050B14]">
                    {activeCategory === '전체' ? (
                        <FlatList
                            data={finalNewsData}
                            keyExtractor={(item) => item.id}
                            numColumns={numColumns}
                            key={`all-${numColumns}`}
                            contentContainerStyle={{ paddingBottom: 60 }}
                            columnWrapperStyle={{ gap: 20, maxWidth: 1400, width: '100%', alignSelf: 'center', paddingHorizontal: 24 }}
                            ListHeaderComponent={
                                <View className="w-full items-center">
                                    {/* Header Content constrained to 1400px */}
                                    <View className="max-w-[1400px] w-full">
                                        <DashboardView
                                            newsData={finalNewsData}
                                            hotKeywords={hotKeywords}
                                            user={user}
                                            onLoginPress={() => setAuthModalVisible(true)}
                                        />
                                        <Separator className="my-8" />
                                        <View className="px-6">
                                            <View className="flex-row items-center justify-between mb-6">
                                                <Text className="text-white text-xl font-bold">최신 인사이트</Text>

                                                {/* Stats Section moved here */}
                                                <View className="flex-row items-center bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                                                    <View className="flex-row items-center">
                                                        <Sparkles size={14} color="#888" />
                                                        <Text className="text-slate-500 text-[13px] ml-1.5 mr-4">마지막 업데이트: 5분 전</Text>
                                                    </View>
                                                    <View className="w-[1px] h-3 bg-white/10 mr-4" />
                                                    <View className="flex-row items-center gap-4">
                                                        <View className="flex-row items-center">
                                                            <View className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                                                            <Text className="text-slate-400 text-[13px]">전체 {finalNewsData.length}개</Text>
                                                        </View>
                                                        <View className="flex-row items-center">
                                                            <View className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5" />
                                                            <Text className="text-slate-400 text-[13px]">과학 {finalNewsData.filter(i => i.category === 'Science').length}개</Text>
                                                        </View>
                                                        <View className="flex-row items-center">
                                                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                                            <Text className="text-slate-400 text-[13px]">경제 {finalNewsData.filter(i => i.category === 'Economy').length}개</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            }
                            renderItem={({ item }) => (
                                <View style={{ width: cardWidth, marginBottom: 20 }}>
                                    <InsightCard
                                        item={item}
                                        onPress={() => setSelectedItem(item)}
                                        desktopMode={isDesktop}
                                    />
                                </View>
                            )}
                            ListFooterComponent={<Footer />}
                        />
                    ) : (
                        /* Category Feed */
                        <FlatList
                            data={finalNewsData}
                            keyExtractor={(item) => item.id}
                            numColumns={numColumns}
                            key={`cat-${numColumns}`}
                            contentContainerStyle={{ paddingBottom: 60 }}
                            columnWrapperStyle={{ gap: 20, maxWidth: 1400, width: '100%', alignSelf: 'center', paddingHorizontal: 24 }}
                            ListHeaderComponent={
                                <View className="w-full items-center py-10 px-6">
                                    <View className="max-w-[1400px] w-full items-center">

                                        {/* Header Hero Section with Floating Lines */}
                                        <View className="relative w-full items-center py-12 mb-8">
                                            {/* Background Effect */}
                                            <View className="absolute inset-0 z-0">
                                                <FloatingLines
                                                    height={450}
                                                    enabledWaves={['top', 'middle', 'bottom']}
                                                    lineCount={5}
                                                    lineDistance={5}
                                                    bendRadius={5}
                                                    bendStrength={-0.5}
                                                    interactive={true}
                                                    parallax={true}
                                                />
                                            </View>

                                            <View className="flex-row items-center bg-blue-500/15 px-3.5 py-2 rounded-3xl mb-5 border border-blue-500/30">
                                                <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 shadow-sm shadow-blue-500" />
                                                <Text className="text-blue-500 text-[13px] font-semibold">실시간 AI 큐레이션</Text>
                                            </View>
                                            <Text className="text-3xl font-extrabold text-white text-center leading-[42px] mb-3 max-w-[600px]">
                                                오늘의 <Text className="text-sky-500">과학</Text>과 <Text className="text-emerald-500">경제</Text> 인사이트
                                            </Text>
                                            <Text className="text-slate-400 text-[15px] mb-6 text-center z-10">
                                                AI가 선별한 신뢰할 수 있는 뉴스를 카드로 빠르게 확인하세요
                                            </Text>

                                            {/* Update Time & Stats */}
                                            <View className="flex-row items-center bg-slate-800/60 px-5 py-2.5 rounded-2xl border border-white/5 backdrop-blur-md">
                                                <View className="flex-row items-center">
                                                    <Sparkles size={14} color="#888" />
                                                    <Text className="text-slate-400 text-[13px] ml-1.5 mr-4">마지막 업데이트: 5분 전</Text>
                                                </View>
                                                <View className="w-[1px] h-3 bg-white/10 mr-4" />
                                                <View className="flex-row items-center gap-4">
                                                    <View className="flex-row items-center">
                                                        <View className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5" />
                                                        <Text className="text-slate-300 text-[13px]">과학 {finalNewsData.filter(i => i.category === 'Science').length}개</Text>
                                                    </View>
                                                    <View className="flex-row items-center">
                                                        <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                                        <Text className="text-slate-300 text-[13px]">경제 {finalNewsData.filter(i => i.category === 'Economy').length}개</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Filter Tabs (Mobile) & Search (Desktop) */}
                                        <View className="w-full items-center mb-6">
                                            {isDesktop ? (
                                                <View className="w-full max-w-[600px]">
                                                    <View className="flex-row items-center bg-slate-900 border border-slate-700/50 rounded-2xl px-5 py-4 shadow-xl shadow-black/20">
                                                        <Search color="#64748B" size={24} style={{ marginRight: 12 }} />
                                                        <TextInput
                                                            className="flex-1 text-white text-lg font-medium outline-none"
                                                            placeholder="검색창"
                                                            placeholderTextColor="#64748B"
                                                            value={searchQuery}
                                                            onChangeText={setSearchQuery}
                                                        />
                                                    </View>
                                                </View>
                                            ) : (
                                                <View className="flex-row bg-white/10 p-2 rounded-full border-[1.5px] border-white/20 shadow-lg shadow-black/40">
                                                    {CATEGORIES.map((cat) => (
                                                        <TouchableOpacity
                                                            key={cat}
                                                            className={`flex-row items-center px-7 py-3.5 rounded-full ${activeCategory === cat ? 'bg-white/20 border-white/30 border-[1.5px] shadow-lg shadow-blue-500/40' : ''}`}
                                                            onPress={() => setActiveCategory(cat)}
                                                        >
                                                            {cat === '전체' && <Sparkles size={14} color={activeCategory === '전체' ? '#fff' : '#888'} style={{ marginRight: 4 }} />}
                                                            <Text className={`text-[15px] font-semibold ${activeCategory === cat ? 'text-white' : 'text-slate-500'}`}>
                                                                {cat}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}
                                        </View>

                                        {/* Hot Keywords */}
                                        {hotKeywords.length > 0 && (
                                            <View className="mb-10 items-center w-full">
                                                <View className="flex-row items-center justify-center gap-3">
                                                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">🔥 HOT KEYWORDS</Text>
                                                    {isDesktop && (
                                                        <RotatingText
                                                            texts={hotKeywords}
                                                            textStyle={{ color: '#60A5FA', fontWeight: '700', fontSize: 13 }}
                                                        />
                                                    )}
                                                </View>
                                                {!isDesktop && (
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-2.5 mt-3">
                                                        {hotKeywords.map((keyword, index) => (
                                                            <TouchableOpacity
                                                                key={index}
                                                                className={`px-4 py-2 rounded-3xl border ${activeKeyword === keyword ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-800/50 border-white/10'}`}
                                                                onPress={() => setActiveKeyword(activeKeyword === keyword ? null : keyword)}
                                                            >
                                                                <Text className={`text-[13px] font-semibold ${activeKeyword === keyword ? 'text-blue-400' : 'text-slate-400'}`}>
                                                                    {keyword}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            }
                            renderItem={({ item }) => (
                                <View style={{ width: cardWidth, marginBottom: 20 }}>
                                    <InsightCard
                                        item={item}
                                        desktopMode={isDesktop}
                                        onPress={() => setSelectedItem(item)}
                                    />
                                </View>
                            )}
                            ListFooterComponent={<Footer />}
                        />
                    )}
                </View>
            )
            }

            {/* Detail Modal */}
            <InsightDetailModal
                item={selectedItem}
                visible={selectedItem !== null}
                onClose={() => setSelectedItem(null)}
            />
            <AuthModal
                visible={authModalVisible}
                onClose={() => setAuthModalVisible(false)}
            />
        </SafeAreaView >
    );
}
