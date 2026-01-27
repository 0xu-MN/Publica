import React, { useState } from 'react';
import { Text, View, Pressable, Platform, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { NewsItem } from '../data/mockData';
import { Clock, Bookmark } from 'lucide-react-native';

interface InsightCardProps {
    item: NewsItem;
    style?: any;
    desktopMode?: boolean;
    onPress?: () => void;
    onBookmarkPress?: () => void;
    isScrapped?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ item, style, desktopMode = false, onPress, onBookmarkPress, isScrapped = false }) => {
    const cardHeight = 350;
    const [isHovered, setIsHovered] = useState(false);

    const rStyleContainer = useAnimatedStyle(() => {
        return {
            transform: [{ scale: withSpring(isHovered ? 1.02 : 1) }],
        };
    });

    const handleHoverIn = () => {
        if (Platform.OS === 'web') {
            setIsHovered(true);
        }
    };

    const handleHoverOut = () => {
        if (Platform.OS === 'web') {
            setIsHovered(false);
        }
    };

    const isScience = item.category === 'Science';
    const categoryColor = isScience ? '#0EA5E9' : '#10B981';
    const categoryBg = isScience ? 'rgba(14, 165, 233, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    const categoryLabel = isScience ? '과학' : '경제';

    return (
        <Animated.View style={[rStyleContainer]} className="w-full mb-4">
            <Pressable
                onPress={onPress}
                // @ts-ignore - web functionality
                onHoverIn={handleHoverIn}
                onHoverOut={handleHoverOut}
                className="w-full"
                style={[style]}
            >
                <View
                    className={`w-full overflow-hidden border ${isHovered ? 'border-white/30' : 'border-white/10'} ${Platform.OS === 'web' && isHovered ? 'shadow-2xl shadow-blue-500/20' : ''}`}
                    style={{ height: cardHeight, borderRadius: 30 }}
                >
                    {/* Background Image */}
                    <Image
                        source={{ uri: item.imageUrl }}
                        className="absolute inset-0 w-full h-full"
                        contentFit="cover"
                        contentPosition="center"
                        transition={500}
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <LinearGradient
                        colors={['transparent', 'rgba(5, 11, 20, 0.4)', 'rgba(5, 11, 20, 0.95)']}
                        locations={[0, 0.5, 1]}
                        className="absolute inset-0"
                    />

                    {/* Glare Effect (Web Only) */}
                    {isHovered && Platform.OS === 'web' && (
                        <LinearGradient
                            colors={['rgba(255,255,255,0.1)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="absolute inset-0"
                        />
                    )}

                    {/* Top Badges */}
                    <View className="flex-row justify-between p-5">
                        <View
                            className="px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10 flex-row items-center"
                            style={{ backgroundColor: categoryBg, borderColor: categoryColor }}
                        >
                            <Text className="text-[11px] font-bold uppercase" style={{ color: categoryColor }}>{categoryLabel}</Text>
                        </View>
                        <TouchableOpacity
                            className={`w-9 h-9 rounded-full items-center justify-center backdrop-blur-sm border border-white/5 active:bg-black/50 ${isScrapped ? 'bg-blue-500/20 shadow-lg shadow-blue-500/30' : 'bg-black/30'}`}
                            style={{ zIndex: 50 }}
                            onPress={(e) => {
                                e.stopPropagation();
                                onBookmarkPress?.();
                            }}
                            activeOpacity={0.7}
                        >
                            <Bookmark
                                size={18}
                                color={isScrapped ? "#3B82F6" : "white"}
                                fill={isScrapped ? "#3B82F6" : "none"}
                                opacity={isScrapped ? 1 : 0.9}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Content */}
                    <View className="flex-1 justify-end p-5 pb-6">
                        {/* 키워드 태그 */}
                        <View className="flex-row flex-wrap mb-3 gap-1.5">
                            {item.tags?.slice(0, 3).map((tag, i) => (
                                <Text key={i} className="text-slate-300 text-[11px] bg-white/10 px-2.5 py-1 rounded-[8px] overflow-hidden font-medium backdrop-blur-md">{tag}</Text>
                            ))}
                        </View>

                        <Text
                            className={`text-white font-extrabold leading-[28px] mb-3 ${desktopMode ? 'text-[22px]' : 'text-[20px]'}`}
                            numberOfLines={3}
                            style={{ textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
                        >
                            {item.title}
                        </Text>

                        <View className="flex-row items-center mt-1">
                            <View className="flex-row items-center bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                                <Text className="text-slate-200 text-xs font-semibold">{item.source}</Text>
                                <Text className="text-slate-400 mx-2 text-[10px]">•</Text>
                                <Text className="text-slate-300 text-xs">{item.timestamp}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};
