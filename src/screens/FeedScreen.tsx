import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, useWindowDimensions, FlatList, TextInput, Animated, Easing } from 'react-native';
import { InsightCard } from '../components/InsightCard';
import { fetchNews, NewsItem } from '../services/newsService';
import { InsightDetailModal } from '../components/InsightDetailModal';
import { AuthModal } from '../components/AuthModal';
import { RotatingText } from '../components/RotatingText';
import { DashboardView } from '../components/DashboardView';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Search, Bell, User, X as CloseIcon, LogIn, Home as HomeIcon, Folder } from 'lucide-react-native';

// Filter categories
const CATEGORIES = ['전체', '과학', '국내경제', '해외경제'];

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

    // View Mode State: 'feed' or 'dashboard'
    const [viewMode, setViewMode] = useState<'feed' | 'dashboard'>('feed');

    // Hot Keywords State
    const [hotKeywords, setHotKeywords] = useState<string[]>([]);

    // ... (rest of the state and useEffects remain same)

    const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

    // Determines number of columns based on screen width (Responsive)
    const numColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
    const cardWidth = (width - (numColumns + 1) * 20) / numColumns; // Adjusted for gap

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
        <SafeAreaView className="flex-1 bg-[#050B14]">
            <StatusBar barStyle="light-content" />

            {/* Top Header */}
            <View className="flex-row justify-between items-center px-6 py-4 relative z-50">
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

                {isDesktop && (
                    <View className="absolute inset-0 flex-row justify-center items-center pointer-events-none">
                        <View className="flex-row items-center pointer-events-auto gap-4">

                            {/* 1. Left Control: Home Morphing */}
                            {viewMode === 'feed' ? (
                                /* Feed Mode: Simple Home Circle */
                                <TouchableOpacity
                                    className="w-12 h-12 rounded-full bg-slate-800/50 border border-white/5 items-center justify-center hover:bg-slate-700 transition-all"
                                    onPress={() => setViewMode('dashboard')}
                                >
                                    <HomeIcon size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            ) : (
                                /* Dashboard Mode: Expanded "Home | Scrap" Pill */
                                <View className="h-12 px-6 rounded-full bg-blue-600 flex-row items-center shadow-lg shadow-blue-500/20">
                                    <View className="flex-row items-center">
                                        <HomeIcon size={16} color="#fff" style={{ marginRight: 6 }} />
                                        <Text className="text-white font-bold text-sm">홈</Text>
                                    </View>

                                    <View className="w-[1px] h-3 bg-white/30 mx-4" />

                                    <TouchableOpacity
                                        className="flex-row items-center opacity-90 hover:opacity-100"
                                        onPress={() => { /* My Page Logic */ console.log("Open My Page"); }}
                                    >
                                        <User size={16} color="#fff" style={{ marginRight: 6 }} />
                                        <Text className="text-white font-bold text-sm">My</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* 2. Right Control: Category Morphing */}
                            {viewMode === 'feed' ? (
                                /* Feed Mode: Full Category Pill */
                                <View className="h-12 px-1 rounded-full bg-slate-900/80 border border-white/10 flex-row items-center backdrop-blur-md">
                                    {CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            className={`h-10 px-6 rounded-full justify-center ${activeCategory === cat ? 'bg-slate-700 shadow-sm' : 'hover:bg-white/5'}`}
                                            onPress={() => setActiveCategory(cat)}
                                        >
                                            <Text className={`text-sm font-semibold ${activeCategory === cat ? 'text-white' : 'text-slate-400'}`}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                /* Dashboard Mode: Collapsed Menu Circle */
                                <TouchableOpacity
                                    className="w-12 h-12 rounded-full bg-slate-800/50 border border-white/5 items-center justify-center hover:bg-slate-700 transition-all"
                                    onPress={() => setViewMode('feed')}
                                >
                                    <Sparkles size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            )}

                        </View>
                    </View>
                )}

                {/* Right: Auth & Icons */}
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

            {viewMode === 'dashboard' ? (
                <DashboardView
                    newsData={finalNewsData}
                    hotKeywords={hotKeywords}
                    user={user}
                    onLoginPress={() => setAuthModalVisible(true)}
                />
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

                    {/* Title Section */}
                    <View className="items-center py-10 px-5">
                        <View className="flex-row items-center bg-blue-500/15 px-3.5 py-2 rounded-3xl mb-5 border border-blue-500/30">
                            <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 shadow-sm shadow-blue-500" />
                            <Text className="text-blue-500 text-[13px] font-semibold">실시간 AI 큐레이션</Text>
                        </View>
                        <Text className="text-3xl font-extrabold text-white text-center leading-[42px] mb-3 max-w-[600px]">
                            오늘의 <Text className="text-sky-500">과학</Text>과 <Text className="text-emerald-500">경제</Text> 인사이트
                        </Text>
                        <Text className="text-slate-400 text-[15px] mb-5 text-center">
                            AI가 선별한 신뢰할 수 있는 뉴스를 카드로 빠르게 확인하세요
                        </Text>

                        {/* Update Time & Stats Row */}
                        <View className="flex-row items-center bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                            <View className="flex-row items-center">
                                <Sparkles size={14} color="#888" />
                                <Text className="text-slate-500 text-[13px] ml-1.5 mr-4">마지막 업데이트: 5분 전</Text>
                            </View>
                            <View className="w-[1px] h-3 bg-white/10 mr-4" />
                            <View className="flex-row items-center gap-4">
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

                    {/* Filter Tabs (Mobile Only) and Desktop Large Search */}
                    <View className="items-center mb-2 w-full px-5">
                        {isDesktop ? (
                            <View className="w-full max-w-[600px] mb-4">
                                <View className="flex-row items-center bg-slate-900 border border-slate-700/50 rounded-2xl px-5 py-4 shadow-xl shadow-black/20">
                                    <Search color="#64748B" size={24} style={{ marginRight: 12 }} />
                                    <TextInput
                                        className="flex-1 text-white text-lg font-medium outline-none" // outline-none for web
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
                                {isDesktop ? (
                                    <RotatingText
                                        texts={hotKeywords}
                                        textStyle={{ color: '#60A5FA', fontWeight: '700', fontSize: 13 }}
                                    />
                                ) : null}
                            </View>

                            {/* Mobile: Scrollable List (Hidden on Desktop) */}
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



                    {/* Masonry Grid */}
                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-white">Loading latest AI news...</Text>
                        </View>
                    ) : (
                        <FlatList
                            key={`grid-${numColumns}`} // Force re-render when columns change
                            data={finalNewsData}
                            renderItem={({ item }) => (
                                <View style={{ width: cardWidth, marginBottom: 20 }}>
                                    <InsightCard
                                        item={item}
                                        desktopMode={isDesktop}
                                        onPress={() => setSelectedItem(item)}
                                        onBookmarkPress={() => {
                                            if (!user) {
                                                setAuthModalVisible(true);
                                            } else {
                                                // Future: Implement quick bookmark toggle here
                                            }
                                        }}
                                    />
                                </View>
                            )}
                            keyExtractor={item => item.id}
                            numColumns={numColumns}
                            columnWrapperStyle={{ gap: 16 }}
                            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                            onEndReached={loadMoreNews}
                            onEndReachedThreshold={0.5}
                        />
                    )}
                </ScrollView>
            )}

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
