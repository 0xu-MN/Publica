import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, useWindowDimensions,
    Animated, StyleSheet, Image, Platform,
} from 'react-native';
import {
    ArrowRight, Sparkles, CheckCircle, ChevronRight, Users,
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

/* ─── PAIN POINTS ─── */
const PAIN_POINTS = [
    {
        color: '#EF4444',
        bg: '#FEF2F2',
        emoji: '🔍',
        title: '"공고가 너무 많아서\n어디서 시작해야 할지 모르겠어요."',
        desc: '매년 3만 개 이상의 지원사업 공고가 올라옵니다. 내 회사에 맞는 공고를 찾는 데만 수십 시간이 소요되고, 그 중에서 진짜 우리가 받을 수 있는 공고는 어디일까요?',
        who: '초기 스타트업, 예비창업자',
    },
    {
        color: '#F59E0B',
        bg: '#FFFBEB',
        emoji: '📄',
        title: '"사업계획서를 어떻게 써야\n합격하는지 감이 안 잡혀요."',
        desc: '지원사업 전문 컨설턴트에게 의뢰하면 건당 수백만 원. 내부에서 작성하면 수십 시간의 작업 끝에 탈락. 심사위원이 진짜 원하는 게 무엇인지 알아야 합니다.',
        who: '중소기업, 연구소 기업',
    },
    {
        color: '#7C3AED',
        bg: '#F5F3FF',
        emoji: '⏰',
        title: '"공고 마감이 2주 남았는데\n시간이 너무 부족합니다."',
        desc: '사업계획서 하나 완성하는 데 평균 2~3주. 대표가 직접 작성하면 본업을 못 합니다. 담당자가 작성하면 전문성이 떨어집니다. 시간과 퀄리티, 둘 다 잡아야 합니다.',
        who: '중견기업 담당자, 연구자',
    },
];

/* ─── SOLUTION SLIDES ─── */
const SOLUTION_SLIDES = [
    {
        tab: '공고 탐색',
        title: '공고 탐색',
        subtitle: 'AI가 나의 사업 규모, 분야, 지역에 맞는 공고를 매칭 스코어로 자동 추천합니다.',
    },
    {
        tab: '전략 수립',
        title: '전략 수립',
        subtitle: '심사위원이 실제로 점수를 주는 평가 기준을 역분석해 맞춤 전략 트리를 만듭니다.',
    },
    {
        tab: '초안 작성',
        title: '초안 작성',
        subtitle: '전략 결과를 이어받아 PSST 논리 구조의 사업계획서 초안을 자동으로 작성합니다.',
    },
    {
        tab: '양식 매핑 & 다운로드',
        title: '양식 매핑 & 다운로드',
        subtitle: '완성된 초안은 정부 양식(HWPX·DOCX)에 자동 매핑되어 즉시 다운로드 가능합니다.',
    },
];

/* ─── AGENTS ─── */
const AGENTS = [
    {
        tag: 'AI 전략 수립',
        name: 'AI 전략 수립 에이전트',
        color: '#7C3AED',
        tagline: '탈락의 이유는 "내용 부족"이 아닙니다.\n"전략의 부재"입니다.',
        desc: 'Nexus Flow는 공고의 평가 지표를 역방향으로 분석합니다. 심사위원이 실제로 점수를 주는 기준을 먼저 파악하고, 거기에 맞는 전략 트리를 자동으로 구성해줍니다.',
        bullets: ['공고 URL/PDF 하나로 평가 기준 자동 추출', 'PSST 프레임워크 기반 전략 트리 생성', '항목별 핵심 작성 포인트 안내', '경쟁 공고와 차별화 전략 제안'],
    },
    {
        tag: 'AI 초안 작성',
        name: 'AI 초안 작성 에이전트',
        color: '#0EA5E9',
        tagline: '전략이 완성되면, 글쓰기는\nAI가 대신합니다.',
        desc: 'Nexus Flow의 전략 결과를 그대로 이어받아 사업계획서 각 문항의 초안을 자동으로 작성합니다. PSST 구조로 논리적 흐름을 잡고 전문 컨설턴트 수준의 문체로 완성됩니다.',
        bullets: ['Nexus Flow 전략 결과 자동 연동', '문항별 PSST 논리 구조 초안 자동 생성', '실시간 품질 검수 및 재작성 지원', 'HWPX · DOCX 정부 양식 자동 매핑 후 다운로드'],
    },
    {
        tag: '공고 탐색',
        name: '공고 탐색 & 맞춤 추천',
        color: '#10B981',
        tagline: '3만 개의 공고 중\n당신의 회사에 맞는 공고만 보여드립니다.',
        desc: '전국 30,000개 이상 기관의 지원사업 공고를 실시간 수집하고, 기업 프로필과 AI 매칭 스코어로 최적의 공고를 추천합니다. D-Day 알림부터 신청 자격 사전 진단까지.',
        bullets: ['30,000개 이상 기관 공고 실시간 수집', 'AI 매칭 스코어로 적합도 자동 분석', '분야·규모·지역·마감일 필터 검색', '바로 에이전트 분석으로 원클릭 연결'],
    },
];

/* ─── WHY PUBLICA ─── */
const WHY_ITEMS = [
    { emoji: '🎯', title: '탈락 요인을 전략 단계에서 제거합니다', desc: '심사위원이 실제로 점수를 주는 기준을 먼저 분석합니다. 제출 후 "이게 맞나?" 불안이 없어집니다.' },
    { emoji: '⚡', title: '마감 3일 전에 시작해도 완성본이 나옵니다', desc: '기존에는 퀄리티와 시간 중 하나를 포기해야 했습니다. PUBLICA는 AI 전략 엔진으로 두 가지를 동시에 해결합니다.' },
    { emoji: '📚', title: '전문가 없이도, 전문가 수준으로', desc: '지원사업 지식이 없어도 됩니다. PSST 프레임워크와 AI 가이드가 처음부터 끝까지 단계별로 안내합니다.' },
];

/* ─────────────────────────────────── SOLUTION SLIDE PREVIEW ─────────────────────── */

function GrantSearchPreview() {
    const items = [
        { name: '2026 소상공인 스마트화 지원 사업', tag: '중소벤처기업부', score: 94, dday: 'D-7', match: '#10B981' },
        { name: '청년창업사관학교 14기 입교생 모집', tag: '창업진흥원', score: 88, dday: 'D-12', match: '#7C3AED' },
        { name: 'R&D 기술사업화 연계 지원 프로그램', tag: '한국산업기술진흥원', score: 76, dday: 'D-19', match: '#0EA5E9' },
    ];
    return (
        <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>AI 맞춤 공고 추천</Text>
                <Text style={{ color: '#52525B', fontSize: 11 }}>총 3,842개 공고 중</Text>
            </View>
            {items.map((item, i) => (
                <View key={i} style={{ backgroundColor: '#1C1C22', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2D2D38' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>{item.name}</Text>
                        <Text style={{ color: '#71717A', fontSize: 11 }}>{item.tag}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={{ backgroundColor: item.match + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                            <Text style={{ color: item.match, fontSize: 12, fontWeight: '800' }}>매칭 {item.score}%</Text>
                        </View>
                        <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700' }}>{item.dday}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

function StrategyPreview() {
    const criteria = [
        { name: '기술성', score: 30, val: 82 },
        { name: '사업성', score: 25, val: 76 },
        { name: '팀 구성', score: 20, val: 90 },
        { name: '성장 가능성', score: 25, val: 68 },
    ];
    return (
        <View style={{ gap: 12 }}>
            <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>평가기준 역분석 결과</Text>
            {criteria.map((c, i) => (
                <View key={i} style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#D4D4D8', fontSize: 12, fontWeight: '600' }}>{c.name} <Text style={{ color: '#71717A', fontWeight: '400' }}>({c.score}점)</Text></Text>
                        <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '800' }}>{c.val}점</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: '#27272A', borderRadius: 99, overflow: 'hidden' }}>
                        <View style={{ width: `${c.val}%` as any, height: '100%', backgroundColor: '#7C3AED', borderRadius: 99 }} />
                    </View>
                </View>
            ))}
        </View>
    );
}

function DraftPreview() {
    return (
        <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <View style={{ backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>PUBLICA NEXUS EDIT</Text>
                </View>
                <Text style={{ color: '#71717A', fontSize: 11 }}>— 초안 작성 에이전트</Text>
            </View>
            {['사업 개요 및 필요성', '기술 현황 및 차별성', '사업화 전략', '기대 효과'].map((sec, i) => (
                <View key={i} style={{ backgroundColor: '#1C1C22', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: i === 1 ? '#7C3AED' : '#2D2D38' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: i === 1 ? '#A78BFA' : '#D4D4D8', fontSize: 12, fontWeight: '700' }}>{sec}</Text>
                        <View style={{ backgroundColor: i === 1 ? '#7C3AED20' : '#27272A', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                            <Text style={{ color: i === 1 ? '#A78BFA' : '#52525B', fontSize: 10, fontWeight: '700' }}>{i === 1 ? '작성 중' : '완료'}</Text>
                        </View>
                    </View>
                    {i === 1 && (
                        <Text style={{ color: '#71717A', fontSize: 11, marginTop: 6, lineHeight: 17 }} numberOfLines={2}>
                            본 기술은 기존 시장 대비 처리 속도 3배 향상, 비용 40% 절감이 가능한...
                        </Text>
                    )}
                </View>
            ))}
        </View>
    );
}

function ExportPreview() {
    const formats = [
        { ext: 'HWPX', label: '한글 정부 양식', color: '#3CA5E9' },
        { ext: 'DOCX', label: 'MS Word 양식', color: '#7C3AED' },
    ];
    return (
        <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <View style={{ backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>PUBLICA NEXUS EDIT</Text>
                </View>
                <Text style={{ color: '#71717A', fontSize: 11 }}>— 양식 매핑 & 다운로드</Text>
            </View>
            <Text style={{ color: '#D4D4D8', fontSize: 13, fontWeight: '600' }}>완성된 초안은 즉시 다운로드 가능합니다.</Text>
            {formats.map((f, i) => (
                <View key={i} style={{ backgroundColor: '#1C1C22', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2D2D38' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: f.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: f.color, fontSize: 11, fontWeight: '900' }}>{f.ext}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{f.label}</Text>
                        <Text style={{ color: '#71717A', fontSize: 11, marginTop: 2 }}>표 구조 · 폰트 · 서식 100% 유지</Text>
                    </View>
                    <CheckCircle size={16} color="#38B780" />
                </View>
            ))}
        </View>
    );
}

const SLIDE_PREVIEWS = [GrantSearchPreview, StrategyPreview, DraftPreview, ExportPreview];

/* ────────────────────────────── AGENT PREVIEW ────────────────────────────────── */

function AgentMockupLeft({ index }: { index: number }) {
    if (index === 0) return (
        <View style={{ flex: 1, backgroundColor: '#0F0F15', borderRadius: 16, padding: 20, gap: 10 }}>
            <View style={{ backgroundColor: '#1C1C22', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#7C3AED40' }}>
                <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>전략 트리 — PSST 구조</Text>
                {['Problem (문제 정의)', 'Solution (해결 방법)', 'Scale (규모 및 효과)', 'Traction (실행 계획)'].map((t, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#7C3AED' }} />
                        <Text style={{ color: '#D4D4D8', fontSize: 11 }}>{t}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
    if (index === 1) return (
        <View style={{ flex: 1, backgroundColor: '#0F0F15', borderRadius: 16, padding: 20 }}>
            <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '700', marginBottom: 12 }}>PUBLICA NEXUS EDIT</Text>
            {['사업 개요', '기술 현황', '사업화 전략', '기대 효과'].map((sec, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#1C1C22' }}>
                    <CheckCircle size={13} color={i < 2 ? '#10B981' : '#3F3F46'} />
                    <Text style={{ color: i < 2 ? '#FFFFFF' : '#52525B', fontSize: 12 }}>{sec}</Text>
                </View>
            ))}
        </View>
    );
    return (
        <View style={{ flex: 1, backgroundColor: '#0F0F15', borderRadius: 16, padding: 20 }}>
            <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '700', marginBottom: 12 }}>공고 매칭 스코어</Text>
            {[{ n: '청년창업사관학교', v: 92 }, { n: '소상공인 지원', v: 78 }, { n: 'R&D 연계', v: 65 }].map((s, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: '#D4D4D8', fontSize: 11 }}>{s.n}</Text>
                        <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800' }}>{s.v}%</Text>
                    </View>
                    <View style={{ height: 5, backgroundColor: '#27272A', borderRadius: 99 }}>
                        <View style={{ width: `${s.v}%` as any, height: '100%', backgroundColor: '#10B981', borderRadius: 99 }} />
                    </View>
                </View>
            ))}
        </View>
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginPress, onStartFree, onNavigateToPricing }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const isWide = width >= 1420;

    /* inner content width: 1420px max, centered */
    const contentPad = isWide ? Math.max(0, (width - 1420) / 2) : 40;

    /* hero animation */
    const heroFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(30)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(heroFade, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(heroSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, []);

    /* solution slider */
    const [solutionSlide, setSolutionSlide] = useState(0);
    const solutionAnim = useRef(new Animated.Value(0)).current;
    const changeSolutionSlide = useCallback((idx: number) => {
        setSolutionSlide(idx);
        Animated.timing(solutionAnim, { toValue: idx, duration: 400, useNativeDriver: true }).start();
    }, [solutionAnim]);

    /* agent auto-play */
    const [activeAgent, setActiveAgent] = useState(0);
    const agentTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const agentAnim = useRef(new Animated.Value(0)).current;

    const changeAgent = useCallback((idx: number) => {
        setActiveAgent(idx);
        Animated.timing(agentAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start(() => {
            Animated.timing(agentAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        });
    }, [agentAnim]);

    useEffect(() => {
        agentTimer.current = setInterval(() => {
            setActiveAgent(prev => {
                const next = (prev + 1) % AGENTS.length;
                Animated.timing(agentAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start(() => {
                    Animated.timing(agentAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
                });
                return next;
            });
        }, 4000);
        return () => { if (agentTimer.current) clearInterval(agentTimer.current); };
    }, [agentAnim]);

    const agent = AGENTS[activeAgent];
    const SlidePreview = SLIDE_PREVIEWS[solutionSlide];

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} showsVerticalScrollIndicator={false}>

            {/* ══════════ HERO ══════════ */}
            <View style={[styles.heroOuter, { paddingHorizontal: contentPad }]}>
                <Animated.View style={[styles.heroCard, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
                    {/* background photo */}
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2564&auto=format&fit=crop' }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                    {/* light wash so left text is readable (background-alt #f2ecfe) */}
                    <LinearGradient
                        colors={['rgba(242,236,254,0.97)', 'rgba(242,236,254,0.72)', 'rgba(242,236,254,0.12)']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                    />

                    <View style={[styles.heroRow, !isDesktop && { flexDirection: 'column' }]}>
                        {/* LEFT: copy */}
                        <View style={[styles.heroLeft, isDesktop ? { flex: 1 } : { width: '100%' }]}>
                            <View style={styles.heroBadge}>
                                <Sparkles size={12} color="#7C3AED" />
                                <Text style={styles.heroBadgeText}>맞춤형 지원사업 AI 솔루션</Text>
                            </View>

                            <Text style={[styles.heroTitle, { fontSize: isDesktop ? 48 : 32 }]}>
                                공고는 찾았는데,{'\n'}아직 한 줄도 <Text style={{ color: '#7C3AED' }}>못 썼나요?</Text>
                            </Text>

                            <Text style={styles.heroSub}>
                                AI가 대신 씁니다. 당신은 아이디어만 확인 하세요 !
                            </Text>

                            <View style={styles.heroStats}>
                                {[
                                    { val: '3만+', label: '수집 공고' },
                                    { val: '10분', label: '초안 완성' },
                                    { val: '무료', label: '체험 가능' },
                                ].map((s, i) => (
                                    <View key={i} style={[styles.heroStat, i > 0 && { borderLeftWidth: 1, borderLeftColor: '#CBD5E1', paddingLeft: 24 }]}>
                                        <Text style={styles.heroStatVal}>{s.val}</Text>
                                        <Text style={styles.heroStatLabel}>{s.label}</Text>
                                    </View>
                                ))}
                            </View>

                            <BorderGlow glowColor="#a855f7" borderRadius={12} glowRadius={24}>
                                <TouchableOpacity onPress={onStartFree} style={styles.heroCta}>
                                    <Text style={styles.heroCtaText}>지금 바로 작성하기</Text>
                                    <ArrowRight size={16} color="#FFF" />
                                </TouchableOpacity>
                            </BorderGlow>
                        </View>

                        {/* RIGHT: report mockup (laptop screen) */}
                        {isDesktop && (
                            <View style={styles.heroRight}>
                                <View style={styles.reportCard}>
                                    <View style={styles.reportHeader}>
                                        <Text style={styles.reportTitle}>AI가 분석하고 정리한{'\n'}국가지원사업 보고서</Text>
                                        <View style={styles.reportPlus}>
                                            <Sparkles size={16} color="#FFF" />
                                        </View>
                                    </View>
                                    {['핵심 요건 요약', '지원 요건 분석', '사업계획서 자동 매핑', '보고서 구조화'].map((t, i) => (
                                        <View key={i} style={styles.reportRow}>
                                            <CheckCircle size={14} color="#7C3AED" />
                                            <Text style={styles.reportRowText}>{t}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.reportBtn}>
                                        <Text style={styles.reportBtnText}>지금 바로 시작하기</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </View>

            {/* ══════════ WHY PUBLICA — pain points ══════════ */}
            <View style={[styles.section, { paddingHorizontal: contentPad }]}>
                <View style={styles.sectionHeadCenter}>
                    <View style={styles.tagPill}>
                        <Text style={styles.tagPillText}>WHY PUBLICA?</Text>
                    </View>
                    <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>혹시 이런 경험, 있으신가요?</Text>
                    <Text style={[styles.sectionSub, { textAlign: 'center', maxWidth: 560 }]}>
                        예비 창업자와 담당자들이 가장 많이 겪는 세 가지 어려움입니다.{'\n'}
                        PUBLICA는 이 문제들을 해결하기 위해 만들어졌습니다.
                    </Text>
                </View>

                <View style={[styles.row, !isDesktop && { flexDirection: 'column' }]}>
                    {PAIN_POINTS.map((p, i) => (
                        <View key={i} style={[styles.painCard, { flex: isDesktop ? 1 : undefined }]}>
                            <View style={[styles.painIconBox, { backgroundColor: p.bg }]}>
                                <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                            </View>
                            <Text style={[styles.painTitle, { color: p.color }]}>{p.title}</Text>
                            <Text style={styles.painDesc}>{p.desc}</Text>
                            <View style={styles.painWho}>
                                <Users size={11} color="#94A3B8" />
                                <Text style={styles.painWhoText}>{p.who}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* ══════════ SOLUTION ══════════ */}
            <View style={styles.solutionSection}>
                {/* header */}
                <View style={[styles.sectionHeadCenter, { paddingHorizontal: contentPad }]}>
                    <View style={[styles.tagPill, { backgroundColor: 'rgba(167,139,250,0.15)', borderColor: 'rgba(167,139,250,0.3)' }]}>
                        <Text style={[styles.tagPillText, { color: '#A78BFA' }]}>SOLUTION</Text>
                    </View>
                    <Text style={[styles.sectionTitle, { color: '#FFFFFF', textAlign: 'center' }]}>이렇게 해결하고자 합니다.</Text>
                    <Text style={[styles.sectionSub, { color: '#94A3B8', textAlign: 'center', maxWidth: 560 }]}>
                        단순한 글쓰기 도구가 아닙니다. 공고 탐색부터 초안 완성까지,{'\n'}
                        지원사업 성공의 전 과정을 PUBLICA가 함께 합니다.
                    </Text>
                </View>

                {/* slide preview area */}
                <View style={[styles.solutionPreviewArea, { marginHorizontal: contentPad }]}>
                    <SlidePreview />
                </View>

                {/* tab nav */}
                <View style={[styles.solutionTabs, { paddingHorizontal: contentPad }]}>
                    {SOLUTION_SLIDES.map((s, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => changeSolutionSlide(i)}
                            style={[styles.solutionTab, i === solutionSlide && styles.solutionTabActive]}
                        >
                            <Text style={[styles.solutionTabText, i === solutionSlide && styles.solutionTabTextActive]}>
                                {s.tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* slide subtitle */}
                <Text style={[styles.solutionSlideDesc, { paddingHorizontal: contentPad }]}>
                    {SOLUTION_SLIDES[solutionSlide].subtitle}
                </Text>
            </View>

            {/* ══════════ KEY AGENT ══════════ */}
            <View style={[styles.section, { paddingHorizontal: contentPad }]}>
                <View style={styles.sectionHeadCenter}>
                    <View style={styles.tagPill}>
                        <Text style={styles.tagPillText}>Key Agent</Text>
                    </View>
                    <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>어떤 에이전트가 있나요?</Text>
                    <Text style={[styles.sectionSub, { textAlign: 'center' }]}>
                        각 에이전트는 독립적이면서도 서로 연결됩니다.{'\n'}
                        처음부터 끝까지 하나의 흐름으로 작동합니다
                    </Text>
                </View>

                <View style={[styles.agentContainer, isDesktop ? { flexDirection: 'row' } : {}]}>
                    {/* left mockup */}
                    <View style={[styles.agentLeft, isDesktop ? { width: '45%' } : { width: '100%', height: 220, marginBottom: 24 }]}>
                        <AgentMockupLeft index={activeAgent} />
                    </View>

                    {/* right content */}
                    <Animated.View style={[styles.agentRight, isDesktop ? { flex: 1 } : {}, { opacity: agentAnim }]}>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                            {AGENTS.map((a, i) => (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => {
                                        if (agentTimer.current) clearInterval(agentTimer.current);
                                        changeAgent(i);
                                        agentTimer.current = setInterval(() => {
                                            setActiveAgent(prev => {
                                                const next = (prev + 1) % AGENTS.length;
                                                changeAgent(next);
                                                return next;
                                            });
                                        }, 4000);
                                    }}
                                    style={[
                                        styles.agentDot,
                                        i === activeAgent && { backgroundColor: agent.color, borderColor: agent.color }
                                    ]}
                                >
                                    <Text style={[styles.agentDotText, i === activeAgent && { color: '#FFF' }]}>{a.tag}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.agentTag, { color: agent.color }]}>{agent.tag}</Text>
                        <Text style={styles.agentName}>{agent.name}</Text>
                        <Text style={[styles.agentTagline, { color: agent.color }]}>{agent.tagline}</Text>
                        <Text style={styles.agentDesc}>{agent.desc}</Text>

                        <View style={{ gap: 10, marginTop: 20 }}>
                            {agent.bullets.map((b, i) => (
                                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                                    <CheckCircle size={15} color={agent.color} style={{ marginTop: 2 }} />
                                    <Text style={{ color: '#334155', fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 22 }}>{b}</Text>
                                </View>
                            ))}
                        </View>

                        <BorderGlow glowColor="#a855f7" borderRadius={10} glowRadius={20}>
                            <TouchableOpacity onPress={onStartFree} style={[styles.agentCta, { backgroundColor: agent.color }]}>
                                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>시작하기</Text>
                                <ChevronRight size={15} color="#FFF" />
                            </TouchableOpacity>
                        </BorderGlow>
                    </Animated.View>
                </View>
            </View>

            {/* ══════════ WHY PUBLICA — dark aurora ══════════ */}
            <SoftAurora
                color1="#f7f7f7"
                color2="#e100ff"
                brightness={0.8}
                mouseInfluence={0.1}
                noiseAmplitude={0.5}
                bandHeight={0.73}
                style={{ backgroundColor: '#18181B', width: '100%' }}
            >
                <View style={[styles.section, { backgroundColor: 'transparent', paddingHorizontal: contentPad }]}>
                    <View style={styles.sectionHeadCenter}>
                        <View style={[styles.tagPill, { backgroundColor: 'rgba(167,139,250,0.15)', borderColor: 'rgba(167,139,250,0.3)' }]}>
                            <Text style={[styles.tagPillText, { color: '#A78BFA' }]}>Why PUBLICA</Text>
                        </View>
                        <Text style={[styles.sectionTitle, { color: '#FFFFFF', textAlign: 'center' }]}>왜 PUBLICA여야 하는가</Text>
                        <Text style={[styles.sectionSub, { color: '#94A3B8', textAlign: 'center' }]}>
                            경쟁 속에서 이기기 위해 필요한 것들,{'\n'}시간과 비용이 부족하다고 느낀다면
                        </Text>
                    </View>

                    <View style={[styles.row, !isDesktop && { flexDirection: 'column' }]}>
                        {WHY_ITEMS.map((item, i) => (
                            <View key={i} style={[styles.whyCard, { flex: isDesktop ? 1 : undefined }]}>
                                <Text style={{ fontSize: 28, marginBottom: 16 }}>{item.emoji}</Text>
                                <Text style={styles.whyTitle}>{item.title}</Text>
                                <Text style={styles.whyDesc}>{item.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </SoftAurora>

            {/* ══════════ FINAL CTA ══════════ */}
            <View style={[styles.ctaSection, { paddingHorizontal: contentPad }]}>
                <View style={isDesktop ? { flexDirection: 'row', alignItems: 'center', gap: 60 } : {}}>
                    {/* left text */}
                    <View style={{ flex: isDesktop ? 1 : undefined, marginBottom: isDesktop ? 0 : 40 }}>
                        <Text style={styles.ctaTitle}>더 이상 밤새우지{'\n'}않아도 됩니다.</Text>
                        <Text style={styles.ctaSub}>
                            PUBLICA와 함께라면 공고 탐색부터 최적의 문서 완성까지,{'\n'}
                            좋은 사업이 더 넓은 세상으로 나아갑니다.
                        </Text>
                        <BorderGlow glowColor="#a855f7" borderRadius={12} glowRadius={24}>
                            <TouchableOpacity onPress={onStartFree} style={styles.ctaBtn}>
                                <Text style={styles.ctaBtnText}>지금 바로 지원하러 가기</Text>
                                <ArrowRight size={16} color="#FFF" />
                            </TouchableOpacity>
                        </BorderGlow>
                        <Text style={styles.ctaNote}>무료로 시작하세요 · 카드 등록 불필요</Text>
                    </View>

                    {/* right mockup */}
                    {isDesktop && (
                        <View style={styles.ctaMockup}>
                            <LinearGradient
                                colors={['#7C3AED', '#5B21B6']}
                                style={{ borderRadius: 20, padding: 24, gap: 12 }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />
                                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>PUBLICA AI</Text>
                                </View>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14 }}>
                                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>초안 작성 완료</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 17 }}>
                                        사업 개요, 기술 현황, 사업화 전략, 기대효과{'\n'}모든 섹션이 완성되었습니다.
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 10, alignItems: 'center' }}>
                                        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>94%</Text>
                                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>매칭 스코어</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 10, alignItems: 'center' }}>
                                        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>8분</Text>
                                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>소요 시간</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 12, alignItems: 'center' }}>
                                    <Text style={{ color: '#7C3AED', fontWeight: '800', fontSize: 13 }}>AI 분석하고 정리한 국가지원사업 보고서</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    )}
                </View>
            </View>

            <Footer />
        </ScrollView>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
    /* HERO */
    heroOuter: {
        paddingTop: 96,
        paddingBottom: 60,
    },
    heroCard: {
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        minHeight: 460,
        justifyContent: 'center',
        backgroundColor: '#F2ECFE',
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 48,
        gap: 32,
    },
    heroLeft: { gap: 22, zIndex: 2 },
    heroRight: { width: 380, alignItems: 'flex-end', zIndex: 2 },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 99,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    heroBadgeText: { color: '#7C3AED', fontWeight: '700', fontSize: 12 },
    heroTitle: {
        color: '#0F172A',
        fontWeight: '900',
        letterSpacing: -1.5,
        lineHeight: Platform.OS === 'web' ? 1.25 as any : undefined,
    },
    heroSub: { color: '#475569', fontSize: 16, lineHeight: 26, fontWeight: '500' },
    heroStats: { flexDirection: 'row', gap: 24, alignItems: 'center' },
    heroStat: { alignItems: 'flex-start' },
    heroStatVal: { color: '#0F172A', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    heroStatLabel: { color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 2 },
    heroCta: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
    },
    heroCtaText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

    /* HERO report mockup */
    reportCard: {
        width: 320,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 22,
        gap: 12,
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.18,
        shadowRadius: 30,
        elevation: 10,
    },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    reportTitle: { color: '#0F172A', fontSize: 15, fontWeight: '900', lineHeight: 21, flex: 1 },
    reportPlus: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
    reportRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    reportRowText: { color: '#334155', fontSize: 13, fontWeight: '600' },
    reportBtn: { backgroundColor: '#7C3AED', borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 6 },
    reportBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

    /* SECTION */
    section: { paddingVertical: 100 },
    row: { flexDirection: 'row', gap: 20 },
    sectionHeadCenter: { alignItems: 'center', marginBottom: 60, gap: 16 },
    tagPill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 99,
        backgroundColor: '#F5F3FF',
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    tagPillText: { color: '#7C3AED', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    sectionTitle: { color: '#0F172A', fontSize: 38, fontWeight: '900', letterSpacing: -0.95, lineHeight: 53 },
    sectionSub: { color: '#505050', fontSize: 16, lineHeight: 24, letterSpacing: -0.4 },

    /* PAIN POINTS */
    painCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 28,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
        gap: 14,
    },
    painIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    painTitle: { fontSize: 16, fontWeight: '800', lineHeight: 24 },
    painDesc: { color: '#475569', fontSize: 13, lineHeight: 22 },
    painWho: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    painWhoText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },

    /* SOLUTION */
    solutionSection: {
        backgroundColor: '#000000',
        paddingVertical: 100,
        gap: 40,
    },
    solutionPreviewArea: {
        backgroundColor: '#141418',
        borderRadius: 20,
        padding: 28,
        borderWidth: 1,
        borderColor: '#27272A',
        minHeight: 240,
    },
    solutionTabs: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    solutionTab: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#3F3F46',
        backgroundColor: '#141418',
    },
    solutionTabActive: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    solutionTabText: { color: '#71717A', fontSize: 13, fontWeight: '700' },
    solutionTabTextActive: { color: '#FFFFFF' },
    solutionSlideDesc: {
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 24,
        textAlign: 'center',
    },

    /* AGENT */
    agentContainer: { gap: 40, alignItems: 'flex-start' },
    agentLeft: { backgroundColor: '#0F0F15', borderRadius: 20, padding: 0, overflow: 'hidden', minHeight: 300 },
    agentRight: { gap: 12 },
    agentDot: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 99,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFF',
    },
    agentDotText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
    agentTag: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    agentName: { color: '#0F172A', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    agentTagline: { fontSize: 15, fontWeight: '700', lineHeight: 24 },
    agentDesc: { color: '#475569', fontSize: 14, lineHeight: 24 },
    agentCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },

    /* WHY PUBLICA dark */
    whyCard: {
        backgroundColor: '#27272A',
        borderRadius: 20,
        padding: 28,
        gap: 10,
    },
    whyTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    whyDesc: { color: '#94A3B8', fontSize: 13, lineHeight: 22 },

    /* CTA */
    ctaSection: { paddingVertical: 100 },
    ctaTitle: { color: '#0F172A', fontSize: 44, fontWeight: '900', letterSpacing: -1.5, lineHeight: 56, marginBottom: 20 },
    ctaSub: { color: '#475569', fontSize: 16, lineHeight: 28, marginBottom: 32 },
    ctaBtn: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
    },
    ctaBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    ctaNote: { color: '#94A3B8', fontSize: 12, marginTop: 16 },
    ctaMockup: { width: 320 },
});
