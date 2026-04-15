import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Briefcase, FileText, CheckCircle2, TrendingUp, Clock, MoreHorizontal } from 'lucide-react-native';

const WidgetCard = ({ title, icon: Icon, children, color = '#7C3AED', className = '' }: any) => (
    <View className={`bg-white rounded-[32px] border border-[#E2E8F0] p-6 shadow-sm shadow-black/[0.02] ${className}`}>
        <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)' }}>
                    <Icon size={20} color={color} strokeWidth={2.5} />
                </View>
                <Text className="text-[#27272a] font-black text-sm uppercase tracking-widest">{title}</Text>
            </View>
            <TouchableOpacity className="w-8 h-8 items-center justify-center rounded-full bg-slate-50">
                <MoreHorizontal size={18} color="#94A3B8" />
            </TouchableOpacity>
        </View>
        {children}
    </View>
);

export const HomeView = () => {
    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View className="p-10 max-w-[1400px] w-full mx-auto">
                {/* Welcome Header */}
                <View className="mb-12">
                    <View className="self-start px-3 py-1 rounded-full mb-4" style={{ backgroundColor: '#7C3AED', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">Dashboard Hub</Text>
                    </View>
                    <Text className="text-[#27272a] text-4xl font-black mb-3 tracking-tighter">안녕하세요, 홍길동 연구원님 👋</Text>
                    <Text className="text-[#64748B] text-lg font-bold">당신만의 혁신적인 전략 연구실이 준비되었습니다.</Text>
                </View>

                {/* Main Grid Layout */}
                <View className="flex-row flex-wrap gap-8">

                    {/* Left Column (Main Stats & Timeline) - Flex 2 */}
                    <View className="flex-[2] min-w-[600px] gap-8">
                        {/* Summary Stats */}
                        <View className="flex-row gap-6">
                            <WidgetCard title="진행중 프로젝트" icon={Briefcase} color="#7C3AED" className="flex-1">
                                <Text className="text-4xl font-black text-[#27272a] mb-2">3<Text className="text-base font-bold text-[#94A3B8] ml-2">건</Text></Text>
                                <View className="bg-emerald-500/10 px-3 py-1.5 rounded-xl self-start border border-emerald-500/10">
                                    <Text className="text-emerald-600 text-[11px] font-black uppercase tracking-tighter">+1개 이번 주 시작</Text>
                                </View>
                            </WidgetCard>
                            <WidgetCard title="마감 임박 과제" icon={Clock} color="#EF4444" className="flex-1">
                                <Text className="text-4xl font-black text-[#27272a] mb-2">2<Text className="text-base font-bold text-[#94A3B8] ml-2">건</Text></Text>
                                <View className="bg-rose-500/10 px-3 py-1.5 rounded-xl self-start border border-rose-500/10">
                                    <Text className="text-rose-600 text-[11px] font-black uppercase tracking-tighter">2일 내 마감 예정</Text>
                                </View>
                            </WidgetCard>
                            <WidgetCard title="완료된 리포트" icon={CheckCircle2} color="#10B981" className="flex-1">
                                <Text className="text-4xl font-black text-[#27272a] mb-2">12<Text className="text-base font-bold text-[#94A3B8] ml-2">건</Text></Text>
                                <View className="px-3 py-1.5 rounded-xl self-start border" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.1)' }}>
                                    <Text className="text-[#7C3AED] text-[11px] font-black uppercase tracking-tighter">지난달 대비 20% ▲</Text>
                                </View>
                            </WidgetCard>
                        </View>

                        {/* Today's Schedule timeline placeholder */}
                        <WidgetCard title="오늘의 일정 정리" icon={Calendar} color="#F59E0B" className="flex-none">
                            <View className="gap-4">
                                {[
                                    { time: '10:00 AM', title: 'R&D 기획 전략 회의', tag: 'Team Strategy', active: true },
                                    { time: '02:00 PM', title: '정부 지원 사업 서류 검토', tag: 'Document Review', active: false },
                                    { time: '04:00 PM', title: 'AI 기반 시장성 분석', tag: 'Market Insight', active: false },
                                ].map((item, idx) => (
                                    <View key={idx} className={`flex-row items-center p-5 rounded-2xl border ${item.active ? '' : 'bg-[#F8FAFC]/50 border-[#E2E8F0]'}`} 
                                        style={item.active ? { backgroundColor: 'rgba(124, 58, 237, 0.05)', borderColor: 'rgba(124, 58, 237, 0.2)', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 } : {}}>
                                        <Text className={`text-xs font-black w-24 uppercase tracking-widest ${item.active ? 'text-[#7C3AED]' : 'text-[#94A3B8]'}`}>{item.time}</Text>
                                        <View className={`w-1 h-10 mx-5 rounded-full`} style={{ backgroundColor: item.active ? '#7C3AED' : '#E2E8F0' }} />
                                        <View className="flex-1">
                                            <Text className={`text-base font-bold ${item.active ? 'text-[#27272a]' : 'text-[#64748B]'}`}>{item.title}</Text>
                                            <Text className="text-[11px] text-[#94A3B8] font-black uppercase mt-1 tracking-widest">{item.tag}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </WidgetCard>
                    </View>

                    {/* Right Column (Projects & Grants) - Flex 1 */}
                    <View className="flex-1 min-w-[380px] gap-8">

                        {/* Recent Progress */}
                        <WidgetCard title="최근 분석 진행도" icon={TrendingUp} color="#7C3AED">
                            <View className="gap-6">
                                {[
                                    { name: 'SaaS MVP 전략 수립', progress: 75, color: '#7C3AED' },
                                    { name: 'K-Startup 예비창업가 과제', progress: 40, color: '#3B82F6' },
                                    { name: 'AI 기술 기반 시장 분석', progress: 90, color: '#10B981' },
                                ].map((p, i) => (
                                    <View key={i}>
                                        <View className="flex-row justify-between mb-3 items-end">
                                            <Text className="text-[#27272a] text-sm font-black">{p.name}</Text>
                                            <Text className="text-[#7C3AED] text-[11px] font-black uppercase tracking-widest">{p.progress}%</Text>
                                        </View>
                                        <View className="h-2 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: '#F1F5F9' }}>
                                            <View className="h-full rounded-full shadow-sm" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </WidgetCard>

                        {/* Recommended Grants */}
                        <WidgetCard title="신규 매칭 사업" icon={Briefcase} color="#D946EF">
                            <View className="gap-3">
                                {[
                                    { name: '2026 예비창업패키지 신규 선정', dday: 'D-12', tag: '최대 1억 지원' },
                                    { name: '중기부 혁신 데이터 바우처', dday: 'D-5', tag: '최대 7천만 규모' },
                                    { name: '생성형 AI 서비스 바우처', dday: 'D-20', tag: '최대 3억 지원' },
                                ].map((g, i) => (
                                    <TouchableOpacity key={i} className="flex-row items-center justify-between p-4 rounded-2xl border active:bg-slate-50" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                                        <View className="flex-1 mr-3">
                                            <Text className="text-[#27272a] text-sm font-black truncate mb-1" numberOfLines={1}>{g.name}</Text>
                                            <Text className="text-[#D946EF] text-[10px] font-black uppercase tracking-widest">{g.tag}</Text>
                                        </View>
                                        <View className="px-2 py-1 rounded-lg border items-center justify-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                                            <Text className="text-[10px] text-[#64748B] font-black uppercase">{g.dday}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity className="mt-6 py-4 rounded-2xl items-center active:opacity-90" style={{ backgroundColor: '#7C3AED', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
                                <Text className="text-white text-xs font-black uppercase tracking-widest">맞춤 공고 더보기</Text>
                            </TouchableOpacity>
                        </WidgetCard>

                        {/* Recent Files */}
                        <WidgetCard title="최근 파일함" icon={FileText} color="#64748B">
                            <View className="gap-3">
                                {[
                                    { name: '전략기획서_v2_최종안.docx', time: '2시간 전' },
                                    { name: '2026_사업추정_데이터.xlsx', time: '어제 오후' },
                                ].map((f, i) => (
                                    <TouchableOpacity key={i} className="flex-row items-center p-3 rounded-xl border border-transparent hover:bg-[#F8FAFC]">
                                        <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-3">
                                            <FileText size={16} color="#94A3B8" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-[#27272a] text-xs font-bold truncate" numberOfLines={1}>{f.name}</Text>
                                            <Text className="text-[#94A3B8] text-[10px] uppercase font-black tracking-widest mt-0.5">{f.time}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </WidgetCard>
                    </View>
                </View>
            </View>
            <View className="h-32" />{/* Bottom Spacer */}
        </ScrollView>
    );
};
