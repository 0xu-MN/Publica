import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Sidebar, WorkspaceTab } from './Sidebar';
import { HomeView } from './views/HomeView';
import { WorkspaceDashboard } from './views/WorkspaceDashboard';
import { AgentView } from '../../features/agent/AgentView';
import { ChatRoom } from '../ChatRoom';
import { ChatListView } from '../ChatListView';
import { SettingsModal } from '../SettingsModal';
import { InsightListItem } from '../InsightListItem';
import { ProfileCard } from '../ProfileCard';
import { CalendarModal } from '../CalendarModal';
import { fetchScraps, toggleScrap } from '../../services/newsService';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../hooks/usePosts';
import { MessageSquare, Bookmark, RefreshCw, X, ArrowLeft, Trash2, Edit2, Database } from 'lucide-react-native';
import { ProfileEditPage } from '../ProfileEditPage';
import { useProjectStore } from '../../store/useProjectStore';
import { GrantList } from '../../screens/GrantList';
import { NexusEditView } from '../../features/agent/NexusEditView';
import { MyProjectsView } from './views/MyProjectsView';
import { PricingPage } from './views/PricingPage';
import { AdminScreen } from '../../screens/AdminScreen';

interface WorkspaceLayoutProps {
    onClose?: () => void;
}

export const WorkspaceLayout = ({ onClose }: WorkspaceLayoutProps) => {
    // Default to 'home'
    const [activeTab, setActiveTabState] = useState<WorkspaceTab>('home');
    const [isLoaded, setIsLoaded] = useState(false);
    const { user } = useAuth();

    // Project Store Sync
    const agentSession = useProjectStore(state => state.agentSession);
    const globalTabRequest = useProjectStore(state => state.globalTabRequest);
    const setGlobalTabRequest = useProjectStore(state => state.setGlobalTabRequest);

    // Chat states
    const [selectedChatUser, setSelectedChatUser] = useState<{ id: string; name: string } | undefined>(undefined);

    // Scrap states
    const [scraps, setScraps] = useState<any[]>([]);
    const [selectedScrap, setSelectedScrap] = useState<any | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('전체');

    // Settings state  
    const [settingsVisible, setSettingsVisible] = useState(false);

    // Profile panel state
    const [showProfilePanel, setShowProfilePanel] = useState(false);

    // Global Tab Routing (e.g. from AppHeader Pro button)
    useEffect(() => {
        if (globalTabRequest) {
            setActiveTabState(globalTabRequest as WorkspaceTab);
            setGlobalTabRequest(null);
        }
    }, [globalTabRequest, setGlobalTabRequest]);
    const profilePanelWidth = useRef(new Animated.Value(0)).current;

    // Calendar state
    const [calendarVisible, setCalendarVisible] = useState(false);

    // Profile Post List state
    const [showMyPosts, setShowMyPosts] = useState(false);
    const { posts, deletePost } = usePosts();

    // Profile Edit state
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const profileEditPanelWidth = useRef(new Animated.Value(0)).current;

    // Persistence Logic
    useEffect(() => {
        const loadTab = async () => {
            try {
                // If agentSession is provided via store, force agent tab
                if (agentSession) {
                    console.log("🚀 Workspace Init with Store Session:", agentSession);
                    setActiveTabState('agent');
                    setIsLoaded(true);
                    return;
                }

                const saved = await AsyncStorage.getItem('WORKSPACE_ACTIVE_TAB');
                if (saved && (saved === 'home' || saved === 'agent')) {
                    setActiveTabState(saved as WorkspaceTab);
                }
            } catch (e) {
                console.error("❌ [Persistence] Failed to load tab state", e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTab();
    }, []);

    // Animate profile panel
    useEffect(() => {
        Animated.spring(profilePanelWidth, {
            toValue: showProfilePanel ? 340 : 0,
            useNativeDriver: false,
            friction: 9,
            tension: 60,
        }).start();
    }, [showProfilePanel]);

    // Animate profile edit panel
    useEffect(() => {
        Animated.spring(profileEditPanelWidth, {
            toValue: showProfileEdit ? 0 : -900,  // Slide from -900 (left) to 0
            useNativeDriver: true,
            friction: 10,
            tension: 65,
        }).start();
    }, [showProfileEdit]);

    const setActiveTab = async (tab: WorkspaceTab) => {
        // Handle profile tab separately - toggle panel instead of changing tab
        if (tab === 'profile') {
            setShowProfilePanel(prev => {
                if (prev) setShowMyPosts(false); // Reset when closing
                return !prev;
            });
            return;
        }

        setActiveTabState(tab);

        // Close profile panel when switching tabs
        setShowProfilePanel(false);
        setShowMyPosts(false); // Reset post view when switching tabs

        try {
            await AsyncStorage.setItem('WORKSPACE_ACTIVE_TAB', tab);
        } catch (e) {
            console.error("❌ [Persistence] Failed to save tab state", e);
        }
    };

    const handleOpenProject = (session: any) => {
        // Technically we should dispatch to ProjectStore here if they open from history
        useProjectStore.getState().setProject(null, session);
        setActiveTab('agent');
    };

    // Load scraps when scraps tab is active
    useEffect(() => {
        if (activeTab === 'scraps' && user) {
            loadScraps();
        }
    }, [activeTab, user]);

    const loadScraps = async () => {
        if (!user) return;
        const data = await fetchScraps(user.id);
        setScraps(data);
    };

    const handleUnscrap = async (item: any) => {
        if (!user) return;
        await toggleScrap(user.id, item);
        loadScraps();
    };

    // Filter scraps by category
    const uniqueCategories = ['전체', ...Array.from(new Set(scraps.map(s => s.category || '기타')))];
    const filteredScraps = selectedCategory === '전체'
        ? scraps
        : scraps.filter(s => (s.category || '기타') === selectedCategory);

    const renderContent = () => {
        if (!isLoaded) {
            return (
                <View className="flex-1 items-center justify-center bg-[#020617]">
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            );
        }

        switch (activeTab) {
            case 'home':
                return <WorkspaceDashboard
                    onOpenCalendar={() => setCalendarVisible(true)}
                    onNavigateToPortfolio={() => setActiveTab('projects')}
                    onLoadSession={(session: any) => {
                        useProjectStore.getState().setProject(null, {
                            id: session.id,
                            title: session.title || '',
                            mode: session.mode || 'Grant Strategist',
                            workspace_data: session.workspace_data || [],
                            chat_history: session.chat_history || [],
                            auto_run_query: session.auto_run_query || '',
                            grant_url: session.grant_url || session.original_url || '',
                            grant_title: session.title || '',
                            pdf_url: session.pdf_url || '',
                        });
                        setActiveTab('agent');
                    }}
                    onNavigateToGrants={() => setActiveTab('grants')}
                />;
            case 'grants':
                return (
                    <GrantList
                        onBack={() => setActiveTab('home')}
                        onSelectGrant={(grant) => {
                            // Navigate to Agent with this grant loaded
                            useProjectStore.getState().setProject(null, {
                                title: grant.title,
                                mode: 'Grant Strategist',
                                workspace_data: [],
                                auto_run_query: `"${grant.title}" 공고에 대한 전략 분석을 시작합니다.`,
                                grant_url: grant.original_url || grant.link || '',
                                grant_title: grant.title,
                                pdf_url: grant.file_url || '',
                            });
                            setActiveTab('agent');
                        }}
                    />
                );
            case 'nexus-edit':
                return <NexusEditView />;
            case 'projects':
                return (
                    <MyProjectsView
                        onNavigateToFlow={(sessionId) => {
                            useProjectStore.getState().setProject(null, { title: '', workspace_data: [], grant_url: '', grant_title: '', pdf_url: '' });
                            setActiveTab('agent');
                        }}
                        onNavigateToEdit={() => setActiveTab('nexus-edit')}
                    />
                );
            case 'agent':
                return <AgentView initialSession={agentSession} onNavigateToEdit={() => setActiveTab('nexus-edit')} />;
            case 'chat':
                return (
                    <View className="flex-1 flex-row bg-[#020617]">
                        <View className="w-80 border-r border-white/5">
                            <ChatListView
                                activeChatId={selectedChatUser?.id}
                                onSelectChat={(user) => setSelectedChatUser(user)}
                            />
                        </View>
                        <View className="flex-1">
                            {selectedChatUser ? (
                                <ChatRoom targetUser={selectedChatUser} />
                            ) : (
                                <View className="flex-1 items-center justify-center">
                                    <MessageSquare size={48} color="#334155" />
                                    <Text className="text-slate-500 mt-4 text-base">대화를 선택하세요</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            case 'scraps':
                return (
                    <ScrollView className="flex-1 bg-[#020617]">
                        <View className="p-6">
                            <View className="flex-row justify-between items-center mb-6">
                                <View>
                                    <Text className="text-white text-3xl font-bold mb-2">스크랩</Text>
                                    <Text className="text-slate-400 text-sm">저장한 인사이트 {scraps.length}개</Text>
                                </View>
                                <TouchableOpacity onPress={loadScraps} className="bg-slate-800 px-4 py-2 rounded-lg border border-white/10">
                                    <RefreshCw size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                                <View className="flex-row gap-2">
                                    {uniqueCategories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            onPress={() => setSelectedCategory(cat)}
                                            className={`px-4 py-2 rounded-full border ${selectedCategory === cat
                                                ? 'bg-blue-600 border-blue-500'
                                                : 'bg-slate-800 border-white/10'
                                                }`}
                                        >
                                            <Text className={`text-sm font-semibold ${selectedCategory === cat ? 'text-white' : 'text-slate-400'
                                                }`}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            {filteredScraps.length > 0 ? (
                                <View className="gap-4">
                                    {filteredScraps.map((scrap) => (
                                        <InsightListItem
                                            key={scrap.id}
                                            item={scrap}
                                            isScrapped={true}
                                            onBookmarkPress={() => handleUnscrap(scrap)}
                                            onPress={() => setSelectedScrap(scrap)}
                                        />
                                    ))}
                                </View>
                            ) : (
                                <View className="items-center py-20">
                                    <Bookmark size={48} color="#334155" />
                                    <Text className="text-slate-500 mt-4 text-base">저장된 인사이트가 없습니다</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                );
            case 'settings':
                return (
                    <View className="flex-1">
                        <SettingsModal visible={true} onClose={() => setActiveTab('home')} onNavigateAdmin={() => setActiveTab('admin')} />
                    </View>
                );
            case 'admin':
                return <AdminScreen />;
            case 'pricing':
                return (
                    <PricingPage
                        currentPlan="free"
                        onSelectPlan={(plan) => {
                            if (plan === 'pro') {
                                // TODO: Open Toss Payments checkout
                                console.log('Pro plan selected — Toss Payments flow');
                            }
                        }}
                    />
                );
            default:
                return <HomeView />;
        }
    };

    return (
        <View className="flex-1 flex-row bg-[#020617]">
            <Sidebar activeTab={showProfilePanel ? 'profile' : activeTab} onTabChange={setActiveTab} />

            {/* Animated Profile Panel */}
            <Animated.View
                style={{
                    width: profilePanelWidth,
                    overflow: 'hidden',
                }}
            >
                <View className="h-full p-3 pr-0">
                    <View className="h-full bg-[#0F172A]/80 backdrop-blur-xl rounded-[24px] border border-white/5 shadow-2xl">
                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={() => setShowProfilePanel(false)}
                            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-slate-800/60 backdrop-blur-sm items-center justify-center border border-white/10"
                            style={{ opacity: showProfilePanel ? 1 : 0 }}
                        >
                            <X size={18} color="#94A3B8" strokeWidth={2.5} />
                        </TouchableOpacity>

                        {/* Profile Content */}
                        <View className="flex-1 p-6">
                            {!showMyPosts ? (
                                <ProfileCard
                                    onEditProfile={() => {
                                        setShowProfileEdit(true);
                                    }}
                                    onChatPress={() => {
                                        setShowProfilePanel(false);
                                        setActiveTab('chat');
                                    }}
                                    onShowPosts={() => setShowMyPosts(true)}
                                />
                            ) : (
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-6">
                                        <TouchableOpacity
                                            onPress={() => setShowMyPosts(false)}
                                            className="w-10 h-10 rounded-full bg-slate-800/50 items-center justify-center mr-3"
                                        >
                                            <ArrowLeft size={20} color="#94A3B8" />
                                        </TouchableOpacity>
                                        <Text className="text-white text-xl font-bold">게시글 목록</Text>
                                    </View>

                                    <ScrollView showsVerticalScrollIndicator={false}>
                                        {posts.filter(p => p.authorId === user?.id || (user?.email && p.author.includes(user.email.split('@')[0]))).length > 0 ? (
                                            posts
                                                .filter(p => p.authorId === user?.id || (user?.email && p.author.includes(user.email.split('@')[0])))
                                                .map(post => (
                                                    <View key={post.id} className="mb-4 bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex-row items-center justify-between">
                                                        <View className="flex-1">
                                                            <Text className="text-white font-bold text-sm mb-1">{post.title}</Text>
                                                            <Text className="text-slate-400 text-xs" numberOfLines={1}>{post.content}</Text>
                                                        </View>
                                                        <View className="flex-row gap-2 ml-4">
                                                            <TouchableOpacity
                                                                className="bg-blue-600/20 px-3 py-1.5 rounded-lg border border-blue-500/30"
                                                                onPress={() => console.log('Edit post:', post.id)}
                                                            >
                                                                <Text className="text-blue-400 text-xs font-bold">수정</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                className="bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30"
                                                                onPress={() => deletePost(post.id)}
                                                            >
                                                                <Text className="text-red-400 text-xs font-bold">삭제</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ))
                                        ) : (
                                            <View className="items-center py-20">
                                                <View className="w-16 h-16 rounded-full bg-slate-800/50 items-center justify-center mb-4">
                                                    <Database size={32} color="#475569" />
                                                </View>
                                                <Text className="text-slate-500 text-base">작성한 게시글이 없습니다</Text>
                                            </View>
                                        )}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* Main Content - No longer affected by panels */}
            <View className="flex-1 flex-col">
                {renderContent()}
            </View>

            {/* Animated Profile Edit Panel Container - Clips the slide-in effect */}
            <View
                style={{
                    position: 'absolute',
                    left: 404, // Sidebar(64) + ProfilePanel(340)
                    top: 0,
                    bottom: 0,
                    width: 900,
                    overflow: 'hidden',
                    zIndex: 60,
                }}
                pointerEvents={showProfileEdit ? 'auto' : 'none'}
            >
                <Animated.View
                    style={{
                        flex: 1,
                        transform: [{ translateX: profileEditPanelWidth }],
                    }}
                >
                    <View className="h-full p-3 pl-0">
                        <View className="h-full bg-[#0F172A]/95 backdrop-blur-xl rounded-[24px] border border-white/5 shadow-2xl">
                            {/* Profile Edit Content */}
                            <View className="flex-1">
                                {showProfileEdit && (
                                    <ProfileEditPage
                                        onClose={() => setShowProfileEdit(false)}
                                        onSave={() => {
                                            setShowProfileEdit(false);
                                            // Profile will auto-reload from AsyncStorage
                                        }}
                                    />
                                )}
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Modals */}
            <CalendarModal
                visible={calendarVisible}
                onClose={() => setCalendarVisible(false)}
            />
            <SettingsModal
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
            />
        </View>
    );
};
