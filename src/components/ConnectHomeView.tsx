import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowRight, Sparkles, AlertCircle, Briefcase, Home, RefreshCcw, Users } from 'lucide-react-native';
import { useSharedValue } from 'react-native-reanimated';
import { VerticalStackCarousel } from './VerticalStackCarousel';
import { GovernmentCard } from './GovernmentCard';
import { CommunityCard } from './CommunityCard';
import { fetchGovernmentPrograms } from '../services/newsService';
import Footer from './Footer';

interface ConnectHomeViewProps {
    onNavigateToSupport?: () => void;
    onNavigateToLounge?: () => void;
}

export const ConnectHomeView: React.FC<ConnectHomeViewProps> = ({ onNavigateToSupport, onNavigateToLounge }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const dummyProgress = useSharedValue(0);

    const [govPrograms, setGovPrograms] = React.useState<any[]>([]);
    const [communityPosts, setCommunityPosts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const progs = await fetchGovernmentPrograms();
            setGovPrograms(progs);

            setCommunityPosts([
                { title: 'Nature 게재 논문, 재현성 문제 관련 토론 요청합니다.', author: '김연구', category: '연구·학술', content: '최근 발표된 AlphaFold3 관련 논문에서 특정 단백질 구조 예측 부분의 재현이 잘 안되네요. 혹시 같은 실험 해보신 분 계신가요?', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800' },
                { title: '박사 3년차인데 번아웃이 너무 심하게 왔습니다.', author: '익명', category: '고민·상담', content: '연구 진도는 안 나가고 교수님 압박은 심해지고... 다들 어떻게 버티시나요? 휴학을 진지하게 고민 중입니다.', imageUrl: undefined },
                { title: '2026 하반기 반도체 섹터 전망 및 포트폴리오 공유', author: '이투자', category: '투자·경제', content: '현재 HBM 공급 과잉 우려가 있지만 AI 서버 수요는 여전히 견고합니다. 제 개인적인 롱/숏 전략 공유드립니다.', imageUrl: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=800' },
                { title: '예비창업패키지 최종 합격 꿀팁 (사업계획서 첨부)', author: '최창업', category: '정부지원', content: '3수 끝에 드디어 합격했습니다! 심사위원이 중요하게 본 포인트 3가지를 정리해봤습니다. 도움 되시길 바랍니다.', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800' },
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

    return (
        <ScrollView
            className="flex-1 w-full bg-[#020617]"
            contentContainerStyle={{ paddingBottom: 0 }}
            showsVerticalScrollIndicator={false}
        >
            <View className="max-w-[1400px] mx-auto w-full p-6 ">
                {/* Header Area */}
                <View className="mb-10 pt-4 flex-row justify-between items-end">
                    <View>
                        <View className="flex-row items-center mb-2">
                            <Home size={28} color="#3B82F6" />
                            <Text className="text-white text-3xl font-bold ml-3">Connect Hub</Text>
                        </View>
                        <Text className="text-slate-400 text-base">정부사업과 커뮤니티를 한 곳에서</Text>
                    </View>
                    <TouchableOpacity
                        onPress={loadData}
                        className="bg-white/5 p-3 rounded-full border border-white/10"
                    >
                        <RefreshCcw size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* Main Content Grid */}
                <View className="flex-row flex-wrap gap-8 mb-12">

                    {/* Column 1: Government Support (Now Main Left) */}
                    <View className="flex-1 min-w-[400px]">
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center gap-2">
                                <View className="bg-emerald-500/10 p-2 rounded-lg">
                                    <AlertCircle size={20} color="#10B981" />
                                </View>
                                <Text className="text-white text-xl font-bold">정부사업 안내</Text>
                            </View>
                            <TouchableOpacity
                                className="bg-white/5 py-1.5 px-3 rounded-full border border-white/10 flex-row items-center hover:bg-white/10"
                                onPress={onNavigateToSupport}
                            >
                                <Text className="text-slate-400 text-xs mr-1">전체 보기</Text>
                                <ArrowRight size={10} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View className="w-full h-[550px] relative mt-4">
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
                                containerHeight={550}
                            />
                        </View>
                    </View>

                    {/* Column 2: Community Lounge (Now Main Right) */}
                    <View className="flex-1 min-w-[400px]">
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center gap-2">
                                <View className="bg-blue-500/10 p-2 rounded-lg">
                                    <Users size={20} color="#3B82F6" />
                                </View>
                                <Text className="text-white text-xl font-bold">커뮤니티 라운지</Text>
                            </View>
                            <TouchableOpacity
                                className="bg-white/5 py-1.5 px-3 rounded-full border border-white/10 flex-row items-center hover:bg-white/10"
                                onPress={onNavigateToLounge}
                            >
                                <Text className="text-slate-400 text-xs mr-1">라운지 이동</Text>
                                <ArrowRight size={10} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View className="w-full h-[550px] relative mt-4">
                            <VerticalStackCarousel
                                data={communityPosts}
                                renderItem={(item, index, progress, totalItems) => (
                                    <CommunityCard
                                        item={item}
                                        index={index}
                                        progress={progress}
                                        totalItems={totalItems}
                                    />
                                )}
                                itemHeight={340}
                                containerHeight={550}
                            />
                        </View>
                    </View>
                </View>

                {/* Section 4: Headhunting (Placeholder) */}
                <View className="mt-12 mb-10 pt-10 border-t border-white/5">
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center gap-3">
                            <View className="bg-purple-500/10 p-2.5 rounded-xl">
                                <Briefcase size={22} color="#A855F7" />
                            </View>
                            <View>
                                <Text className="text-white text-xl font-bold">프리미엄 헤드헌팅</Text>
                                <Text className="text-slate-500 text-xs mt-0.5">인재와 기업을 잇는 데이터 매칭</Text>
                            </View>
                        </View>
                        <View className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <Text className="text-slate-400 text-[11px] font-bold">준비 중</Text>
                        </View>
                    </View>

                    {/* Visual Placeholder */}
                    <View className="w-full h-[300px] rounded-[40px] bg-white/5 border border-dashed border-white/10 items-center justify-center">
                        <Users size={40} color="#334155" />
                        <Text className="text-slate-500 mt-4 font-medium">서비스 고도화 작업이 진행 중입니다.</Text>
                    </View>
                </View>
            </View>
            <Footer />
        </ScrollView>
    );
};
