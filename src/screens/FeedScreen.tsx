import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, useWindowDimensions, FlatList, TextInput, Animated, Easing, Alert, Modal, StyleSheet } from 'react-native';
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
import { PricingPage } from '../components/workspace/views/PricingPage';
import { LandingPage } from '../components/LandingPage';

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
    const [scrappedIds, setScrappedIds] = useState<Set<string>>(new Set());
    const { user, profileComplete, authEvent, signOut } = useAuth();

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

    const handleScrap = async (item: any) => {
        if (!user) {
            Alert.alert('로그인 필요', '스크랩 하려면 로그인이 필요합니다.');
            setAuthModalVisible(true);
            return;
        }

        const isScrapped = scrappedIds.has(item.title);
        const newSet = new Set(scrappedIds);
        if (isScrapped) newSet.delete(item.title);
        else newSet.add(item.title);
        setScrappedIds(newSet);

        try {
            await toggleScrap(user.id, item);
        } catch (e) {
            setScrappedIds(scrappedIds);
            console.error('Failed to toggle scrap', e);
        }
    };

    const syncScrapState = (item: any, isScrapped: boolean) => {
        const newSet = new Set(scrappedIds);
        if (isScrapped) newSet.add(item.title);
        else newSet.delete(item.title);
        setScrappedIds(newSet);
    };

    const [authModalVisible, setAuthModalVisible] = useState(false);
    const [onboardingVisible, setOnboardingVisible] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<FeedNotification[]>(MOCK_NOTIFICATIONS);
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [newsData, setNewsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'feed' | 'connect' | 'lounge' | 'workspace' | 'settings' | 'grants' | 'pricing' | 'landing'>('landing');
    const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
    const [selectedAnalysisResult, setSelectedAnalysisResult] = useState<any | null>(null);
    const setProjectStore = useProjectStore(state => state.setProject);

    useEffect(() => {
        if (viewMode === 'feed' && user) {
            loadScraps();
        }
    }, [viewMode, user]);

    useEffect(() => {
        const loadSavedState = async () => {
            try {
                if (!user) {
                    setViewMode('landing');
                    setNotifications([]);
                    setActiveCategory('전체');
                    return;
                }
                setNotifications(MOCK_NOTIFICATIONS);
                if (user && !profileComplete) {
                    setIsProfileModalOpen(true);
                } else if (profileComplete) {
                    setIsProfileModalOpen(false);
                }
                const savedViewMode = await AsyncStorage.getItem('viewMode');
                const savedCategory = await AsyncStorage.getItem('activeCategory');
                if (savedViewMode) {
                    if (savedViewMode === 'feed' || savedViewMode === 'landing') {
                        setViewMode('workspace');
                    } else if ((savedViewMode === 'workspace' || savedViewMode === 'connect') && !user) {
                        setViewMode('landing');
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
    }, [user]);

    useEffect(() => {
        AsyncStorage.setItem('viewMode', viewMode).catch(err => console.log('Failed to save viewMode:', err));
    }, [viewMode]);

    useEffect(() => {
        AsyncStorage.setItem('activeCategory', activeCategory).catch(err => console.log('Failed to save category:', err));
    }, [activeCategory]);

    const [hotKeywords, setHotKeywords] = useState<string[]>([]);
    const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

    useEffect(() => {
        if (newsData.length > 0) {
            const tagCounts: Record<string, number> = {};
            newsData.forEach(item => {
                (item.tags || []).forEach((tag: string) => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            });
            const sortedTags = Object.entries(tagCounts)
                .sort(([, countA], [, countB]) => countB - countA)
                .map(([tag]) => tag)
                .slice(0, 8);
            setHotKeywords(sortedTags);
        }
    }, [newsData]);

    const getFilteredNews = () => {
        let filtered = newsData;
        if (activeKeyword) {
            filtered = filtered.filter(item =>
                item.tags.some((t: string) => t.includes(activeKeyword.replace('#', '')))
            );
        }
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

    useEffect(() => {
        const interval = setInterval(() => {
            if (viewMode === 'feed' && !loading) {
                loadNews();
            }
        }, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [viewMode, loading]);

    const [, forceUpdate] = useState({});
    useEffect(() => {
        const timer = setInterval(() => {
            forceUpdate({});
        }, 60 * 1000);
        return () => clearInterval(timer);
    }, []);

    const loadNews = async () => {
        setLoading(true);
        setActiveKeyword(null);
        let aiCards: AICardNews[] = [];
        try {
            await Promise.all([
                (async () => {
                    aiCards = await fetchAICards(activeCategory);
                })(),
                user ? loadScraps() : Promise.resolve()
            ]);
        } catch (e) {
            console.error("Error loading news/scraps", e);
        }

        const getRelativeTime = (dateString: string) => {
            const now = new Date();
            const past = new Date(dateString);
            const diffMs = now.getTime() - past.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            if (diffMins < 1) return '방금 전';
            if (diffMins < 60) return `${diffMins}분 전`;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours < 24) return `${diffHours}시간 전`;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays < 7) return `${diffDays}일 전`;
            return past.toLocaleDateString('ko-KR');
        };

        const mappedData = aiCards.map((card) => {
            try {
                if (!card.content || card.content === 'undefined') return null;
                const cardData = JSON.parse(card.content);
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
            } catch (e) { return null; }
        }).filter(Boolean);

        setNewsData(mappedData);
        setLastUpdateTime(new Date());
        setLoading(false);
    };

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
            {viewMode === 'workspace' ? (
                <View style={styles.workspaceWrapper}>
                    <Workspace onClose={() => setViewMode('connect')} />
                </View>
            ) : viewMode === 'settings' ? (
                <SettingsScreen onBack={() => setViewMode('workspace')} />
            ) : viewMode === 'pricing' ? (
                <View style={styles.pricingWrapper}>
                    <PricingPage currentPlan="free" onRequireAuth={() => setAuthModalVisible(true)} />
                </View>
            ) : viewMode === 'landing' ? (
                <LandingPage
                    onLoginPress={() => setAuthModalVisible(true)}
                    onStartFree={() => setAuthModalVisible(true)}
                    onNavigateToPricing={() => setViewMode('pricing')}
                />
            ) : viewMode === 'connect' ? (
                <ConnectHomeView
                    onNavigateToLounge={() => setViewMode('lounge')}
                    onNavigateToWorkspace={() => setViewMode('workspace')}
                    onNavigateToGrantList={() => setViewMode('grants')}
                    onProgramSelect={(program) => setSelectedProgram(program)}
                    onLoginPress={() => setAuthModalVisible(true)}
                />
            ) : viewMode === 'grants' ? (
                <GrantList onBack={() => setViewMode('connect')} onSelectGrant={(grant) => setSelectedProgram(grant)} />
            ) : viewMode === 'lounge' ? (
                <ConnectScreen onLoginRequired={() => setAuthModalVisible(true)} onNavigateToProfile={(userId) => console.log('Profile:', userId)} />
            ) : null}

            {selectedProgram && (
                <View style={styles.overlay}>
                    <GovernmentDetailScreen
                        program={selectedProgram}
                        onBack={() => setSelectedProgram(null)}
                        onAnalyzeComplete={(result: any) => setSelectedAnalysisResult(result)}
                        onStartAnalysis={(program) => {
                            setSelectedProgram(null);
                            const autoSession = {
                                id: 'auto-' + Date.now(),
                                title: program.title,
                                mode: 'Grant Strategist',
                                workspace_data: [{ root_node: `Analyzing: ${program.title}`, branches: [] }],
                                chat_history: [{ sender: 'ai', text: `안녕하세요! '${program.title}' 공고를 기반으로 맞춤형 합격 전략을 수립하겠습니다.` }],
                                grant_url: program.application_url || program.original_url || '',
                                auto_run_query: `Analyze this government grant program: ${program.title}.`
                            };
                            setProjectStore(program, autoSession as any);
                            setViewMode('workspace');
                        }}
                    />
                </View>
            )}

            {selectedAnalysisResult && (
                <View style={styles.overlay}>
                    <AnalysisResultScreen
                        result={selectedAnalysisResult}
                        onClose={() => setSelectedAnalysisResult(null)}
                        onOpenDraft={async (content) => {
                            if (!user) { Alert.alert('로그인 필요', '프로젝트를 생성하려면 로그인이 필요합니다.'); return; }
                            const initialSession = {
                                id: 'project-' + Date.now(),
                                title: selectedProgram?.title || 'New Project',
                                mode: 'Hypothesis Generator',
                                workspace_data: [{ root_node: selectedProgram?.title || "Business Plan", branches: [{ id: 'analysis-root', label: 'Analysis Strategy', full_content: content, type: 'text', status: 'done' }] }],
                                chat_history: [{ sender: 'ai', text: `분석 리포트가 준비되었습니다.` }]
                            };
                            let projectId = initialSession.id;
                            try {
                                const newProject = await createProject(user.id, selectedProgram?.id || 'manual', selectedProgram?.title || 'New Grant Project', initialSession);
                                if (newProject) projectId = newProject.id;
                            } catch (e) {}
                            setSelectedAnalysisResult(null);
                            setSelectedProgram(null);
                            setProjectStore(selectedProgram, { ...initialSession, id: projectId } as any);
                            setTimeout(() => setViewMode('workspace'), 100);
                        }}
                    />
                </View>
            )}

            {viewMode === 'feed' && (
                <View style={styles.feedWrapper}>
                    <FlatList
                        data={finalNewsData}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={
                            <View style={styles.feedHeaderWrapper}>
                                <DashboardView
                                    newsData={finalNewsData}
                                    hotKeywords={hotKeywords}
                                    user={user}
                                    onLoginPress={() => setAuthModalVisible(true)}
                                    onInsightClick={setSelectedItem}
                                />
                                <Separator style={styles.feedSeparator} />
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>최신 인사이트</Text>
                                    <View style={styles.refreshBadge}>
                                        <View style={styles.refreshMeta}>
                                            <Icons.Sparkles size={14} color="#7C3AED" />
                                            <Text style={styles.refreshText}>
                                                업데이트: {Math.floor((Date.now() - lastUpdateTime.getTime()) / 60000) === 0 ? '방금 전' : `${Math.floor((Date.now() - lastUpdateTime.getTime()) / 60000)}분 전`}
                                            </Text>
                                        </View>
                                        <View style={styles.badgeDivider} />
                                        <View style={styles.statRow}>
                                            <View style={styles.statItem}>
                                                <View style={[styles.statDot, { backgroundColor: '#94A3B8' }]} />
                                                <Text style={styles.statText}>전체 {finalNewsData.length}</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <View style={[styles.statDot, { backgroundColor: '#818CF8' }]} />
                                                <Text style={styles.statText}>과학 {finalNewsData.filter(i => i.category === 'Science').length}</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                                                <Text style={styles.statText}>경제 {finalNewsData.filter(i => i.category === 'Economy').length}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.listItemWrapper}>
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
            )}

            <InsightDetailModal
                visible={selectedItem !== null}
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                isScrapped={selectedItem ? scrappedIds.has(selectedItem.title) : false}
                onToggleScrap={(item, isScrapped) => syncScrapState(item, isScrapped)}
            />
            <AuthModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
            <Modal visible={isProfileModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsProfileModalOpen(false)}>
                <ProfileSetupScreen isEditing={false} onClose={() => setIsProfileModalOpen(false)} />
            </Modal>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    workspaceWrapper: { flex: 1, backgroundColor: '#FDF8F3', width: '100%', height: '100%' },
    pricingWrapper: { flex: 1, width: '100%', backgroundColor: 'transparent' },
    overlay: { position: 'absolute', inset: 0, zIndex: 1000, backgroundColor: 'transparent' },
    feedWrapper: { flex: 1, width: '100%', backgroundColor: '#FDF8F3' },
    listContent: { paddingBottom: 60 },
    feedHeaderWrapper: { width: '100%', alignItems: 'center' },
    feedSeparator: { marginVertical: 32, opacity: 0.1 },
    sectionHeader: { width: '100%', maxWidth: 1400, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 48 },
    sectionTitle: { color: '#18181B', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    refreshBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#7C3AED10', paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10 },
    refreshMeta: { flexDirection: 'row', alignItems: 'center' },
    refreshText: { color: '#64748B', fontSize: 12, fontWeight: '700', marginLeft: 8, marginRight: 16 },
    badgeDivider: { width: 1, height: 12, backgroundColor: '#F1F5F9', marginRight: 16 },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center' },
    statDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statText: { color: '#475569', fontSize: 12, fontWeight: '800' },
    listItemWrapper: { width: '100%', maxWidth: 1400, alignSelf: 'center', paddingHorizontal: 48, marginBottom: 12 }
});
