import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolate,
    SharedValue
} from 'react-native-reanimated';

interface VerticalStackCarouselProps<T> {
    data: T[];
    renderItem: (item: T, index: number, progress: SharedValue<number>, totalItems: number) => React.ReactNode;
    itemHeight: number;
    containerHeight?: number;
    autoPlayInterval?: number;
}

const COLLAPSED_HEIGHT = 50;
const ITEM_SPACING = 20;

export function VerticalStackCarousel<T>({
    data,
    renderItem,
    itemHeight,
    containerHeight = 500,
    autoPlayInterval = 4000
}: VerticalStackCarouselProps<T>) {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const progress = useSharedValue(0);

    // Hover State for Pause
    const [isHovered, setIsHovered] = React.useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-play logic (REVERSED: Top to Bottom)
    useEffect(() => {
        if (isHovered) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            setCurrentIndex((prev) => prev - 1);
        }, autoPlayInterval);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [autoPlayInterval, isHovered]);

    // Sync shared value with state
    useEffect(() => {
        progress.value = withSpring(currentIndex, {
            damping: 20,
            stiffness: 70,
            mass: 1
        });
    }, [currentIndex]);

    return (
        <Pressable
            style={{ height: containerHeight, overflow: 'hidden' }}
            className="relative bg-transparent"
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
        >
            {data.map((item, index) => {
                return (
                    <CardItem
                        key={index}
                        index={index}
                        progress={progress}
                        totalItems={data.length}
                        itemHeight={itemHeight}
                    >
                        {renderItem(item, index, progress, data.length)}
                    </CardItem>
                );
            })}
        </Pressable>
    );
}

interface CardItemProps {
    index: number;
    progress: SharedValue<number>;
    totalItems: number;
    itemHeight: number;
    children: React.ReactNode;
}

const CardItem: React.FC<CardItemProps> = ({
    index,
    progress,
    totalItems,
    itemHeight,
    children
}) => {
    const animatedStyle = useAnimatedStyle(() => {
        // Active Index
        const activeValue = progress.value;
        const offset = index - activeValue;

        // Circular Distance Logic
        let diff = ((offset % totalItems) + totalItems) % totalItems;
        if (diff > totalItems / 2) {
            diff -= totalItems;
        }

        // --- Morphing Logic (Bar <-> Card) ---
        // 0 (Active): Full Height (itemHeight)
        // -1 (Prev/Top): Collapsed Height (60px)
        // 1 (Next/Bottom): Collapsed Height (60px)

        const height = interpolate(
            diff,
            [-1, 0, 1],
            [COLLAPSED_HEIGHT, itemHeight, COLLAPSED_HEIGHT],
            Extrapolate.CLAMP
        );

        const scale = interpolate(
            diff,
            [-1, 0, 1],
            [0.85, 1, 0.85], // Waiting cards even narrower
            Extrapolate.CLAMP
        );

        // Position Logic
        const translateY = interpolate(
            diff,
            [-1, 0, 1],
            [-(COLLAPSED_HEIGHT + ITEM_SPACING), 0, itemHeight + ITEM_SPACING],
            Extrapolate.CLAMP
        );

        const opacity = interpolate(
            diff,
            [-2, -1, 0, 1, 2],
            [0, 1, 1, 1, 0],
            Extrapolate.CLAMP
        );

        const zIndex = interpolate(
            diff,
            [-0.5, 0, 0.5],
            [5, 10, 5],
            Extrapolate.CLAMP
        );

        return {
            height,
            transform: [
                { translateY },
                { scale }
            ],
            opacity,
            zIndex: Math.round(zIndex),
        };
    });

    return (
        <Animated.View
            style={[
                styles.cardContainer,
                { overflow: 'hidden' }, // MASKING happens here
                animatedStyle
            ]}
        >
            {/* 
                CRITICAL FIX: 
                Passing children directly allows them to resize.
                But the Container ITSELF needs borderRadius to mask the bottom edge cleanly.
            */}
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        position: 'absolute',
        width: '85%', // Reduced width for narrower cards
        left: '7.5%',   // Centered (7.5% margin left)
        top: 80,
        borderRadius: 30, // KEY FIX: Ensures the clipped bottom is rounded, forming a Pill.
    }
});
