import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView, Platform, Linking } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { NewsItem } from '../services/newsService';
import { X, ExternalLink, Sparkles, Share2, Bookmark, Clock } from 'lucide-react-native';

interface InsightDetailModalProps {
    item: NewsItem | null;
    visible: boolean;
    onClose: () => void;
}

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({ item, visible, onClose }) => {
    if (!item) return null;

    const isScience = item.category === 'Science';
    const categoryColor = isScience ? '#0EA5E9' : '#10B981';
    const categoryBg = isScience ? 'rgba(14, 165, 233, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    const categoryLabel = isScience ? '과학' : '경제';

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <Animated.View
                    entering={SlideInUp.duration(400).springify()}
                    style={styles.modalContainer}
                >
                    {/* Sticky Header Overlay */}
                    <View style={styles.topOverlay}>
                        <View style={[styles.categoryBadge, { backgroundColor: categoryBg, borderColor: categoryColor }]}>
                            <Text style={[styles.categoryText, { color: categoryColor }]}>{categoryLabel}</Text>
                        </View>
                        <View style={styles.topIcons}>
                            <Pressable style={styles.iconButton}>
                                <Bookmark size={20} color="#fff" />
                            </Pressable>
                            <Pressable style={styles.iconButton}>
                                <Share2 size={20} color="#fff" />
                            </Pressable>
                            <Pressable style={styles.closeButton} onPress={onClose}>
                                <X size={22} color="#fff" />
                            </Pressable>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {/* Header Image */}
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={styles.headerImage}
                                contentFit="cover"
                                transition={300}
                            />
                            <LinearGradient
                                colors={['rgba(5, 11, 20, 0.3)', 'transparent']}
                                locations={[0, 1]}
                                style={StyleSheet.absoluteFill}
                            />
                        </View>

                        {/* Content Section */}
                        <View style={styles.contentSection}>
                            <Text style={styles.title}>{item.title}</Text>

                            <View style={styles.metaRow}>
                                <Text style={styles.sourceText}>{item.source}</Text>
                                <Text style={styles.dot}>·</Text>
                                <Text style={styles.timeText}>{item.timestamp}</Text>
                                <Text style={styles.dot}>·</Text>
                                <Clock size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                                <Text style={styles.readTime}>{item.readTime} 읽기</Text>
                            </View>

                            <View style={styles.tagsRow}>
                                {item.tags?.map((tag, i) => (
                                    <Text key={i} style={styles.hashTag}>{tag}</Text>
                                ))}
                            </View>

                            {/* Summary Text - Rendered as bullet points if detected */}
                            <View style={styles.summaryContainer}>
                                {item.summary.split('- ').map((point, index) => {
                                    const cleanPoint = point.trim();
                                    if (!cleanPoint) return null;

                                    // If text starts with bullet logic in AI prompt, render as list item
                                    return (
                                        <View key={index} style={styles.bulletItem}>
                                            <View style={styles.bulletDot} />
                                            <Text style={styles.summaryText}>{cleanPoint}</Text>
                                        </View>
                                    );
                                })}
                                {/* Fallback if no bullets found (legacy data) */}
                                {!item.summary.includes('- ') && (
                                    <Text style={styles.summaryText}>{item.summary}</Text>
                                )}
                            </View>

                            {/* AI Insight Box */}
                            <View style={styles.insightBox}>
                                <View style={styles.insightHeader}>
                                    <Sparkles size={16} color="#F59E0B" />
                                    <Text style={styles.insightLabel}>AI 핵심 인사이트</Text>
                                </View>
                                <Text style={styles.insightText}>
                                    {item.aiInsight || "AI가 분석한 핵심 인사이트를 불러오는 중입니다..."}
                                </Text>
                            </View>

                            {/* Action Button */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.readButton,
                                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                                ]}
                                onPress={() => {
                                    if (item.sourceUrl) {
                                        Linking.openURL(item.sourceUrl).catch(err => console.error("Couldn't load page", err));
                                    } else {
                                        // Fallback if sourceUrl unavailable in type, try guessing or alerting
                                        console.warn("No source URL available");
                                    }
                                }}
                            >
                                <ExternalLink size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.readButtonText}>원문 기사 보기</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 600,
        maxHeight: '90%',
        backgroundColor: '#0F172A',
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            },
            default: {
                shadowColor: "#000",
                shadowOffset: {
                    width: 0,
                    height: 10,
                },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
            }
        }),
    },
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        width: '100%',
        height: 280,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    topOverlay: {
        position: 'absolute',
        top: 24, // Increased spacing from top
        left: 24,
        right: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Align items vertically center
        zIndex: 50, // Ensure it sits above ScrollView
    },
    categoryBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    topIcons: {
        flexDirection: 'row',
        gap: 8,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentSection: {
        padding: 24,
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: '800',
        lineHeight: 34,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sourceText: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '600',
    },
    dot: {
        color: '#64748B',
        marginHorizontal: 6,
        fontSize: 13,
    },
    timeText: {
        color: '#94A3B8',
        fontSize: 13,
    },
    readTime: {
        color: '#94A3B8',
        fontSize: 13,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    hashTag: {
        color: '#3B82F6',
        fontSize: 13,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        overflow: 'hidden',
        fontWeight: '600',
    },
    summaryContainer: {
        marginBottom: 24,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    bulletDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#94A3B8',
        marginTop: 10,
        marginRight: 10,
    },
    summaryText: {
        flex: 1,
        color: '#E2E8F0', // Light Gray like shadcn muted-foreground but lighter for dark mode
        fontSize: 16,
        lineHeight: 26,
        fontWeight: '400',
    },
    insightBox: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        marginBottom: 20,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    insightLabel: {
        color: '#F59E0B',
        fontWeight: '800',
        fontSize: 14,
        marginLeft: 6,
    },
    insightText: {
        color: '#E2E8F0',
        fontSize: 14,
        lineHeight: 22,
    },
    readButton: {
        backgroundColor: '#0EA5E9',
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    readButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
