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
import { calculateGrantScore, normalizeRegion } from '../../../utils/scoring';
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
            let scoredGrants = allGrants.map(g => ({
                ...g,
                dDay: g.d_day ? g.d_day.replace('D-', '') : '30', // Normalize dDay for UI
                matchingRate: profile ? calculateGrantScore(g, profile) : 0
            }));

            // Sort by Score DESC
            scoredGrants.sort((a, b) => b.matchingRate - a.matchingRate);

            // Filter out old historical data
            const currentYear = new Date().getFullYear();
            const activeGrants = scoredGrants.filter(g => {
                if (!g.deadline_date) return true;
                const deadlineYear = parseInt(g.deadline_date.split('-')[0], 10);
                return deadlineYear >= currentYear;
            });

            // Sort active grants based on regional and industry affinity
            activeGrants.sort((a, b) => {
                let scoreA = a.matchingRate || 0;
                let scoreB = b.matchingRate || 0;

                // Priority: Region Match using normalized comparison
                const userRegion = normalizeRegion(profile?.location || profile?.sido || '');
                const regionA = normalizeRegion(a.region || '');
                const regionB = normalizeRegion(b.region || '');

                if (regionA === userRegion && userRegion) scoreA += 500;
                else if (regionA === '전국') scoreA += 100;

                if (regionB === userRegion && userRegion) scoreB += 500;
                else if (regionB === '전국') scoreB += 100;

                // Priority: Industry/Category Match
                const userIndustry = profile?.industry || profile?.major_category || '';
                if (userIndustry && a.category && a.category.includes(userIndustry)) scoreA += 300;
                if (userIndustry && b.category && b.category.includes(userIndustry)) scoreB += 300;

                return scoreB - scoreA;
            });

            // Take Top 3 (Without injecting mock data)
            let recommended = activeGrants.slice(0, 3);
            setRecommendedBusinesses(recommended);

            // 4. Fetch Saved Agent Sessions (workspace_sessions)
            if (user) {
                const { data: sessions } = await supabase
                    .from('workspace_sessions')
                    .select('id, title, mode, updated_at, workspace_data, chat_history, pdf_url, editor_content')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(4);
                if (sessions) setSavedSessions(sessions);
            }

        } catch (e) {
            console.error("Failed to load workspace data", e);
        } finally {
            setLoading(false);
        }
    };

    // Mock Data - Today's Schedule (Keep for now)
    const [scheduleItems, setScheduleItems] = useState([
        { id: '1', text: '정부지원사업 서류 마감 (D-2)', checked: false, dueDate: 'D-2' },
        { id: '2', text: '네이처 논문 리뷰 작성', checked: false },
        { id: '3', text: '개발팀 주간 회의', checked: true },
    ]);

    // Mock Data - AI Briefings (Keep for now)
    const [briefings, setBriefings] = useState([
        {
            id: '1',
            message: '오늘의 브리핑: 2026 예비창업패키지 서류가 거의 완성되었습니다. 에이전트가 검토를 기다리고 있어요.',
        },
    ]);

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
            className="flex-1 bg-[#FDF8F3]"
            contentContainerStyle={{ padding: 24, paddingTop: 60 }}
        >
            <View className="max-w-[1400px] w-full mx-auto">
                {/* Greeting Header */}
                <View className="mb-10">
                    <Text className="text-[#27272a] text-4xl font-black mb-3 tracking-tighter leading-tight">
                        안녕하세요, {nickname}님 👋
                    </Text>
                    <View className="flex-row items-center gap-2">
                        <View className="px-2.5 py-1 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20">
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
                                <View className="w-10 h-10 rounded-2xl bg-[#7C3AED] items-center justify-center shadow-lg shadow-[#7C3AED]/30">
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
                                <View key={briefing.id} className="flex-row items-center bg-[#FDF8F3] p-4 rounded-2xl border border-[#7C3AED]/10">
                                    <View className="w-2 h-2 rounded-full bg-[#7C3AED] mr-4 shadow-sm shadow-[#7C3AED]/50" />
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
                                <View className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 items-center justify-center">
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
                                <View className="py-12 items-center justify-center bg-[#F8FAFC] rounded-3xl border border-dashed border-[#CBD5E1]">
                                    <Layers size={32} color="#CBD5E1" strokeWidth={1.5} className="mb-3" />
                                    <Text className="text-[#94A3B8] text-sm font-medium">진행 중인 프로젝트가 없습니다</Text>
                                </View>
                            )}
                        </View>

                        {/* Footer Button */}
                        <TouchableOpacity
                            className="bg-[#F8FAFC] py-4 rounded-[20px] border border-[#E2E8F0] items-center justify-center mt-auto active:bg-slate-50 transition-all"
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
                            <View className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 items-center justify-center">
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
