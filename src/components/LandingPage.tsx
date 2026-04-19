import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, useWindowDimensions,
    Animated, StyleSheet, Platform, Image
} from 'react-native';
import {
    ArrowRight, Sparkles, FileEdit, Download, CheckCircle2,
    Zap, Clock, Users,
    ChevronRight, Star, Shield, Cpu, BookOpen,
    Search, FileText, Globe, Award
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Footer from './Footer';
import { SoftAurora } from './ui/SoftAurora';
import BorderGlow from './ui/BorderGlow';

interface LandingPageProps {
    onLoginPress: () => void;
    onStartFree: () => void;
    onNavigateToPricing: () => void;
}

/* ─── DATA ─── */
const PAIN_POINTS = [
    {
        icon: Search,
        color: '#EF4444',
        bg: '#FEF2F2',
        title: '"공고가 너무 많아서\n어디서 시작해야 할지 모르겠어요."',
        desc: '매년 3만 개 이상의 지원사업 공고가 올라옵니다. 내 회사에 맞는 공고를 찾는 데만 수십 시간이 소요되고, 그 중에서 진짜 우리가 받을 수 있는 공고는 어디일까요?',
        who: '초기 스타트업, 예비창업자',
    },
    {
        icon: FileText,
        color: '#F59E0B',
        bg: '#FFFBEB',
        title: '"사업계획서를 어떻게 써야\n합격하는지 감이 안 잡혀요."',
        desc: '지원사업 전문 컨설턴트에게 의뢰하면 건당 수백만 원. 내부에서 작성하면 수십 시간의 작업 끝에 탈락. 심사위원이 진짜 원하는 게 무엇인지 알아야 합니다.',
        who: '중소기업, 연구소 기업',
    },
    {
        icon: Clock,
        color: '#7C3AED',
        bg: '#F5F3FF',
        title: '"공고 마감이 2주 남았는데\n시간이 너무 부족합니다."',
        desc: '사업계획서 하나 완성하는 데 평균 2~3주. 대표가 직접 작성하면 본업을 못 합니다. 담당자가 작성하면 전문성이 떨어집니다. 시간과 퀄리티, 둘 다 잡아야 합니다.',
        who: '중견기업 담당자, 연구자',
    },
];

const AGENTS = [
    {
        id: 'flow',
        icon: Zap,
        color: '#7C3AED',
        bg: '#F5F3FF',
        tag: '전략 수립',
        name: 'AI 전략 수립 에이전트',
        tagline: '탈락의 이유는 "내용 부족"이 아닙니다.\n"전략의 부재"입니다.',
        desc: 'Nexus Flow는 공고의 평가 지표를 역방향으로 분석합니다. 심사위원이 실제로 점수를 주는 기준을 먼저 파악하고, 거기에 맞는 전략 트리를 자동으로 구성해줍니다. "무엇을 써야 하는지"부터 명확해집니다.',
        bullets: [
            '공고 URL/PDF 하나로 평가 기준 자동 추출',
            'PSST 프레임워크 기반 전략 트리 생성',
            '항목별 핵심 작성 포인트 안내',
            '경쟁 공고와 차별화 전략 제안',
        ],
    },
    {
        id: 'edit',
        icon: FileEdit,
        color: '#0EA5E9',
        bg: '#F0F9FF',
        tag: 'AI 초안 작성',
        name: 'AI 초안 작성 에이전트',
        tagline: '전략이 완성되면, 글쓰기는\nAI가 대신합니다.',
        desc: 'Nexus Flow의 전략 결과를 그대로 이어받아 사업계획서 각 문항의 초안을 자동으로 작성합니다. PSST 구조로 논리적 흐름을 잡고, 전문 컨설턴트 수준의 문체로 작성됩니다. 완성된 문서는 HWPX/DOCX 정부 양식에 즉시 매핑됩니다.',
        bullets: [
            'Nexus Flow 전략 결과 자동 연동',
            '문항별 PSST 논리 구조 초안 자동 생성',
            '실시간 품질 검수 및 재작성 지원',
            'HWPX · DOCX 정부 양식 자동 매핑 후 다운로드',
        ],
    },
    {
        id: 'grants',
        icon: Search,
        color: '#10B981',
        bg: '#F0FDF4',
        tag: '공고 탐색',
        name: '공고 탐색 & 맞춤 추천',
        tagline: '3만 개의 공고 중\n당신의 회사에 맞는 공고만 보여드립니다.',
        desc: '전국 30,000개 이상 기관의 지원사업 공고를 실시간 수집하고, 기업 프로필과 AI 매칭 스코어로 최적의 공고를 추천합니다. D-Day 알림부터 신청 자격 사전 진단까지, 기회를 놓치지 마세요.',
        bullets: [
            '30,000개 이상 기관 공고 실시간 수집',
            'AI 매칭 스코어로 적합도 자동 분석',
            '분야·규모·지역·마감일 필터 검색',
            '바로 에이전트 분석으로 원클릭 연결',
        ],
    },
];

const STATS = [
    { value: '3만+', label: '수집 공고 수', sub: '전국 기관 실시간 수집', icon: Globe, color: '#7C3AED' },
    { value: '10분', label: '평균 초안 완성 시간', sub: '직접 테스트 측정 결과', icon: Clock, color: '#0EA5E9' },
    { value: '무제한', label: '에이전트 사용 횟수', sub: 'PRO 플랜 기준', icon: Zap, color: '#10B981' },
    { value: '100%', label: '정부 양식 자동 매핑', sub: 'HWPX · DOCX 지원', icon: CheckCircle2, color: '#F59E0B' },
];

const PROCESS_STEPS = [
    { num: '01', icon: Search, color: '#10B981', title: '공고 탐색', desc: 'AI가 내 회사 규모·분야·지역에 맞는 공고를 매칭 스코어로 자동 추천합니다.' },
    { num: '02', icon: Zap, color: '#7C3AED', title: '전략 수립', desc: '심사위원이 실제로 점수를 주는 평가 기준을 역분석해, 맞춤 전략 트리를 만듭니다.' },
    { num: '03', icon: FileEdit, color: '#0EA5E9', title: 'AI 초안 작성', desc: '전략을 바탕으로 PSST 논리 구조의 사업계획서 초안을 자동으로 작성합니다.' },
    { num: '04', icon: Download, color: '#F59E0B', title: '양식 매핑 & 다운로드', desc: '정부 공식 양식(HWPX/DOCX)에 자동 매핑 후 즉시 다운로드. 바로 제출 가능합니다.' },
];

const WHY_ITEMS = [
    { icon: Cpu, color: '#7C3AED', title: '제출 후 "이게 맞나?" 불안이 없어집니다', desc: '심사위원이 실제로 점수를 주는 기준을 먼저 분석합니다. 탈락할 요인은 전략 단계에서 이미 제거됩니다.' },
    { icon: Shield, color: '#0EA5E9', title: '마감 3일 전에 시작해도 완성본이 나옵니다', desc: '기존에는 퀄리티와 시간 중 하나를 포기해야 했습니다. Publica는 AI 전략 엔진으로 두 가지를 동시에 해결합니다.' },
    { icon: BookOpen, color: '#10B981', title: '전문가 없이도, 전문가 수준으로', desc: '지원사업 지식이 없어도 됩니다. PSST 프레임워크와 AI 가이드가 처음부터 끝까지 단계별로 안내합니다.' },
    { icon: Award, color: '#F59E0B', title: '쓸수록 더 강해지는 자산', desc: '모든 전략과 초안이 Portfolio에 자동 저장됩니다. 성공한 전략을 다음 공고에 재활용하면서 지원사업 역량이 계속 쌓입니다.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginPress, onStartFree, onNavigateToPricing }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const [activeAgent, setActiveAgent] = useState(0);

    const heroFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(heroFade, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(heroSlide, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]).start();
    }, []);

    const agent = AGENTS[activeAgent];
    const AgentIcon = agent.icon;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            {/* ════════════ HERO ════════════ */}
            <View style={styles.heroSection}>
                {/* Background image */}
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2564&auto=format&fit=crop' }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(253,248,243,1)', 'rgba(253,248,243,0.8)', 'rgba(253,248,243,1)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <Animated.View style={[styles.heroContent, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
                    <View style={styles.heroBadge}>
                        <Sparkles size={14} color="#7C3AED" />
                        <Text style={styles.heroBadgeText}>기업 맞춤형 AI 지원사업 솔루션</Text>
                    </View>
                    <Text style={[styles.heroTitle, { fontSize: isDesktop ? 68 : 42 }]}>
                        탈락의 이유는{'\n'}
                        <Text style={styles.heroAccent}>"내용 부족"</Text>이{'\n'}
                        아닙니다.
                    </Text>
                    <Text style={styles.heroSub}>
                        심사위원이 원하는 전략을 먼저 파악하고, 10분 안에 사업계획서 초안까지 완성합니다.{'\n'}
                        전국 30,000개 공고에서 지금 내 회사에 맞는 기회를 찾아보세요.
                    </Text>
                    <View style={styles.heroActions}>
                        <BorderGlow glowColor="#a855f7" borderRadius={14} glowRadius={28}>
                        <TouchableOpacity onPress={onStartFree} style={styles.heroCta}>
                            <Text style={styles.heroCtaText}>지금 바로 사업계획서 초안 만들기</Text>
                            <ArrowRight size={18} color="#FFF" />
                        </TouchableOpacity>
                        </BorderGlow>
                        <TouchableOpacity onPress={onLoginPress} style={styles.heroSecondary}>
                            <Text style={styles.heroSecondaryText}>로그인</Text>
                        </TouchableOpacity>
                    </View>
                    {/* Stats strip */}
                    <View style={[styles.heroStats, isDesktop && styles.heroStatsRow]}>
                        {[
                            { val: '3만+', label: '수집 공고' },
                            { val: '10분', label: '초안 완성' },
                            { val: '무료', label: '체험 가능' },
                        ].map((s, i) => (
                            <View key={i} style={styles.heroStat}>
                                <Text style={styles.heroStatVal}>{s.val}</Text>
                                <Text style={styles.heroStatLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>
            </View>

            {/* ════════════ PAIN POINTS ════════════ */}
            <View style={styles.section}>
                <View style={styles.inner}>
                    <View style={styles.sectionHeadCenter}>
                        <Text style={styles.sectionTag}>[ WHY PUBLICA ]</Text>
                        <Text style={styles.sectionTitleCenter}>혹시 이런 경험, 있으신가요?</Text>
                        <Text style={styles.sectionSubCenter}>
                            예비창업자와 담당자들이 가장 많이 겪는 세 가지 어려움입니다.{'\n'}
                            Publica는 이 문제들을 해결하기 위해 만들어졌습니다.
                        </Text>
                    </View>
                    <View style={[styles.painGrid, isDesktop && styles.painGridRow]}>
                        {PAIN_POINTS.map((p, i) => {
                            const PainIcon = p.icon;
                            return (
                                <View key={i} style={styles.painCard}>
                                    <View style={[styles.painIconBox, { backgroundColor: p.bg }]}>
                                        <PainIcon size={24} color={p.color} />
                                    </View>
                                    <Text style={[styles.painTitle, { color: p.color }]}>{p.title}</Text>
                                    <Text style={styles.painDesc}>{p.desc}</Text>
                                    <View style={styles.painWho}>
                                        <Users size={12} color="#94A3B8" />
                                        <Text style={styles.painWhoText}>{p.who}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* ════════════ WHY PUBLICA ════════════ */}
            <SoftAurora
                color1="#f7f7f7"
                color2="#e100ff"
                brightness={0.8}
                mouseInfluence={0.1}
                noiseAmplitude={0.5}
                bandHeight={0.73}
                style={{ backgroundColor: '#18181B', width: '100%' }}
            >
                <View style={[styles.section, { backgroundColor: 'transparent' }]}>
                    <View style={styles.inner}>
                        <View style={styles.sectionHeadCenter}>
                            <Text style={[styles.sectionTag, { color: '#A78BFA' }]}>[ 우리의 해결책 ]</Text>
                            <Text style={[styles.sectionTitleCenter, { color: '#FFFFFF' }]}>왜 Publica여야 하는가</Text>
                            <Text style={[styles.sectionSubCenter, { color: '#94A3B8' }]}>
                                단순한 글쓰기 도구가 아닙니다. 전략부터 완성 문서까지,{'\n'}
                                지원사업 성공의 전 과정을 AI가 함께 합니다.
                            </Text>
                        </View>
                        <View style={[styles.whyGrid, isDesktop && styles.whyGridRow]}>
                            {WHY_ITEMS.map((item, i) => {
                                const WhyIcon = item.icon;
                                return (
                                    <View key={i} style={styles.whyCard}>
                                        <View style={[styles.whyIconBox, { backgroundColor: item.color + '20' }]}>
                                            <WhyIcon size={24} color={item.color} />
                                        </View>
                                        <Text style={styles.whyTitle}>{item.title}</Text>
                                        <Text style={styles.whyDesc}>{item.desc}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </SoftAurora>

            {/* ════════════ AGENT SHOWCASE ════════════ */}
            <View style={styles.section}>
                <View style={styles.inner}>
                    <View style={styles.sectionHeadCenter}>
                        <Text style={styles.sectionTag}>[ AI 에이전트 ]</Text>
                        <Text style={styles.sectionTitleCenter}>어떤 에이전트가 있나요?</Text>
                        <Text style={styles.sectionSubCenter}>
                            각 에이전트는 독립적이면서도 서로 연결됩니다.{'\n'}
                            처음부터 끝까지 하나의 흐름으로 작동합니다.
                        </Text>
                    </View>

                    {/* Tab selector */}
                    <View style={styles.agentTabRow}>
                        {AGENTS.map((a, i) => {
                            const Icon = a.icon;
                            const isActive = activeAgent === i;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => setActiveAgent(i)}
                                    style={[styles.agentTab, isActive && { backgroundColor: a.color, borderColor: a.color }]}
                                >
                                    <Icon size={16} color={isActive ? '#FFF' : '#94A3B8'} />
                                    <Text style={[styles.agentTabText, isActive && { color: '#FFF' }]}>{a.tag}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Agent detail */}
                    <View style={[styles.agentDetail, isDesktop && styles.agentDetailRow]}>
                        <View style={styles.agentDetailLeft}>
                            <View style={[styles.agentDetailIcon, { backgroundColor: agent.bg }]}>
                                <AgentIcon size={36} color={agent.color} />
                            </View>
                            <Text style={[styles.agentDetailTag, { color: agent.color }]}>{agent.tag}</Text>
                            <Text style={styles.agentDetailName}>{agent.name}</Text>
                            <Text style={[styles.agentDetailTagline, { color: agent.color }]}>{agent.tagline}</Text>
                            <Text style={styles.agentDetailDesc}>{agent.desc}</Text>
                            <BorderGlow glowColor="#a855f7" borderRadius={12} glowRadius={24}>
                            <TouchableOpacity onPress={onStartFree} style={[styles.agentCta, { backgroundColor: agent.color }]}>
                                <Text style={styles.agentCtaText}>지금 바로 사업계획서 초안 만들기</Text>
                                <ChevronRight size={16} color="#FFF" />
                            </TouchableOpacity>
                            </BorderGlow>
                        </View>
                        <View style={[styles.agentDetailRight, isDesktop && { borderLeftWidth: 1, borderLeftColor: '#F1F5F9', paddingLeft: 40 }]}>
                            <Text style={styles.agentDetailBulletsTitle}>핵심 기능</Text>
                            {agent.bullets.map((b, i) => (
                                <View key={i} style={styles.bulletRow}>
                                    <CheckCircle2 size={16} color={agent.color} />
                                    <Text style={styles.bulletText}>{b}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* ════════════ PROCESS ════════════ */}
            <View style={[styles.section, { backgroundColor: '#FDF8F3' }]}>
                <View style={styles.inner}>
                    <View style={styles.sectionHeadCenter}>
                        <Text style={styles.sectionTag}>[ 사용 방법 ]</Text>
                        <Text style={styles.sectionTitleCenter}>공고 발견부터 제출까지,{'\n'}단 4단계입니다</Text>
                    </View>
                    <View style={[styles.processGrid, isDesktop && styles.processGridRow]}>
                        {PROCESS_STEPS.map((step, i) => {
                            const StepIcon = step.icon;
                            return (
                                <View key={i} style={styles.processCard}>
                                    <View style={styles.processCardTop}>
                                        <Text style={[styles.processNum, { color: step.color + '40' }]}>{step.num}</Text>
                                        <View style={[styles.processIconBox, { backgroundColor: step.color + '15' }]}>
                                            <StepIcon size={22} color={step.color} />
                                        </View>
                                    </View>
                                    <Text style={styles.processTitle}>{step.title}</Text>
                                    <Text style={styles.processDesc}>{step.desc}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* ════════════ STATS ════════════ */}
            <View style={[styles.section, { backgroundColor: '#18181B', paddingVertical: 80 }]}>
                <View style={styles.inner}>
                    <View style={styles.sectionHeadCenter}>
                        <Text style={[styles.sectionTitleCenter, { color: '#FFFFFF', marginBottom: 8 }]}>숫자로 보는 Publica</Text>
                        <Text style={[styles.sectionSubCenter, { color: '#71717A', marginBottom: 48 }]}>직접 측정하고 검증한 수치만 담았습니다</Text>
                    </View>
                    <View style={[styles.statsGrid, isDesktop && styles.statsGridRow]}>
                        {STATS.map((s, i) => {
                            const StatIcon = s.icon;
                            return (
                                <View key={i} style={styles.statCard}>
                                    <StatIcon size={28} color="#A78BFA" style={{ marginBottom: 16 }} />
                                    <Text style={styles.statVal}>{s.value}</Text>
                                    <Text style={styles.statLabel}>{s.label}</Text>
                                    <Text style={styles.statSub}>{s.sub}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* ════════════ PRICING TEASER ════════════ */}
            <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
                <View style={styles.inner}>
                    <View style={styles.pricingCard}>
                        <LinearGradient
                            colors={['#7C3AED', '#5B21B6']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={{ position: 'relative', zIndex: 1, alignItems: 'center' }}>
                            <View style={styles.pricingBadge}>
                                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                <Text style={styles.pricingBadgeText}>Publica PRO</Text>
                            </View>
                            <Text style={styles.pricingTitle}>지금, 가장 빠른 시작을 하세요</Text>
                            <Text style={styles.pricingSub}>
                                무제한 공고 분석 · AI 초안 작성 · 정부 양식 즉시 다운로드{'\n'}
                                지원사업 성공의 전 과정을 AI와 함께 하세요.
                            </Text>
                            <View style={[styles.pricingActions, isDesktop && { flexDirection: 'row' }]}>
                                <TouchableOpacity onPress={onStartFree} style={styles.pricingCta}>
                                    <Text style={styles.pricingCtaText}>지금 바로 사업계획서 초안 만들기</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={onNavigateToPricing} style={styles.pricingLearn}>
                                    <Text style={styles.pricingLearnText}>요금제 자세히 보기</Text>
                                    <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
                                </TouchableOpacity>
                            </View>
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

    /* HERO */
    heroSection: { minHeight: 700, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, paddingHorizontal: 32, position: 'relative', overflow: 'hidden' },
    heroContent: { maxWidth: 900, width: '100%', alignItems: 'center' },
    heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F3FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, marginBottom: 32, borderWidth: 1, borderColor: '#DDD6FE' },
    heroBadgeText: { color: '#7C3AED', fontWeight: '800', fontSize: 13 },
    heroTitle: { color: '#18181B', fontWeight: '900', letterSpacing: -2, textAlign: 'center', lineHeight: 80 },
    heroAccent: { color: '#7C3AED' },
    heroSub: { color: '#475569', fontSize: 18, textAlign: 'center', lineHeight: 32, marginTop: 24, fontWeight: '500', maxWidth: 700 },
    heroActions: { flexDirection: 'row', gap: 16, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center' },
    heroCta: { backgroundColor: '#7C3AED', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 },
    heroCtaText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
    heroSecondary: { paddingHorizontal: 32, paddingVertical: 18, borderRadius: 18, borderWidth: 2, borderColor: '#E2E8F0' },
    heroSecondaryText: { color: '#475569', fontSize: 17, fontWeight: '700' },
    heroStats: { marginTop: 64, gap: 48 },
    heroStatsRow: { flexDirection: 'row' },
    heroStat: { alignItems: 'center' },
    heroStatVal: { color: '#18181B', fontSize: 36, fontWeight: '900', letterSpacing: -1 },
    heroStatLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700', marginTop: 4 },

    /* SECTION */
    section: { paddingVertical: 100, alignItems: 'center' },
    inner: { width: '100%', maxWidth: 1300, paddingHorizontal: 40 },
    sectionTag: { color: '#7C3AED', fontWeight: '800', fontSize: 12, letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
    sectionHeadCenter: { alignItems: 'center', marginBottom: 64 },
    sectionTitleCenter: { color: '#18181B', fontSize: 40, fontWeight: '900', letterSpacing: -1, textAlign: 'center', marginBottom: 20 },
    sectionSubCenter: { color: '#64748B', fontSize: 17, textAlign: 'center', lineHeight: 30, maxWidth: 640 },

    /* PAIN */
    painGrid: { gap: 20 },
    painGridRow: { flexDirection: 'row' },
    painCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 32, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
    painIconBox: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    painTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, lineHeight: 28 },
    painDesc: { color: '#475569', fontSize: 14, lineHeight: 24, marginBottom: 20 },
    painWho: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    painWhoText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

    /* WHY */
    whyGrid: { gap: 16 },
    whyGridRow: { flexDirection: 'row', flexWrap: 'wrap' },
    whyCard: { flex: 1, minWidth: 240, backgroundColor: '#27272A', borderRadius: 24, padding: 28, gap: 12 },
    whyIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    whyTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
    whyDesc: { color: '#94A3B8', fontSize: 14, lineHeight: 22 },

    /* AGENT SHOWCASE */
    agentTabRow: { flexDirection: 'row', gap: 10, marginBottom: 32, flexWrap: 'wrap' },
    agentTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
    agentTabText: { fontWeight: '800', fontSize: 13, color: '#94A3B8' },
    agentDetail: { backgroundColor: '#FAFAFA', borderRadius: 32, padding: 40, gap: 40, borderWidth: 1, borderColor: '#F1F5F9' },
    agentDetailRow: { flexDirection: 'row', alignItems: 'flex-start' },
    agentDetailLeft: { flex: 1 },
    agentDetailRight: { flex: 1 },
    agentDetailIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    agentDetailTag: { fontWeight: '800', fontSize: 12, letterSpacing: 1.5, marginBottom: 8 },
    agentDetailName: { color: '#18181B', fontSize: 28, fontWeight: '900', marginBottom: 12 },
    agentDetailTagline: { fontSize: 17, fontWeight: '700', lineHeight: 28, marginBottom: 16 },
    agentDetailDesc: { color: '#475569', fontSize: 15, lineHeight: 26, marginBottom: 28 },
    agentCta: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
    agentCtaText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
    agentDetailBulletsTitle: { color: '#94A3B8', fontWeight: '800', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    bulletText: { flex: 1, color: '#18181B', fontSize: 15, fontWeight: '600', lineHeight: 24 },

    /* PROCESS */
    processGrid: { gap: 16 },
    processGridRow: { flexDirection: 'row' },
    processCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, overflow: 'hidden' },
    processCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    processNum: { fontSize: 56, fontWeight: '900', lineHeight: 56 },
    processIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    processTitle: { color: '#18181B', fontSize: 18, fontWeight: '800', marginBottom: 8 },
    processDesc: { color: '#64748B', fontSize: 13, lineHeight: 22 },

    /* STATS */
    statsGrid: { gap: 16 },
    statsGridRow: { flexDirection: 'row' },
    statCard: { flex: 1, alignItems: 'center', padding: 32, backgroundColor: '#27272A', borderRadius: 24, borderWidth: 1, borderColor: '#3F3F46' },
    statVal: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', letterSpacing: -1 },
    statLabel: { color: '#E4E4E7', fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 4 },
    statSub: { color: '#71717A', fontSize: 12 },

    /* PRICING TEASER */
    pricingCard: { borderRadius: 40, overflow: 'hidden', alignItems: 'center', minHeight: 360, justifyContent: 'center', padding: 64 } as any,
    pricingBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    pricingBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
    pricingTitle: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: -1, textAlign: 'center', marginBottom: 16 },
    pricingSub: { color: '#C4B5FD', fontSize: 16, textAlign: 'center', lineHeight: 28, marginBottom: 40 },
    pricingActions: { gap: 16, alignItems: 'center' },
    pricingCta: { backgroundColor: '#FFFFFF', paddingHorizontal: 36, paddingVertical: 18, borderRadius: 18 },
    pricingCtaText: { color: '#7C3AED', fontSize: 17, fontWeight: '900' },
    pricingLearn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pricingLearnText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
});
