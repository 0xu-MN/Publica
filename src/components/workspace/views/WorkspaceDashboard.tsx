import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/supabase';
import Toast from 'react-native-toast-message';
import { useProjectStore } from '../../../store/useProjectStore';
import { Briefcase, AlertCircle, CheckCircle, Zap, Layers, ChevronRight } from 'lucide-react-native';
import { ProjectPipelineCard } from '../components/ProjectPipelineCard';
import { ActiveProjectCard } from '../components/ActiveProjectCard';
import { TodayScheduleWidget } from '../components/TodayScheduleWidget';
import { StatsCard } from '../components/StatsCard';
import { RecommendedBusinessCard } from '../components/RecommendedBusinessCard';
import Footer from '../../Footer';

interface WorkspaceDashboardProps {
    onOpenCalendar: () => void;
    onLoadSession?: (session: any) => void;
    onNavigateToPortfolio?: () => void;
    onNavigateToGrants?: () => void;
}

import { fetchProjects, Project } from '../../../services/projects';
import { fetchGrants } from '../../../services/grants';
import { getTopRecommendedGrants } from '../../../utils/scoring';
import { useAuth } from '../../../contexts/AuthContext';

// ... (imports)

export const WorkspaceDashboard = ({ onOpenCalendar, onLoadSession, onNavigateToPortfolio, onNavigateToGrants }: WorkspaceDashboardProps) => {
    const { user, profile } = useAuth();
    const [nickname, setNickname] = useState('연구원');

    // Real Data State
    const [pipelineProjects, setPipelineProjects] = useState<Project[]>([]);
    const [recommendedBusinesses, setRecommendedBusinesses] = useState<any[]>([]);
    const [savedSessions, setSavedSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [profile]); // Reload when profile changes

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Load Nickname (fallback if not in profile context)
            if (profile?.full_name) {
                setNickname(profile.full_name);
            } else {
                const stored = await AsyncStorage.getItem('user_profile');
                if (stored) {
                    const data = JSON.parse(stored);
                    if (data.nickname) setNickname(data.nickname);
                }
            }

            // 2. Fetch Projects
            const userProjects = await fetchProjects();
            setPipelineProjects(userProjects);

            // 3. Fetch & Score Grants for Recommendations
            const allGrants = await fetchGrants();
            const recommended = getTopRecommendedGrants(allGrants, profile, 3).map(g => ({
                ...g,
                matchingRate: g.matching_score,
                dDay: g.d_day ? g.d_day.replace('D-', '') : '30',
            }));
            setRecommendedBusinesses(recommended);

            // 4. Fetch Saved Agent Sessions (workspace_sessions)
            let fetchedSessions: any[] = [];
            if (user) {
                const { data: sessions } = await supabase
                    .from('workspace_sessions')
                    .select('id, title, mode, updated_at, workspace_data, chat_history, pdf_url, editor_content')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(4);
                if (sessions) {
                    setSavedSessions(sessions);
                    fetchedSessions = sessions;
                }
            }

            // 5. AI Briefing — 실제 데이터 기반 동적 생성
            const today = new Date();
            const dynamicBriefings: any[] = [];

            // 마감 7일 이내 추천 공고
            const urgentGrants = recommended.filter(g => {
                const dday = parseInt(g.dDay || '999');
                return dday >= 0 && dday <= 7;
            });
            if (urgentGrants.length > 0) {
                const g = urgentGrants[0];
                dynamicBriefings.push({
                    id: 'urgent-1',
                    message: `⚡ [긴급] "${g.title}" 공고가 D-${g.dDay}입니다. 아직 작성 중인 서류가 있다면 빠른 완성이 필요합니다.`,
                });
            }

            // 최근 작업한 세션 기반 브리핑
            if (fetchedSessions.length > 0) {
                const latest = fetchedSessions[0];
                const hoursAgo = Math.floor((today.getTime() - new Date(latest.updated_at).getTime()) / 3600000);
                const whenStr = hoursAgo < 1 ? '방금 전' : hoursAgo < 24 ? `${hoursAgo}시간 전` : `${Math.floor(hoursAgo/24)}일 전`;
                const hasEditor = latest.editor_content && latest.editor_content.length > 100;
                dynamicBriefings.push({
                    id: 'session-1',
                    message: `📝 "${latest.title}" 프로젝트를 ${whenStr} 마지막으로 수정했습니다. ${hasEditor ? '작성 중인 서류가 있습니다. 계속 작성하시겠어요?' : 'Flow 분석이 진행 중입니다. Edit에서 초안을 작성해보세요.'}`,
                });
            }

            // 추천 공고 있을 때 기본 브리핑
            if (dynamicBriefings.length === 0 && recommended.length > 0) {
                dynamicBriefings.push({
                    id: 'rec-1',
                    message: `🎯 ${profile?.full_name || ''}님의 프로필에 맞는 공고 ${recommended.length}건이 발견되었습니다. 매칭률 ${recommended[0]?.matchingRate || 0}%의 "${recommended[0]?.title}"를 가장 먼저 확인해보세요.`,
                });
            }
            setBriefings(dynamicBriefings);

            // 6. 마감 임박 스케줄 — 추천 공고 D-30 이내
            const upcomingDeadlines = recommended
                .filter(g => {
                    const dday = parseInt(g.dDay || '999');
                    return dday >= 0 && dday <= 30;
                })
                .slice(0, 3)
                .map((g, i) => ({
                    id: `deadline-${i}`,
                    text: `"${g.title?.slice(0, 22)}..." 마감 (D-${g.dDay})`,
                    checked: false,
                    dueDate: `D-${g.dDay}`,
                }));
            setScheduleItems(upcomingDeadlines);

        } catch (e) {
            console.error("Failed to load workspace data", e);
        } finally {
            setLoading(false);
        }
    };

    const [scheduleItems, setScheduleItems] = useState<any[]>([]);
    const [briefings, setBriefings] = useState<any[]>([]);

    // Derived Active Projects from Pipeline (or keep mock)
    // Let's use the fetched pipeline projects for the bottom section too if possible, 
    // but the UI expects different fields. For safety, let's keep mock for bottom 
    // OR map the pipeline projects to "Active Projects". 
    // Let's use mock for bottom "Active Projects" to avoid scope creep, 
    // unless user explicitly asked. User asked for "Pipeline" and "Recommendations".


    const handleToggleSchedule = (id: string) => {
        setScheduleItems(items =>
            items.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        );
    };

    const handleAddSchedule = () => { console.log('Add schedule item'); };
    const handleDismissBriefing = (id: string) => { setBriefings(prev => prev.filter(b => b.id !== id)); };
    const handleContinueProject = (projectId: string) => { console.log('Continue project:', projectId); };
    const handleViewFiles = (projectId: string) => { console.log('View files:', projectId); };
    const handleViewReport = (projectId: string) => { console.log('View report:', projectId); };

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: '#FFFFFF' }}
            contentContainerStyle={{ padding: 24, paddingTop: 60 }}
        >
            <View className="max-w-[1400px] w-full mx-auto">
                {/* Greeting Header */}
                <View className="mb-10">
                    <Text className="text-[#27272a] text-4xl font-black mb-3 tracking-tighter leading-tight">
                        안녕하세요, {nickname}님 👋
                    </Text>
                    <View className="flex-row items-center gap-2">
                        <View className="px-2.5 py-1 rounded-full border" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.2)' }}>
                            <Text className="text-[#7C3AED] text-[11px] font-bold uppercase tracking-wider">Professional Planner</Text>
                        </View>
                        <Text className="text-[#64748B] text-sm font-medium">
                            오늘도 당신의 혁신적인 연구를 Publica가 지원합니다.
                        </Text>
                    </View>
                </View>

                {/* AI Briefing Cards */}
                {briefings.length > 0 && (
                    <View className="mb-10 bg-white border border-[#E2E8F0] rounded-[40px] p-8 shadow-xl shadow-black/[0.03]">
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: '#7C3AED', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }}>
                                    <Zap size={20} color="#FFFFFF" fill="#FFFFFF" />
                                </View>
                                <View>
                                    <Text className="text-[#27272a] font-black text-lg">AI Strategic Briefing</Text>
                                    <Text className="text-[#94A3B8] text-xs font-bold uppercase tracking-widest">Real-time Analysis</Text>
                                </View>
                            </View>
                            <TouchableOpacity className="bg-[#F8FAFC] px-4 py-2 rounded-xl border border-[#E2E8F0]">
                                <Text className="text-[#64748B] text-xs font-bold">전체 브리핑</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="gap-3">
                            {briefings.map((briefing, index) => (
                                <View key={briefing.id} className="flex-row items-center p-4 rounded-2xl border" style={{ backgroundColor: '#FDF8F3', borderColor: 'rgba(124, 58, 237, 0.1)' }}>
                                    <View className="w-2 h-2 rounded-full mr-4" style={{ backgroundColor: '#7C3AED', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 2 }} />
                                    <Text className="flex-1 text-[#475569] text-[14px] font-bold leading-relaxed">
                                        {briefing.message}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Main Content Grid - Middle Section with 3 Columns */}
                <View className="flex-row gap-6 mb-10">
                    {/* Column 1 - Pipeline */}
                    <View className="w-[400px] bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-2xl shadow-black/[0.04]">
                        {/* Header */}
                        <TouchableOpacity className="flex-row items-center justify-between mb-8">
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)' }}>
                                    <Layers size={18} color="#7C3AED" strokeWidth={2.5} />
                                </View>
                                <Text className="text-[#27272a] font-black text-base uppercase tracking-wider">Active Strategy Pipeline</Text>
                            </View>
                            <ChevronRight size={18} color="#CBD5E1" />
                        </TouchableOpacity>

                        <View className="gap-5 mb-6">
                            {pipelineProjects.length > 0 ? (
                                pipelineProjects.map(project => (
                                    <ProjectPipelineCard
                                        key={project.id}
                                        title={project.grant_title} // Map grant_title to title
                                        subtitle={project.currentStage}
                                        progress={project.progress || 0}
                                        currentStage={project.currentStage || 'Unknown'}
                                        stages={project.stages || []}
                                        onViewReport={() => handleViewReport(project.id)}
                                    />
                                ))
                            ) : (
                                <View className="py-12 items-center justify-center rounded-3xl border border-dashed border-[#CBD5E1]" style={{ backgroundColor: '#F8FAFC' }}>
                                    <Layers size={32} color="#CBD5E1" strokeWidth={1.5} className="mb-3" />
                                    <Text className="text-[#94A3B8] text-sm font-medium">진행 중인 프로젝트가 없습니다</Text>
                                </View>
                            )}
                        </View>

                        {/* Footer Button */}
                        <TouchableOpacity
                            className="py-4 rounded-[20px] border border-[#E2E8F0] items-center justify-center mt-auto active:bg-slate-50 transition-all"
                            style={{ backgroundColor: '#F8FAFC' }}
                        >
                            <Text className="text-[#64748B] text-xs font-black uppercase tracking-widest">전체 파이프라인 상세보기</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Column 2 - Custom Recommendations */}
                    <View className="w-[400px]">
                        <RecommendedBusinessCard
                            items={recommendedBusinesses}
                            onExploreAll={() => onNavigateToGrants?.()}
                            onApply={(item: any) => {
                                // 🌟 Restored the correct flow logic for AI Idea Collection Toast 🌟
                                useProjectStore.getState().setProject(item, {
                                    title: item.title,
                                    mode: 'Grant Strategist',
                                    workspace_data: [],
                                    auto_run_query: `"${item.title}" 공고에 대한 맞춤형 전략 분석을 시작합니다.`,
                                    grant_url: item.original_url || item.link || '',
                                    pdf_url: item.file_url || ''
                                });

                                Toast.show({
                                    type: 'success',
                                    text1: '지원 준비 완료',
                                    text2: 'NEXUS-Flow에서 사업 아이디어 수집을 시작합니다.',
                                });

                                // Navigate to Flow
                                if (onLoadSession) {
                                    onLoadSession(useProjectStore.getState().agentSession);
                                }
                            }}
                        />
                    </View>

                    {/* Column 3 - Today's Schedule & Stats */}
                    <View className="flex-1 gap-6">
                        <TodayScheduleWidget
                            items={scheduleItems}
                            onToggleItem={handleToggleSchedule}
                            onAddItem={onOpenCalendar}
                        />

                        {/* Stats Cards Row */}
                        <View className="flex-row gap-4">
                            <StatsCard
                                icon={Briefcase}
                                iconColor="#7C3AED"
                                title="저장된 AI 세션"
                                value={savedSessions.length.toString()}
                                subtitle="최근 작업 기반"
                                valueColor="#7C3AED"
                            />
                            <StatsCard
                                icon={AlertCircle}
                                iconColor="#F87171"
                                title="마감 임박"
                                value="2"
                                subtitle="2일 이내"
                                valueColor="#F87171"
                            />
                            <StatsCard
                                icon={CheckCircle}
                                iconColor="#10B981"
                                title="완료된 과제"
                                value="12"
                                subtitle="지난 달 대비 20% ▲"
                                valueColor="#10B981"
                            />
                        </View>
                    </View>
                </View>

                {/* Bottom Section: Ongoing Projects */}
                <View className="mb-10">
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center gap-3">
                            <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)' }}>
                                <CheckCircle size={18} color="#7C3AED" strokeWidth={2.5} />
                            </View>
                            <Text className="text-[#27272a] font-black text-2xl tracking-tighter">
                                진행 중인 프로젝트
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => onNavigateToPortfolio?.()} className="bg-white px-4 py-2 rounded-full border border-[#E2E8F0] shadow-sm">
                            <Text className="text-[#7C3AED] text-sm font-bold">
                                전체보기
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Horizontal Layout for Saved Sessions */}
                    <View className="flex-row gap-6">
                        {savedSessions.length > 0 ? (
                            savedSessions.slice(0, 3).map(session => {
                                const branchCount = session.workspace_data?.reduce((acc: number, col: any) => acc + (col.branches?.length || 0), 0) || 0;
                                const hasEditor = !!session.editor_content && session.editor_content.length > 50;
                                const hasChat = (session.chat_history?.length || 0) > 2;
                                let progress = 10;
                                let progressColor = '#94A3B8';
                                let stage = '분석 대기';
                                if (hasEditor && branchCount > 0) { progress = 85; progressColor = '#7C3AED'; stage = '최종 초안 작성 중'; }
                                else if (branchCount > 0 && hasChat) { progress = 60; progressColor = '#7C3AED'; stage = '아이디어 수립 완료'; }
                                else if (branchCount > 0) { progress = 35; progressColor = '#7C3AED'; stage = '기초 기획 단계'; }

                                return (
                                    <View key={session.id} className="flex-1">
                                        <ActiveProjectCard
                                            id={session.id}
                                            name={session.title || 'Untitled'}
                                            description={`${stage} · ${new Date(session.updated_at).toLocaleDateString('ko-KR')}`}
                                            progress={progress}
                                            icon={'folder' as const}
                                            progressColor={progressColor}
                                            onContinue={() => onLoadSession?.(session)}
                                            onViewFiles={() => onLoadSession?.(session)}
                                        />
                                    </View>
                                );
                            })
                        ) : (
                            <View className="flex-1 py-16 items-center bg-white rounded-[40px] border border-dashed border-[#CBD5E1]">
                                <Briefcase size={40} color="#CBD5E1" strokeWidth={1} className="mb-4" />
                                <Text className="text-[#94A3B8] text-base font-medium">저장된 AI 세션이 없습니다</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
            <Footer />
        </ScrollView>
    );
};
