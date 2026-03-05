import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/supabase';
import { Briefcase, AlertCircle, CheckCircle, Zap, Layers, ChevronRight } from 'lucide-react-native';
import { ProjectPipelineCard } from '../components/ProjectPipelineCard';
import { ActiveProjectCard } from '../components/ActiveProjectCard';
import { TodayScheduleWidget } from '../components/TodayScheduleWidget';
import { StatsCard } from '../components/StatsCard';
import { RecommendedBusinessCard } from '../components/RecommendedBusinessCard';

interface WorkspaceDashboardProps {
    onOpenCalendar: () => void;
    onLoadSession?: (session: any) => void;
    onNavigateToPortfolio?: () => void;
    onNavigateToGrants?: () => void;
}

import { fetchProjects, Project } from '../../../services/projects';
import { fetchGrants } from '../../../services/grants';
import { calculateGrantScore } from '../../../utils/scoring';
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

            // Take Top 3
            setRecommendedBusinesses(scoredGrants.slice(0, 3));

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
            className="flex-1 bg-[#020617]"
            contentContainerStyle={{ padding: 24, paddingTop: 60 }}
        >
            <View className="max-w-[1400px] w-full mx-auto">
                {/* Greeting Header */}
                <View className="mb-6">
                    <Text className="text-white text-3xl font-bold mb-2">
                        안녕하세요, {nickname}님 👋
                    </Text>
                    <Text className="text-slate-400 text-sm">
                        오늘은 성공적인 연구를 시작하세요
                    </Text>
                </View>

                {/* AI Briefing Cards */}
                {briefings.length > 0 && (
                    <View className="mb-6 bg-blue-500/10 border border-blue-400/20 rounded-2xl p-5">
                        <View className="flex-row items-center gap-2 mb-4">
                            <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center">
                                <Zap size={16} color="#60A5FA" fill="#60A5FA" />
                            </View>
                            <Text className="text-blue-400 font-semibold text-sm">오늘의 브리핑</Text>
                        </View>
                        <View className="gap-2">
                            {briefings.map((briefing, index) => (
                                <View key={briefing.id} className="flex-row items-start gap-3">
                                    <View className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <Text className="flex-1 text-white text-sm leading-5">
                                        {briefing.message}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Main Content Grid - Middle Section with 3 Columns */}
                <View className="flex-row gap-6 mb-6">
                    {/* Column 1 - Pipeline */}
                    <View className="w-[400px] bg-[#0F172A]/80 rounded-2xl p-5 border border-white/5">
                        {/* Header */}
                        <TouchableOpacity className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center gap-2">
                                <Layers size={18} color="#3B82F6" />
                                <Text className="text-white font-bold text-base">Active Strategy Pipeline</Text>
                            </View>
                            <ChevronRight size={18} color="#475569" />
                        </TouchableOpacity>

                        <View className="gap-4 mb-4">
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
                                <View className="py-8 items-center justify-center">
                                    <Text className="text-slate-500 text-sm">진행 중인 프로젝트가 없습니다</Text>
                                </View>
                            )}
                        </View>

                        {/* Footer Button */}
                        <TouchableOpacity
                            className="bg-white/5 py-3 rounded-xl border border-white/5 items-center justify-center mt-auto"
                        >
                            <Text className="text-slate-400 text-xs font-semibold">전체 파이프라인 보기</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Column 2 - Custom Recommendations */}
                    <View className="w-[400px]">
                        <RecommendedBusinessCard
                            items={recommendedBusinesses}
                            onExploreAll={() => onNavigateToGrants?.()}
                            onApply={(item: any) => {
                                onLoadSession?.({
                                    title: item.title,
                                    mode: 'Grant Strategist',
                                    workspace_data: [],
                                    auto_run_query: `"${item.title}" 공고에 대한 전략 분석을 시작합니다.`,
                                    grant_url: item.original_url || item.link || '',
                                    pdf_url: item.file_url || '',
                                });
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
                        <View className="flex-row gap-3">
                            <StatsCard
                                icon={Briefcase}
                                iconColor="#3B82F6"
                                title="저장된 AI 세션"
                                value={savedSessions.length.toString()}
                                subtitle="최근 저장된 작업"
                                valueColor="#3B82F6"
                            />
                            <StatsCard
                                icon={AlertCircle}
                                iconColor="#EF4444"
                                title="마감 임박"
                                value="2"
                                subtitle="2일 내 마감"
                                valueColor="#EF4444"
                            />
                            <StatsCard
                                icon={CheckCircle}
                                iconColor="#10B981"
                                title="완료된 과제"
                                value="12"
                                subtitle="지난 달 20% ▲"
                                valueColor="#10B981"
                            />
                        </View>
                    </View>
                </View>

                {/* Bottom Section: Ongoing Projects */}
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-white font-bold text-lg">
                            진행 중인 프로젝트
                        </Text>
                        <TouchableOpacity onPress={() => onNavigateToPortfolio?.()}>
                            <Text className="text-blue-400 text-sm font-semibold">
                                전체보기
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Horizontal Layout for Saved Sessions */}
                    <View className="flex-row gap-4">
                        {savedSessions.length > 0 ? (
                            savedSessions.slice(0, 3).map(session => {
                                const branchCount = session.workspace_data?.reduce((acc: number, col: any) => acc + (col.nodes?.length || 0), 0) || 0;
                                const hasEditor = !!session.editor_content && session.editor_content.length > 50;
                                const hasChat = (session.chat_history?.length || 0) > 2;
                                let progress = 10;
                                let progressColor = '#64748B';
                                let stage = '시작됨';
                                if (hasEditor && branchCount > 0) { progress = 75; progressColor = '#10B981'; stage = '서류 작성 중'; }
                                else if (branchCount > 0 && hasChat) { progress = 50; progressColor = '#3B82F6'; stage = '브레인스톰 완료'; }
                                else if (branchCount > 0) { progress = 30; progressColor = '#F59E0B'; stage = '분석 진행 중'; }

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
                            <View className="flex-1 py-8 items-center">
                                <Text className="text-slate-500 text-sm">저장된 AI 세션이 없습니다</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};
