import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, useWindowDimensions, FlatList, TextInput, Animated, Easing, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InsightCard } from '../components/InsightCard';
import { fetchAICards, AICardNews, getScrappedIds, toggleScrap } from '../services/newsService';
import { InsightDetailModal } from '../components/InsightDetailModal';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { AuthModal } from '../components/AuthModal';
import { RotatingText } from '../components/RotatingText';
import { DashboardView } from '../components/DashboardView';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../utils/icons';
import { FloatingLines } from '../components/FloatingLines';
import { MainLayout } from '../components/MainLayout';
import { ConnectHomeView } from '../components/ConnectHomeView';
import { ConnectScreen } from './ConnectScreen';
import { GovernmentDetailScreen } from './GovernmentDetailScreen';
import { SettingsScreen } from './SettingsScreen';
import { Workspace } from '../components/Workspace';
import { GrantList } from './GrantList';
import Footer from '../components/Footer';
import { Separator } from '../components/Separator';
import { OnboardingModal } from '../components/OnboardingModal';
import { HotKeywords } from '../components/HotKeywords';
import { InsightListItem } from '../components/InsightListItem';
import { AnalysisResultScreen } from './AnalysisResultScreen';
import { createProject } from '../services/projects';
import { useProjectStore } from '../store/useProjectStore';

// Filter categories
const CATEGORIES = ['전체'];

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

interface FeedScreenProps {
    initialCategory?: string;
}

export const FeedScreen = ({ initialCategory = '전체' }: FeedScreenProps) => {
    const { width } = useWindowDimensions();
    // Scrap State
    const [scrappedIds, setScrappedIds] = useState<Set<string>>(new Set());
    const { user, profileComplete, authEvent, signOut } = useAuth(); // Destructure signOut & authEvent

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
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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

    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState(''); // Search State
    const [isSearchVisible, setIsSearchVisible] = useState(false); // Search Toggle
    const [newsData, setNewsData] = useState<any[]>([]); // Use flexible type or define new interface
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

    const [viewMode, setViewMode] = useState<'feed' | 'connect' | 'lounge' | 'workspace' | 'settings' | 'grants'>('connect');
    const [targetUserId, setTargetUserId] = useState<string | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
    const [selectedAnalysisResult, setSelectedAnalysisResult] = useState<any | null>(null);
    const setProjectStore = useProjectStore(state => state.setProject); // For passing draft to workspace

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
                // If user logs out, force Connect Mode and clear personal data
                if (!user) {
                    setViewMode('connect');
                    setNotifications([]); // Clear notifications
                    setActiveCategory('전체'); // Reset category
                    return;
                }

                // If logged in, reload notifications (Mock flush)
                setNotifications(MOCK_NOTIFICATIONS);

                // Check Onboarding Status - ONLY show modal on active SIGNED_IN event (fresh login/signup)
                // This prevents the modal from popping up every time the app reloads for developers.
                if (user && !profileComplete && authEvent === 'SIGNED_IN') {
                    setIsProfileModalOpen(true);
                } else if (profileComplete) {
                    setIsProfileModalOpen(false);
                }

                const savedViewMode = await AsyncStorage.getItem('viewMode');
                const savedCategory = await AsyncStorage.getItem('activeCategory');

                if (savedViewMode) {
                    // Always land on Connect Hub ('connect') as the main page
                    if (savedViewMode === 'feed') {
                        setViewMode('connect');
                    } else if (savedViewMode === 'workspace' && !user) {
                        setViewMode('connect');
                    } else {
                        setViewMode(savedViewMode as any);
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
                item.tags.some((t: string) => t.includes(activeKeyword.replace('#', '')))
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

        // 상대 시간 계산 함수
        const getRelativeTime = (dateString: string) => {
            const now = new Date();
            const past = new Date(dateString);
            const diffMs = now.getTime() - past.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 1) return '방금 전';
            if (diffMins < 60) return `${diffMins}분 전`;
            if (diffHours < 24) return `${diffHours}시간 전`;
            if (diffDays < 7) return `${diffDays}일 전`;
            return past.toLocaleDateString('ko-KR');
        };

        const mappedData = aiCards.map((card, index) => {
            // 안전한 content 파싱
            let cardData;
            try {
                if (!card.content || card.content === 'undefined') {
                    console.warn('Invalid card content:', card.id);
                    return null; // 잘못된 카드는 스킵
                }
                cardData = JSON.parse(card.content);
            } catch (e) {
                console.error('Failed to parse card content:', card.id, e);
                return null; // 파싱 실패한 카드는 스킵
            }

            return {
                id: card.id,
                title: cardData.headline || cardData.title,
                summary: cardData.body,
                aiSummary: cardData.body,
                imageUrl: cardData.imageUrl || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop',
                category: cardData.category === 'Science' ? 'Science' : 'Economy',
                source: 'AI Insight',
                sourceUrl: '',
                timestamp: getRelativeTime(card.created_at),
                readTime: '3 min 읽기',
                tags: cardData.bullets || [],
                related_materials: cardData.related_materials || []
            };
        }).filter(Boolean); // null 제거

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
                viewMode === 'workspace' ? (
                    <View className="flex-1 bg-black">
                        <Workspace onClose={() => {
                            setViewMode('connect');
                        }} />
                    </View>
                ) : viewMode === 'settings' ? (
                    <SettingsScreen onBack={() => setViewMode('workspace')} />
                ) : null
            }
            {viewMode === 'connect' && (
                <ConnectHomeView
                    onNavigateToLounge={() => setViewMode('lounge')}
                    onNavigateToWorkspace={() => setViewMode('workspace')}
                    onNavigateToGrantList={() => setViewMode('grants')}
                    onProgramSelect={(program) => setSelectedProgram(program)}
                    onLoginPress={() => setAuthModalVisible(true)}
                />
            )}
            {viewMode === 'grants' && (
                <GrantList
                    onBack={() => setViewMode('connect')}
                    onSelectGrant={(grant) => setSelectedProgram(grant)}
                />
            )}
            {viewMode === 'lounge' && (
                <ConnectScreen
                    onLoginRequired={() => setAuthModalVisible(true)}
                    onNavigateToProfile={(userId) => {
                        console.log('Navigate to profile:', userId);
                        // Profile view is now integrated into Workspace or a separate component could be added if needed
                        // For now, we just log it or we could navigate to a dedicated ProfileScreen
                    }}
                />
            )}

            {/* Government Program Detail Overlay */}
            {/* Government Program Detail Overlay */}
            {selectedProgram && (
                <View className="absolute inset-0 z-50 bg-[#020617]">
                    <GovernmentDetailScreen
                        program={selectedProgram}
                        onBack={() => setSelectedProgram(null)}
                        onAnalyzeComplete={(result: any) => setSelectedAnalysisResult(result)}
                        onStartAnalysis={(program) => {
                            // 1. Close Overlay
                            setSelectedProgram(null);

                            // 2. Prepare Session for Agent
                            console.log("🚀 Starting Agent Analysis for:", program.title);
                            const autoSession = {
                                id: 'auto-' + Date.now(),
                                title: program.title,
                                mode: 'Grant Strategist',
                                workspace_data: [
                                    {
                                        root_node: `Analyzing: ${program.title}`,
                                        branches: []
                                    }
                                ],
                                chat_history: [
                                    { sender: 'ai', text: `안녕하세요! '${program.title}' 공고를 기반으로 맞춤형 합격 전략을 수립하겠습니다. 3단계(적합성-전략-실행) 분석을 시작합니다.` }
                                ],
                                // 🌟 Magic Query to Trigger Agent
                                auto_run_query: `Analyze this government grant program: ${program.title}.\n\nContext:\n- Agency: ${program.agency}\n- Target: ${program.target}\n- Tech Field: ${program.tech_field}\n\nTask: Provide a comprehensive strategy including Fit Analysis, Winning Strategy, and Action Plan.`
                            };

                            // 3. Navigate to Workspace (via store)
                            setProjectStore(program, autoSession as any);
                            setViewMode('workspace');
                        }}
                    />
                </View>
            )}

            {/* Analysis Result Overlay */}
            {selectedAnalysisResult && (
                <View className="absolute inset-0 z-[60] bg-[#020617]">
                    <AnalysisResultScreen
                        result={selectedAnalysisResult}
                        onClose={() => setSelectedAnalysisResult(null)}
                        onOpenDraft={async (content) => {
                            try {
                                if (!user) {
                                    Alert.alert('로그인 필요', '프로젝트를 생성하려면 로그인이 필요합니다.');
                                    return;
                                }

                                // 1. Construct Initial Workspace Data (Agent Context)
                                const initialSession = {
                                    id: 'project-' + Date.now(),
                                    title: selectedProgram?.title || 'New Project',
                                    mode: 'Hypothesis Generator',
                                    workspace_data: [
                                        {
                                            root_node: selectedProgram?.title || "Business Plan",
                                            branches: [
                                                {
                                                    id: 'analysis-root',
                                                    label: 'Analysis Strategy',
                                                    description: content.substring(0, 500) + '...', // Summary for node
                                                    full_content: content, // Full strategy stored
                                                    type: 'text',
                                                    status: 'done'
                                                }
                                            ]
                                        }
                                    ],
                                    chat_history: [
                                        { sender: 'ai', text: `안녕하세요! '${selectedProgram?.title}' 지원을 위한 분석 리포트가 준비되었습니다. 이 내용을 바탕으로 가설 수립 및 서류 작성을 도와 드릴까요?` }
                                    ]
                                };

                                // 2. PERSIST TO DB (Projects Table)
                                let projectId = initialSession.id;
                                try {
                                    const newProject = await createProject(
                                        user.id,
                                        selectedProgram?.id || 'manual',
                                        selectedProgram?.title || 'New Grant Project',
                                        initialSession
                                    );
                                    if (newProject) {
                                        projectId = newProject.id;
                                    }
                                } catch (dbError) {
                                    console.error("DB Save failed, proceeding with local session for demo:", dbError);
                                }

                                // 3. State Updates & Navigation (Fail-safe with stabilization)
                                // We clear overlays FIRST to avoid z-index conflicts
                                setSelectedAnalysisResult(null);
                                setSelectedProgram(null);

                                // Set session data via ProjectStore
                                setProjectStore(
                                    selectedProgram, // Even if it was nullified above, maybe we shouldn't nullify it first? Actually, let's keep it null for the grant, but valid for the session.
                                    {
                                        ...initialSession,
                                        id: projectId
                                    } as any
                                );

                                // Small delay to ensure React handles overlay unmounting before Workspace mounting
                                setTimeout(() => {
                                    setViewMode('workspace');
                                }, 100);

                            } catch (e) {
                                console.error("Critical failure starting project:", e);
                                Alert.alert("오류", "프로젝트 시작 중 치명적인 오류가 발생했습니다.");
                            }
                        }}
                    />
                </View>
            )}
            {viewMode === 'feed' && (
                /* FEED MODE */
                <View className="flex-1 w-full bg-[#050B14]">
                    <FlatList
                        data={finalNewsData}
                        keyExtractor={(item) => item.id}
                        numColumns={1}
                        key={`all-list`}
                        contentContainerStyle={{ paddingBottom: 60 }}
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
                            <View className="w-full max-w-[1400px] self-center px-6">
                                <InsightListItem
                                    item={item}
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
            <Modal
                visible={isProfileModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsProfileModalOpen(false)}
            >
                <ProfileSetupScreen
                    isEditing={false}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            </Modal>
        </MainLayout>
    );
}
