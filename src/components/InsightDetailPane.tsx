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
    const categoryColor = isScience ? '#7C3AED' : '#10B981';
    const categoryBg = isScience ? '#7C3AED08' : '#10B98108';
    const categoryLabel = isScience ? '과학' : '경제';

    // Helper to strip HTML tags
    const stripHtml = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    };

    const cleanSummary = stripHtml(item.summary);
    const imageUrl = item.imageUrl || item.image_url;

    return (
        <View
            style={{
                borderRadius: 40,
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                width: '100%',
                height: '100%'
            }}
        >
            {/* Sticky Header Overlay */}
            <View style={{ position: 'absolute', top: 24, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
                <View
                    style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1, backgroundColor: categoryBg, borderColor: categoryColor + '20' }}
                >
                    <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', color: categoryColor }}>{categoryLabel}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
                        onPress={onToggleBookmark}
                    >
                        <Bookmark
                            size={18}
                            color={isBookmarked ? "#7C3AED" : "#64748B"}
                            fill={isBookmarked ? "#7C3AED" : "none"}
                        />
                    </Pressable>
                    <Pressable style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <Share2 size={18} color="#64748B" />
                    </Pressable>
                    <Pressable style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }} onPress={onClose}>
                        <X size={20} color="#64748B" />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1, borderRadius: 40 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Header Image */}
                <View style={{ width: '100%', height: 260, position: 'relative', borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden' }}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={300}
                    />
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
                        locations={[0, 1]}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                </View>

                {/* Content Section */}
                <View style={{ padding: 24 }}>
                    <Text style={{ color: '#18181b', fontSize: 24, fontWeight: '900', lineHeight: 34, marginBottom: 12, letterSpacing: -0.8 }}>{item.title}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ color: '#475569', fontSize: 13, fontWeight: '700' }}>{item.source || 'AI Insight'}</Text>
                        <Text style={{ color: '#CBD5E1', marginHorizontal: 8 }}>·</Text>
                        <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500' }}>{item.timestamp}</Text>
                        <Text style={{ color: '#CBD5E1', marginHorizontal: 8 }}>·</Text>
                        <Clock size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500' }}>{item.readTime || '3 min'} 읽기</Text>
                    </View>

                    {/* Tags */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                        {item.tags?.map((tag: string, i: number) => (
                            <Text key={i} style={{ color: '#7C3AED', fontSize: 12, fontWeight: '700', backgroundColor: '#7C3AED08', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#7C3AED15' }}>{tag}</Text>
                        ))}
                    </View>

                    {/* AI Highlight (Premium Box) */}
                    <View style={{ backgroundColor: '#FDF8F3', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#7C3AED10', marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Sparkles size={18} color="#7C3AED" />
                            <Text style={{ color: '#7C3AED', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>핵심 요약</Text>
                        </View>
                        <Text style={{ color: '#475569', fontSize: 14, lineHeight: 24, fontWeight: '500' }}>
                            {item.aiInsight || cleanSummary || "본문 요약을 불러오는 중입니다..."}
                        </Text>
                    </View>

                    {/* Related Materials / Action Buttons */}
                    <View style={{ marginTop: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <ExternalLink size={16} color="#94A3B8" />
                            <Text style={{ color: '#94A3B8', fontWeight: '800', fontSize: 13, marginLeft: 8 }}>관련 자료</Text>
                        </View>

                        {item.related_materials && item.related_materials.length > 0 ? (
                            <View style={{ gap: 10 }}>
                                {item.related_materials.map((material: any, idx: number) => (
                                    <Pressable
                                        key={idx}
                                        style={({ pressed }) => ({
                                            backgroundColor: pressed ? '#F8FAFC' : '#FFFFFF',
                                            padding: 16,
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: '#E2E8F0',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        })}
                                        onPress={() => {
                                            if (material.url) {
                                                Linking.openURL(material.url).catch(err => console.error("Couldn't load page", err));
                                            }
                                        }}
                                    >
                                        <View style={{ flex: 1, marginRight: 12 }}>
                                            <Text style={{ color: '#18181b', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{material.title}</Text>
                                            <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{material.url ? new URL(material.url).hostname : '링크 확인하기'}</Text>
                                        </View>
                                        <ArrowRight size={14} color="#CBD5E1" />
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <Pressable
                                style={({ pressed }) => ({
                                    backgroundColor: pressed ? '#6D28D9' : '#7C3AED',
                                    paddingVertical: 16,
                                    borderRadius: 18,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: '#7C3AED',
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 15,
                                })}
                                onPress={() => {
                                    if (item.sourceUrl) {
                                        Linking.openURL(item.sourceUrl).catch(err => console.error("Couldn't load page", err));
                                    }
                                }}
                            >
                                <ExternalLink size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>원문 기사 읽기</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};
