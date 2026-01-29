import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Briefcase, FileText, CheckCircle2, TrendingUp, Clock, MoreHorizontal } from 'lucide-react-native';

const WidgetCard = ({ title, icon: Icon, children, color = '#3B82F6', className = '' }: any) => (
    <View className={`bg-[#0F172A] rounded-2xl border border-white/5 p-5 ${className}`}>
        <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
                <View className="p-2 rounded-lg bg-white/5">
                    <Icon size={18} color={color} />
                </View>
                <Text className="text-white font-bold text-sm">{title}</Text>
            </View>
            <TouchableOpacity>
                <MoreHorizontal size={16} color="#64748B" />
            </TouchableOpacity>
        </View>
        {children}
    </View>
);

export const HomeView = () => {
    return (
        <ScrollView className="flex-1 bg-[#050B14]">
            <View className="p-8 max-w-[1600px] w-full mx-auto">
                {/* Welcome Header */}
                <View className="mb-8">
                    <Text className="text-white text-3xl font-bold mb-2">안녕하세요, 홍길동 연구원님 👋</Text>
                    <Text className="text-slate-400 text-base">오늘도 성공적인 연구를 시작해보세요.</Text>
                </View>

                {/* Main Grid Layout */}
                <View className="flex-row flex-wrap gap-6">

                    {/* Left Column (Main Stats & Timeline) - Flex 2 */}
                    <View className="flex-1 min-w-[500px] gap-6">
                        {/* Summary Stats */}
                        <View className="flex-row gap-4">
                            <WidgetCard title="진행중 프로젝트" icon={Briefcase} color="#3B82F6" className="flex-1">
                                <Text className="text-3xl font-bold text-white mb-1">3<span className="text-base font-normal text-slate-500 ml-1">건</span></Text>
                                <View className="bg-blue-500/10 px-2 py-1 rounded self-start">
                                    <Text className="text-blue-400 text-xs">+1개 이번 주 시작</Text>
                                </View>
                            </WidgetCard>
                            <WidgetCard title="마감 임박" icon={Clock} color="#EF4444" className="flex-1">
                                <Text className="text-3xl font-bold text-white mb-1">2<span className="text-base font-normal text-slate-500 ml-1">건</span></Text>
                                <View className="bg-red-500/10 px-2 py-1 rounded self-start">
                                    <Text className="text-red-400 text-xs">2일 내 마감</Text>
                                </View>
                            </WidgetCard>
                            <WidgetCard title="완료된 작업" icon={CheckCircle2} color="#10B981" className="flex-1">
                                <Text className="text-3xl font-bold text-white mb-1">12<span className="text-base font-normal text-slate-500 ml-1">건</span></Text>
                                <View className="bg-emerald-500/10 px-2 py-1 rounded self-start">
                                    <Text className="text-emerald-400 text-xs">지난달 대비 20% ▲</Text>
                                </View>
                            </WidgetCard>
                        </View>

                        {/* Today's Schedule timeline placeholder */}
                        <WidgetCard title="오늘의 일정 정리" icon={Calendar} color="#F59E0B" className="min-h-[300px]">
                            <View className="space-y-4">
                                {[
                                    { time: '10:00 AM', title: 'R&D 기획 회의', tag: 'Team', active: true },
                                    { time: '02:00 PM', title: '정부 과제 서류 검토', tag: 'Review', active: false },
                                    { time: '04:00 PM', title: 'AI 모델 벤치마킹 분석', tag: 'Focus', active: false },
                                ].map((item, idx) => (
                                    <View key={idx} className={`flex-row items-center p-3 rounded-xl border ${item.active ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/30 border-transparent'}`}>
                                        <Text className={`text-sm font-semibold w-20 ${item.active ? 'text-amber-400' : 'text-slate-500'}`}>{item.time}</Text>
                                        <View className={`w-1 h-8 mx-3 rounded-full ${item.active ? 'bg-amber-500' : 'bg-slate-700'}`} />
                                        <View className="flex-1">
                                            <Text className={`font-medium ${item.active ? 'text-white' : 'text-slate-300'}`}>{item.title}</Text>
                                            <Text className="text-xs text-slate-500">{item.tag}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </WidgetCard>
                    </View>

                    {/* Right Column (Projects & Grants) - Flex 1 */}
                    <View className="w-[400px] gap-6">

                        {/* Active Projects */}
                        <WidgetCard title="진행중인 프로젝트" icon={TrendingUp} color="#8B5CF6">
                            <View className="space-y-4">
                                {[
                                    { name: 'SaaS MVP 개발', progress: 75, color: 'bg-purple-500' },
                                    { name: 'K-Startup 예비창업', progress: 40, color: 'bg-blue-500' },
                                    { name: '시장 조사 보고서', progress: 90, color: 'bg-emerald-500' },
                                ].map((p, i) => (
                                    <View key={i}>
                                        <View className="flex-row justify-between mb-1.5">
                                            <Text className="text-slate-300 text-sm font-medium">{p.name}</Text>
                                            <Text className="text-slate-500 text-xs">{p.progress}%</Text>
                                        </View>
                                        <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <View className={`h-full ${p.color}`} style={{ width: `${p.progress}%` }} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </WidgetCard>

                        {/* Recommended Grants */}
                        <WidgetCard title="맞춤 사업 추천" icon={Briefcase} color="#EC4899">
                            <View className="space-y-3">
                                {[
                                    { name: '2026 예비창업패키지', dday: 'D-12', tag: '최대 1억' },
                                    { name: '데이터바우처 지원사업', dday: 'D-5', tag: '최대 7천' },
                                    { name: 'AI 바우처 지원', dday: 'D-20', tag: '최대 3억' },
                                ].map((g, i) => (
                                    <TouchableOpacity key={i} className="flex-row items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-white/5">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-slate-200 text-sm font-medium truncate" numberOfLines={1}>{g.name}</Text>
                                            <Text className="text-pink-400 text-[10px] mt-0.5">{g.tag}</Text>
                                        </View>
                                        <View className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400 border border-white/10">
                                            <Text className="text-[10px] text-slate-400">{g.dday}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity className="mt-4 py-2 bg-pink-500/10 rounded-lg items-center border border-pink-500/20">
                                <Text className="text-pink-400 text-xs font-semibold">모든 공고 보기</Text>
                            </TouchableOpacity>
                        </WidgetCard>

                        {/* Recent Files */}
                        <WidgetCard title="최근 작업 서류" icon={FileText} color="#64748B">
                            <View className="space-y-2">
                                {[
                                    { name: '사업계획서_Draft_v2.docx', time: '2시간 전' },
                                    { name: '매출추정표_2026.xlsx', time: '어제' },
                                ].map((f, i) => (
                                    <TouchableOpacity key={i} className="flex-row items-center p-2 rounded-lg hover:bg-slate-800/50">
                                        <FileText size={14} color="#94A3B8" className="mr-2" />
                                        <View className="flex-1">
                                            <Text className="text-slate-300 text-xs truncate" numberOfLines={1}>{f.name}</Text>
                                            <Text className="text-slate-600 text-[10px]">{f.time}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </WidgetCard>
                    </View>
                </View>
            </View>
            <View className="h-12" />{/* Bottom Spacer */}
        </ScrollView>
    );
};
