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

export const WorkspaceDashboard = ({ onOpenCalendar }: WorkspaceDashboardProps) => {
    const [nickname, setNickname] = useState('연구원');

    useEffect(() => {
        const loadNickname = async () => {
            try {
                const stored = await AsyncStorage.getItem('user_profile');
                if (stored) {
                    const data = JSON.parse(stored);
                    if (data.nickname) {
                        setNickname(data.nickname);
                    }
                }
            } catch (e) {
                console.error("Failed to load nickname", e);
            }
        };
        loadNickname();
    }, []);
    // Mock Data - Today's Schedule
    const [scheduleItems, setScheduleItems] = useState([
        { id: '1', text: '정부지원사업 서류 마감 (D-2)', checked: false, dueDate: 'D-2' },
        { id: '2', text: '네이처 논문 리뷰 작성', checked: false },
        { id: '3', text: '개발팀 주간 회의', checked: true },
    ]);

    // Mock Data - AI Briefings
    const [briefings, setBriefings] = useState([
        {
            id: '1',
            message: '오늘의 브리핑: 2026 예비창업패키지 서류가 거의 완성되었습니다. 에이전트가 검토를 기다리고 있어요.',
        },
        {
            id: '2',
            message: '오늘의 브리핑: 2026 예비창업패키지 서류가 거의 완성되었습니다. 에이전트가 검토를 기다리고 있어요.',
        },
    ]);

    // Mock Data - Active Projects
    const projects = [
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
        {
            id: '3',
            name: '2026 예비창업패키지 준비',
            description: '사업계획서 최종 작성',
            progress: 90,
            icon: 'document' as const,
            progressColor: '#F59E0B',
        },
    ];

    // Mock Data - Recommended Businesses
    const [recommendedBusinesses] = useState([
        { id: '1', title: '2026 예비창업패키지', dDay: '18', matchingRate: 94 },
        { id: '2', title: '데이터바우처 지원사업', dDay: '5', matchingRate: 86 },
    ]);

    // Mock Data - Pipeline Projects
    const pipelineProjects = [
        {
            id: '1',
            title: '2026년 예비창업패키지 (생활분야)',
            subtitle: '',
            progress: 94,
            currentStage: '실행 계획',
            stages: ['가설 수립', '근거 검증', '실행 계획'],
        },
        {
            id: '2',
            title: 'AI 에이전트 고도화 R&D 지원 사업',
            subtitle: '',
            progress: 88,
            currentStage: '근거 검증',
            stages: ['가설 수립', '근거 검증', '실행 계획'],
        },
    ];

    const handleToggleSchedule = (id: string) => {
        setScheduleItems(items =>
            items.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        );
    };

    const handleAddSchedule = () => {
        // TODO: Open modal or inline form
        console.log('Add schedule item');
    };

    const handleDismissBriefing = (id: string) => {
        setBriefings(briefings => briefings.filter(b => b.id !== id));
    };

    const handleContinueProject = (projectId: string) => {
        // TODO: Navigate to agent view with this project
        console.log('Continue project:', projectId);
    };

    const handleViewFiles = (projectId: string) => {
        // TODO: Navigate to files view
        console.log('View files:', projectId);
    };

    const handleViewReport = (projectId: string) => {
        // TODO: Open strategy report
        console.log('View report:', projectId);
    };

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
                            {pipelineProjects.map(project => (
                                <ProjectPipelineCard
                                    key={project.id}
                                    {...project}
                                    onViewReport={() => handleViewReport(project.id)}
                                />
                            ))}
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

                        {/* Stats Cards Row - Moved below schedule */}
                        <View className="flex-row gap-3">
                            <StatsCard
                                icon={Briefcase}
                                iconColor="#3B82F6"
                                title="진행중 프로젝트"
                                value="3"
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
                        {projects.map(project => (
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
