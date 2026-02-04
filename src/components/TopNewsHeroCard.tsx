import React from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';

interface TopNewsHeroCardProps {
    item: any; // NewsItem
    index: number;
    progress: SharedValue<number>;
    totalItems: number;
}

export const TopNewsHeroCard: React.FC<TopNewsHeroCardProps> = ({ item, index, progress, totalItems }) => {
    // If item is missing (loading state), render placeholder
    if (!item) return <View className="w-full h-full bg-slate-800 rounded-[30px]" />;

    // Animation Logic for Header Content Switch
    const expandedHeaderStyle = useAnimatedStyle(() => {
        const activeValue = progress.value;
        const diff = index - activeValue;

        // Circular distance fix (match VerticalStackCarousel logic)
        let normalizedDiff = ((diff % totalItems) + totalItems) % totalItems;
        if (normalizedDiff > totalItems / 2) normalizedDiff -= totalItems;

        // Rapid fade out when moving away from center (Active -> Inactive)
        const opacity = interpolate(
            Math.abs(normalizedDiff),
            [0, 0.2], // Sharper transition
            [1, 0],
            Extrapolate.CLAMP
        );

        return { opacity, zIndex: opacity > 0.5 ? 10 : 0 };
    });

    const collapsedHeaderStyle = useAnimatedStyle(() => {
        const activeValue = progress.value;
        const diff = index - activeValue;

        // Circular distance fix
        let normalizedDiff = ((diff % totalItems) + totalItems) % totalItems;
        if (normalizedDiff > totalItems / 2) normalizedDiff -= totalItems;

        // Rapid fade in when collapsed (Inactive -> Active transition inverse)
        // Ensure it's fully visible when offset > 0.3
        const opacity = interpolate(
            Math.abs(normalizedDiff),
            [0.1, 0.3], // Sharper transition
            [0, 1],
            Extrapolate.CLAMP
        );

        return { opacity, zIndex: opacity > 0.5 ? 10 : 0 };
    });

    // Background Visibility Animation - Hide for waiting cards
    const backgroundStyle = useAnimatedStyle(() => {
        const activeValue = progress.value;
        const diff = index - activeValue;

        // Circular distance fix
        let normalizedDiff = ((diff % totalItems) + totalItems) % totalItems;
        if (normalizedDiff > totalItems / 2) normalizedDiff -= totalItems;

        // Fade out background when card is not active
        const opacity = interpolate(
            Math.abs(normalizedDiff),
            [0, 0.15],
            [1, 0],
            Extrapolate.CLAMP
        );

        return { opacity };
    });

    return (
        <View className="w-full h-full rounded-[30px] overflow-hidden border border-white/20 relative bg-slate-900">
            {/* Background Image - Hidden for waiting cards */}
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backgroundStyle]}>
                <Image
                    source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop' }}
                    className="w-full h-full opacity-60"
                    resizeMode="cover"
                />
            </Animated.View>

            {/* Gradient Overlay for Readability - Hidden for waiting cards */}
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backgroundStyle]}>
                <LinearGradient
                    colors={['rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.95)']}
                    className="absolute inset-0"
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />
            </Animated.View>

            <View className="flex-1 px-6 justify-between">
                {/* 
                    1. Header / Collapsed Pill View (Height 50px for waiting pills) 
                    Content switches based on Active/Collapsed state.
                */}
                <View className="h-[50px] relative flex items-center">

                    {/* A. Expanded Header (For Active Card): Source | Category */}
                    <Animated.View style={[{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }, expandedHeaderStyle]}>
                        <View className="flex-row items-center flex-1 mr-4 overflow-hidden">
                            <View className={`w-1.5 h-1.5 rounded-full mr-2 ${item.category === 'Science' ? 'bg-sky-500' : 'bg-emerald-500'}`} />
                            <Text className="text-slate-200 text-[11px] font-medium mr-2" numberOfLines={1}>
                                {item.source || 'AI Insight'}
                            </Text>
                            <View className="w-[1px] h-3 bg-white/30 mr-2" />
                            <Text className={`text-[12px] font-bold tracking-wide flex-1 ${item.category === 'Science' ? 'text-sky-400' : 'text-emerald-400'}`} numberOfLines={1}>
                                {item.category === 'Science' ? 'Science Insight' : 'Economy Insight'}
                            </Text>
                        </View>
                        <View className="px-2.5 py-0.5 rounded-full border border-white/20 bg-black/20">
                            <Text className="text-white text-[10px] font-bold">{item.timestamp || 'Today'}</Text>
                        </View>
                    </Animated.View>

                    {/* B. Collapsed Header (For Stacked Cards): Title Only */}
                    <Animated.View style={[{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-start'
                    }, collapsedHeaderStyle]}>
                        <View className="flex-row items-center overflow-hidden">
                            <View className={`w-1.5 h-1.5 rounded-full mr-2 ${item.category === 'Science' ? 'bg-sky-500' : 'bg-emerald-500'}`} />
                            <Text className="text-white text-[13px] font-bold leading-none" numberOfLines={1}>
                                {item.title}
                            </Text>
                        </View>
                    </Animated.View>

                </View>

                {/* Separator (Visible only when expanded) */}
                <View className="w-full h-[1px] bg-white/10 mb-2" />

                {/* 2. Expanded Content Area */}
                <View className="flex-1 justify-end py-6 pb-8">

                    {/* Main Title */}
                    <Text className="text-white text-[26px] font-bold leading-9 mb-4 shadow-lg">
                        {item.title}
                    </Text>

                    {/* Summary / Body */}
                    <Text className="text-slate-300 text-[14px] leading-6 mb-6 line-clamp-3" numberOfLines={3}>
                        {item.summary || item.aiSummary || "요약 내용이 없습니다."}
                    </Text>

                    {/* Footer Action */}
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row gap-2">
                            {item.tags?.slice(0, 3).map((tag: string, i: number) => (
                                <View key={i} className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/5">
                                    <Text className="text-slate-300 text-[11px]">{tag}</Text>
                                </View>
                            ))}
                        </View>

                        <View className="flex-row items-center bg-blue-600 px-4 py-2 rounded-full shadow-lg shadow-blue-600/30">
                            <Text className="text-white text-xs font-bold mr-1">Read Now</Text>
                            <ArrowRight size={12} color="#fff" />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};
