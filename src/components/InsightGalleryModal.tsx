import React, { useState } from 'react';
import {
    View, Text, Pressable, ScrollView, Linking, TouchableOpacity,
    Modal, Platform, StyleSheet, Share
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Bookmark, MessageCircle, Share2, Heart, Sparkles, ExternalLink, Clock } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

interface InsightGalleryModalProps {
    item: any | null;
    visible: boolean;
    onClose: () => void;
    isScrapped?: boolean;
    onToggleScrap?: (item: any, newStatus: boolean) => void;
}

export const InsightGalleryModal: React.FC<InsightGalleryModalProps> = ({
    item, visible, onClose, isScrapped = false, onToggleScrap,
}) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 80) + 12);
    const [commentCount] = useState(Math.floor(Math.random() * 20) + 3);
    const [isBookmarked, setIsBookmarked] = useState(isScrapped);

    if (!item) return null;

    const isScience = item.category === 'Science';
    const categoryColor = isScience ? '#7C3AED' : '#10B981';
    const categoryLabel = isScience ? '과학·기술' : '경제·산업';
    const imageUrl = item.imageUrl || item.image_url;

    const stripHtml = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    };

    const cleanSummary = stripHtml(item.summary || item.aiInsight || '');

    const handleLike = () => {
        setLiked(prev => !prev);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
    };

    const handleScrap = async () => {
        const next = !isBookmarked;
        setIsBookmarked(next);
        if (onToggleScrap) onToggleScrap(item, next);
    };

    const handleShare = async () => {
        if (Platform.OS === 'web') {
            if (navigator.share) {
                navigator.share({ title: item.title, text: cleanSummary });
            } else {
                navigator.clipboard?.writeText(item.title + '\n' + cleanSummary);
            }
        } else {
            await Share.share({ title: item.title, message: cleanSummary });
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
            {/* Backdrop */}
            <Pressable style={styles.backdrop} onPress={onClose} />

            {/* Gallery container */}
            <View style={styles.galleryContainer}>
                {/* Close button */}
                <Pressable style={styles.closeBtn} onPress={onClose}>
                    <X size={20} color="#64748B" />
                </Pressable>

                {/* LEFT: Content */}
                <View style={styles.leftPanel}>
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                        {/* Header image */}
                        <View style={styles.heroImgWrap}>
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.heroImg}
                                contentFit="cover"
                                transition={300}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.5)']}
                                style={StyleSheet.absoluteFill}
                            />
                            {/* Category badge on image */}
                            <View style={[styles.catBadgeImg, { backgroundColor: categoryColor }]}>
                                <Text style={styles.catBadgeImgText}>{categoryLabel}</Text>
                            </View>
                        </View>

                        {/* Meta info */}
                        <View style={styles.metaRow}>
                            <View style={styles.metaAuthor}>
                                <View style={styles.metaAvatar}>
                                    <Text style={styles.metaAvatarText}>AI</Text>
                                </View>
                                <Text style={styles.metaAuthorName}>{item.source || 'AI Insight'}</Text>
                            </View>
                            <View style={styles.metaRight}>
                                <Clock size={12} color="#94A3B8" />
                                <Text style={styles.metaTime}>{item.readTime ?? '3 min'} 읽기</Text>
                                <Text style={styles.metaDot}>·</Text>
                                <Text style={styles.metaDate}>{item.timestamp}</Text>
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>{item.title}</Text>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                            <View style={styles.tagsRow}>
                                {item.tags.slice(0, 4).map((tag: string, i: number) => (
                                    <View key={i} style={styles.tag}>
                                        <Text style={styles.tagText}>#{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* AI Summary box */}
                        <View style={styles.summaryBox}>
                            <View style={styles.summaryHeader}>
                                <Sparkles size={16} color="#7C3AED" />
                                <Text style={styles.summaryHeaderText}>핵심 요약</Text>
                            </View>
                            <Text style={styles.summaryText}>
                                {cleanSummary || '본문 내용을 불러오는 중입니다...'}
                            </Text>
                        </View>

                        {/* Original link */}
                        {item.sourceUrl && (
                            <Pressable
                                style={styles.sourceLink}
                                onPress={() => Linking.openURL(item.sourceUrl)}
                            >
                                <ExternalLink size={14} color="#7C3AED" />
                                <Text style={styles.sourceLinkText}>원문 보기</Text>
                            </Pressable>
                        )}

                        <View style={{ height: 32 }} />
                    </ScrollView>
                </View>

                {/* RIGHT: Action buttons (notefolio style) */}
                <View style={styles.rightPanel}>
                    {/* Like */}
                    <View style={styles.actionItem}>
                        <Pressable
                            style={[styles.actionBtn, liked && styles.actionBtnActive]}
                            onPress={handleLike}
                        >
                            <Heart
                                size={22}
                                color={liked ? '#EF4444' : '#64748B'}
                                fill={liked ? '#EF4444' : 'none'}
                            />
                        </Pressable>
                        <Text style={[styles.actionLabel, liked && { color: '#EF4444' }]}>{likeCount}</Text>
                    </View>

                    {/* Scrap / Bookmark */}
                    <View style={styles.actionItem}>
                        <Pressable
                            style={[styles.actionBtn, isBookmarked && styles.actionBtnBookmark]}
                            onPress={handleScrap}
                        >
                            <Bookmark
                                size={22}
                                color={isBookmarked ? '#7C3AED' : '#64748B'}
                                fill={isBookmarked ? '#7C3AED' : 'none'}
                            />
                        </Pressable>
                        <Text style={[styles.actionLabel, isBookmarked && { color: '#7C3AED' }]}>스크랩</Text>
                    </View>

                    {/* Comment */}
                    <View style={styles.actionItem}>
                        <Pressable style={styles.actionBtn}>
                            <MessageCircle size={22} color="#64748B" />
                        </Pressable>
                        <Text style={styles.actionLabel}>{commentCount}</Text>
                    </View>

                    {/* Share */}
                    <View style={styles.actionItem}>
                        <Pressable style={styles.actionBtn} onPress={handleShare}>
                            <Share2 size={22} color="#64748B" />
                        </Pressable>
                        <Text style={styles.actionLabel}>공유</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    } as any,

    galleryContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -430 }, { translateY: -320 }],
        width: 900,
        maxWidth: '95vw' as any,
        height: 640,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.25,
        shadowRadius: 48,
        elevation: 30,
    },

    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 70,
        zIndex: 100,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },

    leftPanel: {
        flex: 1,
        overflow: 'hidden',
    },

    heroImgWrap: {
        width: '100%',
        height: 320,
        position: 'relative',
    },
    heroImg: { width: '100%', height: '100%' },
    catBadgeImg: {
        position: 'absolute',
        bottom: 16,
        left: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    catBadgeImgText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 12,
    },
    metaAuthor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
    metaAvatarText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
    metaAuthorName: { color: '#475569', fontSize: 13, fontWeight: '700' },
    metaRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaTime: { color: '#94A3B8', fontSize: 12, marginLeft: 4 },
    metaDot: { color: '#CBD5E1', marginHorizontal: 4 },
    metaDate: { color: '#94A3B8', fontSize: 12 },

    title: {
        color: '#18181B',
        fontSize: 22,
        fontWeight: '900',
        lineHeight: 32,
        letterSpacing: -0.5,
        paddingHorizontal: 24,
        marginBottom: 16,
    },

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 24, marginBottom: 20 },
    tag: { backgroundColor: '#F5F3FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6FE' },
    tagText: { color: '#7C3AED', fontSize: 11, fontWeight: '700' },

    summaryBox: {
        marginHorizontal: 24,
        backgroundColor: '#FDF8F3',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#7C3AED15',
        marginBottom: 16,
    },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    summaryHeaderText: { color: '#7C3AED', fontWeight: '800', fontSize: 13 },
    summaryText: { color: '#475569', fontSize: 14, lineHeight: 22, fontWeight: '500' },

    sourceLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginHorizontal: 24,
        paddingVertical: 8,
    },
    sourceLinkText: { color: '#7C3AED', fontSize: 13, fontWeight: '700' },

    /* Right Action Panel */
    rightPanel: {
        width: 72,
        backgroundColor: '#FAFAFA',
        borderLeftWidth: 1,
        borderLeftColor: '#F1F5F9',
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    actionItem: { alignItems: 'center', gap: 4, marginBottom: 8 },
    actionBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    actionBtnActive: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    actionBtnBookmark: {
        backgroundColor: '#F5F3FF',
        borderColor: '#DDD6FE',
    },
    actionLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
});
