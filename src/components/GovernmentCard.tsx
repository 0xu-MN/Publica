import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SharedValue } from 'react-native-reanimated';

interface GovernmentCardProps {
    item: {
        title: string;
        agency: string;
        period: string;
        status: string;
        dDay: string;
        category: string;
    };
    index: number;
    progress: SharedValue<number>;
    totalItems: number;
}

export const GovernmentCard: React.FC<GovernmentCardProps> = ({ item }) => {
    // Note: We removed the opacity animation. 
    // The card now keeps its Purple Gradient background in BOTH Pill (Collapsed) and Card (Expanded) states.
    // The "Pill" shape is achieved solely by the parent container resizing the height to 60px.

    return (
        <View className="w-full h-full rounded-[30px] overflow-hidden border border-white/20 relative">

            {/* Always Visible Gradient Background */}
            <LinearGradient
                colors={['#4C1D95', '#1E293B']} // Violet-900 to Slate-800
                className="absolute inset-0"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View className="flex-1 px-6 pt-0 justify-between">
                {/* 
                    1. Header / Collapsed Pill View (Height 60px) 
                    This section is always visible and perfectly centered vertically in the collapsed state.
                */}
                <View className="flex-row items-center justify-between h-[60px]">
                    {/* Left: Agency | Title */}
                    <View className="flex-row items-center flex-1 mr-4 overflow-hidden">
                        <Text className="text-purple-200 text-[12px] font-medium mr-2" numberOfLines={1}>
                            {item.agency}
                        </Text>
                        <View className="w-[1px] h-3 bg-white/20 mr-2" />
                        <Text className="text-white text-[13px] font-bold tracking-wide flex-1" numberOfLines={1}>
                            {item.title}
                        </Text>
                    </View>

                    {/* Right: D-Day Badge (Oval) */}
                    <View className="px-3 py-1 rounded-full border border-white/30 bg-white/10">
                        <Text className="text-white text-[11px] font-bold">{item.dDay}</Text>
                    </View>
                </View>

                {/* Separator (Visible only when expanded) */}
                <View className="w-full h-[1px] bg-white/10 mb-2" />

                {/* 2. Expanded Content Area */}
                <View className="flex-1 justify-between py-4 pb-6">

                    {/* Row 1: Tags/Category */}
                    <View className="flex-row justify-start items-center mb-2 gap-2">
                        <View className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                            <Text className="text-emerald-400 text-[11px] font-bold">{item.category}</Text>
                        </View>
                        <View className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                            <Text className="text-slate-300 text-[11px]">{item.status}</Text>
                        </View>
                    </View>

                    {/* Row 2: Full Title Display */}
                    <View className="justify-center items-center flex-1 mb-4">
                        <Text className="text-white text-xl font-bold text-center leading-8">
                            {item.title}
                        </Text>
                    </View>

                    {/* Row 3: Info Grid */}
                    <View className="flex-row gap-3 h-[100px]">
                        {/* Info Box */}
                        <View className="flex-[1.6] bg-slate-900/50 rounded-2xl p-4 justify-center border border-white/5 gap-1.5">
                            <Text className="text-purple-200 text-[12px]">📅 접수기간: {item.period}</Text>
                            <Text className="text-purple-200 text-[12px]">🏛️ {item.agency}</Text>
                        </View>

                        {/* Status Box */}
                        <View className="flex-1 bg-slate-900/50 rounded-2xl p-4 justify-center items-center border border-white/5">
                            <Text className="text-slate-400 text-[11px] mb-1">마감일</Text>
                            <Text className="text-emerald-400 text-lg font-bold">{item.period.split('~')[1]?.trim() || '2026.12.31'}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};
