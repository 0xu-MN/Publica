import React from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ExternalLink, Sparkles, Share2, Bookmark, Clock, ArrowRight } from 'lucide-react-native';

interface InsightDetailPaneProps {
    item: any;
    onClose: () => void;
    isBookmarked: boolean;
    onToggleBookmark: () => void;
}

export const InsightDetailPane: React.FC<InsightDetailPaneProps> = ({ item, onClose, isBookmarked, onToggleBookmark }) => {
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
    const imageUrl = item.imageUrl || item.image_url; // Handle both casing

    return (
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
                        onPress={onToggleBookmark}
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
                        source={{ uri: imageUrl }}
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
                        <Text className="text-slate-200 text-[13px] font-semibold">{item.source || 'AI Insight'}</Text>
                        <Text className="text-slate-500 mx-1.5 text-[13px]">·</Text>
                        <Text className="text-slate-400 text-[13px]">{item.timestamp}</Text>
                        <Text className="text-slate-500 mx-1.5 text-[13px]">·</Text>
                        <Clock size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                        <Text className="text-slate-400 text-[13px]">{item.readTime || '3 min'} 읽기</Text>
                    </View>

                    {/* 키워드 태그 */}
                    <View className="flex-row flex-wrap gap-2 mb-5">
                        {item.tags?.map((tag: string, i: number) => (
                            <Text key={i} className="text-blue-400 text-[13px] bg-blue-500/15 px-3 py-1.5 rounded-[10px] overflow-hidden font-semibold border border-blue-500/20">{tag}</Text>
                        ))}
                    </View>

                    {/* AI 핵심 요약만 표시 (골드박스) */}
                    <View className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-[24px] p-5 border-2 border-amber-500/40 mb-5 shadow-lg">
                        <View className="flex-row items-center mb-4">
                            <Sparkles size={18} color="#F59E0B" />
                            <Text className="text-amber-400 font-extrabold text-base ml-2">📌 핵심 정리</Text>
                        </View>
                        <Text className="text-slate-100 text-[15px] leading-[24px] font-medium">
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
    );
};
