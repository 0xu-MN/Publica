import React from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SharedValue } from 'react-native-reanimated';

interface CommunityCardProps {
    item: {
        title: string;
        author: string;
        category: string;
        content: string;
        imageUrl?: string;
    };
    index: number;
    progress: SharedValue<number>;
    totalItems: number;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ item }) => {
    // Note: Reverting to always-visible Blue Gradient background.
    // The shape (Pill vs Card) is controlled by the outer container's height animation.

    return (
        <View className="w-full h-full rounded-[30px] overflow-hidden border border-white/20 relative">

            {/* Always Visible Gradient Background */}
            <LinearGradient
                colors={['#1E1B4B', '#312E81']}
                className="absolute inset-0"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View className="flex-1 px-6 pt-0 justify-between">
                {/* 1. Header / Collapsed View (Height 60px) */}
                <View className="flex-row items-center justify-between h-[60px]">
                    {/* Left: Author | Title */}
                    <View className="flex-row items-center flex-1 mr-4 overflow-hidden">
                        <Text className="text-blue-200 text-[12px] font-medium mr-2" numberOfLines={1}>
                            {item.author}
                        </Text>
                        <View className="w-[1px] h-3 bg-white/20 mr-2" />
                        <Text className="text-white text-[13px] font-bold tracking-wide flex-1" numberOfLines={1}>
                            {item.title}
                        </Text>
                    </View>

                    {/* Right: Category Badge */}
                    <View className="px-3 py-1 rounded-full border border-white/30 bg-white/10">
                        <Text className="text-white text-[11px] font-bold">{item.category}</Text>
                    </View>
                </View>

                {/* Separator */}
                <View className="w-full h-[1px] bg-white/10 mb-2" />

                {/* 2. Expanded Content */}
                <View className="flex-1 justify-between py-4 pb-6">
                    {/* Row 1: Profile */}
                    <View className="flex-row items-center mb-2 gap-2">
                        <View className="w-6 h-6 rounded-full bg-blue-400/20 items-center justify-center border border-blue-400/30">
                            <Text className="text-blue-300 text-[10px] font-bold">U</Text>
                        </View>
                        <Text className="text-blue-200 text-[12px]">{item.author}</Text>
                    </View>

                    {/* Row 2: Full Title */}
                    <View className="justify-center items-center flex-1 mb-4">
                        <Text className="text-white text-xl font-bold text-center leading-8" numberOfLines={2}>
                            {item.title}
                        </Text>
                    </View>

                    {/* Row 3: Content Split */}
                    <View className="flex-row gap-3 h-[100px]">
                        <View className="flex-1 bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                            <Text className="text-slate-300 text-[11px] leading-5" numberOfLines={4}>
                                {item.content}
                            </Text>
                        </View>

                        <View className="flex-1 bg-slate-900/50 rounded-2xl overflow-hidden border border-white/5 relative">
                            {item.imageUrl ? (
                                <Image source={{ uri: item.imageUrl }} className="w-full h-full opacity-90" resizeMode="cover" />
                            ) : (
                                <View className="flex-1 items-center justify-center">
                                    <Text className="text-slate-600 text-[10px]">이미지 없음</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};
