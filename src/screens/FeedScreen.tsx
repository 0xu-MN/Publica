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
import { Home as HomeIcon, Folder, HeartHandshake, Building2, Users, Atom, TrendingUp, Sparkles, Search, Bell, User, X as CloseIcon, LogIn, Heart, MessageCircle, MessageSquare, LogOut, Settings } from 'lucide-react-native';
import { FloatingLines } from '../components/FloatingLines';
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

        // If DB is empty, use sample data from user request context or previous mock
        if (mappedData.length === 0) {
            const sampleCards = [
                {
                    id: 'sample-1',
                    title: 'AI 반도체의 미래: HBM4가 가져올 패러다임 변화',
                    summary: `AI 학습 데이터의 폭발적 증가로 메모리 대역폭이 연산 속도의 병목이 되고 있습니다. HBM4는 이를 해결할 '게임 체인저'로 평가받습니다.

✅ 핵심 이슈
삼성전자와 SK하이닉스, 그리고 TSMC의 3각 협력이 본격화되고 있습니다.
- 16단 적층 기술의 수율 안정화가 최대 관건입니다.
- 하이브리드 본딩 기술 도입으로 패키징 두께를 획기적으로 줄였습니다.
- 엔비디아 루빈(Rubin) 칩셋에 전량 탑재될 예정으로, 초기 물량 확보 전쟁이 치열합니다.`,
                    aiInsight: '💡 결론\nHBM4는 단순한 메모리를 넘어 로직 다이와 결합된 "시스템 메모리"로 진화하고 있습니다. 2026년 하반기, 이 기술을 선점하는 기업이 향후 AI 인프라 시장의 70%를 독식할 것으로 전망됩니다.',
                    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
                    category: 'Science',
                    source: 'AI Analysis',
                    timestamp: '방금 전',
                    readTime: '5분',
                    tags: ['#HBM4', '#반도체', '#AI인프라'],
                    related_materials: [
                        { title: 'SK하이닉스 HBM4 로드맵 공식 발표', url: 'https://news.skhynix.co.kr' },
                        { title: 'TrendForce: 2026 메모리 시장 전망', url: 'https://www.trendforce.com' },
                        { title: 'TSMC CoWoS 기술 백서', url: 'https://www.tsmc.com' }
                    ]
                },
                {
                    id: 'sample-2',
                    title: '미국 연준(Fed), 2026년 금리 정책 대전환 예고',
                    summary: `미국 노동시장이 완전 고용 상태에 근접하면서, 연준이 마침내 비둘기파적 기조로 돌아섰습니다. 이는 글로벌 자산 배분의 거대한 이동을 예고합니다.

✅ 핵심 이슈
제롬 파월 의장은 "인플레이션과의 전쟁은 끝났다"고 선언했습니다.
1. "실질 금리 중립화": 현재 3.5% 수준인 기준 금리를 2.5%까지 단계적으로 인하할 로드맵을 제시했습니다.
2. "유동성 공급 확대": 양적 긴축(QT)을 종료하고 시장에 다시 유동성을 공급하기 시작했습니다.
3. "이머징 마켓의 반격": 달러 약세 기조 속에서 한국을 포함한 신흥국 증시로의 자금 유입이 가속화될 것입니다.`,
                    aiInsight: '💡 결론\n"공포를 사고 환희에 팔아라"는 격언이 다시 유효해지는 시점입니다. 고금리 시대에 소외되었던 바이오, 신재생에너지, 그리고 AI 소프트웨어 섹터가 금리 인하의 최대 수혜를 입을 ‘주도주’로 부상할 것입니다.',
                    imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&q=80&w=800',
                    category: 'Economy',
                    source: 'Global Economy',
                    timestamp: '30분 전',
                    readTime: '4분',
                    tags: ['#금리인하', '#거시경제', '#투자전략'],
                    related_materials: [
                        { title: 'FOMC 의사록 전문 (2026.01)', url: 'https://www.federalreserve.gov' },
                        { title: 'WSJ: 월가의 금리 인하 기대감 분석', url: 'https://www.wsj.com' },
                        { title: 'IMF 세계 경제 전망 보고서', url: 'https://www.imf.org' }
                    ]
                },
                {
                    id: 'sample-3',
                    title: '양자 컴퓨터 상용화: 보안의 새로운 시대',
                    summary: `구글과 IBM이 100만 큐비트급 양자 프로세서 안정화에 성공했습니다. 이는 기존 RSA 암호 체계의 종말을 의미합니다.

✅ 핵심 이슈
양자 내성 암호(PQC)로의 전환은 선택이 아닌 생존의 문제입니다.
- "Show's Algorithm"의 현실화: 기존 슈퍼컴퓨터로 1만 년 걸릴 암호 해독이 단 몇 시간 만에 가능해졌습니다.
- 금융권의 비상: 전 세계 은행들이 레거시 시스템을 PQC 기반으로 전면 교체하는 '보안 대이동'을 시작했습니다.
- 국가 안보 위협: 군사 기밀 및 정부 통신망의 보안 체계가 근본적인 도전에 직면했습니다.`,
                    aiInsight: '💡 결론\n양자 보안은 단순한 기술 트렌드가 아닙니다. 다가오는 "Y2Q(Year to Quantum)" 위기에 대비하지 못한 기업과 국가는 디지털 주권을 잃게 될 것입니다. 보안 솔루션 기업들의 주가 재평가가 시급합니다.',
                    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800',
                    category: 'Science',
                    source: 'AI Analysis',
                    timestamp: '1시간 전',
                    readTime: '6분',
                    tags: ['#양자컴퓨팅', '#PQC', '#사이버보안'],
                    related_materials: [
                        { title: 'NIST PQC 표준 가이드라인', url: 'https://www.nist.gov' },
                        { title: 'Nature: 양자 오류 수정 기술의 진보', url: 'https://www.nature.com' },
                        { title: 'IBM Quantum Roadmap 2026', url: 'https://www.ibm.com/quantum' }
                    ]
                },
                {
                    id: 'sample-4',
                    title: '2026년 글로벌 에너지 시장: 수소 경제의 부상',
                    summary: `탄소 중립 실현을 위한 마지막 퍼즐 조각, '그린 수소'의 생산 단가가 티핑 포인트(kg당 2달러) 이하로 하락했습니다.

✅ 핵심 이슈
중동의 오일머니가 수소 인프라로 대거 이동하고 있습니다.
1. "네옴시티 프로젝트": 사우디아가 세계 최대 규모의 그린 수소 플랜트 가동을 시작했습니다.
2. "수소 운송 혁명": 액화 수소 운반선 발주량이 LNG 선박을 추월했습니다. 한국 조선업계의 새로운 먹거리입니다.
3. 에너지 안보: 화석 연료 의존도를 낮추려는 유럽의 공격적인 보조금 정책이 시장 확대를 견인하고 있습니다.`,
                    aiInsight: '💡 결론\n수소는 더 이상 미래의 에너지가 아닙니다. 생산-운송-활용 전 밸류체인에서 실제 수익이 창출되는 구간에 진입했습니다. 인프라 구축 관련 기업들이 초기 시장을 장악하며 제2의 테슬라가 될 가능성이 큽니다.',
                    imageUrl: 'https://images.unsplash.com/photo-1521579772986-463283623c21?auto=format&fit=crop&q=80&w=800',
                    category: 'Economy',
                    source: 'Energy Insight',
                    timestamp: '2시간 전',
                    readTime: '5분',
                    tags: ['#수소경제', '#친환경', '#조선업'],
                    related_materials: [
                        { title: 'IEA 2026 Energy Outlook', url: 'https://www.iea.org' },
                        { title: 'BloombergNEF: Hydrogen Market Report', url: 'https://about.bnef.com' },
                        { title: 'EU 수소 전략 백서', url: 'https://ec.europa.eu' }
                    ]
                }
            ];
            setNewsData(sampleCards);
        } else {
            setNewsData(mappedData);
        }

        setLastUpdateTime(new Date());
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

                                {/* Notification Bell Area */}
                                <View className="relative z-50">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsNotificationOpen(!isNotificationOpen);
                                            setIsUserMenuOpen(false);
                                        }}
                                        className="ml-5 relative"
                                    >
                                        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                                            <Bell color={hasNotification ? "#FDBA74" : "#fff"} size={24} className="opacity-90" fill={hasNotification ? "#FDBA74" : "none"} />
                                        </Animated.View>
                                        {hasNotification && (
                                            <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#020617]" />
                                        )}
                                    </TouchableOpacity>

                                    {/* Notification Dropdown */}
                                    {isNotificationOpen && (
                                        <View className="absolute top-10 right-[-50px] w-[320px] bg-[#1E293B] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[100]">
                                            <View className="p-4 border-b border-white/5 flex-row justify-between items-center bg-[#0F172A]">
                                                <Text className="text-white font-bold">알림</Text>
                                                <TouchableOpacity onPress={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}>
                                                    <Text className="text-xs text-slate-400">모두 읽음</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <ScrollView className="max-h-[300px]">
                                                {notifications.map((item) => (
                                                    <TouchableOpacity
                                                        key={item.id}
                                                        onPress={() => {
                                                            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
                                                        }}
                                                        className={`p-4 border-b border-white/5 flex-row gap-3 ${item.isRead ? 'opacity-50' : 'bg-blue-500/5'}`}
                                                    >
                                                        <View className={`w-8 h-8 rounded-full items-center justify-center ${item.type === 'like' ? 'bg-pink-500/20' :
                                                            item.type === 'comment' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                                                            }`}>
                                                            {item.type === 'like' && <Heart size={14} color="#EC4899" fill="#EC4899" />}
                                                            {item.type === 'comment' && <MessageCircle size={14} color="#3B82F6" fill="#3B82F6" />}
                                                            {item.type === 'chat' && <MessageSquare size={14} color="#A855F7" fill="#A855F7" />}
                                                        </View>
                                                        <View className="flex-1">
                                                            <View className="flex-row justify-between mb-1">
                                                                <Text className="text-white font-bold text-sm">{item.sender}</Text>
                                                                <Text className="text-slate-500 text-xs">{item.time}</Text>
                                                            </View>
                                                            <Text className="text-slate-300 text-xs leading-4" numberOfLines={2}>{item.content}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>

                                {/* User Menu Area */}
                                <View className="relative z-50">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsUserMenuOpen(!isUserMenuOpen);
                                            setIsNotificationOpen(false);
                                        }}
                                        className="ml-5"
                                    >
                                        <User color="#fff" size={24} className="opacity-90" />
                                    </TouchableOpacity>

                                    {/* User Dropdown */}
                                    {isUserMenuOpen && (
                                        <View className="absolute top-10 right-0 w-[200px] bg-[#1E293B] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[100]">
                                            <TouchableOpacity
                                                className="p-4 border-b border-white/5 flex-row items-center hover:bg-white/5"
                                                onPress={() => {
                                                    setViewMode('dashboard');
                                                    setIsUserMenuOpen(false);
                                                }}
                                            >
                                                <User size={16} color="#94A3B8" className="mr-3" />
                                                <Text className="text-slate-200">마이페이지</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                className="p-4 border-b border-white/5 flex-row items-center hover:bg-white/5"
                                                onPress={() => {
                                                    setViewMode('settings');
                                                    setIsUserMenuOpen(false);
                                                }}
                                            >
                                                <Settings size={16} color="#94A3B8" className="mr-3" />
                                                <Text className="text-slate-200">계정 설정</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                className="p-4 flex-row items-center hover:bg-white/5"
                                                onPress={() => {
                                                    signOut();
                                                    setIsUserMenuOpen(false);
                                                }}
                                            >
                                                <LogOut size={16} color="#EF4444" className="mr-3" />
                                                <Text className="text-red-400">로그아웃</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </View >

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
                                                        <Sparkles size={14} color="#888" />
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
        </SafeAreaView >
    );
}
