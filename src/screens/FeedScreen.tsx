import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, useWindowDimensions, Platform, FlatList, Animated, TextInput } from 'react-native';
import { InsightCard } from '../components/InsightCard';
import { fetchNews, NewsItem, subscribeToNews } from '../services/newsService';
import { supabase } from '../lib/supabase';
import { InsightDetailModal } from '../components/InsightDetailModal';
import { Sparkles, Search, Bell, User, X as CloseIcon } from 'lucide-react-native'; // Renamed X to CloseIcon to avoid conflict

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

    // Determines number of columns based on screen width (Responsive)
    const numColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
    const cardWidth = (width - (numColumns + 1) * 20) / numColumns; // Adjusted for gap

    useEffect(() => {
        loadNews();

        // 실시간 업데이트 구독 (선택사항)
        // const subscription = subscribeToNews((payload) => {
        //     console.log('Real-time update:', payload);
        //     // 새 데이터가 들어오면 새로고침 (혹은 리스트 앞에 추가)
        //     loadNews();
        // });

        // return () => {
        //     // supabase.removeChannel(subscription); // Assuming supabase is available for channel management
        // };
    }, [activeCategory]);

    const loadNews = async () => {
        setLoading(true);
        // Base category for fetching (Backend only knows Science/Economy)
        const fetchCategory = activeCategory === '전체' ? '전체'
            : activeCategory === '과학' ? '과학'
                : '경제'; // Both domestic and global fetch 'Economy'

        let data = await fetchNews(fetchCategory);

        // Client-side filtering for Domestic/Global and Search
        if (activeCategory === '국내경제') {
            const koreanSources = ['연합뉴스', '한국은행', '네이버', '조선비즈', '한겨레', '매일경제'];
            data = data.filter(item => koreanSources.some(k => item.source.includes(k)));
        } else if (activeCategory === '해외경제') {
            const koreanSources = ['연합뉴스', '한국은행', '네이버', '조선비즈', '한겨레', '매일경제'];
            data = data.filter(item => !koreanSources.some(k => item.source.includes(k)));
        }

        if (searchQuery.trim()) {
            data = data.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.summary.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setNewsData(data);
        setLoading(false);
    };

    // Reload when search changes
    useEffect(() => {
        loadNews();
    }, [searchQuery]);

    const loadMoreNews = () => {
        // Pagination could be implemented here
    };

    const isDesktop = width >= 768; // Simple breakpoint for desktop, kept for InsightCard prop

    const renderItem = ({ item }: { item: NewsItem }) => (
        <InsightCard
            item={item}
            desktopMode={isDesktop}
            onPress={() => setSelectedItem(item)}
            style={{ width: cardWidth, margin: 10 }}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Top Header */}
            <View style={styles.topHeader}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Text style={styles.logoText}>I</Text>
                    </View>
                    <View>
                        <Text style={styles.appName}>InsightFlow</Text>
                        <Text style={styles.appTagline}>AI 뉴스 큐레이션</Text>
                    </View>
                </View>
                <View style={styles.headerIcons}>
                    {isSearchVisible ? (
                        <View style={styles.searchBarContainer}>
                            <TextInput
                                style={styles.searchInput}
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
                            <Search color="#fff" size={24} style={styles.icon} />
                        </TouchableOpacity>
                    )}
                    <Bell color="#fff" size={24} style={styles.icon} />
                    <User color="#fff" size={24} style={styles.icon} />
                </View>
            </View >

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Title Section */}
                <View style={styles.titleSection}>
                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>실시간 AI 큐레이션</Text>
                    </View>
                    <Text style={styles.mainTitle}>
                        오늘의 <Text style={styles.highlightScience}>과학</Text>과 <Text style={styles.highlightEconomy}>경제</Text> 인사이트
                    </Text>
                    <Text style={styles.subTitle}>
                        AI가 선별한 신뢰할 수 있는 뉴스를 카드로 빠르게 확인하세요
                    </Text>
                    <View style={styles.updateInfo}>
                        <Sparkles size={14} color="#888" />
                        <Text style={styles.updateText}>마지막 업데이트: 5분 전</Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    <View style={styles.filterGroup}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.filterButton, activeCategory === cat && styles.filterButtonActive]}
                                onPress={() => setActiveCategory(cat)}
                            >
                                {cat === '전체' && <Sparkles size={14} color={activeCategory === '전체' ? '#fff' : '#888'} style={{ marginRight: 4 }} />}
                                <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Statistics or Count */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <View style={[styles.dot, { backgroundColor: '#0EA5E9' }]} />
                        <Text style={styles.statText}>과학 {newsData.filter(i => i.category === 'Science').length}개</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.statText}>경제 {newsData.filter(i => i.category === 'Economy').length}개</Text>
                    </View>
                </View>

                {/* Masonry Grid */}
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: 'white' }}>Loading latest AI news...</Text>
                    </View>
                ) : (
                    <FlatList
                        key={`grid-${numColumns}`} // Force re-render when columns change
                        data={newsData}
                        renderItem={({ item, index }) => (
                            <View style={{ width: cardWidth, marginBottom: 20 }}>
                                <InsightCard
                                    item={item}
                                    onPress={() => setSelectedItem(item)}
                                />
                            </View>
                        )}
                        keyExtractor={item => item.id}
                        numColumns={numColumns}
                        columnWrapperStyle={{ gap: 20 }}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050B14',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        width: 36,
        height: 36,
        backgroundColor: '#3B82F6', // Changed to Blue for InsightFlow brand
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    logoText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 22,
    },
    appName: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 18,
        letterSpacing: -0.5,
    },
    appTagline: {
        color: '#94A3B8',
        fontSize: 11,
        marginTop: 2,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    icon: {
        marginLeft: 20,
        opacity: 0.9,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginLeft: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        minWidth: 200,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        marginRight: 8,
        minWidth: 150,
        padding: 0, // Reset default padding
    },
    scrollContent: {
        paddingBottom: 60,
    },
    titleSection: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3B82F6',
        marginRight: 8,
        shadowColor: '#3B82F6',
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    liveText: {
        color: '#3B82F6',
        fontSize: 13,
        fontWeight: '600',
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 42,
        marginBottom: 12,
        maxWidth: 600, // Limit width on desktop
    },
    highlightScience: {
        color: '#0EA5E9',
    },
    highlightEconomy: {
        color: '#10B981',
    },
    subTitle: {
        color: '#94A3B8',
        fontSize: 15,
        marginBottom: 20,
        textAlign: 'center',
    },
    updateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateText: {
        color: '#64748B',
        fontSize: 13,
        marginLeft: 6,
    },
    filterContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    filterGroup: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        padding: 8,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.18)',
        ...Platform.select({
            web: {
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.37,
                shadowRadius: 16,
                elevation: 8,
            }
        }),
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 50,
    },
    filterButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        ...Platform.select({
            web: {
                backdropFilter: 'blur(30px) saturate(200%)',
                WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                boxShadow: `
                    0 4px 24px rgba(59, 130, 246, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                    0 1px 2px rgba(255, 255, 255, 0.4) inset
                `,
            },
            default: {
                shadowColor: "#3B82F6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 6,
            }
        }),
    },
    filterText: {
        color: '#64748B',
        fontSize: 15,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
        gap: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    statText: {
        color: '#94A3B8',
        fontSize: 13,
    },
    masonryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20, // Increased padding
        gap: 16, // Explicit gap for web support
    },
    desktopGrid: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 40,
    },
    column: {
        flex: 1,
        gap: 16, // Vertical gap between cards
    },
});
