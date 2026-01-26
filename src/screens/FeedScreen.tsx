import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, useWindowDimensions, FlatList, TextInput, Animated, Easing, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InsightCard } from '../components/InsightCard';
import { fetchAICards, AICardNews, getScrappedIds, toggleScrap } from '../services/newsService';
import { InsightDetailModal } from '../components/InsightDetailModal';
import { AuthModal } from '../components/AuthModal';
import { RotatingText } from '../components/RotatingText';
import { DashboardView } from '../components/DashboardView';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../utils/icons';
import { FloatingLines } from '../components/FloatingLines';
import { MainLayout } from '../components/MainLayout';
import { SupportScreen } from './SupportScreen';
import { PersonalDashboard } from '../components/PersonalDashboard';
import { SettingsScreen } from './SettingsScreen';
import { Workspace } from '../components/Workspace';
import { AnimatedPillNav } from '../components/AnimatedPillNav';
import Footer from '../components/Footer';
import { Separator } from '../components/Separator';
import { OnboardingModal } from '../components/OnboardingModal';

// Filter categories
const CATEGORIES = ['전체', '과학', '경제'];

interface FeedNotification {
    id: string;
    type: 'like' | 'comment' | 'chat';
    content: string;
    time: string;
    isRead: boolean;
    sender: string;
}

const MOCK_NOTIFICATIONS: FeedNotification[] = [
    { id: '1', type: 'like', content: '회원님의 "스타트업 초기 자금..." 게시글을 좋아합니다.', time: '방금 전', isRead: false, sender: '김투자' },
    { id: '2', type: 'comment', content: '좋은 정보 감사합니다! 혹시 자세한...', time: '10분 전', isRead: false, sender: '이창업' },
    { id: '3', type: 'chat', content: '안녕하세요, 협업 관련 문의드립니다.', time: '1시간 전', isRead: true, sender: '박대표' },
    { id: '4', type: 'like', content: '회원님의 댓글을 좋아합니다.', time: '3시간 전', isRead: true, sender: '최개발' },
];

export const FeedScreen = () => {
    const { width } = useWindowDimensions();
    // Scrap State
    const [scrappedIds, setScrappedIds] = useState<Set<string>>(new Set());
    const { user, signOut } = useAuth(); // Destructure signOut

    useEffect(() => {
        if (user) {
            loadScraps();
        } else {
            setScrappedIds(new Set());
        }
    }, [user]);

    const loadScraps = async () => {
        if (!user) return;
        const ids = await getScrappedIds(user.id);
        setScrappedIds(ids);
    }
    // 1. Action: User clicks scrap button in Feed List
    const handleScrap = async (item: any) => {
        console.log('handleScrap triggered for:', item.title);

        if (!user) {
            Alert.alert('로그인 필요', '스크랩 하려면 로그인이 필요합니다.');
            setAuthModalVisible(true);
            return;
        }

        // Optimistic Update for UI responsiveness
        const isScrapped = scrappedIds.has(item.title);
        const newSet = new Set(scrappedIds);
        if (isScrapped) newSet.delete(item.title);
        else newSet.add(item.title);
        setScrappedIds(newSet);

        try {
            // Actual API Call
            await toggleScrap(user.id, item);
        } catch (e) {
            // Revert on error
            setScrappedIds(scrappedIds);
            console.error('Failed to toggle scrap', e);
        }
    };

    // 2. State Sync: Modal or other child component updated the scrap status
    const syncScrapState = (item: any, isScrapped: boolean) => {
        const newSet = new Set(scrappedIds);
        if (isScrapped) newSet.add(item.title);
        else newSet.delete(item.title);
        setScrappedIds(newSet);
    };

    const [authModalVisible, setAuthModalVisible] = useState(false);
    const [onboardingVisible, setOnboardingVisible] = useState(false);

    // Notification & User Menu Logic
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<FeedNotification[]>(MOCK_NOTIFICATIONS);
    const hasNotification = notifications.some(n => !n.isRead);
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (hasNotification) {
            const wiggle = Animated.sequence([
                Animated.timing(rotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
                Animated.delay(1000)
            ]);
            Animated.loop(wiggle).start();
        } else {
            rotateAnim.setValue(0);
        }
    }, [hasNotification]);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-15deg', '15deg']
    });

    const [activeCategory, setActiveCategory] = useState('전체');
    const [searchQuery, setSearchQuery] = useState(''); // Search State
    const [isSearchVisible, setIsSearchVisible] = useState(false); // Search Toggle
    const [newsData, setNewsData] = useState<any[]>([]); // Use flexible type or define new interface
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

    // View Mode State: 'feed' | 'dashboard' | 'support' | 'workspace' | 'public_profile' | 'settings'
    const [viewMode, setViewMode] = useState<'feed' | 'dashboard' | 'support' | 'workspace' | 'public_profile' | 'settings'>('feed');
    const [supportSubMode, setSupportSubMode] = useState<'overview' | 'support' | 'connect'>('overview');
    const [targetUserId, setTargetUserId] = useState<string | null>(null);

    // Load saved state on mount and handle Auth State changes
    useEffect(() => {
        // Sync scraps when returning to feed
        if (viewMode === 'feed' && user) {
            loadScraps();
        }
    }, [viewMode, user]);

    useEffect(() => {
        const loadSavedState = async () => {
            try {
                // If user logs out, force Feed Mode and clear personal data
                if (!user) {
                    setViewMode('feed');
                    setNotifications([]); // Clear notifications
                    setActiveCategory('전체'); // Reset category
                    return;
                }

                // If logged in, reload notifications (Mock flush)
                setNotifications(MOCK_NOTIFICATIONS);

                // Check Onboarding Status
                const storedProfile = await AsyncStorage.getItem('user_profile');
                if (!storedProfile) {
                    setOnboardingVisible(true);
                }

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
                // Adjust for new mock data structure if needed or ensure AICardNews has tags logic
                // For now, assume we might generate tags or just skip if tags missing
                (item.related_materials || []).forEach((mat: any) => {
                    // Mock logic for tags from AI cards if they don't have explicit tags
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

    // Auto-refresh feed every 2 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (viewMode === 'feed' && !loading) {
                loadNews();
            }
        }, 2 * 60 * 1000); // 2 minutes
        return () => clearInterval(interval);
    }, [viewMode, loading]);

    // Force re-render every minute to update "X minutes ago" display
    const [, forceUpdate] = useState({});
    useEffect(() => {
        const timer = setInterval(() => {
            forceUpdate({});
        }, 60 * 1000); // 1 minute
        return () => clearInterval(timer);
    }, []);

    const loadNews = async () => {
        setLoading(true);
        setActiveKeyword(null);

        let aiCards: AICardNews[] = [];

        try {
            // Fetch Data and Sync Scraps in Parallel
            await Promise.all([
                (async () => {
                    aiCards = await fetchAICards(activeCategory);
                })(),
                user ? loadScraps() : Promise.resolve()
            ]);
        } catch (e) {
            console.error("Error loading news/scraps", e);
        }

        const mappedData = aiCards.map((card, index) => ({
            id: card.id,
            title: card.headline,
            // Use body as summary, maybe truncate
            summary: card.body,
            aiSummary: card.body,
            imageUrl: card.imageUrl || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop', // Default or random
            category: card.category || (index % 2 === 0 ? 'Science' : 'Economy'), // Use provided category or fallback
            source: 'AI Insight',
            sourceUrl: '',
            timestamp: new Date(card.created_at).toLocaleDateString(),
            readTime: '3 min',
            tags: card.bullets ? card.bullets.slice(0, 2) : [], // Use bullets as tags for now
            related_materials: card.related_materials || [] // Pass related materials for detail modal
        }));

        // Set news data from database
        setNewsData(mappedData);

        setLastUpdateTime(new Date());
        setLoading(false);
    };

    const loadMoreNews = () => {
        // Pagination could be implemented here
    };

    const isDesktop = width >= 768; // Simple breakpoint for desktop, kept for InsightCard prop

    return (
        <MainLayout
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            supportSubMode={supportSubMode}
            setSupportSubMode={setSupportSubMode}
            user={user}
            onAuthModalOpen={() => setAuthModalVisible(true)}
            onSignOut={signOut}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearchVisible={isSearchVisible}
            setIsSearchVisible={setIsSearchVisible}
            notifications={notifications}
            setNotifications={setNotifications}
        >

            {
                viewMode === 'dashboard' ? (
                    <PersonalDashboard onNavigateToSettings={() => setViewMode('settings')} />
                ) : viewMode === 'public_profile' ? (
                    <PersonalDashboard readOnly={true} targetUserId={targetUserId || undefined} onClose={() => setViewMode('feed')} />
                ) : viewMode === 'workspace' ? (
                    <Workspace onClose={() => setViewMode('dashboard')} />
                ) : viewMode === 'settings' ? (
                    <SettingsScreen onBack={() => setViewMode('dashboard')} />
                ) : null // Render nothing if not dashboard or workspace, as support and feed are handled separately
            }
            {viewMode === 'support' && (
                <View className="flex-1">
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
                                            onInsightClick={setSelectedItem}
                                        />
                                        <Separator className="my-8" />
                                        <View className="px-6">
                                            <View className="flex-row items-center justify-between mb-6">
                                                <Text className="text-white text-xl font-bold">최신 인사이트</Text>

                                                {/* Stats Section moved here */}
                                                <View className="flex-row items-center bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                                                    <View className="flex-row items-center">
                                                        <Icons.Sparkles size={14} color="#888" />
                                                        <Text className="text-slate-500 text-[13px] ml-1.5 mr-4">
                                                            마지막 업데이트: {Math.floor((Date.now() - lastUpdateTime.getTime()) / 60000) === 0 ? '방금 전' : `${Math.floor((Date.now() - lastUpdateTime.getTime()) / 60000)}분 전`}
                                                        </Text>
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
                                        isScrapped={scrappedIds.has(item.title)}
                                        onBookmarkPress={() => handleScrap(item)}
                                    />
                                </View>
                            )}
                            ListFooterComponent={<Footer />}
                            refreshing={loading}
                            onRefresh={loadNews}
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
                                        </View>

                                        {/* Filter Tabs (Mobile) & Search (Desktop) */}
                                        <View className="w-full items-center mb-6">
                                            {isDesktop ? (
                                                <View className="w-full max-w-[600px]">
                                                    <View className="flex-row items-center bg-slate-900 border border-slate-700/50 rounded-2xl px-5 py-4 shadow-xl shadow-black/20">
                                                        <Icons.Search color="#64748B" size={24} style={{ marginRight: 12 }} />
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
                                                            {cat === '전체' && <Icons.Sparkles size={14} color={activeCategory === '전체' ? '#fff' : '#888'} style={{ marginRight: 4 }} />}
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
                                        isScrapped={scrappedIds.has(item.title)}
                                        onBookmarkPress={() => handleScrap(item)}
                                    />
                                </View>
                            )}
                            ListFooterComponent={<Footer />}
                            refreshing={loading}
                            onRefresh={loadNews}
                        />
                    )}
                </View>
            )
            }

            {/* Detail Modal */}
            <InsightDetailModal
                visible={selectedItem !== null}
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                isScrapped={selectedItem ? scrappedIds.has(selectedItem.title) : false}
                onToggleScrap={(item, isScrapped) => syncScrapState(item, isScrapped)}
            />
            <AuthModal
                visible={authModalVisible}
                onClose={() => setAuthModalVisible(false)}
            />
            <OnboardingModal
                visible={onboardingVisible}
                onClose={() => setOnboardingVisible(false)}
            />
        </MainLayout>
    );
}
