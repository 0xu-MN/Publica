import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView, ActivityIndicator, Image } from 'react-native';
import { ArrowRight, Sparkles, AlertCircle, Briefcase, Home, RefreshCcw, Users, Building2, Search, Filter, LayoutGrid, Plus, Bell, User as UserIcon, CheckCircle2 } from 'lucide-react-native';
import { useSharedValue } from 'react-native-reanimated';
import { VerticalStackCarousel } from './VerticalStackCarousel';
import { GovernmentCard } from './GovernmentCard';
import { CommunityCard } from './CommunityCard';
import { fetchGovernmentPrograms } from '../services/newsService';
import { AdvancedSearchFilter } from './AdvancedSearchFilter';
import { GovernmentProgramList } from './GovernmentProgramList';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';

interface ConnectHomeViewProps {
    onNavigateToSupport?: () => void;
    onNavigateToLounge?: () => void;
    onProgramSelect?: (program: any) => void;
    onLoginPress?: () => void;
}

export const ConnectHomeView: React.FC<ConnectHomeViewProps> = ({
    onNavigateToSupport,
    onNavigateToLounge,
    onProgramSelect,
    onLoginPress
}) => {
    const { width } = useWindowDimensions();
    const { user } = useAuth();
    const isDesktop = width >= 1024;
    const scrollRef = React.useRef<ScrollView>(null);
    const searchSectionRef = React.useRef<View>(null);

    const [govPrograms, setGovPrograms] = React.useState<any[]>([]);
    const [fundingPrograms, setFundingPrograms] = React.useState<any[]>([]);
    const [communityPosts, setCommunityPosts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            // Added mock data for govPrograms to ensure enough items for carousel
            const progs = [
                { title: '2026년 예비창업패키지 (일반분야)', agency: '중소벤처기업부', status: '접수중', dDay: 'D-15', category: '사업화', budget: '최대 1.0억원', period: '2024.01.01 ~ 2024.03.31' },
                { title: 'AI 에이전트 고도화 R&D 지원사업', agency: '과학기술정보통신부', status: '접수중', dDay: 'D-30', category: 'R&D', budget: '최대 3.0억원', period: '2024.02.01 ~ 2024.04.30' },
                { title: '2026년 청년창업사관학교 지원사업', agency: '중소벤처기업진흥공단', status: '접수중', dDay: 'D-5', category: '창업', budget: '최대 0.5억원', period: '2024.03.01 ~ 2024.05.31' },
            ];
            setGovPrograms(progs);

            setFundingPrograms([
                { title: '청년창업 활성화 융자 지원금', agency: '중소벤처기업진흥공단', status: '접수중', dDay: 'D-15', category: '지원금', budget: '최대 2.0억원', period: '2024.01.27 ~ 2026.12.31' },
                { title: '녹색기술 사업화 보조금', agency: '산업통상자원부', status: '예정', dDay: 'D-30', category: '보조금', budget: '최대 3.0억원', period: '2024.02.01 ~ 2026.12.31' },
                { title: '디지털 전환 솔루션 바우처', agency: '과학기술정보통신부', status: '접수중', dDay: 'D-5', category: '바우처', budget: '최대 5,000만원', period: '2024.03.01 ~ 2026.12.31' },
            ]);

            setCommunityPosts([
                { title: '예비창업패키지 3번 문항 작성 팁 있을까요?', author: '박연구원', time: '54분 전', category: 'Q&A', content: '이번에 예비창업패키지 준비 중인데 3번 BM 구성이 어렵네요...', likes: 4, comments: 12 },
                { title: '이번 R&D 예산 증액안, 실제로 체감되시나요?', author: '김대표', time: '1시간 전', category: '자유게시판', content: '뉴스에서는 증액이라는데 실제로는 잘 모르겠네요.', likes: 21, comments: 45 },
                { title: '지자체 지원금 드디어 입금됐습니다!', author: '이창업', time: '3시간 전', category: 'Talk', content: '기다림 끝에 오늘 입금 확인했네요. 다들 힘내세요!', likes: 2, comments: 8 },
                { title: '시리즈 A 투자 유치 성공기 공유합니다', author: '최투자', time: '5시간 전', category: 'Insight', content: '약 1년간의 투자 유치 과정을 정리해봤습니다.', likes: 88, comments: 32 },
            ]);
        } catch (error) {
            console.error("Error loading connect hub data:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 bg-[#020617] items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-slate-400 mt-4 font-medium">Connect Hub 로딩 중...</Text>
            </View>
        );
    }

    // Render Logged Out View
    const renderLoggedOut = () => (
        <View className="max-w-[1400px] mx-auto w-full p-6">
            {/* Header */}
            <View className="mb-8 pt-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-white text-5xl font-black tracking-tighter mb-2">CONNECT HUB</Text>
                    <Text className="text-slate-400 text-lg">홍길동 연구원님의 사업 아이템에 맞춘 최적의 기회입니다.</Text>
                </View>
                <TouchableOpacity className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex-row items-center">
                    <Filter size={18} color="#94A3B8" />
                    <Text className="text-slate-300 ml-2 font-medium">필터링</Text>
                </TouchableOpacity>
            </View>

            {/* Login CTA Banner */}
            <TouchableOpacity
                onPress={onLoginPress}
                className="w-full bg-[#6366F1] py-10 rounded-[32px] items-center justify-center mb-12 shadow-2xl shadow-indigo-500/20"
            >
                <Text className="text-white text-xl font-bold">로그인 후 더 많은 기능을 이용하실 수 있습니다</Text>
            </TouchableOpacity>

            {/* ROW SET 1: Gov Programs + New Opportunities */}
            <View className="flex-row gap-8 mb-12">
                {/* Left: Government Info */}
                <View className="flex-[1.1]">
                    <View className="flex-row items-center justify-between mb-6 px-2">
                        <View className="flex-row items-center gap-2">
                            <View className="bg-white/10 p-1.5 rounded-full">
                                <AlertCircle size={16} color="#94A3B8" />
                            </View>
                            <Text className="text-white text-xl font-bold">정부사업 안내</Text>
                        </View>
                        <TouchableOpacity className="bg-white/5 px-2 py-0.5 rounded-md border border-white/10"><Text className="text-slate-500 text-[10px]">전체보기 {'>'}</Text></TouchableOpacity>
                    </View>

                    <View className="w-full h-[500px] relative">
                        <VerticalStackCarousel
                            data={govPrograms}
                            renderItem={(item, index, progress, totalItems) => (
                                <GovernmentCard
                                    item={item}
                                    index={index}
                                    progress={progress}
                                    totalItems={totalItems}
                                />
                            )}
                            itemHeight={340}
                            containerHeight={500}
                        />
                    </View>
                </View>

                {/* Right: New Opportunities */}
                <View className="flex-1">
                    <View className="bg-[#0F172A] p-10 rounded-[48px] border border-white/5 h-[570px]">
                        <View className="flex-row items-center justify-between mb-8">
                            <Text className="text-white text-xl font-black tracking-tight">NEW OPPORTUNITIES</Text>
                            <TouchableOpacity><Text className="text-slate-500 text-[10px] font-black tracking-tighter uppercase">View All Projects</Text></TouchableOpacity>
                        </View>
                        <View className="flex-row flex-wrap gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <View key={i} className="w-[47%] bg-slate-900/50 p-6 rounded-[28px] border border-white/5 h-[160px] justify-between">
                                    <View>
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-slate-600 text-[8px] font-bold">중소벤처기업부</Text>
                                            <Text className="text-[#34D399] text-[10px] font-black">D-12</Text>
                                        </View>
                                        <Text className="text-white text-xs font-bold leading-5" numberOfLines={3}>2026 글로벌 기술 매칭 펀드 및 바우처 지원사업 참여 기업 모집</Text>
                                    </View>
                                    <View className="flex-row gap-1">
                                        <View className="bg-slate-800 px-1.5 py-0.5 rounded-sm"><Text className="text-slate-500 text-[7px]">자금</Text></View>
                                        <View className="bg-slate-800 px-1.5 py-0.5 rounded-sm"><Text className="text-slate-500 text-[7px]">글로벌</Text></View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* SEPARATE UI: Horizontal Divider */}
            <View className="w-full h-[1px] bg-white/5 mb-16 relative">
                <View className="absolute left-0 top-[-1px] w-24 h-[3px] bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </View>

            {/* ROW SET 2: Gov Funding + Funding & Grants (ALIGNED SET) */}
            <View className="flex-row gap-8 mb-24">
                {/* Left: Government Funding Rotation */}
                <View className="flex-[1.1]">
                    <View className="flex-row items-center justify-between mb-6 px-2">
                        <View className="flex-row items-center gap-2">
                            <View className="bg-white/10 p-1.5 rounded-full">
                                <Sparkles size={16} color="#A855F7" />
                            </View>
                            <Text className="text-white text-xl font-bold">정부지원금 로테이션</Text>
                        </View>
                        <TouchableOpacity className="bg-white/5 px-2 py-0.5 rounded-md border border-white/10"><Text className="text-slate-500 text-[10px]">전체보기 {'>'}</Text></TouchableOpacity>
                    </View>

                    <View className="w-full h-[500px] relative">
                        <VerticalStackCarousel
                            data={fundingPrograms}
                            renderItem={(item, index, progress, totalItems) => (
                                <GovernmentCard
                                    item={item}
                                    index={index}
                                    progress={progress}
                                    totalItems={totalItems}
                                />
                            )}
                            itemHeight={340}
                            containerHeight={500}
                        />
                    </View>
                </View>

                {/* Right: Funding & Grants */}
                <View className="flex-1">
                    <View className="bg-[#0F172A] p-10 rounded-[48px] border border-white/5 h-[500px]">
                        <View className="flex-row items-center gap-3 mb-8">
                            <Sparkles size={20} color="#60A5FA" />
                            <Text className="text-white text-xl font-black uppercase tracking-tight">Funding & Grants</Text>
                        </View>
                        <View className="gap-5">
                            {[1, 2].map(i => (
                                <View key={i} className="bg-slate-900/80 p-6 rounded-[24px] border border-white/5 flex-row justify-between items-center transition-all hover:bg-slate-800/80">
                                    <View className="flex-row items-center gap-5">
                                        <View className="w-12 h-12 bg-blue-500/10 rounded-2xl items-center justify-center border border-blue-500/20">
                                            <Briefcase size={22} color="#3B82F6" />
                                        </View>
                                        <View>
                                            <Text className="text-white text-base font-bold mb-1">청년창업 활성화 융자 지원금</Text>
                                            <Text className="text-slate-500 text-xs">중소벤처기업진흥공단 • 연 2.0% 고정금리</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-blue-400 text-lg font-black">최대 2.0억원</Text>
                                        <Text className="text-slate-600 text-[8px]">선착순 마감 가능</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* SEPARATE UI: Horizontal Divider 2 */}
            <View className="w-full h-[1px] bg-white/5 mb-16 relative">
                <View className="absolute left-0 top-[-1px] w-24 h-[3px] bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </View>

            {/* Lounge Section - FLOWING HORIZONTAL LIST */}
            <View className="mb-24 px-2">
                <View className="flex-row items-center justify-between mb-8 px-2">
                    <View className="flex-row items-center gap-3">
                        <Users size={22} color="#A855F7" />
                        <Text className="text-white text-2xl font-black">Lounge</Text>
                    </View>
                    <TouchableOpacity><Text className="text-slate-500 text-sm font-bold">전체보기 {'>'}</Text></TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 24, paddingRight: 40 }}
                >
                    {communityPosts.map((post, i) => (
                        <View key={i} className="w-[420px] bg-[#0F172A] p-8 rounded-[40px] border border-white/5 min-h-[220px] justify-between shadow-xl">
                            <View>
                                <View className="flex-row items-center gap-3 mb-6">
                                    <View className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                                        <Image source={{ uri: `https://i.pravatar.cc/100?u=${post.author}` }} className="w-full h-full" />
                                    </View>
                                    <View>
                                        <Text className="text-white text-sm font-bold">{post.author}</Text>
                                        <Text className="text-slate-500 text-[10px]">{post.time}</Text>
                                    </View>
                                </View>
                                <Text className="text-slate-200 text-base font-bold leading-7 mb-4" numberOfLines={2}>{post.title}</Text>
                            </View>
                            <View className="flex-row items-center gap-4 border-t border-white/5 pt-4">
                                <View className="flex-row items-center gap-1.5">
                                    <Text className="text-slate-500 text-[10px]">💬 {post.comments}</Text>
                                </View>
                                <View className="flex-row items-center gap-1.5">
                                    <Text className="text-slate-500 text-[10px]">👍 {post.likes}</Text>
                                </View>
                                <View className="ml-auto bg-purple-500/10 px-3 py-1 rounded-lg">
                                    <Text className="text-purple-400 text-[10px] font-black uppercase">{post.category}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    // Render Logged In View
    const renderLoggedIn = () => (
        <View className="max-w-[1400px] mx-auto w-full p-6">
            {/* Header / Personal Card */}
            <View className="mb-12">
                <Text className="text-white text-5xl font-black tracking-tight mb-2">CONNECT HUB</Text>
                <Text className="text-slate-400 text-lg mb-8">홍길동 연구원님의 사업 아이템에 맞춘 최적의 기회입니다.</Text>

                <View className="flex-row gap-6">
                    {/* User Profile Card */}
                    <View className="flex-[1.5] bg-[#0F172A] rounded-[40px] p-8 border border-white/5 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-6">
                            <View className="relative">
                                <View className="w-24 h-24 rounded-full bg-slate-800 overflow-hidden border-2 border-blue-500/30">
                                    <Image source={{ uri: 'https://i.pravatar.cc/150?u=hong' }} className="w-full h-full" />
                                </View>
                                <View className="absolute bottom-0 right-0 bg-emerald-500 w-6 h-6 rounded-full border-4 border-[#0F172A] items-center justify-center">
                                    <Plus size={12} color="white" strokeWidth={3} />
                                </View>
                            </View>
                            <View>
                                <View className="flex-row items-center gap-3 mb-2">
                                    <Text className="text-white text-3xl font-bold">홍길동 연구원님</Text>
                                    <View className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/30">
                                        <Text className="text-blue-400 text-xs font-bold">AI STRATEGIST</Text>
                                    </View>
                                </View>
                                <Text className="text-slate-400 font-medium">보유 기술: <Text className="text-blue-400">#AI_Agent, #FinTech</Text> • 선호 분야: <Text className="text-emerald-400">정부 R&D</Text></Text>
                            </View>
                        </View>
                        <View className="flex-row gap-10 pr-4">
                            <View className="items-center">
                                <Text className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-widest">Match Optimization</Text>
                                <Text className="text-blue-400 text-4xl font-black">98 <Text className="text-lg">%</Text></Text>
                            </View>
                            <View className="items-center">
                                <Text className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-widest">Active Projects</Text>
                                <Text className="text-white text-4xl font-black">3 <Text className="text-lg">건</Text></Text>
                            </View>
                        </View>
                    </View>
                    {/* Filter Icon for Logged in */}
                    <TouchableOpacity className="bg-white/5 w-16 h-16 rounded-[24px] border border-white/10 items-center justify-center self-center">
                        <RefreshCcw size={24} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Top Picks / Recommendations */}
            <View className="flex-row gap-8 mb-16">
                {/* Card 1 */}
                <TouchableOpacity className="flex-1 bg-[#0F172A] rounded-[48px] p-10 border border-white/5 relative overflow-hidden group">
                    <View className="absolute top-0 right-0 p-8">
                        <View className="items-end">
                            <Text className="text-blue-500 text-xs font-bold mb-1">SCORE</Text>
                            <Text className="text-white text-6xl font-black">94<Text className="text-2xl">%</Text></Text>
                        </View>
                    </View>
                    <Text className="text-slate-400 font-bold mb-4">중소벤처기업부</Text>
                    <Text className="text-white text-3xl font-bold leading-tight mb-8" numberOfLines={2}>2026년 예비창업패키지{"\n"}(일반분야)</Text>

                    <View className="flex-row gap-3 mb-10">
                        <View className="bg-blue-500/10 px-4 py-2 rounded-xl"><Text className="text-blue-400 font-bold">사업화</Text></View>
                        <View className="bg-slate-800 px-4 py-2 rounded-xl"><Text className="text-slate-400 font-bold">D-15</Text></View>
                    </View>

                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-slate-500 text-sm mb-1">지원 규모</Text>
                            <Text className="text-[#34D399] text-xl font-bold">최대 1.0억원</Text>
                        </View>
                        <TouchableOpacity className="bg-blue-600 px-6 py-4 rounded-2xl flex-row items-center shadow-lg shadow-blue-500/20">
                            <Sparkles size={18} color="white" />
                            <Text className="text-white font-bold ml-2 text-lg">전략 에이전트 분석</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {/* Card 2 */}
                <TouchableOpacity className="flex-1 bg-[#0F172A] rounded-[48px] p-10 border border-white/5 relative overflow-hidden group">
                    <View className="absolute top-0 right-0 p-8">
                        <View className="items-end">
                            <Text className="text-blue-500 text-xs font-bold mb-1">SCORE</Text>
                            <Text className="text-white text-6xl font-black">88<Text className="text-2xl">%</Text></Text>
                        </View>
                    </View>
                    <Text className="text-slate-400 font-bold mb-4">과학기술정보통신부</Text>
                    <Text className="text-white text-3xl font-bold leading-tight mb-8" numberOfLines={2}>AI 에이전트 고도화 R&D{"\n"}지원사업</Text>

                    <View className="flex-row gap-3 mb-10">
                        <View className="bg-blue-500/10 px-4 py-2 rounded-xl"><Text className="text-blue-400 font-bold">R&D</Text></View>
                        <View className="bg-slate-800 px-4 py-2 rounded-xl"><Text className="text-slate-400 font-bold">D-30</Text></View>
                    </View>

                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-slate-500 text-sm mb-1">지원 규모</Text>
                            <Text className="text-[#34D399] text-xl font-bold">최대 3.0억원</Text>
                        </View>
                        <TouchableOpacity className="bg-blue-600 px-6 py-4 rounded-2xl flex-row items-center shadow-lg shadow-blue-500/20">
                            <Sparkles size={18} color="white" />
                            <Text className="text-white font-bold ml-2 text-lg">전략 에이전트 분석</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="absolute bottom-4 right-4"><LayoutGrid size={24} color="#1E293B" /></View>
                </TouchableOpacity>
            </View>

            {/* Grid Preview (Middle row) */}
            <View className="flex-row gap-6 mb-20">
                {/* Col 1 */}
                <View className="flex-1 bg-[#0F172A]/50 p-8 rounded-[40px] border border-white/5">
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center gap-2">
                            <CheckCircle2 size={18} color="#10B981" />
                            <Text className="text-white text-xl font-bold">정부사업 안내</Text>
                        </View>
                        <TouchableOpacity className="bg-white/5 px-2 py-1 rounded-lg border border-white/10"><Text className="text-slate-500 text-[10px]">전체 {'>'}</Text></TouchableOpacity>
                    </View>
                    <View className="bg-[#1E293B] p-6 rounded-3xl border border-white/5">
                        <View className="bg-indigo-500/20 self-start px-2 py-0.5 rounded-md mb-3"><Text className="text-indigo-400 text-[10px] font-bold">접수중</Text></View>
                        <Text className="text-white font-bold mb-10 leading-6">2026년 청년창업사관학교 지원사업 지역특화형(민간협업형) 운영사 모집 공고</Text>
                        <View className="flex-row justify-between items-center mt-auto">
                            <Text className="text-slate-500 text-xs">중소벤처기업진흥공단</Text>
                            <Text className="text-[#34D399] font-bold">2026.02.06</Text>
                        </View>
                    </View>
                </View>

                {/* Col 2 */}
                <View className="flex-1 bg-[#0F172A]/50 p-8 rounded-[40px] border border-white/5">
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center gap-2">
                            <Sparkles size={18} color="#A855F7" />
                            <Text className="text-white text-xl font-bold">정부지원금</Text>
                        </View>
                        <TouchableOpacity className="bg-white/5 px-2 py-1 rounded-lg border border-white/10"><Text className="text-slate-500 text-[10px]">전체 {'>'}</Text></TouchableOpacity>
                    </View>
                    <View className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-6 rounded-3xl border border-white/5">
                        <View className="flex-row gap-2 mb-3">
                            <View className="bg-purple-500/10 px-2 py-0.5 rounded-md"><Text className="text-purple-400 text-[10px] font-bold">사업화</Text></View>
                            <View className="bg-slate-700 px-2 py-0.5 rounded-md"><Text className="text-slate-400 text-[10px] font-bold">D-22</Text></View>
                        </View>
                        <Text className="text-white font-black text-xl mb-12">녹색기술 사업화 보조금</Text>
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center gap-2">
                                <View className="w-5 h-5 rounded-full bg-slate-700" />
                                <Text className="text-slate-500 text-xs">산업통상자원부</Text>
                            </View>
                            <Text className="text-slate-400 text-xs">2026.12.31</Text>
                        </View>
                    </View>
                </View>

                {/* Col 3 */}
                <View className="flex-1 bg-[#0F172A]/50 p-8 rounded-[40px] border border-white/5">
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center gap-2">
                            <Users size={18} color="#60A5FA" />
                            <Text className="text-white text-xl font-bold">커뮤니티 라운지</Text>
                        </View>
                        <TouchableOpacity className="bg-white/5 px-2 py-1 rounded-lg border border-white/10"><Text className="text-slate-500 text-[10px]">이동 {'>'}</Text></TouchableOpacity>
                    </View>
                    <View className="bg-[#1E293B] p-6 rounded-3xl border border-white/5">
                        <View className="flex-row items-center gap-2 mb-4">
                            <View className="w-6 h-6 rounded-full bg-slate-700" />
                            <Text className="text-slate-400 text-xs">이투자 • 2026 하반기 반도체 섹터 전망...</Text>
                            <View className="bg-blue-500/10 px-2 py-0.5 rounded-md ml-auto"><Text className="text-blue-400 text-[8px] font-bold">투자·경제</Text></View>
                        </View>
                        <Text className="text-white font-bold leading-6 mb-4">2026 하반기 반도체 섹터 전망 및 포트폴리오 공유</Text>
                        <View className="w-full h-24 rounded-2xl bg-slate-700 mb-4 items-center justify-center overflow-hidden">
                            <Image source={{ uri: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086' }} className="w-full h-full opacity-60" />
                        </View>
                        <Text className="text-slate-500 text-[10px]" numberOfLines={2}>현재 HBM 공급 과잉 우려가 있지만 AI 서버 수요는 여전히 견고합니다. 제 개인적인 전략...</Text>
                    </View>
                </View>
            </View>

            {/* Bottom Search Section */}
            <View className="mt-20 mb-32">
                <View className="mb-10">
                    <View className="flex-row items-center gap-3 mb-2">
                        <Building2 size={32} color="#10B981" />
                        <Text className="text-white text-4xl font-black">정부사업 찾기</Text>
                    </View>
                    <Text className="text-slate-500 text-lg font-medium">내 기업에 맞는 최적의 지원사업을 검색해보세요.</Text>
                </View>

                {/* Simulated Filter Bar */}
                <View className="bg-[#0F172A] rounded-[32px] p-8 border border-white/5 mb-8">
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center gap-2">
                            <Search size={20} color="#3B82F6" />
                            <Text className="text-white text-xl font-bold">상세 조건 검색</Text>
                        </View>
                        <TouchableOpacity><Text className="text-slate-500">지우기 {'>'}</Text></TouchableOpacity>
                    </View>
                    <View className="w-full bg-[#1E293B] h-14 rounded-2xl border border-white/5 px-6 justify-center">
                        <Text className="text-slate-500">검색어 입력 (예: 청년, 반도체)</Text>
                    </View>
                </View>

                {/* List Body */}
                <View className="gap-4">
                    {[1, 2, 3].map(i => (
                        <TouchableOpacity key={i} className="bg-[#0F172A] p-8 rounded-[32px] border border-white/5 flex-row justify-between items-center group">
                            <View>
                                <View className="flex-row items-center gap-2 mb-3">
                                    <Text className="text-emerald-500 text-xs font-black uppercase tracking-tighter">공공기관 | K-Startup</Text>
                                </View>
                                <Text className="text-white text-xl font-bold group-hover:text-emerald-400 transition-colors">
                                    {i === 1 ? '2026년 지역특화산업육성사업(R&D) 제1차 신규지원 과제 모집 공고' : i === 2 ? '부산창조경제혁신센터 Plug-in Tokyo #9 참여 스타트업 모집' : '2026년 스타트업 AI 기술인력 양성(이어드림 스쿨) 교육생 모집 공고'}
                                </Text>
                                <View className="flex-row items-center gap-2 mt-4">
                                    <View className="bg-emerald-500/10 px-2 py-0.5 rounded-full"><Text className="text-emerald-500 text-[10px] font-bold">접수중</Text></View>
                                </View>
                            </View>
                            <ArrowRight size={24} color="#334155" />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    return (
        <ScrollView
            ref={scrollRef}
            className="flex-1 w-full bg-[#020617]"
            contentContainerStyle={{ paddingBottom: 0 }}
            showsVerticalScrollIndicator={false}
        >
            {user ? renderLoggedIn() : renderLoggedOut()}
            <Footer />
        </ScrollView>
    );
};
