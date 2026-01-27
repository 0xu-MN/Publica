import React, { useState, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

interface HotKeywordsProps {
    category?: 'Science' | 'Economy' | 'All';
}

export const HotKeywords: React.FC<HotKeywordsProps> = ({ category = 'All' }) => {
    const [keywords, setKeywords] = useState<{ keyword: string; count: number }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const fadeAnim = new Animated.Value(1);

    useEffect(() => {
        fetchHotKeywords();
    }, [category]);

    useEffect(() => {
        if (keywords.length === 0) return;

        // 3초마다 키워드 변경
        const interval = setInterval(() => {
            // 페이드 아웃
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            setCurrentIndex(prev => (prev + 1) % keywords.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [keywords]);

    const fetchHotKeywords = async () => {
        try {
            const { supabase } = await import('../lib/supabase');

            // 최근 30일간의 카드에서 tags 추출
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

    if (keywords.length === 0) {
        return null;
    }

    const currentKeyword = keywords[currentIndex];

    return (
        <View className="flex-row items-center justify-center mb-4">
            <Text className="text-orange-500 text-sm font-bold mr-2">🔥 HOT KEYWORDS</Text>
            <Animated.View style={{ opacity: fadeAnim }}>
                <Text className="text-blue-400 text-sm font-bold">
                    #{currentKeyword?.keyword}
                </Text>
            </Animated.View>
        </View>
    );
};
