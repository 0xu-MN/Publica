import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Settings, Folder, CheckSquare, Sparkles, Plus, Clock, FileText, ChevronRight, LayoutDashboard, Database, MessageCircle } from 'lucide-react-native';
import { ProfileCard } from './ProfileCard';
// import { ChatModal } from './ChatModal'; // Removed
// import { ChatListModal } from './ChatListModal'; // Removed
import { ChatRoom } from './ChatRoom';
import { ChatListView } from './ChatListView';
import { CalendarModal } from './CalendarModal';
import { ProjectDetailModal } from './ProjectDetailModal';
import { SettingsModal } from './SettingsModal';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../hooks/usePosts';
import { Workspace } from './Workspace';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Ensure async storage is imported

interface PersonalDashboardProps {
    readOnly?: boolean;
    targetUserId?: string;
    onClose?: () => void;
    onNavigateToSettings?: () => void;
}

export const PersonalDashboard = ({ readOnly, targetUserId, onClose, onNavigateToSettings }: PersonalDashboardProps) => {
    const { user } = useAuth();
    // In a real app, we would fetch the target user's data using targetUserId here.
    // For now, we'll Mock it or reuse local storage if it's the "Simulated Public View" of myself
    // OR we just show a "Public View" placeholder if it's another user.

    // For this specific demo request: "click profile -> enter relative profile".
    // I will simulate "Another User" by just showing a hardcoded or random profile if targetUserId != user.id
    // But since I don't have a backend to fetch "User X", I'll just show the ProfileCard in read-only mode for now.

    const { posts, deletePost, updatePost } = usePosts();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    // Chat States
    const [chatVisible, setChatVisible] = useState(false);
    const [chatListVisible, setChatListVisible] = useState(false);
    const [selectedChatUser, setSelectedChatUser] = useState<{ id: string; name: string } | undefined>(undefined);

    const [calendarVisible, setCalendarVisible] = useState(false);
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [projectModalVisible, setProjectModalVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false); // Restored
    const [workspaceVisible, setWorkspaceVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState('');
    const [workspaceFile, setWorkspaceFile] = useState('');

    const [activeTab, setActiveTab] = useState<'dashboard' | 'files' | 'posts' | 'messages'>('dashboard');

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
            <View className="w-20 bg-[#0A1628] border-r border-white/5 items-center py-8 gap-8">
                <TouchableOpacity
                    className={`w-10 h-10 rounded-xl items-center justify-center shadow-lg ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-blue-500/30' : 'hover:bg-white/5'}`}
                    onPress={() => setActiveTab('dashboard')}
                >
                    <LayoutDashboard size={20} color={activeTab === 'dashboard' ? '#fff' : '#94A3B8'} />
                </TouchableOpacity>
                <TouchableOpacity
                    className={`w-10 h-10 rounded-xl items-center justify-center ${activeTab === 'files' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'hover:bg-white/5'}`}
                    onPress={() => setActiveTab('files')}
                >
                    <Folder size={20} color={activeTab === 'files' ? '#fff' : '#94A3B8'} />
                </TouchableOpacity>
                <TouchableOpacity
                    className={`w-10 h-10 rounded-xl items-center justify-center ${activeTab === 'posts' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'hover:bg-white/5'}`}
                    onPress={() => setActiveTab('posts')}
                >
                    <Database size={20} color={activeTab === 'posts' ? '#fff' : '#94A3B8'} />
                </TouchableOpacity>
                <View className="flex-1" />
                <TouchableOpacity
                    className={`w-10 h-10 rounded-xl items-center justify-center ${activeTab === 'messages' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'hover:bg-white/5'}`}
                    onPress={() => setActiveTab('messages')}
                >
                    <MessageCircle size={20} color={activeTab === 'messages' ? '#fff' : '#94A3B8'} />
                </TouchableOpacity> {/* Messages Icon Added */}
                <TouchableOpacity
                    className="w-10 h-10 hover:bg-white/5 rounded-xl items-center justify-center"
                    onPress={() => setSettingsVisible(true)}
                >
                    <Settings size={20} color="#94A3B8" />
                </TouchableOpacity>
            </View>

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
                                        targetUserId={targetUserId}
                                        onChatPress={(userInfo) => {
                                            // Public View: Switch to Messages Tab and Open Chat
                                            setActiveTab('messages');
                                            if (userInfo) {
                                                setSelectedChatUser(userInfo);
                                            } else {
                                                setSelectedChatUser(targetUserId ? { id: targetUserId, name: 'User' } : undefined);
                                            }
                                        }}
                                        onShowInbox={() => {
                                            setActiveTab('messages');
                                            setSelectedChatUser(undefined);
                                        }}
                                        onEditProfile={() => onNavigateToSettings?.()}
                                    />
                                </View>
                            </View>

                            {/* RIGHT COLUMN: Content Blocks Stacked */}
                            <View className="flex-1 gap-6">

                                {/* Top Row: AI & Schedule Side by Side */}
                                <View className={isDesktop ? "flex-row gap-6 h-[280px]" : "gap-6"}>
                                    {/* AI Curation Block */}
                                    <View className={`bg-[#0F172A] rounded-3xl p-6 border border-white/5 flex-1 ${isDesktop ? '' : 'h-[300px]'}`}>
                                        <View className="flex-row items-center justify-between mb-3">
                                            <View className="flex-row items-center gap-2">
                                                <Sparkles size={18} color="#10B981" />
                                                <Text className="text-white font-bold text-lg">AI 큐레이션</Text>
                                            </View>
                                            <View className="bg-emerald-500/10 px-3 py-1 rounded-full">
                                                <Text className="text-emerald-400 text-xs font-semibold">#퀀트 #반도체</Text>
                                            </View>
                                        </View>
                                        <View className="gap-2 flex-1">
                                            <PaperItem title="Quantum Error Correction Trends 2026" />
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
                                                <Clock size={18} color="#F59E0B" />
                                                <Text className="text-white font-bold text-lg">오늘의 일정</Text>
                                            </TouchableOpacity>
                                            <View className="flex-row items-center gap-2">
                                                <Text className="text-slate-500 text-xs">Jan 19</Text>
                                                <TouchableOpacity
                                                    className="w-8 h-8 bg-blue-600 rounded-lg items-center justify-center shadow-lg shadow-blue-500/20"
                                                    onPress={() => setCalendarVisible(true)}
                                                >
                                                    <Plus size={16} color="#fff" />
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
                                <Folder size={48} color="#475569" />
                                <Text className="text-slate-500 text-lg mt-4">프로젝트를 선택해주세요</Text>
                                <Text className="text-slate-600 text-sm mt-2">왼쪽의 대시보드에서 프로젝트를 클릭하세요</Text>
                            </View>
                        )}
                    </View>
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
                                    <Database size={48} color="#475569" />
                                    <Text className="text-slate-500 text-lg mt-4">작성한 게시글이 없습니다.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
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
                                    <MessageCircle size={48} color="#475569" />
                                    <Text className="text-slate-500 text-lg mt-4">채팅을 선택해주세요</Text>
                                </View>
                            )}
                        </View>
                    </View>
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
        <FileText size={16} color="#94A3B8" />
        <Text className="text-slate-300 text-sm ml-3 flex-1" numberOfLines={1}>{title}</Text>
        <ChevronRight size={14} color="#475569" />
    </TouchableOpacity>
);

const TaskItem = ({ text, checked }: { text: string, checked: boolean }) => (
    <View className="flex-row items-center p-2">
        <View className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
            {checked && <CheckSquare size={12} color="#fff" />}
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
                <Folder size={20} color={color} />
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
                <Sparkles size={12} color="#fff" />
                <Text className="text-white font-semibold text-xs">이어서 작업</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className="flex-1 bg-white/5 py-2 rounded-lg flex-row items-center justify-center gap-2 border border-white/10"
                onPress={onPress}
            >
                <Folder size={12} color="#94A3B8" />
                <Text className="text-slate-300 font-semibold text-xs">파일 보기</Text>
            </TouchableOpacity>
        </View>
    </View>
);
