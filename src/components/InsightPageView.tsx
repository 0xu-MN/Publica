import React, { useState, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, TextInput, Image,
    useWindowDimensions, StyleSheet, ScrollView
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Bookmark, Clock, TrendingUp } from 'lucide-react-native';
import { NewsItem } from '../services/newsService';

interface InsightPageViewProps {
    newsData: NewsItem[];
    hotKeywords: string[];
    user?: any;
    onLoginPress: () => void;
    onInsightClick: (item: any) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    scrappedIds: Set<string>;
    onBookmarkPress: (item: any) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
    Science: '과학·기술',
    Economy: '경제·산업',
};

const CATEGORY_COLORS: Record<string, string> = {
    Science: '#7C3AED',
    Economy: '#10B981',
};

const CATEGORY_BG: Record<string, string> = {
    Science: '#F5F3FF',
    Economy: '#ECFDF5',
};

export const InsightPageView: React.FC<InsightPageViewProps> = ({
    newsData,
    hotKeywords,
    user,
    onLoginPress,
    onInsightClick,
    searchQuery,
    onSearchChange,
    scrappedIds,
    onBookmarkPress,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

    const filtered = useMemo(() => {
        let items = newsData;
        if (activeKeyword) {
            items = items.filter(item =>
                (item.tags || []).some((t: string) =>
                    t.toLowerCase().includes(activeKeyword.toLowerCase().replace('#', ''))
                )
            );
        }
        if (searchQuery.trim()) {
            items = items.filter(item =>
                item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return items;
    }, [newsData, activeKeyword, searchQuery]);

    const featuredItem = filtered[0] ?? null;
    const featuredSidebar = filtered.slice(1, 6);
    const recentPosts = filtered.slice(1);

    return (
        <View style={styles.root}>
            {/* ── Page Header ── */}
            <View style={styles.pageHeader}>
                <View>
                    <Text style={styles.pageTitle}>Publica Insight</Text>
                    <Text style={styles.pageSubtitle}>AI가 큐레이션한 지원사업·R&D·시장 트렌드 뉴스</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchWrap}>
                    <Search size={16} color="#94A3B8" />
                    <TextInput
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        placeholder="인사이트 검색..."
                        placeholderTextColor="#94A3B8"
                        style={styles.searchInput}
                        returnKeyType="search"
                    />
                </View>
            </View>

            {/* ── Keyword Tags ── */}
            {hotKeywords.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.keywordRow}
                    style={{ marginBottom: 32 }}
                >
                    <TouchableOpacity
                        onPress={() => setActiveKeyword(null)}
                        style={[styles.kwTag, !activeKeyword && styles.kwTagActive]}
                    >
                        <Text style={[styles.kwText, !activeKeyword && styles.kwTextActive]}>전체</Text>
                    </TouchableOpacity>
                    {hotKeywords.map((kw, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => setActiveKeyword(kw === activeKeyword ? null : kw)}
                            style={[styles.kwTag, activeKeyword === kw && styles.kwTagActive]}
                        >
                            <Text style={[styles.kwText, activeKeyword === kw && styles.kwTextActive]}>
                                #{kw}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* ── Featured Section ── */}
            {featuredItem && (
                <View style={styles.featuredSection}>
                    <View style={styles.featuredSectionHeader}>
                        <TrendingUp size={18} color="#7C3AED" />
                        <Text style={styles.featuredSectionTitle}>오늘의 피처드</Text>
                    </View>

                    <View style={[styles.featuredRow, !isDesktop && { flexDirection: 'column' }]}>
                        {/* Main Featured Card */}
                        <TouchableOpacity
                            style={styles.featuredMain}
                            onPress={() => onInsightClick(featuredItem)}
                            activeOpacity={0.92}
                        >
                            <View style={styles.featuredImgWrap}>
                                <ExpoImage
                                    source={{ uri: featuredItem.imageUrl }}
                                    style={styles.featuredImg}
                                    contentFit="cover"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.72)']}
                                    style={StyleSheet.absoluteFill}
                                />
                                {/* Category badge */}
                                <View style={[styles.catBadgeOverlay, { backgroundColor: CATEGORY_COLORS[featuredItem.category] ?? '#7C3AED' }]}>
                                    <Text style={styles.catBadgeOverlayText}>
                                        {CATEGORY_LABELS[featuredItem.category] ?? featuredItem.category}
                                    </Text>
                                </View>
                                {/* Bookmark */}
                                <TouchableOpacity
                                    style={[styles.bmBtn, scrappedIds.has(featuredItem.title) && styles.bmBtnActive]}
                                    onPress={() => onBookmarkPress(featuredItem)}
                                >
                                    <Bookmark
                                        size={15}
                                        color={scrappedIds.has(featuredItem.title) ? '#7C3AED' : '#FFF'}
                                        fill={scrappedIds.has(featuredItem.title) ? '#7C3AED' : 'none'}
                                    />
                                </TouchableOpacity>
                                {/* Text overlay */}
                                <View style={styles.featuredOverlay}>
                                    <Text style={styles.featuredTitle} numberOfLines={3}>{featuredItem.title}</Text>
                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaSource}>{featuredItem.source}</Text>
                                        <View style={styles.dot} />
                                        <Clock size={11} color="rgba(255,255,255,0.7)" />
                                        <Text style={styles.metaTime}>{featuredItem.timestamp}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Sidebar list */}
                        {isDesktop && (
                            <View style={styles.featuredSidebar}>
                                <Text style={styles.sidebarTitle}>Other featured posts</Text>
                                {featuredSidebar.map((item, i) => (
                                    <TouchableOpacity
                                        key={item.id ?? i}
                                        style={styles.sidebarItem}
                                        onPress={() => onInsightClick(item)}
                                        activeOpacity={0.8}
                                    >
                                        <ExpoImage
                                            source={{ uri: item.imageUrl }}
                                            style={styles.sidebarThumb}
                                            contentFit="cover"
                                        />
                                        <View style={styles.sidebarTextWrap}>
                                            <Text style={styles.sidebarItemTitle} numberOfLines={2}>{item.title}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* ── Recent Posts ── */}
            <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                    <Text style={styles.recentTitle}>Recent Posts</Text>
                    <View style={styles.postCount}>
                        <Text style={styles.postCountText}>총 {recentPosts.length}건</Text>
                    </View>
                </View>

                {recentPosts.length === 0 && (
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                    </View>
                )}

                <View style={[
                    styles.recentGrid,
                    isDesktop ? styles.recentGridDesktop : styles.recentGridMobile
                ]}>
                    {recentPosts.map((item, i) => (
                        <TouchableOpacity
                            key={item.id ?? i}
                            style={[styles.recentCard, isDesktop && { width: '31%' }]}
                            onPress={() => onInsightClick(item)}
                            activeOpacity={0.88}
                        >
                            <View style={styles.recentImgWrap}>
                                <ExpoImage
                                    source={{ uri: item.imageUrl }}
                                    style={styles.recentImg}
                                    contentFit="cover"
                                />
                                <View style={[
                                    styles.recentCatBadge,
                                    { backgroundColor: CATEGORY_BG[item.category] ?? '#F5F3FF' }
                                ]}>
                                    <Text style={[
                                        styles.recentCatText,
                                        { color: CATEGORY_COLORS[item.category] ?? '#7C3AED' }
                                    ]}>
                                        {CATEGORY_LABELS[item.category] ?? item.category}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.recentBmBtn, scrappedIds.has(item.title) && styles.bmBtnActive]}
                                    onPress={() => onBookmarkPress(item)}
                                >
                                    <Bookmark
                                        size={13}
                                        color={scrappedIds.has(item.title) ? '#7C3AED' : '#64748B'}
                                        fill={scrappedIds.has(item.title) ? '#7C3AED' : 'none'}
                                    />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.recentContent}>
                                <Text style={styles.recentItemTitle} numberOfLines={2}>{item.title}</Text>
                                <Text style={styles.recentItemSummary} numberOfLines={2}>{item.summary}</Text>
                                <View style={styles.recentMeta}>
                                    <View style={styles.recentAuthorRow}>
                                        <View style={styles.recentAuthorAvatar}>
                                            <Text style={styles.recentAuthorInitial}>
                                                {(item.source ?? 'AI')[0]}
                                            </Text>
                                        </View>
                                        <Text style={styles.recentAuthorName}>{item.source ?? 'AI Insight'}</Text>
                                    </View>
                                    <View style={styles.readTimeWrap}>
                                        <Clock size={11} color="#94A3B8" />
                                        <Text style={styles.readTime}>{item.readTime ?? '3 min read'}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { maxWidth: 1300, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },

    /* Header */
    pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
    pageTitle: { color: '#18181B', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 4 },
    pageSubtitle: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 12, gap: 10, minWidth: 240 },
    searchInput: { flex: 1, color: '#18181B', fontSize: 14, fontWeight: '500', outlineStyle: 'none' } as any,

    /* Keywords */
    keywordRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 2 },
    kwTag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
    kwTagActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
    kwText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
    kwTextActive: { color: '#FFFFFF' },

    /* Featured */
    featuredSection: { marginBottom: 48 },
    featuredSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    featuredSectionTitle: { color: '#18181B', fontSize: 20, fontWeight: '800' },

    featuredRow: { flexDirection: 'row', gap: 24 },
    featuredMain: { flex: 3, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20 },
    featuredImgWrap: { width: '100%', aspectRatio: 1.65, position: 'relative' },
    featuredImg: { width: '100%', height: '100%' },

    catBadgeOverlay: { position: 'absolute', top: 16, left: 16, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    catBadgeOverlayText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

    bmBtn: { position: 'absolute', top: 14, right: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
    bmBtnActive: { backgroundColor: '#F5F3FF' },

    featuredOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 },
    featuredTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', lineHeight: 32, marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaSource: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.5)' },
    metaTime: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500', marginLeft: 2 },

    /* Sidebar */
    featuredSidebar: { flex: 1.5 },
    sidebarTitle: { color: '#18181B', fontSize: 14, fontWeight: '800', marginBottom: 16 },
    sidebarItem: { flexDirection: 'row', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
    sidebarThumb: { width: 64, height: 48, borderRadius: 10, backgroundColor: '#F1F5F9' },
    sidebarTextWrap: { flex: 1 },
    sidebarItemTitle: { color: '#18181B', fontSize: 13, fontWeight: '600', lineHeight: 20 },

    /* Recent Posts */
    recentSection: { },
    recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    recentTitle: { color: '#18181B', fontSize: 20, fontWeight: '800' },
    postCount: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#E2E8F0' },
    postCountText: { color: '#64748B', fontSize: 12, fontWeight: '700' },

    emptyWrap: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },

    recentGrid: { gap: 24 },
    recentGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
    recentGridMobile: { flexDirection: 'column' },

    recentCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
    recentImgWrap: { width: '100%', height: 190, position: 'relative' },
    recentImg: { width: '100%', height: '100%' },
    recentCatBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
    recentCatText: { fontSize: 9, fontWeight: '800' },
    recentBmBtn: { position: 'absolute', top: 10, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },

    recentContent: { padding: 18, gap: 10 },
    recentItemTitle: { color: '#18181B', fontSize: 16, fontWeight: '800', lineHeight: 24 },
    recentItemSummary: { color: '#64748B', fontSize: 13, lineHeight: 20 },

    recentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    recentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    recentAuthorAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
    recentAuthorInitial: { color: '#FFF', fontSize: 10, fontWeight: '800' },
    recentAuthorName: { color: '#475569', fontSize: 12, fontWeight: '600' },
    readTimeWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    readTime: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
});
