import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, useWindowDimensions, FlatList, TextInput } from 'react-native';
import { InsightCard } from '../components/InsightCard';
import { fetchNews, NewsItem } from '../services/newsService';
import { InsightDetailModal } from '../components/InsightDetailModal';
import { Sparkles, Search, Bell, User, X as CloseIcon } from 'lucide-react-native';

// Filter categories
const CATEGORIES = ['전체', '과학', '국내경제', '해외경제'];

export const FeedScreen = () => {
    const { width } = useWindowDimensions();
    const [activeCategory, setActiveCategory] = useState('전체');
    const [searchQuery, setSearchQuery] = useState(''); // Search State
    const [isSearchVisible, setIsSearchVisible] = useState(false); // Search Toggle
    const [newsData, setNewsData] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);

    // Hot Keywords State
    const [hotKeywords, setHotKeywords] = useState<string[]>([]);
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
            <View className="flex-row justify-between items-center px-6 py-4">
                <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-blue-500 rounded-lg items-center justify-center mr-3">
                        <Text className="text-white font-bold text-[22px]">I</Text>
                    </View>
                    <View>
                        <Text className="text-white font-extrabold text-lg tracking-tighter">InsightFlow</Text>
                        <Text className="text-slate-400 text-[11px] mt-0.5">AI 뉴스 큐레이션</Text>
                    </View>
                </View>
                <View className="flex-row">
                    {isSearchVisible ? (
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
                    )}
                    <Bell color="#fff" size={24} className="opacity-90 ml-5" />
                    <User color="#fff" size={24} className="opacity-90 ml-5" />
                </View>
            </View >

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
                    <View className="flex-row items-center">
                        <Sparkles size={14} color="#888" />
                        <Text className="text-slate-500 text-[13px] ml-1.5">마지막 업데이트: 5분 전</Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View className="items-center mb-6">
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
                </View>

                {/* Hot Keywords */}
                {hotKeywords.length > 0 && (
                    <View className="mb-6 items-center">
                        <Text className="text-slate-500 text-xs font-bold mb-3 uppercase tracking-widest">🔥 Hot Keywords</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-2.5">
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
                    </View>
                )}

                {/* Statistics or Count */}
                <View className="flex-row justify-center mb-7 gap-5">
                    <View className="flex-row items-center">
                        <View className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-2" />
                        <Text className="text-slate-400 text-[13px]">과학 {finalNewsData.filter(i => i.category === 'Science').length}개</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                        <Text className="text-slate-400 text-[13px]">경제 {finalNewsData.filter(i => i.category === 'Economy').length}개</Text>
                    </View>
                </View>

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

            {/* Detail Modal */}
            <InsightDetailModal
                item={selectedItem}
                visible={selectedItem !== null}
                onClose={() => setSelectedItem(null)}
            />
        </SafeAreaView >
    );
}
