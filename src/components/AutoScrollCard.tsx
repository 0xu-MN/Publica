import React, { useEffect } from 'react';
import { View, Text, Image, useWindowDimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    withSequence,
    cancelAnimation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface AutoScrollItem {
    id: string;
    title: string;
    subtitle: string;
    icon?: string; // URL or local asset
    color?: string;
}

interface AutoScrollCardProps {
    items: AutoScrollItem[];
    title: string;
    subtitle: string;
}

const ITEM_HEIGHT = 80; // Height of each scrolling item
const VISIBLE_ITEMS = 3;

export const AutoScrollCard: React.FC<AutoScrollCardProps> = ({ items, title, subtitle }) => {
    const translateY = useSharedValue(0);

    // We duplicate items to create a seamless loop effect
    const duplicatedItems = [...items, ...items];
    const totalHeight = items.length * ITEM_HEIGHT;

    useEffect(() => {
        translateY.value = withRepeat(
            withTiming(-totalHeight, {
                duration: 10000, // Speed of scroll
                easing: Easing.linear,
            }),
            -1, // Infinite repeat
            false // No reverse
        );

        return () => {
            cancelAnimation(translateY);
        };
    }, [totalHeight]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    return (
        <View className="w-full h-full rounded-3xl overflow-hidden relative border border-white/10">
            {/* Background Gradient */}
            <LinearGradient
                colors={['#2E1065', '#0F172A']} // Purple to Dark text-slate
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
            />

            {/* Content Overlay */}
            <View className="flex-1 p-6 relative z-10">
                {/* Header Text */}
                <View className="mb-6">
                    <Text className="text-white text-xl font-bold mb-1 leading-7">
                        {title}
                    </Text>
                    <Text className="text-blue-200/80 text-sm">
                        {subtitle}
                    </Text>
                </View>

                {/* Scrolling List Container */}
                <View className="flex-1 overflow-hidden relative rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">

                    {/* Mask / Gradient Overlay for smoothly fading out top/bottom */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.5)']}
                        locations={[0, 0.2, 0.8, 1]}
                        className="absolute inset-0 z-20 pointer-events-none"
                    />

                    <Animated.View style={animatedStyle}>
                        {duplicatedItems.map((item, index) => (
                            <View
                                key={`${item.id}-${index}`}
                                style={{ height: ITEM_HEIGHT }}
                                className="flex-row items-center px-4 border-b border-white/5"
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.color || 'bg-blue-500/20'}`}>
                                    <Text className="text-white font-bold text-xs">AI</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white text-sm font-bold mb-0.5" numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <Text className="text-slate-400 text-xs" numberOfLines={1}>
                                        {item.subtitle}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </Animated.View>
                </View>

                {/* Visual Indicator of "More" / "Driving" */}
                {/* Based on the dribbble shot, there's a progress bar or indicator. 
                    Let's add a simple progress bar at bottom */}
                <View className="mt-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <View className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <Text className="text-blue-300 text-[10px] font-bold">Auto-Updating</Text>
                    </View>
                    <View className="h-1 bg-white/10 w-24 rounded-full overflow-hidden">
                        <Animated.View className="h-full bg-blue-500 w-[30%]" />
                    </View>
                </View>
            </View>
        </View>
    );
};
