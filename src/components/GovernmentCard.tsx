import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Grant } from '../services/grants';

interface GovernmentCardProps {
    item: Grant;
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
                colors={['#DBC1DE', '#BD90C2']} // Soft Lavender to Muted Purple (#BD90C2)
                className="absolute inset-0"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View className="flex-1 px-6 pt-0 justify-between">
                {/* 
                    1. Header / Collapsed Pill View (Height 60px) 
                    This section is always visible and perfectly centered vertically in the collapsed state.
                */}
                <View className="flex-row items-center justify-between h-[60px] w-full px-2">
                    {/* Left: Agency | Title */}
                    <View className="flex-row items-center flex-[0.85] overflow-hidden">
                        <Text className="text-slate-800/70 text-[12px] font-medium mr-2" numberOfLines={1}>
                            {item.agency}
                        </Text>
                        <View className="w-[1px] h-3 bg-slate-800/20 mr-2" />
                        <Text className="text-[13px] font-bold tracking-wide flex-1" style={{ color: '#27272a' }} numberOfLines={1}>
                            {item.title}
                        </Text>
                    </View>

                    {/* Right: D-Day Badge (Oval) */}
                    <View className="px-3 py-1 rounded-full border border-white/30 bg-white/10 flex-shrink-0">
                        <Text className="text-white text-[11px] font-bold">{item.d_day || '상시'}</Text>
                    </View>
                </View>

                {/* Separator (Visible only when expanded) */}
                <View className="w-full h-[1px] bg-white/10 mb-2" />

                {/* 2. Expanded Content Area */}
                <View className="flex-1 justify-between py-4 pb-6">

                    {/* Row 1: Tags/Category */}
                    <View className="flex-row justify-start items-center mb-2 gap-2">
                        <View className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                            <Text className="text-emerald-400 text-[11px] font-bold">{item.category || (item.grant_type === 'subsidy' ? '정부지원금' : '지원사업')}</Text>
                        </View>
                        <View className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                            <Text className="text-slate-300 text-[11px]">모집중</Text>
                        </View>
                    </View>

                    {/* Row 2: Full Title Display */}
                    <View className="justify-center items-center flex-1 mb-4">
                        <Text className="text-[22px] font-bold text-center leading-8" style={{ color: '#27272a' }}>
                            {item.title}
                        </Text>
                    </View>

                    {/* Row 3: Info Grid */}
                    <View className="flex-row gap-3 h-[100px]">
                        {/* Info Box */}
                        <View className="flex-[1.6] bg-white/30 rounded-2xl p-4 justify-center border border-black/5 gap-1.5">
                            <Text className="text-[12px] font-medium" style={{ color: '#27272a' }} numberOfLines={1}>📅 접수: {item.application_period || '별도 공지시까지'}</Text>
                            <Text className="text-[12px] font-medium" style={{ color: '#27272a' }} numberOfLines={1}>🏛️ {item.department || item.agency}</Text>
                        </View>

                        {/* Status Box */}
                        <View className="flex-1 bg-white/30 rounded-2xl p-4 justify-center items-center border border-black/5">
                            <Text className="text-[11px] mb-1 font-bold opacity-60" style={{ color: '#27272a' }}>마감일</Text>
                            <Text className="text-lg font-black" style={{ color: '#27272a' }}>{item.deadline_date || '상시접수'}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};
