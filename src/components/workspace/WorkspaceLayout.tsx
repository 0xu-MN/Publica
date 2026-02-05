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
import { MessageSquare, Bookmark, RefreshCw, X } from 'lucide-react-native';

interface WorkspaceLayoutProps {
    onClose?: () => void;
}

export const WorkspaceLayout = ({ onClose }: WorkspaceLayoutProps) => {
    // Default to 'home'
    const [activeTab, setActiveTabState] = useState<WorkspaceTab>('home');
    const [isLoaded, setIsLoaded] = useState(false);
    const { user } = useAuth();

    // Session Load State for Agent
    const [sessionToLoad, setSessionToLoad] = useState<any>(null);

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
    const profilePanelWidth = useRef(new Animated.Value(0)).current;

    // Calendar state
    const [calendarVisible, setCalendarVisible] = useState(false);

    // Persistence Logic
    useEffect(() => {
        const loadTab = async () => {
            try {
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

    const setActiveTab = async (tab: WorkspaceTab) => {
        // Handle profile tab separately - toggle panel instead of changing tab
        if (tab === 'profile') {
            setShowProfilePanel(prev => !prev);
            return;
        }

        setActiveTabState(tab);
        if (tab !== 'agent') setSessionToLoad(null);

        // Close profile panel when switching tabs
        setShowProfilePanel(false);

        try {
            await AsyncStorage.setItem('WORKSPACE_ACTIVE_TAB', tab);
        } catch (e) {
            console.error("❌ [Persistence] Failed to save tab state", e);
        }
    };

    const handleOpenProject = (session: any) => {
        setSessionToLoad(session);
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
                return <WorkspaceDashboard onOpenCalendar={() => setCalendarVisible(true)} />;
            case 'agent':
                return <AgentView initialSession={sessionToLoad} />;
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
                        <SettingsModal visible={true} onClose={() => setActiveTab('home')} />
                    </View>
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
                    <View className="h-full bg-[#0F172A]/80 backdrop-blur-xl rounded-l-[24px] border-l border-t border-b border-white/5 shadow-2xl">
                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={() => setShowProfilePanel(false)}
                            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-slate-800/60 backdrop-blur-sm items-center justify-center border border-white/10"
                            style={{ opacity: showProfilePanel ? 1 : 0 }}
                        >
                            <X size={18} color="#94A3B8" strokeWidth={2.5} />
                        </TouchableOpacity>

                        {/* Profile Card */}
                        <View className="flex-1 p-6">
                            <ProfileCard
                                onEditProfile={() => {
                                    // Navigate to profile edit - for now just close panel
                                    setShowProfilePanel(false);
                                }}
                                onChatPress={() => {
                                    setShowProfilePanel(false);
                                    setActiveTab('chat');
                                }}
                            />
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* Main Content - Gets pushed when panel opens */}
            <View className="flex-1 flex-col">
                {renderContent()}
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
