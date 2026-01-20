import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ChevronRight, ArrowRight, Sparkles, TrendingUp, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VerticalScrollCards } from './VerticalScrollCards';
import { mockCommunityPosts, CommunityPost } from '../data/mockData';

interface ConnectHomeViewProps {
    onNavigateToSupport: () => void;
    onNavigateToLounge: () => void;
}

const GOVERNMENT_PROGRAMS = [
    { id: '1', title: '2026년도 AI 바우처 지원사업', subtitle: '과학기술정보통신부', meta: '~ 2026.02.28 | 최대 3억' },
    { id: '2', title: '청년창업사관학교 16기', subtitle: '중소벤처기업진흥공단', meta: '~ 2026.02.05 | D-3' },
    { id: '3', title: '데이터바우처 지원사업', subtitle: '한국데이터산업진흥원', meta: '~ 2026.03.15 | 최대 4500만' },
    { id: '4', title: '글로벌 강소기업 1000+', subtitle: '중소벤처기업부', meta: '~ 2026.02.20 | 수출/마케팅' },
    { id: '5', title: '스마트상점 기술보급', subtitle: '소상공인시장진흥공단', meta: '~ 2026.04.01 | 최대 1500만' },
];

export const ConnectHomeView: React.FC<ConnectHomeViewProps> = ({ onNavigateToSupport, onNavigateToLounge }) => {
    // Get random 4 posts for the grid
    const recentPosts = mockCommunityPosts.slice(0, 4);

    return (
        <ScrollView className="flex-1 pb-20" showsVerticalScrollIndicator={false}>
            <View className="px-8 py-10 gap-12 max-w-[1400px] w-full mx-auto">

                {/* Main Title */}
                <View className="mb-4">
                    <Text className="text-white text-4xl font-bold mb-2">Connect Hub</Text>
                    <Text className="text-slate-400 text-base">정부사업과 커뮤니티를 한 곳에서</Text>
                </View>

                {/* SECTION 1: Government Support (Moving Card + List) */}
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-2">
                            <View className="bg-green-500/10 p-1.5 rounded-lg">
                                <Sparkles size={16} color="#4ADE80" />
                            </View>
                            <Text className="text-white text-lg font-bold">정부사업 안내</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onNavigateToSupport}
                            className="bg-[#1E293B] px-3 py-1.5 rounded-full border border-white/10 flex-row items-center hover:bg-slate-800"
                        >
                            <Text className="text-slate-400 text-xs font-bold mr-1">더 보기</Text>
                            <ChevronRight size={12} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row gap-6 h-[600px]">
                        {/* LEFT: Vertical Scroll Cards */}
                        <View className="flex-1">
                            <VerticalScrollCards
                                items={GOVERNMENT_PROGRAMS}
                                title="맞춤형 정부사업"
                                subtitle="회원님께 딱 맞는 사업을&#10;실시간으로 분석했습니다."
                                bgGradientColors={['#2E1065', '#0F172A']}
                            />
                        </View>

                        {/* RIGHT: Static List / Placeholder for "Other Business List" */}
                        <View className="flex-1 bg-[#1E293B] rounded-3xl border border-white/10 p-6 justify-between">
                            <View>
                                <Text className="text-slate-400 text-xs font-bold mb-4 uppercase tracking-wider">맞춤형 지원사업</Text>
                                <View className="gap-4">
                                    {[1, 2, 3].map((i) => (
                                        <View key={i} className="flex-row gap-3">
                                            <View className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 items-center justify-center">
                                                <Text className="text-slate-500 font-bold text-xs">{i}</Text>
                                            </View>
                                            <View className="flex-1 justify-center">
                                                <View className="h-2.5 w-3/4 bg-slate-700/50 rounded mb-1.5" />
                                                <View className="h-2 w-1/2 bg-slate-800/50 rounded" />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View className="border-t border-white/5 pt-4">
                                <Text className="text-slate-500 text-center text-xs leading-5">
                                    기존에 보고 계시던{'\n'}
                                    관심 사업 리스트를 여기다{'\n'}
                                    보여주면 될 듯?
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>


                {/* SECTION 2: Community Lounge (Hot Zone + Grid) */}
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-2">
                            <View className="bg-blue-500/10 p-1.5 rounded-lg">
                                <Users size={16} color="#60A5FA" />
                            </View>
                            <Text className="text-white text-lg font-bold">커뮤니티 라운지</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onNavigateToLounge}
                            className="bg-[#1E293B] px-3 py-1.5 rounded-full border border-white/10 flex-row items-center hover:bg-slate-800"
                        >
                            <Text className="text-slate-400 text-xs font-bold mr-1">라운지 입장</Text>
                            <ArrowRight size={12} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row gap-6 h-[600px]">
                        {/* LEFT: Vertical Scroll Cards (Community) */}
                        <View className="flex-1">
                            <VerticalScrollCards
                                items={recentPosts.map(p => ({
                                    id: p.id,
                                    title: p.title,
                                    subtitle: p.content,
                                    meta: `${p.category} · ${p.author}`
                                }))}
                                title="실시간 인기 구역"
                                subtitle="지금 가장 뜨거운 논쟁이&#10;일어나고 있는 곳입니다."
                                bgGradientColors={['#1e1b4b', '#0F172A']}
                            />
                        </View>

                        {/* RIGHT: 2x2 Grid Categories Placeholder */}
                        <View className="flex-1 flex-row flex-wrap gap-3">
                            {['연구·학술', '투자·경제', '고민·상담', '오프토픽'].map((cat, idx) => (
                                <View key={cat} className="w-[48%] h-[48%] bg-[#1E293B] rounded-2xl border border-white/5 p-4 justify-between hover:border-blue-500/30 transition-all cursor-pointer">
                                    <View className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center">
                                        <Text className="text-white font-bold text-xs">{idx + 1}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-slate-400 text-[10px] mb-1">카테고리별 라운지</Text>
                                        <Text className="text-white font-bold text-sm">{cat}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

            </View>
        </ScrollView>
    );
};
