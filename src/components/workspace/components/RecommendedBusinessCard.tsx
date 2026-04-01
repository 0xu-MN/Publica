import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, ChevronRight, Search } from 'lucide-react-native';

interface BusinessItem {
    id: string;
    title: string;
    dDay: string;
    matchingRate: number;
}

interface RecommendedBusinessCardProps {
    items: BusinessItem[];
    onExploreAll: () => void;
    onApply?: (item: BusinessItem) => void;
}

export const RecommendedBusinessCard = ({ items, onExploreAll, onApply }: RecommendedBusinessCardProps) => {
    return (
        <View className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] flex-1 shadow-2xl shadow-black/[0.03]">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-8">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 items-center justify-center">
                        <Sparkles size={20} color="#7C3AED" strokeWidth={2.5} />
                    </View>
                    <View>
                        <Text className="text-[#27272a] font-black text-lg tracking-tight">맞춤 사업 추천</Text>
                        <Text className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest leading-none">AI Insight</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={onExploreAll} className="p-2 rounded-full bg-[#F8FAFC]">
                    <ChevronRight size={20} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* List of Recommended Businesses */}
            {items.length > 0 ? (
                <View className="gap-6 mb-8">
                    {items.map((item) => (
                        <View
                            key={item.id}
                            className="bg-[#F8FAFC]/50 rounded-[28px] p-6 border border-[#E2E8F0] shadow-sm relative overflow-hidden active:scale-[0.98] transition-transform"
                        >
                            <View className="flex-row items-start justify-between mb-4">
                                <View className="flex-1 mr-4">
                                    <View className="bg-amber-500/10 self-start px-2.5 py-1 rounded-lg mb-2">
                                        <Text className="text-amber-600 text-[10px] font-black uppercase">마감 D-{item.dDay}</Text>
                                    </View>
                                    <Text className="text-[#27272a] font-black text-base leading-tight" numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row items-center justify-between border-t border-[#E2E8F0]/40 pt-4">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                    <Text className="text-[#10B981] text-[11px] font-black tracking-wider uppercase">
                                        MATCHING {item.matchingRate}%
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    className="bg-[#7C3AED] px-5 py-3 rounded-2xl shadow-lg shadow-[#7C3AED]/20 active:opacity-90" 
                                    onPress={() => onApply?.(item)}
                                >
                                    <Text className="text-white text-xs font-black uppercase tracking-widest">분석 시작</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <View className="bg-[#F8FAFC]/30 rounded-[32px] p-12 border border-dashed border-[#E2E8F0] items-center justify-center min-h-[280px] mb-8">
                    <View className="w-20 h-20 rounded-[30px] bg-white border border-[#E2E8F0] items-center justify-center mb-6 shadow-sm">
                        <Search size={32} color="#CBD5E1" strokeWidth={1.5} />
                    </View>
                    <Text className="text-[#27272a] text-xl font-black text-center mb-3 tracking-tight">
                        새로운 기회 분석 중
                    </Text>
                    <Text className="text-[#94A3B8] text-sm text-center leading-relaxed font-bold">
                        연구원님의 프로필에 최적화된{"\n"}전략 공고를 실시간 탐색하고 있습니다
                    </Text>
                </View>
            )}

            {/* Footer Button */}
            <TouchableOpacity
                onPress={onExploreAll}
                className="bg-white py-4 rounded-2xl border border-[#E2E8F0] items-center justify-center shadow-sm active:bg-slate-50"
            >
                <Text className="text-[#64748B] text-xs font-black uppercase tracking-widest">모든 지원사업 둘러보기</Text>
            </TouchableOpacity>
        </View>
    );
};
