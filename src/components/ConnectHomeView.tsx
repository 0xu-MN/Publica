import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Sparkles, AlertCircle, Briefcase, Home, RefreshCcw, Users, Building2, Search, Filter, LayoutGrid, Plus, Bell, User as UserIcon, CheckCircle2 } from 'lucide-react-native';
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { fetchGrants } from '../services/grants';
import { getTopRecommendedGrants } from '../utils/scoring';
import { fetchAICards, AICardNews } from '../services/newsService';
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
    onNavigateToInsight?: () => void;
    onProgramSelect?: (program: any) => void;
    onLoginPress?: () => void;
}

export const ConnectHomeView: React.FC<ConnectHomeViewProps> = ({
    onNavigateToSupport,
    onNavigateToLounge,
    onNavigateToWorkspace,
    onNavigateToGrantList,
    onNavigateToInsight,
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
    const [topGrants, setTopGrants] = React.useState<any[]>([]);
    const [insightNews, setInsightNews] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch & Score Grants
            const allGrants = await fetchGrants();
            const recommended = getTopRecommendedGrants(allGrants, profile, 10);

            setTopGrants(recommended.slice(0, 2));

            const rndApps = recommended.filter(g => g.grant_type === 'project' || !g.grant_type).slice(0, 5);
            setGovPrograms(rndApps);

            const fundApps = recommended.filter(g => g.grant_type === 'subsidy').slice(0, 5);
            setFundingPrograms(fundApps);

            // 2. Fetch Insight News for Publica Insight section
            try {
                const aiCards: AICardNews[] = await fetchAICards('전체');
                const mappedCards = aiCards
                    .map((card) => {
                        try {
                            if (!card.content || card.content === 'undefined') return null;
                            const cardData = JSON.parse(card.content);
                            return {
                                id: card.id,
                                title: cardData.headline || cardData.title,
                                summary: cardData.body,
                                imageUrl: cardData.imageUrl || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop',
                                category: cardData.category === 'Science' ? 'Science' : 'Economy',
                                source: 'AI Insight',
                                timestamp: new Date(card.created_at).toLocaleDateString('ko-KR'),
                                readTime: '3 min 읽기',
                                tags: cardData.bullets || [],
                            };
                        } catch (e) { return null; }
                    })
                    .filter(Boolean)
                    .slice(0, 6);
                setInsightNews(mappedCards);
            } catch (e) {
                console.error('Failed to fetch insight news', e);
            }

            // Mock Community Data
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
                            {user ? (
                                <Text style={styles.welcomeText}>Welcome back, <Text style={styles.welcomeName}>{nickname}</Text> {honorific}!</Text>
                            ) : (
                                <Text style={styles.welcomeText}>안녕하세요, <Text style={styles.welcomeName}>방문자</Text>님!</Text>
                            )}
                            <Text style={styles.headerSubtitle}>맞춤 지원사업 기회를 확인하세요</Text>
                        </View>
                        <View style={styles.dateBox}>
                            <Text style={styles.dateYear}>{new Date().getFullYear()}</Text>
                            <Text style={styles.dateMain}>
                                {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                            </Text>
                            <Text style={styles.dateDay}>
                                {new Date().toLocaleDateString('ko-KR', { weekday: 'long' })}
                            </Text>
                        </View>
                    </View>

                    {/* Profile Summary Bar */}
                    {user ? (
                        <View style={styles.profileSummaryBar}>
                            <View style={styles.profileSummaryLeft}>
                                <View style={styles.profileInitialAvatar}>
                                    <Text style={styles.profileInitialText}>
                                        {(nickname || 'U')[0].toUpperCase()}
                                    </Text>
                                </View>
                                <View>
                                    <View style={styles.profileNameRow}>
                                        <Text style={styles.profileSummaryName}>{nickname} {honorific}</Text>
                                        <View style={styles.roleBadge}><Text style={styles.roleText}>{role}</Text></View>
                                    </View>
                                    <Text style={styles.profileSummaryKeywords} numberOfLines={1}>
                                        {keywords.slice(0, 3).map((k: string) => `#${k}`).join('  ')} · {field}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.profileSummaryRight}>
                                <View style={styles.profileStatChip}>
                                    <Text style={styles.profileStatLabel}>Match Score</Text>
                                    <Text style={styles.profileStatValue}>98%</Text>
                                </View>
                                <TouchableOpacity onPress={onNavigateToWorkspace} style={styles.workspacePillBtn}>
                                    <LayoutGrid size={14} color="#7C3AED" />
                                    <Text style={styles.workspacePillText}>Workspace</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.guestBar}>
                            <Text style={styles.guestBarText}>로그인하고 맞춤 공고 추천을 받아보세요</Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity onPress={onLoginPress} style={styles.viewBtn}>
                                    <Text style={styles.viewBtnText}>로그인</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={onLoginPress} style={[styles.viewBtn, { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#7C3AED' }]}>
                                    <Text style={[styles.viewBtnText, { color: '#7C3AED' }]}>회원가입</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Top Recommendations - Notefolio Style */}
                    <View style={styles.recommendSection}>
                        <View style={styles.sectionTitleRow}>
                            <View style={styles.sectionLabelWrap}>
                                <Sparkles size={18} color="#7C3AED" />
                                <Text style={styles.sectionLabel}>AI 맞춤 추천 공고</Text>
                            </View>
                            <TouchableOpacity onPress={() => !user ? onLoginPress?.() : onNavigateToGrantList?.()}>
                                <Text style={styles.moreBtn}>전체보기 {'>'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ position: 'relative' }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 20, paddingHorizontal: 2, paddingBottom: 8 }}
                            >
                                {topGrants.length === 0 ? (
                                    [1, 2].map(i => (
                                        <View key={i} style={styles.grantHeroCard}>
                                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Search size={32} color="#E2E8F0" />
                                                <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 12 }}>공고 탐색 중...</Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    topGrants.slice(0, 2).map((grant, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.grantHeroCard}
                                            onPress={() => !user ? onLoginPress?.() : onProgramSelect?.(grant)}
                                            activeOpacity={0.9}
                                        >
                                            {/* Background gradient accent */}
                                            <LinearGradient
                                                colors={idx === 0 ? ['#4C1D95', '#7C3AED'] : ['#064E3B', '#10B981']}
                                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                style={StyleSheet.absoluteFill}
                                            />
                                            {/* Score chip */}
                                            <View style={styles.grantScoreChip}>
                                                <Text style={styles.grantScoreLabel}>MATCH</Text>
                                                <Text style={styles.grantScoreValue}>{!user ? '??' : grant.score}<Text style={{ fontSize: 14 }}>%</Text></Text>
                                            </View>
                                            {/* Content */}
                                            <View style={styles.grantHeroContent}>
                                                <View style={styles.grantHeroBadges}>
                                                    <View style={styles.grantHeroBadge}>
                                                        <Text style={styles.grantHeroBadgeText}>{grant.category}</Text>
                                                    </View>
                                                    <View style={[styles.grantHeroBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                                                        <Text style={styles.grantHeroBadgeText}>{grant.d_day}</Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.grantHeroAgency}>{grant.agency}</Text>
                                                <Text style={styles.grantHeroTitle} numberOfLines={3}>{grant.title}</Text>
                                                <View style={styles.grantHeroFooter}>
                                                    <Text style={styles.grantHeroField}>{grant.tech_field}</Text>
                                                    <View style={styles.grantHeroBtn}>
                                                        <Sparkles size={14} color="#FFF" />
                                                        <Text style={styles.grantHeroBtnText}>분석 시작</Text>
                                                        <ArrowRight size={14} color="#FFF" />
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                            {!user && (
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 28, alignItems: 'center', justifyContent: 'center', zIndex: 20, ...({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any) }]}>
                                    <TouchableOpacity onPress={onLoginPress} style={styles.viewBtn}>
                                        <Text style={styles.viewBtnText}>로그인하고 맞춤 추천받기</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
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


                    {/* Publica Insight Section */}
                    <View style={{ marginBottom: 56 }}>
                        <View style={styles.sectionTitleRow}>
                            <View style={styles.sectionLabelWrap}>
                                <Sparkles size={22} color="#7C3AED" />
                                <Text style={styles.sectionLabel}>Publica Insight</Text>
                            </View>
                            <TouchableOpacity onPress={onNavigateToInsight}>
                                <Text style={styles.moreBtn}>전체보기 {'>'}</Text>
                            </TouchableOpacity>
                        </View>

                        {insightNews.length === 0 ? (
                            // Skeleton placeholder while loading
                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                {[1, 2, 3].map(i => (
                                    <View key={i} style={[styles.insightCard, { backgroundColor: '#F8FAFC' }]}>
                                        <View style={{ height: 140, backgroundColor: '#F1F5F9', borderRadius: 16, marginBottom: 14 }} />
                                        <View style={{ height: 14, backgroundColor: '#F1F5F9', borderRadius: 6, marginBottom: 8, width: '80%' }} />
                                        <View style={{ height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, width: '60%' }} />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 16, paddingHorizontal: 2 }}
                            >
                                {insightNews.map((item: any, i: number) => (
                                    <TouchableOpacity key={item.id ?? i} style={styles.insightCard} activeOpacity={0.85}>
                                        <View style={styles.insightImgWrap}>
                                            <Image
                                                source={{ uri: item.imageUrl }}
                                                style={styles.insightImg}
                                                resizeMode="cover"
                                            />
                                            <View style={[
                                                styles.insightCatBadge,
                                                { backgroundColor: item.category === 'Science' ? '#F5F3FF' : '#ECFDF5' }
                                            ]}>
                                                <Text style={[styles.insightCatText, { color: item.category === 'Science' ? '#7C3AED' : '#10B981' }]}>
                                                    {item.category === 'Science' ? '과학·기술' : '경제·산업'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.insightCardTitle} numberOfLines={2}>{item.title}</Text>
                                        <View style={styles.insightCardMeta}>
                                            <Text style={styles.insightCardSource}>{item.source}</Text>
                                            <Text style={styles.insightCardTime}>{item.timestamp}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* ── Separator ── */}
                    <View style={styles.divider}><View style={styles.dividerAccent} /></View>

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
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    content: { maxWidth: 1400, alignSelf: 'center', width: '100%', paddingHorizontal: 24, paddingBottom: 24, paddingTop: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, marginBottom: 16 },
    welcomeText: { color: '#18181B', fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
    welcomeName: { color: '#7C3AED', fontWeight: '900' },
    headerSubtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
    dateBox: { alignItems: 'flex-end', backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    dateYear: { color: '#CBD5E1', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    dateMain: { color: '#18181B', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    dateDay: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

    // Profile summary bar (replaces old profile card)
    profileSummaryBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFAFA', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 16, marginBottom: 28, borderWidth: 1, borderColor: '#F1F5F9' },
    profileSummaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    profileInitialAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
    profileInitialText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    profileSummaryName: { color: '#18181B', fontSize: 15, fontWeight: '800' },
    profileSummaryKeywords: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
    profileSummaryRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    profileStatChip: { backgroundColor: '#F5F3FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#DDD6FE', alignItems: 'center' },
    profileStatLabel: { color: '#7C3AED', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    profileStatValue: { color: '#7C3AED', fontSize: 16, fontWeight: '900' },
    workspacePillBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F3FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#DDD6FE' },
    workspacePillText: { color: '#7C3AED', fontSize: 12, fontWeight: '800' },
    // Guest bar
    guestBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, marginBottom: 28, borderWidth: 1, borderColor: '#E2E8F0' },
    guestBarText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    roleBadge: { backgroundColor: '#7C3AED', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
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
    recFooter: { marginTop: 'auto', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
    recFieldLabel: { color: '#94A3B8', fontSize: 11, marginBottom: 4 },
    recFieldValue: { color: '#10B981', fontSize: 14, fontWeight: '800', flexShrink: 1 },
    viewBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, flexShrink: 0 },
    viewBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

    sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingHorizontal: 8 },
    sectionLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionLabel: { color: '#18181b', fontSize: 22, fontWeight: '800' },
    moreBtn: { color: '#7C3AED', fontSize: 12, fontWeight: '700' },

    dualGridRow: { flexDirection: 'row', gap: 24, marginBottom: 48 },
    carouselCol: { flex: 1.1 },
    gridCol: { flex: 1 },
    oppsCard: { backgroundColor: '#FFFFFF', padding: 32, borderRadius: 40, height: 570, borderWidth: 1, borderColor: '#7C3AED10' },
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
    postCategoryText: { color: '#7C3AED', fontSize: 10, fontWeight: '800' },

    // Insight cards
    insightCard: { width: 260, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
    insightImgWrap: { width: '100%', height: 150, position: 'relative' },
    insightImg: { width: '100%', height: '100%' },
    insightCatBadge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    insightCatText: { fontSize: 9, fontWeight: '800' },
    insightCardTitle: { color: '#18181B', fontSize: 14, fontWeight: '700', lineHeight: 20, padding: 14, paddingBottom: 8 },
    insightCardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 },
    insightCardSource: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
    insightCardTime: { color: '#CBD5E1', fontSize: 10 },

    // Grant Hero Cards (notefolio style)
    grantHeroCard: { width: 480, height: 260, borderRadius: 24, overflow: 'hidden', position: 'relative', flexDirection: 'column', justifyContent: 'space-between' },
    grantScoreChip: { position: 'absolute', top: 20, right: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
    grantScoreLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
    grantScoreValue: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: -1 },
    grantHeroContent: { flex: 1, justifyContent: 'flex-end', padding: 24 },
    grantHeroBadges: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    grantHeroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    grantHeroBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
    grantHeroAgency: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '700', marginBottom: 6 },
    grantHeroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', lineHeight: 26, marginBottom: 16 },
    grantHeroFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    grantHeroField: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
    grantHeroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    grantHeroBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});

