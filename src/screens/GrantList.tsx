import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet, FlatList, Platform, Animated, Linking } from 'react-native';
import { ChevronLeft, Info, Zap, Filter, Search, ArrowRight, Share2, Bookmark, Sparkles, ExternalLink, FileText, X } from 'lucide-react-native';
import { fetchGrants, Grant } from '../services/grants';
import { useAuth } from '../contexts/AuthContext';
import { calculateGrantScore } from '../utils/scoring';
import { Icons } from '../utils/icons';

interface GrantListProps {
    onBack: () => void;
    onSelectGrant: (grant: Grant) => void;
}

export const GrantList = ({ onBack, onSelectGrant }: GrantListProps) => {
    const [grants, setGrants] = useState<Grant[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Rec' | 'All'>('Rec');
    const [sortOption, setSortOption] = useState<'match' | 'deadline' | 'recent'>('match');
    const [filter, setFilter] = useState<'All' | 'R&D' | 'Commercialization' | 'Voucher' | 'Policy Fund'>('All');
    const [regionFilter, setRegionFilter] = useState<string>('All');
    const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
    const detailPanelWidth = useRef(new Animated.Value(0)).current;
    const { user, profile } = useAuth();

    // Animate detail panel
    const openDetail = (grant: Grant) => {
        setSelectedGrant(grant);
        Animated.spring(detailPanelWidth, {
            toValue: 420,
            useNativeDriver: false,
            friction: 12,
            tension: 65,
        }).start();
    };

    const closeDetail = () => {
        Animated.spring(detailPanelWidth, {
            toValue: 0,
            useNativeDriver: false,
            friction: 12,
            tension: 65,
        }).start(() => setSelectedGrant(null));
    };

    useEffect(() => {
        loadData();
    }, [profile]); // Reload when profile changes

    const loadData = async () => {
        setLoading(true);
        const data = await fetchGrants();

        // Calculate scores immediately
        if (profile) {
            const scoredData = data.map(grant => ({
                ...grant,
                matching_score: calculateGrantScore(grant, profile)
            }));
            setGrants(scoredData);
        } else {
            setGrants(data);
        }
        setLoading(false);
    };

    const getSortedGrants = () => {
        let filtered = grants.filter(g => filter === 'All' || g.category === filter);

        // Region filter
        if (regionFilter !== 'All') {
            filtered = filtered.filter(g => {
                const gRegion = g.region || '전국';
                if (regionFilter === '전국') return gRegion === '전국';
                return gRegion === regionFilter || gRegion === '전국';
            });
        }

        // Exclude expired grants (D-Day past)
        filtered = filtered.filter(g => {
            if (!g.d_day) return true;
            const match = g.d_day.match(/D-(-?\d+)/);
            if (!match) return true;
            return parseInt(match[1]) >= 0;
        });

        const parseDDay = (d: string) => {
            if (!d) return 999;
            if (d === 'D-Day') return 0;
            if (d === 'D-365') return 365; // Long term
            const match = d.match(/D-(\d+)/);
            return match ? parseInt(match[1]) : 999;
        };

        return [...filtered].sort((a, b) => {
            if (sortOption === 'match') {
                // High score first
                return (b.matching_score || 0) - (a.matching_score || 0);
            } else if (sortOption === 'deadline') {
                // Low D-Day first
                return parseDDay(a.d_day) - parseDDay(b.d_day);
            } else {
                // Recent first (created_at desc)
                if (!a.created_at) return 1;
                if (!b.created_at) return -1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });
    };

    const renderGrantCard = ({ item }: { item: Grant }) => {
        const score = item.matching_score || 0;
        const matchColor = score > 90 ? '#10B981' : score > 80 ? '#3B82F6' : '#F59E0B';

        if (activeTab === 'Rec') {
            // Recommendation: Grid-like Card (Existing UI)
            return (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => openDetail(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.cardHeader}>
                        <View style={[styles.matchBadge, { borderColor: matchColor }]}>
                            <Zap size={12} color={matchColor} fill={matchColor} />
                            <Text style={[styles.matchText, { color: matchColor }]}>{score}% Match</Text>
                        </View>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>

                    <Text style={styles.titleText}>{item.title}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icons.Building size={14} color="#64748B" />
                            <Text style={styles.metaText}>{item.agency}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icons.Calendar size={14} color="#EF4444" />
                            <Text style={[styles.metaText, { color: '#EF4444' }]}>{item.d_day}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />
                    <Text style={styles.summaryText} numberOfLines={2}>{item.summary}</Text>

                    {/* Budget & Period Info */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        {item.budget && (
                            <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' }}>
                                <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>💰 {item.budget}</Text>
                            </View>
                        )}
                        {item.application_period && (
                            <View style={{ backgroundColor: 'rgba(59,130,246,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)' }}>
                                <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: '600' }}>📅 {item.application_period}</Text>
                            </View>
                        )}
                        {item.region && item.region !== '전국' && (
                            <View style={{ backgroundColor: 'rgba(168,85,247,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(168,85,247,0.15)' }}>
                                <Text style={{ color: '#A855F7', fontSize: 11, fontWeight: '600' }}>📍 {item.region}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.tagContainer}>
                            <View style={styles.tag}><Text style={styles.tagText}>{item.tech_field}</Text></View>
                        </View>
                        <TouchableOpacity style={styles.actionBtn}>
                            <ArrowRight size={18} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.reasoningBox}>
                        <Info size={12} color="#475569" />
                        <Text style={styles.reasoningText} numberOfLines={1}>
                            {item.matching_reason || "Your profile matches this grant criteria perfectly."}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        } else {
            // All Grants: Slim List View
            return (
                <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => openDetail(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.listMain}>
                        <View style={styles.listHeader}>
                            <Text style={styles.listAgency}>{item.agency}</Text>
                            <Text style={[styles.listDDay, item.d_day === 'D-3' && { color: '#EF4444' }]}>{item.d_day}</Text>
                        </View>
                        <Text style={styles.listTitle}>{item.title}</Text>
                        {item.budget && (
                            <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700', marginTop: 4 }}>💰 {item.budget}</Text>
                        )}
                        <View style={styles.listFooter}>
                            <View style={[styles.typeTag, { backgroundColor: item.category === 'R&D' ? '#1E3A8A' : '#0F172A' }]}>
                                <Text style={styles.typeTagText}>{item.category}</Text>
                            </View>
                            <Text style={styles.listMeta}>{item.tech_field} • {item.target_audience}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Smart Match Finder</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Bookmark size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            <View style={styles.mainLayout}>
                {/* ─── Left: Grant List (max-width constrained) ─── */}
                <View style={styles.listSection}>
                    {/* Tab System */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'Rec' && styles.tabActive]}
                            onPress={() => { setActiveTab('Rec'); setSortOption('match'); }}
                        >
                            <Sparkles size={16} color={activeTab === 'Rec' ? '#3B82F6' : '#64748B'} />
                            <Text style={[styles.tabText, activeTab === 'Rec' && styles.tabTextActive]}>AI 추천</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'All' && styles.tabActive]}
                            onPress={() => { setActiveTab('All'); setSortOption('deadline'); }}
                        >
                            <Filter size={16} color={activeTab === 'All' ? '#3B82F6' : '#64748B'} />
                            <Text style={[styles.tabText, activeTab === 'All' && styles.tabTextActive]}>전체 공고</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sorting & Filter Bar */}
                    <View style={styles.filterContainer}>
                        <View style={styles.sortRow}>
                            <TouchableOpacity onPress={() => setSortOption('match')} style={[styles.sortChip, sortOption === 'match' && styles.sortChipActive]}>
                                <Text style={[styles.sortText, sortOption === 'match' && styles.sortTextActive]}>매칭률 높은순</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setSortOption('deadline')} style={[styles.sortChip, sortOption === 'deadline' && styles.sortChipActive]}>
                                <Text style={[styles.sortText, sortOption === 'deadline' && styles.sortTextActive]}>마감 임박순</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setSortOption('recent')} style={[styles.sortChip, sortOption === 'recent' && styles.sortChipActive]}>
                                <Text style={[styles.sortText, sortOption === 'recent' && styles.sortTextActive]}>최근 공고순</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                            {['All', 'R&D', 'Commercialization', 'Voucher', 'Policy Fund'].map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.filterChip, filter === cat && styles.filterChipActive]}
                                    onPress={() => setFilter(cat as any)}
                                >
                                    <Text style={[styles.filterChipText, filter === cat && styles.filterChipTextActive]}>
                                        {cat === 'Commercialization' ? '사업화' : cat === 'Voucher' ? '바우처' : cat === 'Policy Fund' ? '정책자금' : cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                            {['All', '전국', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map((reg) => (
                                <TouchableOpacity
                                    key={reg}
                                    style={[styles.filterChip, regionFilter === reg && { backgroundColor: '#581C87', borderColor: '#A855F7' }]}
                                    onPress={() => setRegionFilter(reg)}
                                >
                                    <Text style={[styles.filterChipText, regionFilter === reg && styles.filterChipTextActive]}>
                                        {reg === 'All' ? '📍 전체 지역' : reg}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#3B82F6" />
                            <Text style={styles.loadingText}>데이터를 불러오는 중입니다...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={getSortedGrants()}
                            renderItem={renderGrantCard}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.center}>
                                    <Text style={styles.emptyText}>해당 카테고리의 공고가 없습니다.</Text>
                                </View>
                            }
                        />
                    )}
                </View>

                {/* ─── Right: Detail Slide Panel ─── */}
                <Animated.View style={[styles.detailPanel, { width: detailPanelWidth }]}>
                    {selectedGrant && (
                        <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                            {/* Detail Header */}
                            <View style={styles.detailHeader}>
                                <Text style={styles.detailHeaderTitle}>공고 상세</Text>
                                <TouchableOpacity onPress={closeDetail} style={styles.detailCloseBtn}>
                                    <X size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            {/* Category Badge */}
                            <View style={styles.detailBadgeRow}>
                                <View style={styles.detailBadge}>
                                    <Text style={styles.detailBadgeText}>{selectedGrant.category}</Text>
                                </View>
                                <View style={[styles.detailBadge, { borderColor: '#EF4444' }]}>
                                    <Text style={[styles.detailBadgeText, { color: '#EF4444' }]}>{selectedGrant.d_day}</Text>
                                </View>
                                {selectedGrant.region && selectedGrant.region !== '전국' && (
                                    <View style={[styles.detailBadge, { borderColor: '#A855F7' }]}>
                                        <Text style={[styles.detailBadgeText, { color: '#A855F7' }]}>📍 {selectedGrant.region}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Title */}
                            <Text style={styles.detailTitle}>{selectedGrant.title}</Text>

                            {/* Meta Info */}
                            <View style={styles.detailMeta}>
                                <View style={styles.detailMetaItem}>
                                    <Text style={styles.detailMetaLabel}>주관기관</Text>
                                    <Text style={styles.detailMetaValue}>{selectedGrant.agency}</Text>
                                </View>
                                {selectedGrant.department && (
                                    <View style={styles.detailMetaItem}>
                                        <Text style={styles.detailMetaLabel}>소관부서</Text>
                                        <Text style={styles.detailMetaValue}>{selectedGrant.department}</Text>
                                    </View>
                                )}
                                {selectedGrant.application_period && (
                                    <View style={styles.detailMetaItem}>
                                        <Text style={styles.detailMetaLabel}>접수기간</Text>
                                        <Text style={styles.detailMetaValue}>{selectedGrant.application_period}</Text>
                                    </View>
                                )}
                                {selectedGrant.budget && (
                                    <View style={styles.detailMetaItem}>
                                        <Text style={styles.detailMetaLabel}>지원규모</Text>
                                        <Text style={[styles.detailMetaValue, { color: '#10B981' }]}>{selectedGrant.budget}</Text>
                                    </View>
                                )}
                                <View style={styles.detailMetaItem}>
                                    <Text style={styles.detailMetaLabel}>대상</Text>
                                    <Text style={styles.detailMetaValue}>{selectedGrant.target_audience}</Text>
                                </View>
                                <View style={styles.detailMetaItem}>
                                    <Text style={styles.detailMetaLabel}>분야</Text>
                                    <Text style={styles.detailMetaValue}>{selectedGrant.tech_field}</Text>
                                </View>
                            </View>

                            {/* Divider */}
                            <View style={{ height: 1, backgroundColor: '#1E293B', marginVertical: 16 }} />

                            {/* Description */}
                            <Text style={styles.detailSectionLabel}>공고 개요</Text>
                            <Text style={styles.detailDescription}>{selectedGrant.description || selectedGrant.summary}</Text>

                            {/* Eligibility */}
                            {selectedGrant.eligibility && (
                                <>
                                    <Text style={[styles.detailSectionLabel, { marginTop: 16 }]}>지원자격</Text>
                                    <Text style={styles.detailDescription}>{selectedGrant.eligibility}</Text>
                                </>
                            )}

                            {/* Matching Score */}
                            {selectedGrant.matching_score != null && selectedGrant.matching_score > 0 && (
                                <View style={styles.detailMatchBox}>
                                    <Zap size={16} color="#F59E0B" />
                                    <Text style={styles.detailMatchText}>AI 매칭률: {selectedGrant.matching_score}%</Text>
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View style={styles.detailActions}>
                                <TouchableOpacity
                                    style={styles.detailActionPrimary}
                                    onPress={() => {
                                        onSelectGrant(selectedGrant);
                                        closeDetail();
                                    }}
                                >
                                    <FileText size={16} color="#FFF" />
                                    <Text style={styles.detailActionPrimaryText}>이 공고로 사업계획서 작성</Text>
                                </TouchableOpacity>

                                {(selectedGrant.original_url || selectedGrant.link) && (
                                    <TouchableOpacity
                                        style={styles.detailActionSecondary}
                                        onPress={() => {
                                            const url = selectedGrant.original_url || selectedGrant.link || '';
                                            if (Platform.OS === 'web') {
                                                window.open(url, '_blank');
                                            } else {
                                                Linking.openURL(url);
                                            }
                                        }}
                                    >
                                        <ExternalLink size={16} color="#60A5FA" />
                                        <Text style={styles.detailActionSecondaryText}>원문 보기</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    )}
                </Animated.View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617', alignItems: 'center' as const },
    header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#1E293B', width: '100%', maxWidth: 1200, alignSelf: 'center' as const },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, gap: 12 },
    tab: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B' },
    tabActive: { backgroundColor: '#1E293B', borderColor: '#3B82F6' },
    tabText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
    tabTextActive: { color: 'white' },

    filterContainer: { paddingHorizontal: 20, paddingVertical: 15, gap: 12 },
    sortRow: { flexDirection: 'row', gap: 8 },
    sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B' },
    sortChipActive: { backgroundColor: '#1E293B', borderColor: '#3B82F6' },
    sortText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
    sortTextActive: { color: '#3B82F6' },

    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B' },
    filterChipActive: { backgroundColor: '#1E3A8A', borderColor: '#3B82F6' },
    filterChipText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    filterChipTextActive: { color: 'white' },

    listContent: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
    card: { backgroundColor: '#0F172A', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1E293B' },
    // ... rest of shared card styles stay roughly same
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    matchBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    matchText: { fontSize: 11, fontWeight: 'bold' },
    categoryText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
    titleText: { color: 'white', fontSize: 18, fontWeight: '700', lineHeight: 26, marginBottom: 12 },
    metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#1E293B', marginBottom: 16 },
    summaryText: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginBottom: 16 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    tagContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: { backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tagText: { color: '#3B82F6', fontSize: 11, fontWeight: '600' },
    actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
    reasoningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111827', padding: 12, borderRadius: 12 },
    reasoningText: { color: '#475569', fontSize: 11, fontWeight: '500', flex: 1 },

    // List Item Styles
    listItem: { backgroundColor: '#0F172A', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1E293B' },
    listMain: { gap: 8 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listAgency: { color: '#64748B', fontSize: 11, fontWeight: '700' },
    listDDay: { color: '#94A3B8', fontSize: 12, fontWeight: '800' },
    listTitle: { color: 'white', fontSize: 15, fontWeight: '700', lineHeight: 22 },
    listFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    typeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#1E293B' },
    typeTagText: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
    listMeta: { color: '#475569', fontSize: 11, fontWeight: '500' },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    loadingText: { color: '#64748B', marginTop: 15, fontSize: 14, fontWeight: '500' },
    emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center' },

    // Main Layout (list + detail side by side)
    mainLayout: { flex: 1, flexDirection: 'row' as const, width: '100%', maxWidth: 1200, alignSelf: 'center' as const },
    listSection: { flex: 1 },

    // Detail Slide Panel
    detailPanel: { overflow: 'hidden' as const, borderLeftWidth: 1, borderColor: '#1E293B', backgroundColor: '#0B1120' },
    detailScroll: { flex: 1, padding: 20 },
    detailHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 16 },
    detailHeaderTitle: { color: '#E2E8F0', fontSize: 16, fontWeight: '800' as const },
    detailCloseBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: '#1E293B' },
    detailBadgeRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 },
    detailBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#3B82F6' },
    detailBadgeText: { color: '#60A5FA', fontSize: 11, fontWeight: '700' as const },
    detailTitle: { color: '#F1F5F9', fontSize: 18, fontWeight: '800' as const, lineHeight: 26, marginBottom: 20 },
    detailMeta: { gap: 12 },
    detailMetaItem: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const },
    detailMetaLabel: { color: '#64748B', fontSize: 12, fontWeight: '700' as const, width: 70 },
    detailMetaValue: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' as const, flex: 1, textAlign: 'right' as const },
    detailSectionLabel: { color: '#E2E8F0', fontSize: 14, fontWeight: '800' as const, marginBottom: 8 },
    detailDescription: { color: '#94A3B8', fontSize: 13, lineHeight: 22 },
    detailMatchBox: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, backgroundColor: 'rgba(245,158,11,0.08)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)', marginTop: 16 },
    detailMatchText: { color: '#F59E0B', fontSize: 13, fontWeight: '700' as const },
    detailActions: { gap: 10, marginTop: 24, paddingBottom: 40 },
    detailActionPrimary: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, height: 48, borderRadius: 14, backgroundColor: '#4F46E5' },
    detailActionPrimaryText: { color: '#FFF', fontSize: 14, fontWeight: '800' as const },
    detailActionSecondary: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, height: 44, borderRadius: 12, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1E293B' },
    detailActionSecondaryText: { color: '#60A5FA', fontSize: 13, fontWeight: '700' as const },
});
