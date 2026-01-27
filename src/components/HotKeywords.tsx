import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    useSharedValue
} from 'react-native-reanimated';

interface HotKeyword {
    keyword: string;
    count: number;
}

interface HotKeywordsProps {
    category?: 'Science' | 'Economy' | 'All';
}

export const HotKeywords: React.FC<HotKeywordsProps> = ({ category = 'All' }) => {
    const [keywords, setKeywords] = useState<HotKeyword[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        fetchHotKeywords();

        // 3초마다 롤업
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % Math.min(keywords.length, 10));
        }, 3000);

        return () => clearInterval(interval);
    }, [category, keywords.length]);

    useEffect(() => {
        // 페이드 애니메이션
        opacity.value = withSequence(
            withTiming(0.3, { duration: 200 }),
            withTiming(1, { duration: 300 })
        );
    }, [currentIndex]);

    const fetchHotKeywords = async () => {
        try {
            const { supabase } = await import('../lib/supabase');

            // 최근 30일간의 카드에서 tags 추출 (더 많은 데이터)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const query = supabase
                .from('cards')
                .select('content, created_at')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(100);

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching hot keywords:', error);
                return;
            }

            // tags 집계
            const tagCounts: { [key: string]: number } = {};

            data?.forEach((card: any) => {
                try {
                    const content = JSON.parse(card.content);

                    // 카테고리 필터링
                    if (category === 'Science' && content.category !== 'Science') return;
                    if (category === 'Economy' && content.category !== 'Economy') return;
                    // category === 'All'이면 모든 카테고리 포함

                    content.tags?.forEach((tag: string) => {
                        if (tag && tag.trim()) {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        }
                    });
                } catch (e) {
                    // Skip invalid cards
                }
            });

            // 상위 10개 추출
            const sortedKeywords = Object.entries(tagCounts)
                .map(([keyword, count]) => ({ keyword, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            console.log(`🔥 Hot Keywords (${category}):`, sortedKeywords.map(k => k.keyword));
            setKeywords(sortedKeywords);
        } catch (error) {
            console.error('Error in fetchHotKeywords:', error);
        }
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    if (keywords.length === 0) {
        return null;
    }

    const displayKeywords = keywords.slice(0, 10);
    const currentKeyword = displayKeywords[currentIndex % displayKeywords.length];

    return (
        <View className="mb-6">
            {/* 헤더 */}
            <View className="flex-row items-center mb-3 px-1">
                <TrendingUp size={16} color="#F59E0B" />
                <Text className="text-amber-400 font-extrabold text-sm ml-2">
                    🔥 이번주 HOT 키워드 TOP 10
                </Text>
            </View>

            {/* 롤업 키워드 */}
            <View className="bg-slate-800/60 rounded-2xl p-4 border border-amber-500/20">
                <Animated.View style={animatedStyle}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                            <Text className="text-white text-xl font-extrabold">
                                #{currentIndex + 1}. {currentKeyword?.keyword}
                            </Text>
                            <Text className="text-slate-400 text-xs mt-1">
                                {currentKeyword?.count}회 언급
                            </Text>
                        </View>
                        <View className="bg-amber-500/20 px-3 py-1.5 rounded-full">
                            <Text className="text-amber-400 font-bold text-xs">
                                HOT
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* 전체 키워드 목록 (작게) */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-4"
                >
                    <View className="flex-row gap-2">
                        {displayKeywords.map((kw, idx) => (
                            <Pressable
                                key={idx}
                                onPress={() => setCurrentIndex(idx)}
                                className={`px-3 py-1.5 rounded-full ${idx === currentIndex
                                    ? 'bg-amber-500/30 border border-amber-500/50'
                                    : 'bg-slate-700/50 border border-slate-600/30'
                                    }`}
                            >
                                <Text
                                    className={`text-xs font-semibold ${idx === currentIndex
                                        ? 'text-amber-300'
                                        : 'text-slate-400'
                                        }`}
                                >
                                    #{idx + 1} {kw.keyword}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};
