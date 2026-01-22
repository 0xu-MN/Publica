import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { ArrowRight, Sparkles, AlertCircle, Briefcase } from 'lucide-react-native';
import { VerticalStackCarousel } from './VerticalStackCarousel';
import { GovernmentCard } from './GovernmentCard';
import { CommunityCard } from './CommunityCard';
import Footer from './Footer';

// Mock Data
const GOVERNMENT_PROGRAMS = [
    { title: '데이터바우처 지원사업', agency: '한국데이터산업진흥원', period: '2026.03.15', status: '접수중', dDay: 'D-30', category: '데이터/AI' },
    { title: '글로벌 강소기업 1000+', agency: '중소벤처기업부', period: '2026.02.20', status: '마감임박', dDay: 'D-15', category: '수출/마케팅' },
    { title: '스마트상점 기술보급', agency: '소상공인시장진흥공단', period: '2026.04.01', status: '접수예정', dDay: 'D-45', category: '소상공인' },
    { title: '2026년도 AI 바우처 지원', agency: '과학기술정보통신부', period: '2026.02.28', status: '접수중', dDay: 'D-22', category: '기술개발' },
    { title: '청년창업사관학교 16기', agency: '중소벤처기업진흥공단', period: '2026.02.05', status: '마감임박', dDay: 'D-3', category: '창업지원' },
];

const COMMUNITY_POSTS = [
    { title: 'Nature 게재 논문, 재현성 문제 관련 토론 요청합니다.', author: '김연구', category: '연구·학술', content: '최근 발표된 AlphaFold3 관련 논문에서 특정 단백질 구조 예측 부분의 재현이 잘 안되네요. 혹시 같은 실험 해보신 분 계신가요?', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800' },
    { title: '박사 3년차인데 번아웃이 너무 심하게 왔습니다.', author: '익명', category: '고민·상담', content: '연구 진도는 안 나가고 교수님 압박은 심해지고... 다들 어떻게 버티시나요? 휴학을 진지하게 고민 중입니다.', imageUrl: undefined },
    { title: '2026 하반기 반도체 섹터 전망 및 포트폴리오 공유', author: '이투자', category: '투자·경제', content: '현재 HBM 공급 과잉 우려가 있지만 AI 서버 수요는 여전히 견고합니다. 제 개인적인 롱/숏 전략 공유드립니다.', imageUrl: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=800' },
    { title: '예비창업패키지 최종 합격 꿀팁 (사업계획서 첨부)', author: '최창업', category: '정부지원', content: '3수 끝에 드디어 합격했습니다! 심사위원이 중요하게 본 포인트 3가지를 정리해봤습니다. 도움 되시길 바랍니다.', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800' },
];

interface ConnectHomeViewProps {
    onNavigateToSupport?: () => void;
    onNavigateToLounge?: () => void;
}

export const ConnectHomeView: React.FC<ConnectHomeViewProps> = ({ onNavigateToSupport, onNavigateToLounge }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    return (
        <ScrollView
            className="flex-1 w-full bg-[#020617]"
            contentContainerStyle={{ paddingBottom: 0 }}
            showsVerticalScrollIndicator={false}
        >
            <View className="max-w-[1400px] mx-auto w-full pt-14 px-6 md:px-0">
                {/* Header Area */}
                <View className="mb-10">
                    <Text className="text-white text-4xl font-bold mb-2">Connect Hub</Text>
                    <Text className="text-slate-400 text-lg">정부사업과 커뮤니티를 한 곳에서</Text>
                </View>

                <View className="flex-row gap-8 min-h-[500px]">
                    {/* 1. Government Support Section */}
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center gap-2">
                                <View className="bg-emerald-500/10 p-2 rounded-lg">
                                    <Sparkles size={20} color="#10B981" />
                                </View>
                                <Text className="text-white text-xl font-bold">정부사업 안내</Text>
                            </View>
                            <TouchableOpacity
                                className="bg-white/5 py-1.5 px-3 rounded-full border border-white/10 flex-row items-center hover:bg-white/10"
                                onPress={onNavigateToSupport}
                            >
                                <Text className="text-slate-400 text-xs mr-1">더 보기</Text>
                                <ArrowRight size={10} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Vertical Stack Carousel */}
                        <View className="w-full h-[500px] relative mt-4">
                            <VerticalStackCarousel
                                data={GOVERNMENT_PROGRAMS}
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

                    {/* 2. Community Lounge Section */}
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center gap-2">
                                <View className="bg-blue-500/10 p-2 rounded-lg">
                                    <AlertCircle size={20} color="#3B82F6" />
                                </View>
                                <Text className="text-white text-xl font-bold">커뮤니티 라운지</Text>
                            </View>
                            <TouchableOpacity
                                className="bg-white/5 py-1.5 px-3 rounded-full border border-white/10 flex-row items-center hover:bg-white/10"
                                onPress={onNavigateToLounge}
                            >
                                <Text className="text-slate-400 text-xs mr-1">더 보기</Text>
                                <ArrowRight size={10} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Vertical Stack Carousel */}
                        <View className="w-full h-[500px] relative mt-4">
                            <VerticalStackCarousel
                                data={COMMUNITY_POSTS}
                                renderItem={(item, index, progress, totalItems) => (
                                    <CommunityCard
                                        item={item}
                                        index={index}
                                        progress={progress}
                                        totalItems={totalItems}
                                    />
                                )}
                                itemHeight={340} // Card Height
                                containerHeight={500}
                            />
                        </View>
                    </View>
                </View>

                {/* 3. Headhunting Section (Skeleton Placeholder) */}
                <View className="mt-12 mb-10">
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center gap-2">
                            <View className="bg-purple-500/10 p-2 rounded-lg">
                                <Briefcase size={20} color="#A855F7" />
                            </View>
                            <Text className="text-white text-xl font-bold">헤드헌팅</Text>
                            <View className="bg-white/10 px-2 py-0.5 rounded text-center">
                                <Text className="text-slate-400 text-[10px]">Coming Soon</Text>
                            </View>
                        </View>
                    </View>

                    {/* Skeleton UI simulating VerticalStackCarousel */}
                    <View className="w-full h-[400px] relative items-center justify-center opacity-50">

                        {/* Top Pill Skeleton */}
                        <View className="absolute top-[20px] w-full h-[60px] rounded-[30px] bg-white/5 border border-white/5" />

                        {/* Middle Card Skeleton */}
                        <View className="absolute top-[100px] w-full h-[300px] rounded-[30px] bg-white/5 border border-white/5 p-6 justify-between">
                            <View className="flex-row justify-between">
                                <View className="w-1/3 h-4 bg-white/10 rounded" />
                                <View className="w-10 h-6 bg-white/10 rounded-full" />
                            </View>
                            <View className="items-center gap-3">
                                <View className="w-3/4 h-8 bg-white/10 rounded" />
                                <View className="w-1/2 h-4 bg-white/10 rounded" />
                            </View>
                            <View className="flex-row gap-3 h-[80px]">
                                <View className="flex-[1.6] bg-white/5 rounded-2xl" />
                                <View className="flex-1 bg-white/5 rounded-2xl" />
                            </View>
                        </View>

                        {/* Bottom Pill Skeleton */}
                        <View className="absolute top-[420px] w-full h-[60px] rounded-[30px] bg-white/5 border border-white/5" />

                    </View>
                </View>
            </View>
            <Footer />
        </ScrollView>
    );
};
