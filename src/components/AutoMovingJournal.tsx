import React, { useEffect } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { JournalCard, AICardNews } from './JournalCard';

interface AutoMovingJournalProps {
    items: AICardNews[];
}

const ITEM_HEIGHT = 500;
const GAP = 20;

export const AutoMovingJournal: React.FC<AutoMovingJournalProps> = ({ items }) => {
    const translateY = useSharedValue(0);
    const { height: screenHeight } = useWindowDimensions();

    // Duplicate items for seamless loop (triple to be safe)
    const loopedItems = [...items, ...items, ...items];
    const totalContentHeight = items.length * (ITEM_HEIGHT + GAP);

    useEffect(() => {
        if (items.length === 0) return;

        translateY.value = withRepeat(
            withTiming(-totalContentHeight, {
                duration: items.length * 8000, // Speed: 8s per card
                easing: Easing.linear,
            }),
            -1,
            false
        );

        return () => cancelAnimation(translateY);
    }, [items, totalContentHeight]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    if (items.length === 0) return null;

    return (
        <View className="w-full h-full rounded-[40px] overflow-hidden bg-slate-900/20 border border-white/5 relative">
            {/* Fade Overlays */}
            <LinearGradient
                colors={['#020617', 'transparent', 'transparent', '#020617']}
                locations={[0, 0.1, 0.9, 1]}
                className="absolute inset-0 z-20 pointer-events-none"
            />

            <Animated.View style={[animatedStyle, { gap: GAP }]}>
                {loopedItems.map((item, index) => (
                    <View
                        key={`${item.id}-${index}`}
                        style={{ height: ITEM_HEIGHT }}
                        className="w-full"
                    >
                        <JournalCard
                            item={item}
                            index={index}
                            progress={{ value: 1 }} // Static representation inside mover
                            totalItems={loopedItems.length}
                        />
                    </View>
                ))}
            </Animated.View>
        </View>
    );
};
