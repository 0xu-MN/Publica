import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    runOnJS
} from 'react-native-reanimated';

interface RotatingTextProps {
    texts: string[];
    style?: any;
    textStyle?: any;
}

export const RotatingText: React.FC<RotatingTextProps> = ({ texts, style, textStyle }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % texts.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [texts.length]);

    if (!texts || texts.length === 0) return null;

    return (
        <View style={[{ height: 30, justifyContent: 'center', minWidth: 120 }, style]}>
            <Animated.Text
                key={currentIndex}
                entering={Platform.OS === 'web' ? undefined : undefined} // Disable reanimated entering for now on web to be safe, or just use key for mounting
                style={[textStyle, { color: '#60A5FA', fontSize: 13, fontWeight: '700' }]}
            >
                {texts[currentIndex]}
            </Animated.Text>
        </View>
    );
};
