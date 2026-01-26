


import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Icons } from '../utils/icons';
import { ProfileCard } from './ProfileCard';
import { InsightCard } from './InsightCard';
import { ChatRoom } from './ChatRoom';
import { ChatListView } from './ChatListView';
import { CalendarModal } from './CalendarModal';
import { ProjectDetailModal } from './ProjectDetailModal';
import { SettingsModal } from './SettingsModal';
import Footer from './Footer';
import { DashboardSidebar } from './DashboardSidebar';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../hooks/usePosts';
import { fetchScraps, toggleScrap } from '../services/newsService';
import { Workspace } from './Workspace';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { InsightDetailPane } from './InsightDetailPane';
import { InsightDetailModal } from './InsightDetailModal';

interface PersonalDashboardProps {
    readOnly?: boolean;
    targetUserId?: string | null;
    onClose?: () => void;
    onNavigateToSettings?: () => void;
    activeTab?: 'dashboard' | 'scraps' | 'messages' | 'files'; // Added for initialTab
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
    activeTab: initialTab = 'dashboard',
    readOnly = false,
    targetUserId,
    onNavigateToSettings
}) => {
    const { user } = useAuth();
    const { posts, deletePost, updatePost } = usePosts();
    const windowWidth = Dimensions.get('window').width;
    const isDesktop = windowWidth >= 1024;

    // -- STATE DEFINITIONS --

    // Split View & Filter State
    const [selectedScrap, setSelectedScrap] = useState<any | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('전체');
    const [scraps, setScraps] = useState<any[]>([]);

    // Navigation & View State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'files' | 'posts' | 'messages' | 'scraps'>(initialTab as any);
    const [settingsVisible, setSettingsVisible] = useState(false);

    // Chat State
    const [chatVisible, setChatVisible] = useState(false);
    const [chatListVisible, setChatListVisible] = useState(false);
    const [selectedChatUser, setSelectedChatUser] = useState<{ id: string; name: string } | undefined>(undefined);

    // Productivity State
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [projectModalVisible, setProjectModalVisible] = useState(false);

    // Workspace State
    const [workspaceVisible, setWorkspaceVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState('');
    const [workspaceFile, setWorkspaceFile] = useState('');

    // -- COMPUTED VALUES --
    const uniqueCategories = ['전체', ...Array.from(new Set(scraps.map(s => s.category || '기타')))];
    const filteredScraps = selectedCategory === '전체'
        ? scraps
        : scraps.filter(s => (s.category || '기타') === selectedCategory);

    // -- EFFECTS --
    useEffect(() => {
        if (activeTab === 'scraps' && user) {
            loadScraps();
        }
    }, [activeTab, user]);

    // -- HANDLERS --
    const loadScraps = async () => {
        if (!user) {
            console.log('[DEBUG-PD] No user in dashboard, skipping load');
            return;
        }
        console.log('[DEBUG-PD] Loading scraps for user:', user.id);
        const data = await fetchScraps(user.id);
        console.log('[DEBUG-PD] Scraps loaded:', data.length);
        setScraps(data);
    };

    const handleUnscrap = async (item: any) => {
        if (!user) return;
        await toggleScrap(user.id, item);
        loadScraps(); // Refresh list
    };

    const openProjectDetail = (projectName: string) => {
        setSelectedProject(projectName);
        setProjectModalVisible(true);
        setActiveTab('files');
    };

    const openInWorkspace = (projectName: string) => {
        setSelectedProject(projectName);
        setWorkspaceFile(`${projectName}/main.md`);
        setWorkspaceVisible(true);
    };

    // -- RENDER INTERCEPTS --
    if (workspaceVisible) {
        return (
            <Workspace
                projectName={selectedProject}
                fileName={workspaceFile}
                onClose={() => setWorkspaceVisible(false)}
            />
        );
    }

    return (
        <View className="flex-1 flex-row bg-[#050B14]">
            {/* Left Sidebar Navigation */}
            <DashboardSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSettingsPress={() => setSettingsVisible(true)}
            />

            {/* Main Content */}
            {activeTab === 'dashboard' ? (
                <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 60 }}>
                    <View className="max-w-[1400px] w-full mx-auto">
                        <View className={isDesktop ? "flex-row gap-6 min-h-[600px]" : "gap-6"}>

                            {/* LEFT COLUMN: Tall Profile Card */}
                            <View className={isDesktop ? "w-[340px]" : "h-[520px]"}>
                                {/* Profile Card Area - Ensuring Full Height */}
                                <View className="h-full">
                                    <ProfileCard
                                        readOnly={readOnly}
                                        targetUserId={targetUserId || undefined}
                                        onChatPress={(userInfo) => {
                                            // Public View: Switch to Messages Tab and Open Chat
                                            setActiveTab('messages');
                                            if (userInfo) {
                                                setSelectedChatUser(userInfo);
                                            } else {
                                                setSelectedChatUser(targetUserId ? { id: targetUserId, name: 'User' } : undefined);
                                            }
                                        }}
                                        onScrapPress={() => setActiveTab('scraps')}
                                    />
                                </View>
                            </View>

                            {/* RIGHT COLUMN: Dashboard Widgets */}
                            <View className="flex-1 gap-6">
                                {/* Top Row: Schedule & Today's Brief */}
                                <View className={isDesktop ? "flex-row gap-6 h-[280px]" : "gap-6"}>
                                    {/* Recent Documents - CLICKABLE */}
                                    <View className="bg-[#0F172A] rounded-3xl p-6 border border-white/5 flex-1 relative overflow-hidden">
                                        <View className="absolute top-0 right-0 p-4 opacity-5">
                                            <Icons.FolderOpen size={120} color="white" />
                                        </View>
                                        <View className="flex-row items-center justify-between mb-4 relative z-10">
                                            <TouchableOpacity onPress={() => setActiveTab('files')}>
                                                <Text className="text-white font-bold text-lg">최근 문서</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setActiveTab('files')}>
                                                <Text className="text-blue-500 text-sm font-semibold">더보기</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View className="gap-3 relative z-10">
                                            <PaperItem title="Impact of AI on Kospi Volatility" />
                                            <PaperItem title="Next-Gen Lithography: EUV+" />
                                        </View>
                                    </View>

                                    {/* Today's Schedule Block - CLICKABLE with + Button */}
                                    <View className={`bg-[#0F172A] rounded-3xl p-6 border border-white/5 flex-1 ${isDesktop ? '' : 'h-[300px]'}`}>
                                        <View className="flex-row items-center justify-between mb-4">
                                            <TouchableOpacity
                                                className="flex-row items-center gap-2"
                                                onPress={() => setCalendarVisible(true)}
                                            >
                                                <Icons.Clock size={18} color="#F59E0B" />
                                                <Text className="text-white font-bold text-lg">오늘의 일정</Text>
                                            </TouchableOpacity>
                                            <View className="flex-row items-center gap-2">
                                                <Text className="text-slate-500 text-xs">Jan 19</Text>
                                                <TouchableOpacity
                                                    className="w-8 h-8 bg-blue-600 rounded-lg items-center justify-center shadow-lg shadow-blue-500/20"
                                                    onPress={() => setCalendarVisible(true)}
                                                >
                                                    <Icons.Plus size={16} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View className="gap-3 flex-1">
                                            <TaskItem text="정부지원사업 서류 마감 (D-2)" checked={false} />
                                            <TaskItem text="네이처 논문 리뷰 작성" checked={false} />
                                            <TaskItem text="개발팀 주간 회의" checked={true} />
                                        </View>
                                    </View>
                                </View>

                                {/* Bottom Row: Stats (Small) & Projects (Wide) */}
                                <View className={isDesktop ? "flex-row gap-6 flex-1" : "gap-6"}>
                                    {/* Activity Stats - Compact */}
                                    <View className={`bg-[#0F172A] rounded-3xl p-6 border border-white/5 ${isDesktop ? 'w-[200px]' : 'h-[180px]'}`}>
                                        <Text className="text-white font-bold text-lg mb-4">활동 지표</Text>
                                        <View className="gap-4">
                                            <View>
                                                <Text className="text-slate-400 text-xs mb-1">읽은 논문</Text>
                                                <Text className="text-white text-3xl font-bold">0<Text className="text-slate-500 text-sm">건</Text></Text>
                                            </View>
                                            <View>
                                                <Text className="text-slate-400 text-xs mb-1">공유 수</Text>
                                                <Text className="text-white text-3xl font-bold">0<Text className="text-slate-500 text-sm">회</Text></Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Projects Block - EXPANDED & CLICKABLE */}
                                    <View className={`bg-[#0F172A] rounded-3xl p-6 border border-white/5 flex-1 ${isDesktop ? '' : 'h-[380px]'}`}>
                                        <View className="flex-row items-center justify-between mb-4">
                                            <Text className="text-white font-bold text-lg">진행 중인 프로젝트</Text>
                                            <TouchableOpacity>
                                                <Text className="text-blue-500 text-sm font-semibold">전체보기</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View className="flex-1 gap-3 justify-center">
                                            <ProjectItem
                                                name="InsightFlow MVP 개발"
                                                desc="React Native + Supabase 기반 앱"
                                                progress={75}
                                                color="#3B82F6"
                                                onPress={() => openProjectDetail('InsightFlow MVP 개발')}
                                                onWorkspace={() => openInWorkspace('InsightFlow MVP 개발')}
                                            />
                                            <ProjectItem
                                                name="퀀트 투자 알고리즘 고도화"
                                                desc="Transformer 모델 파인튜닝"
                                                progress={30}
                                                color="#10B981"
                                                onPress={() => openProjectDetail('퀀트 투자 알고리즘 고도화')}
                                                onWorkspace={() => openInWorkspace('퀀트 투자 알고리즘 고도화')}
                                            />
                                            <ProjectItem
                                                name="2026 예비창업패키지 준비"
                                                desc="사업계획서 초안 작성"
                                                progress={90}
                                                color="#F59E0B"
                                                onPress={() => openProjectDetail('2026 예비창업패키지 준비')}
                                                onWorkspace={() => openInWorkspace('2026 예비창업패키지 준비')}
                                            />
                                        </View>
                                    </View>
                                </View>

                            </View>
                        </View>
                    </View>
                    <Footer />
                </ScrollView>
            ) : activeTab === 'scraps' ? (
                <View className="flex-1 bg-[#050B14] flex-row">
                    {/* Left Pane / Full List */}
                    <View className={`flex-1 p-6 ${selectedScrap && isDesktop ? 'max-w-[400px] border-r border-white/5' : ''}`}>
                        <View className="mb-6">
                            <View className="flex-row items-center justify-between mb-4">
                                <View>
                                    <Text className="text-white font-bold text-2xl mb-1">스크랩 보관함</Text>
                                    <Text className="text-slate-400 text-sm">저장한 인사이트 {scraps.length}개</Text>
                                </View>
                                <TouchableOpacity
                                    className="px-4 py-2 bg-slate-800 rounded-lg border border-white/10"
                                    onPress={loadScraps}
                                >
                                    <Text className="text-white text-sm font-semibold">새로고침</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Category Filter Pills */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                                {uniqueCategories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full border ${selectedCategory === cat
                                            ? 'bg-blue-600 border-blue-500'
                                            : 'bg-slate-800 border-white/10'
                                            }`}
                                    >
                                        <Text className={`text-sm font-medium ${selectedCategory === cat ? 'text-white' : 'text-slate-400'
                                            }`}>
                                            {cat === 'Science' ? '과학' : cat === 'Economy' ? '경제' : cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            {filteredScraps.length > 0 ? (
                                <View className={!selectedScrap ? "flex-row flex-wrap gap-4" : ""}>
                                    {filteredScraps.map((scrap) => (
                                        <View key={scrap.id} className={!selectedScrap ? "w-full md:w-[32%] mb-0" : "mb-4"}>
                                            <InsightCard
                                                item={scrap}
                                                isScrapped={true}
                                                onBookmarkPress={() => handleUnscrap(scrap)}
                                                desktopMode={!selectedScrap} // Detailed cards in Grid
                                                onPress={() => {
                                                    if (isDesktop) {
                                                        setSelectedScrap(scrap);
                                                    } else {
                                                        setSelectedScrap(scrap);
                                                    }
                                                }}
                                            />
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View className="items-center py-20 bg-[#0F172A] rounded-3xl border border-white/5">
                                    <Icons.Bookmark size={48} color="#475569" />
                                    <Text className="text-slate-500 text-lg mt-4">해당하는 스크랩이 없습니다.</Text>
                                    <Text className="text-slate-600 text-sm mt-2">다른 카테고리를 선택해보세요.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>

                    {/* Right Pane (Desktop Only) */}
                    {isDesktop && selectedScrap && (
                        <View className="flex-1 bg-[#050B14] p-6 justify-center items-center">
                            <View className="w-full h-full max-w-[600px] relative">
                                <InsightDetailPane
                                    item={selectedScrap}
                                    onClose={() => setSelectedScrap(null)}
                                    isBookmarked={true}
                                    onToggleBookmark={() => handleUnscrap(selectedScrap)}
                                />
                            </View>
                        </View>
                    )}

                    {/* Mobile Modal */}
                    {!isDesktop && (
                        <InsightDetailModal
                            visible={!!selectedScrap}
                            item={selectedScrap}
                            onClose={() => setSelectedScrap(null)}
                            isScrapped={true}
                            onToggleScrap={(item) => handleUnscrap(item)}
                        />
                    )}

                    <Footer />
                </View>
            ) : activeTab === 'files' ? (
                // Files Tab - Show Project Detail Inline
                <View className="flex-1">
                    <View className="max-w-[1400px] w-full mx-auto flex-1">
                        {selectedProject ? (
                            <View className="flex-1 bg-[#050B14] p-6">
                                <View className="mb-6">
                                    <Text className="text-white font-bold text-2xl mb-1">{selectedProject}</Text>
                                    <Text className="text-slate-400 text-sm">프로젝트 파일 관리</Text>
                                </View>
                                <View className="flex-1 bg-[#0F172A] rounded-3xl border border-white/10 p-6">
                                    <Text className="text-slate-300">파일 탐색기가 여기에 표시됩니다.</Text>
                                </View>
                            </View>
                        ) : (
                            <View className="flex-1 items-center justify-center">
                                <Icons.Folder size={48} color="#475569" />
                                <Text className="text-slate-500 text-lg mt-4">프로젝트를 선택해주세요</Text>
                                <Text className="text-slate-600 text-sm mt-2">왼쪽의 대시보드에서 프로젝트를 클릭하세요</Text>
                            </View>
                        )}
                    </View>
                    <Footer />
                </View>
            ) : activeTab === 'posts' ? (
                // Posts Tab
                <View className="flex-1 bg-[#050B14] p-6">
                    <View className="max-w-[1400px] w-full mx-auto bg-[#0F172A] rounded-3xl border border-white/10 p-6 h-full">
                        <ScrollView>
                            {/* Filter persistent posts by author ID or fallback to email match */}
                            {posts.filter(p => p.authorId === user?.id || (user?.email && p.author.includes(user.email.split('@')[0]))).length > 0 ? (
                                posts
                                    .filter(p => p.authorId === user?.id || (user?.email && p.author.includes(user.email.split('@')[0])))
                                    .map(post => (
                                        <View key={post.id} className="mb-4 bg-slate-900/50 p-4 rounded-xl border border-white/5 flex-row items-center justify-between">
                                            <View className="flex-1">
                                                <Text className="text-white font-bold text-sm mb-1">{post.title}</Text>
                                                <Text className="text-slate-400 text-xs" numberOfLines={1}>{post.content}</Text>
                                            </View>
                                            <View className="flex-row gap-2 ml-4">
                                                <TouchableOpacity className="bg-blue-600 px-3 py-1.5 rounded-lg">
                                                    <Text className="text-white text-xs font-bold">수정</Text>
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
                                    <Icons.Database size={48} color="#475569" />
                                    <Text className="text-slate-500 text-lg mt-4">작성한 게시글이 없습니다.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                    <Footer />
                </View>
            ) : (
                // Messages Tab
                <View className="flex-1 flex-row bg-[#050B14]">
                    {/* Left Pane: Chat List */}
                    <View className="w-80 border-r border-white/5 h-full">
                        <ChatListView
                            activeChatId={selectedChatUser?.id}
                            onSelectChat={(user) => setSelectedChatUser(user)}
                        />
                    </View>

                    {/* Right Pane: Chat Room - WIDTH CONSTRAINED */}
                    <View className="flex-1 h-full p-6 items-center bg-[#050B14]">
                        <View className="w-full max-w-[800px] h-full">
                            {selectedChatUser ? (
                                <ChatRoom targetUser={selectedChatUser} />
                            ) : (
                                <View className="flex-1 items-center justify-center bg-[#1E293B] rounded-3xl border border-white/10 m-6">
                                    <Icons.MessageCircle size={48} color="#475569" />
                                </View>
                            )}
                        </View>
                    </View>
                    <Footer />
                </View>
            )}

            <CalendarModal visible={calendarVisible} onClose={() => setCalendarVisible(false)} />
            <ProjectDetailModal
                visible={projectModalVisible}
                onClose={() => setProjectModalVisible(false)}
                projectName={selectedProject}
            />
            <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
        </View>
    );
};

// Helper Components
const PaperItem = ({ title }: { title: string }) => (
    <TouchableOpacity className="bg-slate-900/50 p-3 rounded-xl border border-white/5 flex-row items-center hover:bg-slate-800">
        <Icons.FileText size={16} color="#94A3B8" />
        <Text className="text-slate-300 text-sm ml-3 flex-1" numberOfLines={1}>{title}</Text>
        <Icons.ChevronRight size={14} color="#475569" />
    </TouchableOpacity>
);

const TaskItem = ({ text, checked }: { text: string, checked: boolean }) => (
    <View className="flex-row items-center p-2">
        <View className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
            {checked && <Icons.CheckSquare size={12} color="#fff" />}
        </View>
        <Text className={`text-sm ${checked ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{text}</Text>
    </View>
);

const ProjectItem = ({ name, desc, progress, color, onPress, onWorkspace }: {
    name: string,
    desc: string,
    progress: number,
    color: string,
    onPress: () => void,
    onWorkspace: () => void
}) => (
    <View className="bg-slate-900/30 rounded-xl border border-white/5 overflow-hidden">
        <TouchableOpacity
            className="flex-row items-center p-4 hover:bg-slate-800/50"
            onPress={onPress}
        >
            <View className={`w-10 h-10 rounded-lg items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
                <Icons.Folder size={20} color={color} />
            </View>
            <View className="ml-4 flex-1">
                <Text className="text-slate-200 font-bold text-sm">{name}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">{desc}</Text>
            </View>
            <View className="w-24 items-end">
                <Text className="text-slate-400 text-xs mb-1.5">{progress}%</Text>
                <View className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
                </View>
            </View>
        </TouchableOpacity>
        <View className="px-4 pb-3 flex-row gap-2">
            <TouchableOpacity
                className="flex-1 bg-blue-600 py-2 rounded-lg flex-row items-center justify-center gap-2"
                onPress={onWorkspace}
            >
                <Icons.Sparkles size={12} color="#fff" />
                <Text className="text-white font-semibold text-xs">이어서 작업</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className="flex-1 bg-white/5 py-2 rounded-lg flex-row items-center justify-center gap-2 border border-white/10"
                onPress={onPress}
            >
                <Icons.Folder size={12} color="#94A3B8" />
                <Text className="text-slate-300 font-semibold text-xs">파일 보기</Text>
            </TouchableOpacity>
        </View>
    </View>
);
