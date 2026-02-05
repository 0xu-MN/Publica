import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, ChevronRight } from 'lucide-react-native';

interface BusinessItem {
    id: string;
    title: string;
    dDay: string;
    matchingRate: number;
}

interface RecommendedBusinessCardProps {
    items: BusinessItem[];
    onExploreAll: () => void;
}

export const RecommendedBusinessCard = ({ items, onExploreAll }: RecommendedBusinessCardProps) => {
    return (
        <View className="bg-[#0F172A]/80 rounded-2xl p-5 border border-white/5 flex-1">
            {/* Header */}
            <TouchableOpacity className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                    <Sparkles size={18} color="#EC4899" />
                    <Text className="text-white font-bold text-base">맞춤 사업 추천</Text>
                </View>
                <ChevronRight size={18} color="#475569" />
            </TouchableOpacity>

            {/* List of Recommended Businesses */}
            <View className="gap-3 mb-4">
                {items.map((item) => (
                    <View
                        key={item.id}
                        className="bg-black/20 rounded-xl p-4 border border-white/5"
                    >
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-white font-semibold text-sm flex-1 mr-2" numberOfLines={1}>
                                {item.title}
                            </Text>
                            <View className="bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                                <Text className="text-pink-500 text-[10px] font-bold">D-{item.dDay}</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                            <Sparkles size={12} color="#6366F1" />
                            <Text className="text-[#6366F1] text-xs font-bold uppercase tracking-wider">
                                MATCHING {item.matchingRate}%
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Footer Button */}
            <TouchableOpacity
                onPress={onExploreAll}
                className="bg-white/5 py-3 rounded-xl border border-white/5 items-center justify-center mt-auto"
            >
                <Text className="text-slate-400 text-xs font-semibold">전체 공고 탐색하기</Text>
            </TouchableOpacity>
        </View>
    );
};
