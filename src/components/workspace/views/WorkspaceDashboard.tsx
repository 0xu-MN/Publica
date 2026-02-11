import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Briefcase, AlertCircle, CheckCircle, Zap, Layers, ChevronRight } from 'lucide-react-native';
import { ProjectPipelineCard } from '../components/ProjectPipelineCard';
import { ActiveProjectCard } from '../components/ActiveProjectCard';
import { TodayScheduleWidget } from '../components/TodayScheduleWidget';
import { StatsCard } from '../components/StatsCard';
import { RecommendedBusinessCard } from '../components/RecommendedBusinessCard';

interface WorkspaceDashboardProps {
    onOpenCalendar: () => void;
}

import { fetchProjects, Project } from '../../../services/projects';
import { fetchGrants } from '../../../services/grants';
import { calculateGrantScore } from '../../../utils/scoring';
import { useAuth } from '../../../contexts/AuthContext';

// ... (imports)

export const WorkspaceDashboard = ({ onOpenCalendar }: WorkspaceDashboardProps) => {
    const { user, profile } = useAuth();
    const [nickname, setNickname] = useState('연구원');

    // Real Data State
    const [pipelineProjects, setPipelineProjects] = useState<Project[]>([]);
    const [recommendedBusinesses, setRecommendedBusinesses] = useState<any[]>([]);
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
    const activeProjectsMock = [
        {
            id: '1',
            name: 'InsightFlow MVP 개발',
            description: 'React Native + Supabase 기반 앱',
            progress: 75,
            icon: 'folder' as const,
            progressColor: '#3B82F6',
        },
        {
            id: '2',
            name: '원본 투자 탐피리즘 고도화',
            description: 'Transformer 모델 리팩토링',
            progress: 30,
            icon: 'code' as const,
            progressColor: '#10B981',
        },
    ];

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
                            onExploreAll={() => console.log('Explore all')}
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
                                title="진행중 프로젝트"
                                value={pipelineProjects.length.toString()}
                                subtitle="+1개 이번 주 시작"
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
                        <TouchableOpacity>
                            <Text className="text-blue-400 text-sm font-semibold">
                                전체보기
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Horizontal Layout for Projects */}
                    <View className="flex-row gap-4">
                        {activeProjectsMock.map(project => (
                            <View key={project.id} className="flex-1">
                                <ActiveProjectCard
                                    {...project}
                                    onContinue={() => handleContinueProject(project.id)}
                                    onViewFiles={() => handleViewFiles(project.id)}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};
