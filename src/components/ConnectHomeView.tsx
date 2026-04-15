import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Sparkles, AlertCircle, Briefcase, Home, RefreshCcw, Users, Building2, Search, Filter, LayoutGrid, Plus, Bell, User as UserIcon, CheckCircle2 } from 'lucide-react-native';
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { fetchGrants } from '../services/grants';
import { getTopRecommendedGrants } from '../utils/scoring';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';
import ElectricBorder from './ElectricBorder';
import { VerticalStackCarousel } from './VerticalStackCarousel';
import { GovernmentCard } from './GovernmentCard';
import BorderGlow from './ui/BorderGlow';

interface ConnectHomeViewProps {
    onNavigateToSupport?: () => void;
    onNavigateToLounge?: () => void;
    onNavigateToWorkspace?: () => void;
    onNavigateToGrantList?: () => void;
    onProgramSelect?: (program: any) => void;
    onLoginPress?: () => void;
}

export const ConnectHomeView: React.FC<ConnectHomeViewProps> = ({
    onNavigateToSupport,
    onNavigateToLounge,
    onNavigateToWorkspace,
    onNavigateToGrantList,
    onProgramSelect,
    onLoginPress
}) => {
    const { width } = useWindowDimensions();
    const { user, profile } = useAuth();

    const getDisplayData = () => {
        if (!profile) return { keywords: ['AI_Agent', 'FinTech'], field: '정부 R&D' };

        const keywords = profile.research_keywords && profile.research_keywords.length > 0
            ? profile.research_keywords
            : ['설정 필요'];

        const field = profile.expertise || profile.major_category || profile.industry || '미설정';

        return { keywords, field };
    };

    const { keywords, field } = getDisplayData();

    // Derive remaining profile data directly
    const nickname = profile?.full_name || user?.email?.split('@')[0] || 'User';
    const role = profile?.user_type === 'business' ? (profile?.industry || 'Business') :
        profile?.user_type === 'pre_entrepreneur' ? (profile?.industry || 'Pre-Ent') :
            profile?.user_type === 'researcher' ? (profile?.major_category || 'Researcher') :
                (profile?.industry || 'AI Strategist');

    // 직종별 호칭 계산
    const getHonorific = (): string => {
        const ut = (profile as any)?.user_type;
        if (ut === 'business' || ut === 'pre_entrepreneur') return '대표님';
        if (ut === 'researcher') {
            const rt = (profile as any)?.researcher_type || '';
            if (rt.includes('교수')) return '교수님';
            if (rt.includes('박사')) return '박사님';
            if (rt.includes('학생') || rt.includes('대학원')) return '님';
            return '연구원님';
        }
        if (ut === 'other') {
            const aff = (profile as any)?.affiliation || '';
            if (aff.includes('강사') || aff.includes('선생')) return '선생님';
            if (aff.includes('작가') || aff.includes('디자이너') || aff.includes('크리에이터')) return '님';
            return '님';
        }
        return '님';
    };
    const honorific = getHonorific();

    const imageUrl = profile?.avatar_url || '';
    const isDesktop = width >= 1024;
    const scrollRef = React.useRef<ScrollView>(null);
    const searchSectionRef = React.useRef<View>(null);

    const [govPrograms, setGovPrograms] = React.useState<any[]>([]);
    const [fundingPrograms, setFundingPrograms] = React.useState<any[]>([]);
    const [communityPosts, setCommunityPosts] = React.useState<any[]>([]);
    const [topGrants, setTopGrants] = React.useState<any[]>([]); // New state for top cards
    const [loading, setLoading] = React.useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch & Score Grants
            const allGrants = await fetchGrants();
            const recommended = getTopRecommendedGrants(allGrants, profile, 10);

            // Set Top 2 for the Main Cards
            setTopGrants(recommended.slice(0, 2));

            // Set Carousel items (Projects)
            const rndApps = recommended.filter(g => g.grant_type === 'project' || !g.grant_type).slice(0, 5);
            setGovPrograms(rndApps);

            // Set Funding items (Strictly Subsidies)
            const fundApps = recommended.filter(g => g.grant_type === 'subsidy').slice(0, 5);
            setFundingPrograms(fundApps);


            // Mock Community Data (Keep for now)
            setCommunityPosts([
                { title: '예비창업패키지 3번 문항 작성 팁 있을까요?', author: '박연구원', time: '54분 전', category: 'Q&A', content: '이번에 예비창업패키지 준비 중인데 3번 BM 구성이 어렵네요...', likes: 4, comments: 12 },
                { title: '이번 R&D 예산 증액안, 실제로 체감되시나요?', author: '김대표', time: '1시간 전', category: '자유게시판', content: '뉴스에서는 증액이라는데 실제로는 잘 모르겠네요.', likes: 21, comments: 45 },
                { title: '지자체 지원금 드디어 입금됐습니다!', author: '이창업', time: '3시간 전', category: 'Talk', content: '기다림 끝에 오늘 입금 확인했네요. 다들 힘내세요!', likes: 2, comments: 8 },
                { title: '시리즈 A 투자 유치 성공기 공유합니다', author: '최투자', time: '5시간 전', category: 'Insight', content: '약 1년간의 투자 유치 과정을 정리해봤습니다.', likes: 88, comments: 32 },
            ]);
        } catch (error) {
            console.error("Error loading connect hub data:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, [profile]); // Reload when profile changes

    // Auto-scroll Animation for Lounge
    const translateX = useSharedValue(0);
    const CARD_WIDTH = 420;
    const GAP = 24;
    const TOTAL_ITEMS = communityPosts.length;
    const TOTAL_WIDTH = (CARD_WIDTH + GAP) * TOTAL_ITEMS;

    useEffect(() => {
        if (communityPosts.length > 0) {
            translateX.value = 0;
            translateX.value = withRepeat(
                withTiming(-TOTAL_WIDTH, {
                    duration: 30000, // 30 seconds for one full loop
                    easing: Easing.linear,
                }),
                -1, // Infinite
                false // Don't reverse
            );
        }
        return () => cancelAnimation(translateX);
    }, [communityPosts.length, TOTAL_WIDTH]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={{ color: '#64748B', marginTop: 16, fontWeight: '600' }}>Connect Hub 로딩 중...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            ref={scrollRef}
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 0 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
        >
            <View style={{ backgroundColor: '#FFFFFF', width: '100%' }}>
                <View style={styles.content}>
                    {/* Header Section */}
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.headerTitle}>CONNECT HUB</Text>
                            <Text style={styles.headerSubtitle}>{nickname || '방문자'} {honorific}의 아이템에 맞춘 최적의 기회입니다.</Text>
                        </View>
                        <TouchableOpacity style={styles.filterBtn}>
                            <Filter size={18} color="#94A3B8" />
                            <Text style={styles.filterText}>필터링</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Card Section */}
                    <View style={styles.profileCard}>
                        {!user ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                                    <View style={styles.avatar}><UserIcon size={40} color="#94A3B8" /></View>
                                    <View>
                                        <Text style={styles.profileTitle}>안녕하세요 방문자님!</Text>
                                        <Text style={styles.profileKeywords}>로그인 후 더 많은 기능을 만나보세요.</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity onPress={onLoginPress} style={styles.viewBtn}>
                                        <Text style={styles.viewBtnText}>로그인</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={onLoginPress} style={[styles.viewBtn, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#7C3AED30' }]}>
                                        <Text style={[styles.viewBtnText, { color: '#7C3AED' }]}>회원가입</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                                    <View style={styles.avatarWrapper}>
                                        <View style={styles.avatar}>
                                            {imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} /> : <UserIcon size={32} color="#94A3B8" />}
                                        </View>
                                        <View style={styles.onlineDot} />
                                    </View>
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                            <Text style={styles.profileTitle}>{nickname} {honorific}</Text>
                                            <View style={styles.roleBadge}><Text style={styles.roleText}>{role}</Text></View>
                                        </View>
                                        <Text style={styles.profileKeywords} numberOfLines={1}>
                                            보유 기술: <Text style={{ color: '#7C3AED', fontWeight: '700' }}>{keywords.map((k: string) => `#${k}`).join(', ')}</Text> • 선호 분야: <Text style={{ color: '#10B981', fontWeight: '700' }}>{field}</Text>
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Match Score</Text>
                                        <Text style={[styles.statValue, { color: '#7C3AED' }]}>98<Text style={styles.scoreUnit}>%</Text></Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Projects</Text>
                                        <Text style={styles.statValue}>3<Text style={styles.scoreUnit}>건</Text></Text>
                                    </View>
                                    <TouchableOpacity onPress={onNavigateToWorkspace} style={styles.workspaceBtn}>
                                        <LayoutGrid size={20} color="#7C3AED" />
                                        <Text style={styles.workspaceText}>Workspace</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Top Recommendations */}
                    <View style={styles.recommendSection}>
                        <View style={styles.recCardsRow}>
                            {topGrants.length === 0 ? (
                                <View style={[styles.recCard, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Search size={48} color="#94A3B8" style={{ opacity: 0.5, marginBottom: 20 }} />
                                    <Text style={{ color: '#18181b', fontSize: 24, fontWeight: '800', marginBottom: 8 }}>맞춤 지원사업 탐색 중</Text>
                                    <Text style={{ color: '#64748B', textAlign: 'center' }}>AI가 {nickname} {honorific}께 최적화된 공고를 선별하고 있습니다.</Text>
                                </View>
                            ) : (
                                topGrants.slice(0, 2).map((grant, idx) => (
                                    <TouchableOpacity key={idx} style={styles.recCard} onPress={() => !user ? onLoginPress?.() : onProgramSelect?.(grant)}>
                                        <View style={styles.scoreContainer}>
                                            <Text style={styles.scoreLabel}>Match Score</Text>
                                            <Text style={styles.scoreValue}>{!user ? '??' : grant.score}<Text style={styles.scoreUnit}>%</Text></Text>
                                        </View>
                                        <View style={{ width: '70%' }}>
                                            <Text style={styles.recAgency}>{grant.agency}</Text>
                                            <Text style={styles.recTitle} numberOfLines={3}>{grant.title}</Text>
                                        </View>
                                        <View style={styles.badgeRow}>
                                            <View style={styles.badgePurple}><Text style={styles.badgeTextPurple}>{grant.category}</Text></View>
                                            <View style={styles.badgeGray}><Text style={styles.badgeTextGray}>{grant.d_day}</Text></View>
                                        </View>
                                        <View style={styles.recFooter}>
                                            <View>
                                                <Text style={styles.recFieldLabel}>지원 분야</Text>
                                                <Text style={styles.recFieldValue}>{grant.tech_field}</Text>
                                            </View>
                                            <BorderGlow borderRadius={16} glowColor="hsl(262, 83%, 58%)" glowIntensity={0.8}>
                                                <View style={styles.viewBtn}>
                                                    <Sparkles size={18} color="#FFF" />
                                                    <Text style={styles.viewBtnText}>상세 보기</Text>
                                                </View>
                                            </BorderGlow>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                        {!user && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 40, alignItems: 'center', justifyContent: 'center', zIndex: 20, ...({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any) }]}>
                                <TouchableOpacity onPress={onLoginPress} style={[styles.viewBtn, { paddingHorizontal: 32, paddingVertical: 20 }]}>
                                    <Text style={[styles.viewBtnText, { fontSize: 18 }]}>로그인하고 맞춤 추천받기</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Sub Sections Grid */}
                    <View style={styles.dualGridRow}>
                        <View style={styles.carouselCol}>
                            <View style={styles.sectionTitleRow}>
                                <View style={styles.sectionLabelWrap}>
                                    <AlertCircle size={20} color="#7C3AED" />
                                    <Text style={styles.sectionLabel}>정부사업 안내</Text>
                                </View>
                                <TouchableOpacity onPress={() => !user ? onLoginPress?.() : onNavigateToGrantList?.()}>
                                    <Text style={styles.moreBtn}>전체보기 {'>'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ height: 500 }}>
                                <VerticalStackCarousel
                                    data={govPrograms}
                                    itemHeight={340}
                                    containerHeight={500}
                                    renderItem={(item, index, progress, totalItems) => (
                                        <GovernmentCard item={item} index={index} progress={progress} totalItems={totalItems} />
                                    )}
                                />
                            </View>
                        </View>

                        <View style={styles.gridCol}>
                            <View style={styles.oppsCard}>
                                <View style={[styles.sectionTitleRow, { marginBottom: 32 }]}>
                                    <Text style={[styles.sectionLabel, { fontSize: 18 }]}>NEW OPPORTUNITIES</Text>
                                </View>
                                <View style={styles.oppsGrid}>
                                    {[1, 2, 3, 4].map(i => (
                                        <View key={i} style={styles.oppItem}>
                                            <View>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <Text style={styles.oppAgency}>중소벤처기업부</Text>
                                                    <Text style={styles.oppDday}>D-12</Text>
                                                </View>
                                                <Text style={styles.oppTitle} numberOfLines={3}>2026 글로벌 기술 매칭 펀드 및 바우처 지원사업</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                                <View style={styles.badgeGray}><Text style={[styles.badgeTextGray, { fontSize: 8 }]}>자금</Text></View>
                                                <View style={styles.badgeGray}><Text style={[styles.badgeTextGray, { fontSize: 8 }]}>글로벌</Text></View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider}><View style={styles.dividerAccent} /></View>

                    {/* Workspace Summary Section */}
                    <View style={{ marginBottom: 56 }}>
                        <View style={styles.sectionTitleRow}>
                            <View style={styles.sectionLabelWrap}>
                                <Home size={22} color="#7C3AED" />
                                <Text style={styles.sectionLabel}>My Workspace</Text>
                            </View>
                            <TouchableOpacity onPress={() => !user ? onLoginPress?.() : onNavigateToWorkspace?.()} >
                                <Text style={styles.moreBtn}>상세보기 {'>'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 16, position: 'relative' }}>
                            {[1, 2, 3].map(i => (
                                <View key={i} style={[styles.recCard, { minHeight: 180, padding: 24 }]}>
                                    <Text style={{ color: '#7C3AED', fontSize: 10, fontWeight: '800', marginBottom: 8 }}>PROJECT 0{i}</Text>
                                    <Text style={{ color: '#18181b', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>전략 에이전트 기반 사업 아이템 고도화 리포트</Text>
                                    <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ color: '#94A3B8', fontSize: 10 }}>2시간 전 업데이트</Text>
                                        <View style={styles.postCategory}><Text style={styles.postCategoryText}>분석 완료</Text></View>
                                    </View>
                                </View>
                            ))}
                            {!user && (
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10, ...({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any) }]}>
                                    <TouchableOpacity onPress={onLoginPress} style={styles.viewBtn}>
                                        <Text style={styles.viewBtnText}>워크스페이스 시작하기</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Lounge Section */}
                    <View style={styles.loungeWrap}>
                        <View style={styles.sectionTitleRow}>
                            <View style={styles.sectionLabelWrap}>
                                <Users size={24} color="#7C3AED" />
                                <Text style={styles.sectionLabel}>Publica Lounge</Text>
                            </View>
                            <TouchableOpacity onPress={onNavigateToLounge}>
                                <Text style={styles.moreBtn}>전체보기 {'>'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ position: 'relative' }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <Animated.View style={[{ flexDirection: 'row', gap: 24, paddingLeft: 8 }, animatedStyle]}>
                                    {[...communityPosts, ...communityPosts].map((post, i) => (
                                        <TouchableOpacity key={i} style={styles.loungeCard} onPress={() => !user ? onLoginPress?.() : onNavigateToLounge?.()}>
                                            <View style={styles.authorRow}>
                                                <View style={styles.authorThumb}><Image source={{ uri: `https://i.pravatar.cc/100?u=${post.author}` }} style={{ width: '100%', height: '100%' }} /></View>
                                                <View><Text style={styles.authorName}>{post.author}</Text><Text style={styles.postTime}>{post.time}</Text></View>
                                            </View>
                                            <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
                                            <View style={styles.postStats}>
                                                <Text style={styles.postStatText}>💬 {post.comments}</Text>
                                                <Text style={styles.postStatText}>👍 {post.likes}</Text>
                                                <View style={styles.postCategory}><Text style={styles.postCategoryText}>{post.category}</Text></View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </Animated.View>
                            </ScrollView>

                            <LinearGradient
                                colors={['#FFFFFF', 'rgba(255, 255, 255, 0)']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 10 }}
                                pointerEvents="none"
                            />
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0)', '#FFFFFF']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 10 }}
                                pointerEvents="none"
                            />
                        </View>
                    </View>
                </View>
            </View>
            <Footer />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF8F3' },
    content: { maxWidth: 1400, alignSelf: 'center', width: '100%', padding: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, marginBottom: 32 },
    headerTitle: { color: '#18181b', fontSize: 48, fontWeight: '900', letterSpacing: -2 },
    headerSubtitle: { color: '#64748B', fontSize: 18, fontWeight: '500' },
    filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF8F3', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
    filterText: { color: '#475569', marginLeft: 8, fontWeight: '600' },

    profileCard: { backgroundColor: '#FDF8F3', borderRadius: 32, padding: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, borderWidth: 1, borderColor: '#7C3AED15', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
    avatarWrapper: { position: 'relative', marginRight: 24 },
    avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#7C3AED30', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#10B981', borderColor: '#FDF8F3', borderWidth: 3 },
    profileTitle: { color: '#18181b', fontSize: 28, fontWeight: '800', marginBottom: 4 },
    roleBadge: { backgroundColor: '#7C3AED', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, marginLeft: 12 },
    roleText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    profileKeywords: { color: '#64748B', fontSize: 14, fontWeight: '500' },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 32 },
    statItem: { alignItems: 'center' },
    statLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
    statValue: { color: '#18181b', fontSize: 32, fontWeight: '900' },
    workspaceBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderColor: '#7C3AED20', gap: 10 },
    workspaceText: { color: '#7C3AED', fontWeight: '800', fontSize: 15 },

    recommendSection: { marginBottom: 56, position: 'relative' },
    recCardsRow: { flexDirection: 'row', gap: 24 },
    recCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 40, padding: 32, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4, minHeight: 340 },
    recAgency: { color: '#94A3B8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
    recTitle: { color: '#18181b', fontSize: 24, fontWeight: '800', lineHeight: 32, marginBottom: 24 },
    badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
    badgePurple: { backgroundColor: '#F5F3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#DDD6FE' },
    badgeTextPurple: { color: '#7C3AED', fontWeight: '700', fontSize: 12 },
    badgeGray: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    badgeTextGray: { color: '#64748B', fontWeight: '700', fontSize: 12 },
    scoreContainer: { position: 'absolute', top: 32, right: 32, alignItems: 'flex-end' },
    scoreLabel: { color: '#7C3AED', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
    scoreValue: { color: '#18181b', fontSize: 44, fontWeight: '900' },
    scoreUnit: { fontSize: 18, fontWeight: '700' },
    recFooter: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    recFieldLabel: { color: '#94A3B8', fontSize: 11, marginBottom: 4 },
    recFieldValue: { color: '#10B981', fontSize: 16, fontWeight: '800' },
    viewBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
    viewBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

    sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingHorizontal: 8 },
    sectionLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionLabel: { color: '#18181b', fontSize: 22, fontWeight: '800' },
    moreBtn: { color: '#7C3AED', fontSize: 12, fontWeight: '700' },

    dualGridRow: { flexDirection: 'row', gap: 24, marginBottom: 48 },
    carouselCol: { flex: 1.1 },
    gridCol: { flex: 1 },
    oppsCard: { backgroundColor: '#FDF8F3', padding: 32, borderRadius: 40, height: 570, borderWidth: 1, borderColor: '#7C3AED10' },
    oppsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    oppItem: { width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, height: 160, justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0' },
    oppAgency: { color: '#64748B', fontSize: 9, fontWeight: '700' },
    oppDday: { color: '#7C3AED', fontSize: 10, fontWeight: '900' },
    oppTitle: { color: '#18181b', fontSize: 13, fontWeight: '700', lineHeight: 18 },

    divider: { width: '100%', height: 1, backgroundColor: '#F1F5F9', marginVertical: 48 },
    dividerAccent: { width: 64, height: 4, backgroundColor: '#7C3AED', borderRadius: 99, position: 'absolute', top: -1.5, left: 0 },

    loungeWrap: { marginBottom: 64 },
    loungeCard: { width: 420, backgroundColor: '#FFFFFF', padding: 32, borderRadius: 32, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 24 },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    authorThumb: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', overflow: 'hidden' },
    authorName: { color: '#18181b', fontSize: 14, fontWeight: '700' },
    postTime: { color: '#94A3B8', fontSize: 10 },
    postTitle: { color: '#18181b', fontSize: 18, fontWeight: '700', lineHeight: 26, marginBottom: 16 },
    postStats: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
    postStatText: { color: '#64748B', fontSize: 11 },
    postCategory: { backgroundColor: '#F5F3FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 'auto' },
    postCategoryText: { color: '#7C3AED', fontSize: 10, fontWeight: '800' }
});
