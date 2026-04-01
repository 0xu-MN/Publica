import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet, FlatList, Platform, Animated, Linking, TextInput } from 'react-native';
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
    const [searchQuery, setSearchQuery] = useState<string>('');
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
                // If the user selected '전국', show only national grants
                if (regionFilter === '전국') return gRegion === '전국';

                // Otherwise, show exactly what the user selected (if user selected '서울', show '서울' only)
                return gRegion === regionFilter;
            });
        }

        // Search query filter
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(g =>
                (g.title && g.title.toLowerCase().includes(lowerQuery)) ||
                (g.agency && g.agency.toLowerCase().includes(lowerQuery)) ||
                (g.tech_field && g.tech_field.toLowerCase().includes(lowerQuery))
            );
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
                    <ChevronLeft size={24} color="#27272a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Smart Match Finder</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Bookmark size={20} color="#94A3B8" />
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
                            <Sparkles size={16} color={activeTab === 'Rec' ? '#7C3AED' : '#64748B'} />
                            <Text style={[styles.tabText, activeTab === 'Rec' && styles.tabTextActive]}>AI 추천</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'All' && styles.tabActive]}
                            onPress={() => { setActiveTab('All'); setSortOption('deadline'); }}
                        >
                            <Filter size={16} color={activeTab === 'All' ? '#7C3AED' : '#64748B'} />
                            <Text style={[styles.tabText, activeTab === 'All' && styles.tabTextActive]}>전체 공고</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sorting & Filter Bar */}
                    <View style={styles.filterContainer}>
                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Search size={18} color="#94A3B8" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="공고명, 주관기관, 분야 등 검색..."
                                placeholderTextColor="#64748B"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                                    <X size={16} color="#94A3B8" />
                                </TouchableOpacity>
                            )}
                        </View>

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
                                        {cat === 'All' ? '전체' : cat === 'Commercialization' ? '사업화' : cat === 'Voucher' ? '바우처' : cat === 'Policy Fund' ? '정책자금' : cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Region Filter (Wrapped Grid instead of Horizontal Scroll) */}
                        <View style={styles.regionGrid}>
                            {['All', '전국', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map((reg) => (
                                <TouchableOpacity
                                    key={reg}
                                    style={[
                                        styles.filterChip,
                                        { marginBottom: 8 },
                                        regionFilter === reg && { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }
                                    ]}
                                    onPress={() => setRegionFilter(reg)}
                                >
                                    <Text style={[styles.filterChipText, regionFilter === reg && styles.filterChipTextActive]}>
                                        {reg === 'All' ? '📍 전체 지역' : reg}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
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
                                        <ExternalLink size={18} color="#64748B" />
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
    container: { flex: 1, backgroundColor: '#FDF8F3' },
    header: { 
        height: 70, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 24, 
        borderBottomWidth: 1, 
        borderColor: '#E2E8F0', 
        backgroundColor: '#FFFFFF', 
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        zIndex: 10,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#27272a', fontSize: 20, fontWeight: '900', letterSpacing: -0.8 },
    iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F8FAFC' },

    tabContainer: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 24, gap: 12 },
    tab: { 
        flex: 1, 
        height: 52, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 10, 
        borderRadius: 18, 
        backgroundColor: '#FFFFFF', 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
    },
    tabActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED', shadowOpacity: 0.2, shadowColor: '#7C3AED' },
    tabText: { color: '#64748B', fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
    tabTextActive: { color: '#FFFFFF' },

    filterContainer: { paddingHorizontal: 24, paddingVertical: 20, gap: 16 },
    sortRow: { flexDirection: 'row', gap: 10 },
    sortChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
    sortChipActive: { backgroundColor: '#7C3AED10', borderColor: '#7C3AED' },
    sortText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
    sortTextActive: { color: '#7C3AED' },

    searchContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: '#E2E8F0', 
        paddingHorizontal: 16, 
        height: 56, 
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
    },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, color: '#27272a', fontSize: 15, fontWeight: '600' },
    clearSearchBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },

    regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingBottom: 16 },

    filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
    filterChipText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
    filterChipTextActive: { color: '#FFFFFF' },

    listContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
    card: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 32, 
        padding: 32, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    matchBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
    matchText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    categoryText: { color: '#94A3B8', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    titleText: { color: '#27272a', fontSize: 22, fontWeight: '900', lineHeight: 30, marginBottom: 16, letterSpacing: -0.8 },
    metaRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },
    summaryText: { color: '#475569', fontSize: 14, lineHeight: 22, marginBottom: 20, fontWeight: '500' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    tagContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: '#7C3AED08', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#7C3AED10' },
    tagText: { color: '#7C3AED', fontSize: 12, fontWeight: '800' },
    actionBtn: { width: 48, height: 48, borderRadius: 18, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    reasoningBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    reasoningText: { color: '#64748B', fontSize: 12, fontWeight: '700', flex: 1, lineHeight: 18 },

    // List Item Styles (Slim View)
    listItem: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 24, 
        padding: 24, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
    },
    listMain: { gap: 10 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listAgency: { color: '#94A3B8', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    listDDay: { color: '#EF4444', fontSize: 13, fontWeight: '900' },
    listTitle: { color: '#27272a', fontSize: 17, fontWeight: '800', lineHeight: 24, letterSpacing: -0.5 },
    listFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
    typeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
    typeTagText: { color: '#64748B', fontSize: 11, fontWeight: '800' },
    listMeta: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 60 },
    loadingText: { color: '#94A3B8', marginTop: 20, fontSize: 15, fontWeight: '700' },
    emptyText: { color: '#94A3B8', fontSize: 15, fontWeight: '700', textAlign: 'center' },

    // Main Layout (list + detail side by side)
    mainLayout: { flex: 1, flexDirection: 'row', width: '100%', maxWidth: 1400, alignSelf: 'center' },
    listSection: { flex: 1 },

    // Detail Slide Panel
    detailPanel: { overflow: 'hidden', borderLeftWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
    detailScroll: { flex: 1, padding: 32 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    detailHeaderTitle: { color: '#27272a', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    detailCloseBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
    detailBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    detailBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
    detailBadgeText: { color: '#64748B', fontSize: 12, fontWeight: '800' },
    detailTitle: { color: '#27272a', fontSize: 24, fontWeight: '900', lineHeight: 34, marginBottom: 28, letterSpacing: -1 },
    detailMeta: { gap: 16, backgroundColor: '#FDF8F3', padding: 24, borderRadius: 28, borderWidth: 1, borderColor: '#E2E8F0' },
    detailMetaItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    detailMetaLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '800', width: 80 },
    detailMetaValue: { color: '#27272a', fontSize: 14, fontWeight: '800', flex: 1, textAlign: 'right', letterSpacing: -0.2 },
    detailSectionLabel: { color: '#27272a', fontSize: 16, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
    detailDescription: { color: '#475569', fontSize: 14, lineHeight: 24, fontWeight: '500' },
    detailMatchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#7C3AED08', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#7C3AED15', marginTop: 24 },
    detailMatchText: { color: '#7C3AED', fontSize: 15, fontWeight: '900' },
    detailActions: { gap: 12, marginTop: 40, paddingBottom: 60 },
    detailActionPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 60, borderRadius: 20, backgroundColor: '#7C3AED', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 },
    detailActionPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
    detailActionSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
    detailActionSecondaryText: { color: '#64748B', fontSize: 14, fontWeight: '800' },
});
