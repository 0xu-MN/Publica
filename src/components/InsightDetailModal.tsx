import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, Platform, Linking } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { NewsItem } from '../services/newsService';
import { X, ExternalLink, Sparkles, Share2, Bookmark, Clock, ArrowRight } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';

interface InsightDetailModalProps {
    item: any | null; // Changed to any to accept extended properties like related_materials
    visible: boolean;
    onClose: () => void;
}

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({ item, visible, onClose }) => {
    const { user } = useAuth();
    const [authModalVisible, setAuthModalVisible] = React.useState(false);
    const [isBookmarked, setIsBookmarked] = React.useState(false);

    // Check bookmark status when item opens
    React.useEffect(() => {
        if (item && user) {
            checkBookmarkStatus();
        } else {
            setIsBookmarked(false);
        }
    }, [item, user]);

    const checkBookmarkStatus = async () => {
        if (!item || !user) return;
        const { data } = await supabase
            .from('bookmarks')
            .select('id')
            .eq('user_id', user.id)
            .eq('news_id', item.id)
            .single();
        setIsBookmarked(!!data);
    };

    const handleBookmark = async () => {
        if (!user) {
            setAuthModalVisible(true);
            return;
        }

        if (!item) return;

        try {
            if (isBookmarked) {
                // Remove bookmark
                await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('news_id', item.id);
                setIsBookmarked(false);
            } else {
                // Add bookmark
                await supabase
                    .from('bookmarks')
                    .insert({
                        user_id: user.id,
                        news_id: item.id
                    });
                setIsBookmarked(true);
            }
        } catch (error) {
            console.error('Bookmark error:', error);
        }
    };

    if (!item) return null;

    const isScience = item.category === 'Science';
    const categoryColor = isScience ? '#0EA5E9' : '#10B981';
    const categoryBg = isScience ? 'rgba(14, 165, 233, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    const categoryLabel = isScience ? '과학' : '경제';

    // Helper to strip HTML tags
    const stripHtml = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    };

    const cleanSummary = stripHtml(item.summary);

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View
                className="flex-1 justify-center items-center p-5"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
            >
                <Pressable className="absolute inset-0" onPress={onClose} />

                <Animated.View
                    entering={SlideInUp.duration(400).springify()}
                    style={[
                        { width: 500, maxHeight: '90%' },
                        Platform.OS === 'web' ? { filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))' } : { elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 }
                    ]}
                >
                    {/* Clipping Container - Separated from Animation Layer for Web compatibility */}
                    <View
                        style={{
                            borderRadius: 40,
                            overflow: 'hidden',
                            backgroundColor: '#0F172A',
                            width: '100%',
                            height: '100%'
                        }}
                    >
                        {/* Sticky Header Overlay */}
                        <View className="absolute top-6 left-6 right-6 flex-row justify-between items-center z-50">
                            <View
                                className="px-3.5 py-1.5 rounded-2xl border"
                                style={{ backgroundColor: categoryBg, borderColor: categoryColor }}
                            >
                                <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: categoryColor }}>{categoryLabel}</Text>
                            </View>
                            <View className="flex-row gap-2">
                                <Pressable
                                    className="w-9 h-9 rounded-[18px] bg-black/40 items-center justify-center"
                                    onPress={handleBookmark}
                                >
                                    <Bookmark
                                        size={20}
                                        color={isBookmarked ? "#F59E0B" : "#fff"}
                                        fill={isBookmarked ? "#F59E0B" : "none"}
                                    />
                                </Pressable>
                                <Pressable className="w-9 h-9 rounded-[18px] bg-black/40 items-center justify-center">
                                    <Share2 size={20} color="#fff" />
                                </Pressable>
                                <Pressable className="w-9 h-9 rounded-[18px] bg-black/40 items-center justify-center" onPress={onClose}>
                                    <X size={22} color="#fff" />
                                </Pressable>
                            </View>
                        </View>

                        <ScrollView
                            className="flex-1"
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                            style={{ borderRadius: 40 }}
                        >
                            {/* Header Image */}
                            <View className="w-full h-[240px] relative" style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden' }}>
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    className="w-full h-full"
                                    contentFit="cover"
                                    transition={300}
                                />
                                <LinearGradient
                                    colors={['rgba(5, 11, 20, 0.3)', 'transparent']}
                                    locations={[0, 1]}
                                    className="absolute inset-0"
                                />
                            </View>

                            {/* Content Section */}
                            <View className="p-6" style={{ borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
                                <Text className="text-white text-2xl font-extrabold leading-[34px] mb-3">{item.title}</Text>

                                <View className="flex-row items-center mb-4">
                                    <Text className="text-slate-200 text-[13px] font-semibold">{item.source}</Text>
                                    <Text className="text-slate-500 mx-1.5 text-[13px]">·</Text>
                                    <Text className="text-slate-400 text-[13px]">{item.timestamp}</Text>
                                    <Text className="text-slate-500 mx-1.5 text-[13px]">·</Text>
                                    <Clock size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                                    <Text className="text-slate-400 text-[13px]">{item.readTime} 읽기</Text>
                                </View>

                                <View className="flex-row flex-wrap gap-2 mb-5">
                                    {item.tags?.map((tag, i) => (
                                        <Text key={i} className="text-blue-500 text-[13px] bg-blue-500/15 px-3 py-1.5 rounded-[10px] overflow-hidden font-semibold">{tag}</Text>
                                    ))}
                                </View>

                                {/* Summary Text */}
                                <View className="mb-6">
                                    {cleanSummary.includes('- ') ? (
                                        cleanSummary.split('- ').map((point, index) => {
                                            const cleanPoint = point.trim();
                                            if (!cleanPoint) return null;

                                            return (
                                                <View key={index} className="flex-row items-start mb-2">
                                                    <View className="w-1 h-1 rounded-full bg-slate-400 mt-2.5 mr-2.5" />
                                                    <Text className="flex-1 text-slate-200 text-base leading-[26px] font-normal">{cleanPoint}</Text>
                                                </View>
                                            );
                                        })
                                    ) : (
                                        <Text className="text-slate-200 text-base leading-[26px] font-normal">{cleanSummary}</Text>
                                    )}
                                </View>

                                {/* AI Insight Box */}
                                <View className="bg-slate-800/60 rounded-[24px] p-[18px] border border-amber-500/30 mb-5">
                                    <View className="flex-row items-center mb-3">
                                        <Sparkles size={16} color="#F59E0B" />
                                        <Text className="text-amber-500 font-extrabold text-sm ml-1.5">AI 핵심 요약</Text>
                                    </View>
                                    <Text className="text-slate-200 text-sm leading-[22px]">
                                        {item.aiInsight || cleanSummary || "본문 요약을 불러오는 중입니다..."}
                                    </Text>
                                </View>

                                {/* Related Materials / Action Buttons */}
                                <View className="mt-4">
                                    <View className="flex-row items-center mb-3">
                                        <ExternalLink size={16} color="#94A3B8" />
                                        <Text className="text-slate-400 font-bold text-sm ml-2">관련자료</Text>
                                    </View>

                                    {item.related_materials && item.related_materials.length > 0 ? (
                                        <View className="gap-2">
                                            {item.related_materials.map((material: any, idx: number) => (
                                                <Pressable
                                                    key={idx}
                                                    style={({ pressed }) => [
                                                        pressed && { opacity: 0.8 }
                                                    ]}
                                                    className="bg-slate-800/80 p-3.5 rounded-xl border border-white/5 flex-row items-center justify-between"
                                                    onPress={() => {
                                                        if (material.url) {
                                                            Linking.openURL(material.url).catch(err => console.error("Couldn't load page", err));
                                                        }
                                                    }}
                                                >
                                                    <View className="flex-1 mr-3">
                                                        <Text className="text-slate-200 text-[13px] font-medium" numberOfLines={1}>{material.title}</Text>
                                                        <Text className="text-slate-500 text-[11px] mt-0.5">{material.url ? new URL(material.url).hostname.replace('www.', '') : 'External Link'}</Text>
                                                    </View>
                                                    <ArrowRight size={14} color="#64748B" />
                                                </Pressable>
                                            ))}
                                        </View>
                                    ) : (
                                        <Pressable
                                            style={({ pressed }) => [
                                                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                                            ]}
                                            className="bg-sky-500 py-4 rounded-[20px] flex-row items-center justify-center"
                                            onPress={() => {
                                                if (item.sourceUrl) {
                                                    Linking.openURL(item.sourceUrl).catch(err => console.error("Couldn't load page", err));
                                                } else {
                                                    console.warn("No source URL available");
                                                }
                                            }}
                                        >
                                            <ExternalLink size={18} color="#fff" style={{ marginRight: 8 }} />
                                            <Text className="text-white text-base font-bold">원문 기사 전체 보기</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </Animated.View>
            </View>
            <AuthModal
                visible={authModalVisible}
                onClose={() => setAuthModalVisible(false)}
            />
        </Modal >
    );
};
