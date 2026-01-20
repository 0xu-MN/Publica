import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface ScrollCard {
    id: string;
    title: string;
    subtitle?: string;
    meta?: string;
}

interface VerticalScrollCardsProps {
    items: ScrollCard[];
    title: string;
    subtitle?: string;
    bgGradientColors?: readonly [string, string, ...string[]];
}

const ITEM_HEIGHT = 100; // Height of each scrolling item
const GAP = 12;

export const VerticalScrollCards: React.FC<VerticalScrollCardsProps> = ({
    items,
    title,
    subtitle,
    bgGradientColors = ['#2E1065', '#0F172A']
}) => {
    const translateY = useSharedValue(0);

    // Duplicate items for seamless loop
    const loopedItems = [...items, ...items, ...items];
    const totalContentHeight = items.length * (ITEM_HEIGHT + GAP);

    useEffect(() => {
        translateY.value = withRepeat(
            withTiming(-totalContentHeight, {
                duration: 20000, // Slower scrolling
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, [totalContentHeight]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    return (
        <View className="w-full h-full rounded-3xl overflow-hidden relative border border-white/10">
            {/* 1. Fixed Background Container (Image 3 Style) */}
            <LinearGradient
                colors={bgGradientColors}
                className="absolute inset-0"
            />

            {/* 2. Fixed Header Content (Within the card) */}
            <View className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-black/50 to-transparent">
                {/* Optional: Add a subtle overlay or just padding */}
            </View>

            <View className="flex-1 p-6 relative">
                {/* Static Title Area (Always visible on top of scroll? Or part of scroll?) 
                    The user wants "Image 3" style. In Dribbble, the card stays, content moves. 
                    Let's keep the title STATIC at the top if provided, or DYNAMIC inside?
                    Looking at user request: "큰타이틀을 아까처럼 connect hub로 달아주고... 이미지가 아래에서 위로 가는 방향으로 자동으로 계속 올라가서 무빙"
                    So the CARD is the frame. The CONTENT moves inside.
                */}

                {/* Scrollable Content Area */}
                <View className="flex-1 overflow-hidden mt-4">
                    <Animated.View style={[animatedStyle, { gap: GAP }]}>
                        {loopedItems.map((item, index) => (
                            <View
                                key={`${item.id}-${index}`}
                                style={{ height: ITEM_HEIGHT }}
                                className="justify-center border-b border-white/10"
                            >
                                <Text className="text-white text-lg font-bold leading-6 mb-1" numberOfLines={2}>
                                    {item.title}
                                </Text>
                                {item.subtitle && (
                                    <Text className="text-slate-400 text-xs mb-1" numberOfLines={1}>
                                        {item.subtitle}
                                    </Text>
                                )}
                                {item.meta && (
                                    <Text className="text-slate-500 text-[10px] uppercase tracking-wider">
                                        {item.meta}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </Animated.View>
                </View>

                {/* Bottom static overlay for 'read more' fade effect */}
                <LinearGradient
                    colors={['transparent', '#0F172A']}
                    className="absolute bottom-0 left-0 right-0 h-20 z-10"
                />
            </View>

            {/* Static Card Info (Bottom/Top) if needed, but for now just the container */}
        </View>
    );
};
