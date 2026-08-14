import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, useWindowDimensions,
    Animated, StyleSheet, Image, Platform,
} from 'react-native';
import {
    ArrowRight, ArrowUpRight, Sparkles, CheckCircle, ChevronRight, Users, Bookmark,
    Home, User, Minus, NotebookPen, FileEdit, Zap, MessageSquareText, Scroll,
    Share2, FileText, Folder, LayoutGrid, Building2, Rocket
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
        who: '중소기업, 연구소기업, 예비창업자',
    },
    {
        color: '#7C3AED',
        bg: '#F5F3FF',
        emoji: '⏰',
        title: '"공고 마감이 2주 남았는데\n시간이 너무 부족합니다."',
        desc: '사업계획서 하나 완성하는 데 평균 2~3주. 대표가 직접 작성하면 본업을 못 합니다. 담당자가 작성하면 전문성이 떨어집니다. 시간과 퀄리티, 둘 다 잡아야 합니다.',
        who: '초기 스타트업, 예비창업자, 퇴근한 직장인',
    },
];

/* ─── SOLUTION SLIDES ─── */
const SOLUTION_SLIDES = [
    {
        tab: '공고 탐색',
        title: '공고 탐색',
        subtitle: 'AI가 나의 사업 규모, 분야,지역에 맞는 공고를 매칭 스코어로 자동 추천합니다',
    },
    {
        tab: '전략 수집',
        title: '전략 수집',
        subtitle: '심사위원이 실제로 점수를 주는 평가 기준을 역분석해 맞춤 전략 트리를 만듭니다',
    },
    {
        tab: '초안 작성',
        title: '초안 작성',
        subtitle: '전략 결과를 이어받아 PSST 논리 구조의 사업계획서 초안을 자동으로 작성합니다',
    },
    {
        tab: '양식매핑 & 다운로드',
        title: '양식매핑 & 다운로드',
        subtitle: '완성된 초안은 정부 양식(HWPX·DOCX)에 자동 매핑되어 즉시 다운로드 가능합니다',
    },
];

/* ─── AGENTS ─── */
const AGENTS = [
    {
        tag: '전략 수립',
        name: 'AI 전략 수립 에이전트',
        color: '#7C3AED',
        tagline: '탈락의 이유는 "내용 부족"이 아닙니다.\n"전략의 부재"입니다.',
        desc: 'Nexus Flow는 공고의 평가 지표를 역방향으로 분석합니다.\n심사위원이 실제로 점수를 주는 기준을 먼저 파악하고, 거기에 맞는 전략 트리를 자동으로 구성합니다. "무엇을 써야 하는지"부터 명확해집니다.',
        bullets: ['공고 URL/PDF 하나로 평가 기준 자동 추출', 'PSST 프레임워크 기반 전략 트리 생성', '항목별 핵심 작성 포인트 안내', '경쟁 공고와 차별화 전략 제안'],
    },
    {
        tag: '초안 작성',
        name: 'AI 초안 작성 에이전트',
        color: '#0EA5E9',
        tagline: '전략이 완성되면, 글쓰기는\nAI가 대신합니다.',
        desc: 'Nexus Flow의 전략 결과를 그대로 이어받아 사업계획서 각 문항의 초안을 자동으로 작성합니다.\nPSST 구조로 논리적 흐름을 잡고 전문 컨설턴트 수준의 문체로 완성됩니다.',
        bullets: ['Nexus Flow 전략 결과 자동 연동', '문항별 PSST 논리 구조 초안 자동 생성', '실시간 품질 검수 및 재작성 지원', 'HWPX · DOCX 정부 양식 자동 매핑 후 다운로드'],
    },
    {
        tag: '공고 탐색',
        name: '공고 탐색 & 맞춤 추천 에이전트',
        color: '#10B981',
        tagline: '3만 개의 공고 중\n당신의 회사에 맞는 공고만 보여드립니다.',
        desc: '전국 30,000개 이상 기관의 지원사업 공고를 실시간 수집하고, 기업 프로필과 AI 매칭 스코어로 최적의 공고를 추천합니다.\nD-Day 알림부터 신청 자격 사전 진단까지.',
        bullets: ['30,000개 이상 기관 공고 실시간 수집', 'AI 매칭 스코어로 적합도 자동 분석', '분야·규모·지역·마감일 필터 검색', '바로 에이전트 분석으로 원클릭 연결'],
    },
];

/* ─── WHY PUBLICA ─── */
const WHY_ITEMS = [
    { emoji: '🎯', title: '제출 후 "이게 맞나?" 불안이 없어집니다.', desc: '전문가 없이도 전문가 수준으로 PSST 프레임워크와 AI 가이드가 처음부터 끝까지 단계별로 안내하며 분석합니다. 탈락할 요인은 전략 단계에서 이미 제거됩니다.' },
    { emoji: '⚡', title: '마감 3일 전에 시작해도 완성본이 나옵니다', desc: '기존에는 퀄리티와 시간 중 하나를 포기해야 했습니다. PUBLICA는 AI 전략 엔진으로 두 가지를 동시에 해결합니다.' },
    { emoji: '📚', title: '쓸수록 더 강해지는 자산', desc: '모든 전략과 초안이 포트폴리오에 자동 저장됩니다. 성공한 전략을 다음 공고에 재사용하면서 지원사업 역량이 계속 쌓입니다.' },
];

/* ─────────────────────────────────── SOLUTION SLIDE PREVIEW ─────────────────────── */

/* 공통: 0% → toPercent 로 채워지는 진행바 */
function AnimatedFillBar({ toPercent, delay, trackColor = '#2D2D35', fillColor = '#7C3AED' }: { toPercent: number; delay: number; trackColor?: string; fillColor?: string }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        anim.setValue(0);
        Animated.timing(anim, { toValue: toPercent, duration: 900, delay, useNativeDriver: false }).start();
    }, []);
    return (
        <View style={{ height: 8, borderRadius: 4, backgroundColor: trackColor, overflow: 'hidden' }}>
            <Animated.View style={{ height: '100%', borderRadius: 4, backgroundColor: fillColor, width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
        </View>
    );
}

/* 공통: 0 → 100 카운트업 숫자 */
function AnimatedPercentLabel({ delay, color = '#FFFFFF' }: { delay: number; color?: string }) {
    const [pct, setPct] = useState(0);
    useEffect(() => {
        const anim = new Animated.Value(0);
        const id = anim.addListener(({ value }) => setPct(Math.round(value)));
        Animated.timing(anim, { toValue: 100, duration: 900, delay, useNativeDriver: false }).start();
        return () => anim.removeListener(id);
    }, []);
    return <Text style={{ color, fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' }}>{pct}%</Text>;
}

/* ── 1. 공고탐색 (Figma 12-2287) ──
   다크 배경 위에 3개 공고 카드가 순차적으로 나타나며 매칭 % 바가 채워짐 */
/* Figma 501-2869 하단 캡션 공통 스타일 (반투명 블랙 + 퍼플 inset glow) */
function SolutionCaption({ text }: { text: string }) {
    return (
        <View style={{
            alignSelf: 'center', marginTop: 18, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 18.5,
            backgroundColor: 'rgba(0,0,0,0.5)',
            ...(Platform.OS === 'web' ? { boxShadow: 'inset 0 0 15px rgba(124,58,237,0.5)' } as any : {}),
        }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{text}</Text>
        </View>
    );
}

/* ── 1. 공고탐색 (Figma 501-2869) ──
   "프로필 설정" 화면 — 기존 사업자 / 예비 창업자 칩 선택 */
function GrantMatchPreview() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 20 }}>프로필 설정</Text>
            <View style={{ width: 220, gap: 10 }}>
                <StaggerItem delay={100}>
                    <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#7C3AED', borderRadius: 10, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <Building2 size={16} color="#18181B" />
                        <View style={{ alignItems: 'flex-start' }}>
                            <Text style={{ color: '#000000', fontSize: 11, fontWeight: '600' }}>기존 사업자</Text>
                            <Text style={{ color: '#767676', fontSize: 9 }}>사업자 등록증 보유</Text>
                        </View>
                    </View>
                </StaggerItem>
                <StaggerItem delay={280}>
                    <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#7C3AED', borderRadius: 10, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <Rocket size={16} color="#18181B" />
                        <View style={{ alignItems: 'flex-start' }}>
                            <Text style={{ color: '#000000', fontSize: 11, fontWeight: '600' }}>예비 창업자</Text>
                            <Text style={{ color: '#767676', fontSize: 9 }}>창업준비 / 아이디어</Text>
                        </View>
                    </View>
                </StaggerItem>
            </View>
            <SolutionCaption text="AI가 나의 사업 규모, 분야,지역에 맞는 공고를 매칭 스코어로 자동 추천합니다" />
        </View>
    );
}

/* ── 2. 전략수집 (Figma 172-6152) ──
   4개 카드가 사방에서 중앙 메인 PSST 카드로 수렴 */
function StrategyCollectPreview() {
    const fadeCenter = useRef(new Animated.Value(0)).current;
    const scaleCenter = useRef(new Animated.Value(0.85)).current;
    const satellites = [
        { top: 0, left: 0, delay: 0 },
        { top: 0, right: 0, delay: 100 },
        { bottom: 0, left: 0, delay: 200 },
        { bottom: 0, right: 0, delay: 300 },
    ];
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeCenter, { toValue: 1, duration: 700, delay: 500, useNativeDriver: true }),
            Animated.spring(scaleCenter, { toValue: 1, delay: 500, useNativeDriver: true, damping: 12, stiffness: 80 } as any),
        ]).start();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '100%', aspectRatio: 1.6, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                {/* 위성 카드 4개 */}
                {satellites.map((pos, i) => (
                    <StaggerItem key={i} delay={i * 100}>
                        <View style={[{
                            position: 'absolute',
                            backgroundColor: '#18181B',
                            borderRadius: 12,
                            padding: 10,
                            borderWidth: 1,
                            borderColor: '#3F3F46',
                            width: 110,
                        }, pos as any]}>
                            <View style={{ gap: 6 }}>
                                <View style={{ height: 7, borderRadius: 4, backgroundColor: '#3F3F46', width: '75%' }} />
                                <View style={{ height: 7, borderRadius: 4, backgroundColor: '#3F3F46', width: '55%' }} />
                                <View style={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(124,58,237,0.4)', width: '90%' }} />
                            </View>
                        </View>
                    </StaggerItem>
                ))}
                {/* 중앙 수렴 메인 카드 */}
                <Animated.View style={{
                    backgroundColor: '#1C1028',
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1.5,
                    borderColor: '#7C3AED',
                    width: 200,
                    opacity: fadeCenter,
                    transform: [{ scale: scaleCenter }],
                    ...(Platform.OS === 'web' ? { boxShadow: '0 0 32px rgba(124,58,237,0.5)' } as any : {}),
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Sparkles size={12} color="#A78BFA" />
                        <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>전략 분석 완료</Text>
                    </View>
                    {[
                        { label: 'Problem 정의', pct: 96 },
                        { label: 'Solution 차별성', pct: 94 },
                        { label: 'Scale 비전', pct: 89 },
                        { label: 'Traction', pct: 92 },
                    ].map((item, i) => (
                        <View key={i} style={{ marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ color: '#D4D4D8', fontSize: 10, fontWeight: '600' }}>{item.label}</Text>
                                <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>{item.pct}</Text>
                            </View>
                            <AnimatedFillBar toPercent={item.pct} delay={600 + i * 150} fillColor="#7C3AED" trackColor="#2D2D35" />
                        </View>
                    ))}
                </Animated.View>
            </View>
            <SolutionCaption text="공고의 평가기준과 사업 아이디어를 분석해, 맞춤 전략 트리를 자동으로 만듭니다." />
        </View>
    );
}

/* ── 3. 초안작성 (Figma 274-9823) ──
   "1. 문제 인식", "2. 솔루션 및 차별성" 섹션 타이핑 + 라인 채움 */
function DraftPreview() {
    const sections = [
        {
            title: '1. 문제 인식',
            text: '본 사업아이템은 기존 지원사업 신청 서류 작성 과정의 극심한 시간 소모 문제를 해결합니다.',
            rows: 4,
        },
        {
            title: '2. 솔루션 및 차별성',
            text: 'AI 역분석 엔진을 통해 심사위원 평가 기준을 역산하여 맞춤형 사업계획서를 자동 생성합니다.',
            rows: 3,
        },
    ];

    return (
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 4, gap: 16 }}>
            {sections.map((sec, si) => (
                <View key={si} style={{
                    backgroundColor: '#18181B',
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: si === 0 ? 'rgba(124,58,237,0.4)' : '#27272A',
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ color: '#E4E4E7', fontSize: 12, fontWeight: '800' }}>{sec.title}</Text>
                        {si === 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                                <CheckCircle size={10} color="#10B981" />
                                <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '700' }}>PSST 연동</Text>
                            </View>
                        )}
                    </View>
                    {si === 0 ? (
                        <TypewriterText
                            text={sec.text}
                            style={{ color: '#A1A1AA', fontSize: 11, lineHeight: 18 }}
                            speed={20}
                        />
                    ) : (
                        <View style={{ gap: 7 }}>
                            {Array.from({ length: sec.rows }).map((_, ri) => (
                                <AnimatedFillBar key={ri} toPercent={100} delay={400 + ri * 160} fillColor={ri === 0 ? '#7C3AED' : '#3F3F46'} trackColor="#27272A" />
                            ))}
                        </View>
                    )}
                </View>
            ))}
            <SolutionCaption text="전략이 완성되면, PSST 논리 구조 사업계획서 초안을 AI가 자동으로 작성합니다." />
        </View>
    );
}

/* ── 4. 양식매핑 & 다운로드 (Figma 251-4691) ──
   스텝 인디케이터 + 파일 카드 + 매핑 진행 바 */
function ExportPreview() {
    const rows = [
        { label: '문제인식', delay: 0 },
        { label: '솔루션', delay: 180 },
        { label: '시장분석', delay: 360 },
        { label: '팀 구성', delay: 540 },
        { label: '사업화전략', delay: 720 },
    ];

    return (
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 4 }}>
            {/* 스텝 인디케이터 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>1</Text>
                </View>
                <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '700', marginLeft: 8 }}>양식 분석 & 매핑</Text>
                <View style={{ width: 32, height: 1.5, backgroundColor: '#3F3F46', marginHorizontal: 10 }} />
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#27272A', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#52525B', fontSize: 10, fontWeight: '800' }}>2</Text>
                </View>
                <Text style={{ color: '#52525B', fontSize: 12, fontWeight: '700', marginLeft: 8 }}>다운로드</Text>
            </View>

            {/* 파일 카드 */}
            <View style={{
                backgroundColor: '#18181B',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(124,58,237,0.5)',
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <View style={{ backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 6, padding: 5 }}>
                        <FileText size={14} color="#A78BFA" />
                    </View>
                    <Text style={{ color: '#E4E4E7', fontSize: 12, fontWeight: '700' }}>예비창업패키지_사업계획서.hwpx</Text>
                </View>
                <View style={{ gap: 10 }}>
                    {rows.map((row, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: '#71717A', fontSize: 11, width: 60 }}>{row.label}</Text>
                            <View style={{ flex: 1 }}>
                                <AnimatedFillBar toPercent={100} delay={row.delay} fillColor="#7C3AED" trackColor="#27272A" />
                            </View>
                            <AnimatedPercentLabel delay={row.delay} color="#A78BFA" />
                        </View>
                    ))}
                </View>
            </View>
            <SolutionCaption text="완성된 초안은 즉시 다운로드 가능합니다." />
        </View>
    );
}

const SLIDE_PREVIEWS = [GrantMatchPreview, StrategyCollectPreview, DraftPreview, ExportPreview];

/* ────────────────────────────── ANIMATION HELPERS ────────────────────────────────── */

function StaggerItem({ children, delay }: { children: React.ReactNode; delay: number }) {
    const fade = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fade, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
    }, []);
    return (
        <Animated.View style={{ opacity: fade, transform: [{ translateX: fade.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }}>
            {children}
        </Animated.View>
    );
}

function TypewriterText({ text, style, speed = 35 }: { text: string; style?: any; speed?: number }) {
    const [shown, setShown] = useState('');
    useEffect(() => {
        setShown('');
        let i = 0;
        const id = setInterval(() => {
            i++;
            setShown(text.slice(0, i));
            if (i >= text.length) clearInterval(id);
        }, speed);
        return () => clearInterval(id);
    }, [text]);
    return <Text style={style}>{shown}<Text style={{ opacity: shown.length < text.length ? 1 : 0 }}>▍</Text></Text>;
}

/* ────────────────────────────── AGENT LIVE MOTION GRAPHIC ────────────────────────────────── */

function AgentLiveMotionGraphic({ activeIndex }: { activeIndex: number }) {
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        // 은은하게 반짝이는 펄스 애니메이션
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [activeIndex]);

    return (
        <View style={styles.liveMotionContainer}>
            {/* 상단 윈도우 컨트롤 도트 */}
            <View style={styles.liveMotionHeader}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={[styles.windowDot, { backgroundColor: '#FF5F56' }]} />
                    <View style={[styles.windowDot, { backgroundColor: '#FFBD2E' }]} />
                    <View style={[styles.windowDot, { backgroundColor: '#27C93F' }]} />
                </View>
                <View style={styles.liveBadge}>
                    <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                    <Text style={styles.liveBadgeText}>AI AGENT ACTIVE</Text>
                </View>
            </View>

            {/* TAB 0: AI 전략 수립 모션 */}
            {activeIndex === 0 && (
                <View style={styles.motionContentBox}>
                    <View style={styles.motionTitleRow}>
                        <Sparkles size={16} color="#7C3AED" />
                        <Text style={styles.motionMainStatusText}>공고 평가 지표 역방향 스캔 중...</Text>
                    </View>

                    <View style={styles.strategyNodeGrid}>
                        {[
                            { code: 'P', title: 'Problem 정의', score: '98점' },
                            { code: 'S', title: 'Solution 차별성', score: '95점' },
                            { code: 'S', title: 'Scale 비전', score: '92점' },
                            { code: 'T', title: 'Traction 실행안', score: '96점' },
                        ].map((node, i) => (
                            <StaggerItem key={i} delay={i * 200}>
                                <View style={styles.strategyNodeCard}>
                                    <View style={styles.nodeBadge}>
                                        <Text style={styles.nodeBadgeText}>{node.code}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.nodeTitle}>{node.title}</Text>
                                        <View style={styles.nodeProgressTrack}>
                                            <AnimatedFillBar toPercent={90 + i * 2} delay={i * 250} fillColor="#7C3AED" trackColor="#E4E4E7" />
                                        </View>
                                    </View>
                                    <Text style={styles.nodeScore}>{node.score}</Text>
                                </View>
                            </StaggerItem>
                        ))}
                    </View>
                </View>
            )}

            {/* TAB 1: AI 초안 작성 모션 */}
            {activeIndex === 1 && (
                <View style={styles.motionContentBox}>
                    <View style={styles.motionTitleRow}>
                        <FileEdit size={16} color="#7C3AED" />
                        <TypewriterText
                            text="PSST 구조의 사업계획서 1. 문제 인식 초안 자동 생성 중..."
                            style={styles.motionMainStatusText}
                            speed={30}
                        />
                    </View>

                    <View style={styles.draftSimBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '800' }}>[문항 1] 개발 동기 및 시장 문제점</Text>
                            <View style={styles.draftBadgeDone}>
                                <CheckCircle size={12} color="#10B981" />
                                <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>PSST 연동</Text>
                            </View>
                        </View>

                        {/* 라이브 타이핑 텍스트 모션 */}
                        <View style={styles.typewritingLineBox}>
                            <TypewriterText
                                text="본 사업아이템은 기존 지원사업 신청 서류 작성 과정의 극심한 시간 소모 문제를 해결하기 위해 AI 역분석 엔진을 적용한 맞춤형 자가성장 솔루션입니다."
                                style={{ color: '#334155', fontSize: 12, lineHeight: 20, fontWeight: '500' }}
                                speed={25}
                            />
                        </View>

                        <View style={{ gap: 8, marginTop: 12 }}>
                            <AnimatedFillBar toPercent={100} delay={400} fillColor="#7C3AED" />
                            <AnimatedFillBar toPercent={85} delay={700} fillColor="#A78BFA" />
                        </View>
                    </View>
                </View>
            )}

            {/* TAB 2: 공고 탐색 & 맞춤 추천 모션 */}
            {activeIndex === 2 && (
                <View style={styles.motionContentBox}>
                    <View style={styles.motionTitleRow}>
                        <Zap size={16} color="#7C3AED" />
                        <Text style={styles.motionMainStatusText}>전국 30,000개 기관 공고 AI 스코어링 분석...</Text>
                    </View>

                    <View style={{ gap: 10 }}>
                        {[
                            { name: '2026 청년창업사관학교 입교팀 모집', score: 98, tag: '중기부 · 강추' },
                            { name: '초기창업패키지 지원사업 공고', score: 92, tag: '창진원 · 적합' },
                            { name: 'TIPS 프로그램 연계 지원 공고', score: 86, tag: 'R&D 패스트트랙' },
                        ].map((g, i) => (
                            <StaggerItem key={i} delay={i * 220}>
                                <View style={styles.grantMotionCard}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: '800', flex: 1 }} numberOfLines={1}>
                                            {g.name}
                                        </Text>
                                        <View style={styles.grantMatchBadge}>
                                            <Text style={{ color: '#7C3AED', fontSize: 11, fontWeight: '900' }}>{g.score}% 매칭</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                                        <Text style={{ color: '#64748B', fontSize: 10 }}>{g.tag}</Text>
                                        <View style={{ flex: 0.6 }}>
                                            <AnimatedFillBar toPercent={g.score} delay={i * 200} fillColor="#7C3AED" trackColor="#F1F5F9" />
                                        </View>
                                    </View>
                                </View>
                            </StaggerItem>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginPress, onStartFree, onNavigateToPricing }) => {
    const { width, height } = useWindowDimensions();
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

    /* solution slider — 가로 캐러셀. translateX로 실제 좌우 이동을 보여준다. */
    const [solutionSlide, setSolutionSlide] = useState(0);
    const [solutionPinned, setSolutionPinned] = useState(false); // true인 동안 ScrollView.scrollEnabled=false로 페이지 자체를 잠근다
    const solutionTrackX = useRef(new Animated.Value(0)).current; // 캐러셀 translateX (px, 음수)

    const goToSlide = useCallback((idx: number, panelWidth: number) => {
        setSolutionSlide(idx);
        Animated.timing(solutionTrackX, { toValue: -idx * panelWidth, duration: 380, useNativeDriver: true }).start();
    }, [solutionTrackX]);

    // 🌟 SOLUTION 섹션 스크롤 잠금.
    // sticky도, scrollTo로 위치를 매번 되돌리는 방식도 지터/무한루프가 났다(둘 다 실측 확인됨).
    // 이번엔 ScrollView의 scrollEnabled 자체를 꺼서 물리적으로 스크롤이 안 되게 만든다 —
    // 그러면 페이지가 "그 자리에서 못 움직이는" 게 보장되고, 휠 델타는 페이지 스크롤이 아니라
    // 순수하게 캐러셀 translateX를 좌우로 미는 데만 쓰인다(= 실제로 가로로 슬라이드하는 게 보인다).
    const mainScrollRef = useRef<any>(null);
    const solutionSectionRef = useRef<any>(null);
    const solutionSectionYRef = useRef(0);
    const solutionPanelWidthRef = useRef(0);
    const [solutionPanelWidth, setSolutionPanelWidthState] = useState(0);
    const setSolutionPanelWidth = useCallback((w: number) => {
        solutionPanelWidthRef.current = w;
        setSolutionPanelWidthState(w);
    }, []);
    const currentScrollYRef = useRef(0);
    const pinnedRef = useRef(false);
    const progressRef = useRef(0);
    const solutionSlideRef = useRef(solutionSlide);
    useEffect(() => { solutionSlideRef.current = solutionSlide; }, [solutionSlide]);

    const STEP_DISTANCE = 220; // 탭 1개 넘기는 데 필요한 누적 휠 델타
    const maxProgress = (SOLUTION_SLIDES.length - 1) * STEP_DISTANCE;

    const handleMainScroll = useCallback((e: any) => {
        currentScrollYRef.current = e.nativeEvent.contentOffset.y;

        // 잠기지 않은 상태에서, 섹션 상단이 뷰포트 상단에 도달하는 순간 즉시 잠근다.
        // (wheel 이벤트가 아니라 실제 scroll 이벤트로 판정하므로 훨씬 안정적이다.)
        if (!pinnedRef.current) {
            const top = solutionSectionYRef.current;
            const y = currentScrollYRef.current;
            if (y >= top - 4 && y <= top + 4) {
                pinnedRef.current = true;
                progressRef.current = 0;
                mainScrollRef.current?.scrollTo?.({ y: top, animated: false });
                setSolutionPinned(true);
            }
        }
    }, []);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

        const onWheel = (e: WheelEvent) => {
            if (!pinnedRef.current) return; // 잠기기 전/후에는 원래 페이지 스크롤 그대로 통과
            e.preventDefault();

            progressRef.current = clamp(progressRef.current + e.deltaY, 0, maxProgress);
            const idx = Math.round(progressRef.current / STEP_DISTANCE);
            if (idx !== solutionSlideRef.current) {
                goToSlide(idx, solutionPanelWidthRef.current || 1000);
            }

            const atStart = progressRef.current <= 0 && e.deltaY < 0;
            const atEnd = progressRef.current >= maxProgress && e.deltaY > 0;
            if (atStart || atEnd) {
                // 경계를 벗어나려는 시도 → 잠금 해제, 다음 tick부터 실제 페이지 스크롤 재개
                pinnedRef.current = false;
                setSolutionPinned(false);
            }
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        return () => window.removeEventListener('wheel', onWheel);
    }, [goToSlide, maxProgress]);

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
        }, 4500);
        return () => { if (agentTimer.current) clearInterval(agentTimer.current); };
    }, [agentAnim]);

    const agent = AGENTS[activeAgent];
    const solutionSectionHeight = Math.max(700, height); // 화면 전체를 채워야 다음 섹션이 아래로 안 비친다

    return (
        <ScrollView
            ref={mainScrollRef}
            style={{ flex: 1, backgroundColor: '#F8F8F8' }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!solutionPinned}
            scrollEventThrottle={16}
            onScroll={handleMainScroll}
        >
            {/* ══════════ HERO (Figma 536-2154 / 536-2172) ══════════ */}
            <View style={[styles.heroOuter, { paddingHorizontal: contentPad }]}>
                <Animated.View style={[styles.heroCard, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
                    {/* 피그마 536-2154 비주얼 (오른쪽 3D 맥북, 책 3권, 머그컵, 노란 링노트 모의 합성) */}
                    {isDesktop && (
                        <>
                            <Image
                                source={require('../../assets/landing/hero_visual.png')}
                                style={styles.heroVisual}
                                resizeMode="cover"
                            />
                            {/* Figma의 inset box-shadow(150px 블러)를 재현 — 이미지 왼쪽 끝이 딱 잘리지 않고
                                배경색(#F8F8F8)으로 점점 흐려지며 녹아드는 그라데이션 페이드.
                                Image와 완전히 동일한 styles.heroVisual을 써서 두 박스 경계가 항상 정확히 겹친다. */}
                            <LinearGradient
                                pointerEvents="none"
                                colors={['#F8F8F8', '#F8F8F8', 'rgba(248,248,248,0)']}
                                locations={[0, 0.18, 0.65]}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={styles.heroVisual}
                            />
                            {/* 🌟 카드 왼쪽 아래 라운드 모서리에서 이미지 일부(보라색 책등)가 클리핑을
                                살짝 벗어나 삐져나오던 자국 — 카드 배경색과 동일한 패치로 그 모서리만 덮는다. */}
                            <View style={styles.heroVisualCornerPatch} pointerEvents="none" />
                        </>
                    )}

                    <View style={[styles.heroRow, !isDesktop && { flexDirection: 'column' }]}>
                        {/* LEFT: copy */}
                        <View style={[styles.heroLeft, isDesktop ? { flex: 1, maxWidth: 540 } : { width: '100%' }]}>
                            <View style={styles.heroBadge}>
                                <Sparkles size={12} color="#7C3AED" />
                                <Text style={styles.heroBadgeText}>맞춤형 지원사업 AI 솔루션</Text>
                            </View>

                            <Text style={[styles.heroTitle, { fontSize: isDesktop ? 44 : 30, lineHeight: (isDesktop ? 44 : 30) * 1.25 }]}>
                                <Text style={{ color: '#7C3AED' }}>공고</Text>는 찾았는데,{'\n'}아직 한 줄도 <Text style={{ color: '#7C3AED' }}>못 썼나요</Text>?
                            </Text>

                            <Text style={styles.heroSub}>
                                AI가 대신 씁니다. 당신은 제출만 하세요
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

                            <BorderGlow glowColor="#a855f7" borderRadius={99} glowRadius={24}>
                                <TouchableOpacity onPress={onStartFree} style={styles.heroCtaPill}>
                                    <Text style={styles.heroCtaText}>지금 바로 작성하기</Text>
                                    <ArrowRight size={16} color="#FFF" />
                                </TouchableOpacity>
                            </BorderGlow>
                        </View>
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

            {/* ══════════ SOLUTION (전체 화면 고정 + 가로 캐러셀) ══════════ */}
            <View
                ref={solutionSectionRef}
                onLayout={(e) => { solutionSectionYRef.current = e.nativeEvent.layout.y; }}
            >
                <View style={[styles.solutionSection, { height: solutionSectionHeight, justifyContent: 'center' }]}>
                    {/* header */}
                    <View style={[styles.sectionHeadCenter, { paddingHorizontal: contentPad, marginBottom: 0, gap: 10 }]}>
                        <View style={[styles.tagPill, { backgroundColor: 'rgba(167,139,250,0.15)', borderColor: 'rgba(167,139,250,0.3)' }]}>
                            <Text style={[styles.tagPillText, { color: '#A78BFA' }]}>SOLUTION</Text>
                        </View>
                        <Text style={[styles.sectionTitle, { color: '#FFFFFF', textAlign: 'center', fontSize: 34, lineHeight: 44 }]}>이렇게 해결하고자 합니다.</Text>
                        <Text style={[styles.sectionSub, { color: '#94A3B8', textAlign: 'center', maxWidth: 560, fontSize: 15, lineHeight: 22 }]}>
                            단순한 글쓰기 도구가 아닙니다. 공고 탐색부터 초안 완성까지, 지원사업 성공의 전 과정을 PUBLICA가 함께 합니다.
                        </Text>
                    </View>

                    {/* 가로 캐러셀 뷰포트 — 퍼센트 대신 실측 px로 트랙/패널 폭을 고정해서 밖으로 새는 것을 막는다 */}
                    <View
                        style={[styles.solutionPreviewArea, { marginHorizontal: contentPad, marginTop: 32 }]}
                        onLayout={(e) => setSolutionPanelWidth(e.nativeEvent.layout.width)}
                    >
                        {solutionPanelWidth > 0 && (
                            <Animated.View style={{ flexDirection: 'row', width: solutionPanelWidth * SLIDE_PREVIEWS.length, height: '100%', transform: [{ translateX: solutionTrackX }] }}>
                                {SLIDE_PREVIEWS.map((Preview, i) => (
                                    <View key={i} style={{ width: solutionPanelWidth, height: '100%' }}>
                                        {i === solutionSlide && <Preview />}
                                    </View>
                                ))}
                            </Animated.View>
                        )}
                    </View>

                    {/* tab nav */}
                    <View style={[styles.solutionTabs, { paddingHorizontal: contentPad }]}>
                        {SOLUTION_SLIDES.map((s, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => goToSlide(i, solutionPanelWidthRef.current || 1000)}
                                style={[styles.solutionTab, i === solutionSlide && styles.solutionTabActive]}
                            >
                                <Text style={[styles.solutionTabText, i === solutionSlide && styles.solutionTabTextActive]}>
                                    {s.tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 4개 탭 프리뷰 전부 캡션이 목업 안에 포함되어 있어 별도 subtitle 텍스트는 렌더링하지 않음 */}
                </View>
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

                {/* Figma 725-2866 기준 대형 화이트 프레임 카드 */}
                <View style={styles.agentMainCard}>
                    <View style={[styles.agentCardInner, !isDesktop && { flexDirection: 'column' }]}>
                        {/* 좌측: 실시간 에이전트 동적 모션 그래픽 시뮬레이터 */}
                        <View style={[styles.agentMockupBox, isDesktop ? { flex: 1.1 } : { width: '100%', height: 350 }]}>
                            <AgentLiveMotionGraphic activeIndex={activeAgent} />

                            {/* 하단 인디케이터 컨트롤 바 (오직 현재 선택된 activeAgent만 확장) */}
                            <View style={styles.agentMockupControlBar}>
                                {[0, 1, 2].map((idx) => (
                                    <View
                                        key={idx}
                                        style={[
                                            styles.agentMockupDot,
                                            idx === activeAgent
                                                ? { width: 24, borderRadius: 12, backgroundColor: '#7C3AED' }
                                                : { width: 6, borderRadius: 3, backgroundColor: '#A3A3A3' }
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* 우측: 아이콘 탭 그룹 & 에이전트 상세 내용 & Learn more 버튼 */}
                        <Animated.View style={[styles.agentRightContent, isDesktop ? { flex: 1 } : { width: '100%' }, { opacity: agentAnim }]}>
                            {/* 상단 3개 아이콘 탭 버튼 */}
                            <View style={styles.agentIconTabsRow}>
                                {[
                                    { icon: Share2, label: '전략 수립' },
                                    { icon: FileText, label: '초안 작성' },
                                    { icon: Folder, label: '공고 탐색' },
                                ].map((item, idx) => {
                                    const IconComp = item.icon;
                                    const isActive = idx === activeAgent;
                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => {
                                                if (agentTimer.current) clearInterval(agentTimer.current);
                                                changeAgent(idx);
                                                agentTimer.current = setInterval(() => {
                                                    setActiveAgent(prev => {
                                                        const next = (prev + 1) % AGENTS.length;
                                                        changeAgent(next);
                                                        return next;
                                                    });
                                                }, 4000);
                                            }}
                                            style={[
                                                styles.agentIconTabBtn,
                                                isActive && styles.agentIconTabBtnActive
                                            ]}
                                        >
                                            <IconComp size={18} color={isActive ? '#7C3AED' : '#A1A1AA'} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={styles.agentCategoryLabel}>{agent.tag}</Text>
                            <Text style={styles.agentMainTitle}>{agent.name}</Text>
                            <Text style={styles.agentHighlightTagline}>{agent.tagline}</Text>
                            <Text style={styles.agentBodyDesc}>{agent.desc}</Text>

                            <View style={{ flex: 1, minHeight: 16 }} />

                            {/* 우측 하단 Learn more 버튼 */}
                            <TouchableOpacity onPress={onStartFree} style={styles.agentLearnMoreBtn}>
                                <Text style={styles.agentLearnMoreText}>Learn more</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
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
                <View style={[styles.ctaCard, isDesktop ? { flexDirection: 'row', alignItems: 'center' } : {}]}>
                    {/* left text */}
                    <View style={{ flex: isDesktop ? 1 : undefined, padding: isDesktop ? 56 : 32 }}>
                        <Text style={styles.ctaTitle}>더 이상 밤새우지 않아도 됩니다.</Text>
                        <Text style={styles.ctaSub}>
                            PUBLICA와 함께라면 공고 탐색부터 완성본 출력까지,{'\n'}
                            혼자 고민하던 시간이 사라집니다.
                        </Text>
                        <BorderGlow glowColor="#a855f7" borderRadius={99} glowRadius={24}>
                            <TouchableOpacity onPress={onStartFree} style={styles.ctaBtn}>
                                <Text style={styles.ctaBtnText}>지금 바로 사업계획서 초안 작성하기</Text>
                                <ArrowUpRight size={18} color="#FFF" />
                            </TouchableOpacity>
                        </BorderGlow>
                        <TouchableOpacity onPress={onNavigateToPricing} style={{ marginTop: 20 }}>
                            <Text style={styles.ctaNote}>요금제 자세히 보기 &gt;</Text>
                        </TouchableOpacity>
                    </View>

                    {/* right mockup — 사용자 1번 피그마 디자인 100% 동기화 */}
                    {isDesktop && (
                        <View style={styles.ctaMockupOuter}>
                            <View style={styles.ctaMockupInnerContainer}>
                                {/* 상단 PUBLICA 로고 + PUBLICA NEXUS Flow */}
                                <View style={styles.ctaMockupHeaderRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                        <View style={styles.ctaPLogoBadge}>
                                            <Text style={styles.ctaPLogoText}>P</Text>
                                        </View>
                                        <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 }}>PUBLICA</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={{ color: '#18181B', fontSize: 13, fontWeight: '800' }}>PUBLICA NEXUS </Text>
                                        <Text style={{ color: '#D946EF', fontSize: 13, fontWeight: '900' }}>Flow</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', flex: 1, marginTop: 14, alignItems: 'stretch' }}>
                                    {/* 좌측 사이드 아이콘 레일 */}
                                    <View style={styles.ctaSideIconRail}>
                                        <Sparkles size={16} color="#71717A" />
                                        <Home size={16} color="#71717A" />
                                        <User size={16} color="#71717A" />
                                        <Minus size={18} color="#D4D4D8" />
                                        <NotebookPen size={16} color="#71717A" />
                                        <View style={styles.ctaZapIconBox}>
                                            <Zap size={14} color="#FFFFFF" />
                                        </View>
                                        <FileEdit size={16} color="#71717A" />
                                    </View>

                                    {/* 우측 챗 배너 및 하단 진행중인 프로젝트 */}
                                    <View style={{ flex: 1, paddingLeft: 20, justifyContent: 'space-between' }}>
                                        {/* 1번 이미지의 기울어진 보라색 챗 배너 */}
                                        <View style={styles.ctaPurpleChatBanner}>
                                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                                                <MessageSquareText size={20} color="#FFFFFF" style={{ marginTop: 2 }} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>AI 리서치 시작하기</Text>
                                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 3, fontWeight: '500' }}>
                                                        브레인스톰과 시장 조사를 시작합니다
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* 하단 진행중인 프로젝트 카운터 카드 */}
                                        <View style={styles.ctaOngoingProjectCard}>
                                            <Bookmark size={18} color="#0F172A" />
                                            <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '900' }}>진행중인 프로젝트</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
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
    /* GNB HEADER */
    gnbHeaderRow: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
    },
    gnbLogoBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gnbLogoPText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
    gnbLogoText: { color: '#0F172A', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
    gnbNavText: { color: '#475569', fontSize: 14, fontWeight: '600' },
    gnbNavTextActive: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
    gnbSignupText: { color: '#475569', fontSize: 14, fontWeight: '600' },
    gnbLoginBtn: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 20,
        paddingVertical: 9,
        borderRadius: 99,
    },
    gnbLoginBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

    /* HERO */
    heroOuter: {
        paddingTop: 120, // 헤더(80px) + 여유 공간 — 히어로 뱃지가 헤더에 가려 잘리던 문제
        paddingBottom: 60,
    },
    heroCard: {
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        minHeight: 640,
        justifyContent: 'center',
        // 🌟 Figma 원본 배경색은 #F8F8F8. 페이지/그라데이션과 다른 색이면 카드 윤곽선이
        // 그대로 보이므로 전부 이 색으로 통일한다 (아래 그라데이션, 페이지 bg 전부 동일하게).
        backgroundColor: '#F8F8F8',
    },
    heroVisual: {
        // 🌟 aspectRatio + top:50%/translateY 조합은 카드 높이와 어긋나면 위아래를 세게 잘라
        // "확대된 것처럼" 보이는 원인이었다. top:0/bottom:0으로 카드 높이에 그대로 꽉 채우면
        // cover가 세로 crop 없이 가로만 자연스럽게 잘라서 훨씬 자연스럽다.
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: '64%',
        borderRadius: 28,
    },
    heroVisualCornerPatch: {
        // heroVisual(이미지 박스)은 right:0, width:64%라 왼쪽 끝은 카드 기준 36% 지점이다.
        // 패치도 같은 좌표계(heroCard 기준 절대좌표)라 left를 36%로 맞춰야 이미지 왼쪽 끝과 일치한다.
        position: 'absolute',
        left: '36%',
        bottom: 0,
        width: 60,
        height: 60,
        backgroundColor: '#F8F8F8',
        borderBottomLeftRadius: 28,
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
    heroCtaPill: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 99,
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
        paddingVertical: 40,
        gap: 24,
        justifyContent: 'space-between',
    },
    solutionPreviewArea: {
        backgroundColor: '#000000',
        borderRadius: 20,
        padding: 24,
        height: 420,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    solutionTabs: {
        flexDirection: 'row',
        gap: 35,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 24,
        flexWrap: 'wrap',
    },
    solutionTab: {
        paddingVertical: 4,
    },
    solutionTabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#FFFFFF',
    },
    solutionTabText: { color: '#767676', fontSize: 18, fontWeight: '700' },
    solutionTabTextActive: { color: '#FFFFFF' },
    solutionSlideDesc: {
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 24,
        textAlign: 'center',
    },

    /* KEY AGENT (IMAGE 3) STYLES */
    agentMainCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 36,
        padding: 32,
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 28,
        elevation: 4,
    },
    agentCardInner: {
        flexDirection: 'row',
        gap: 40,
        alignItems: 'stretch',
    },
    agentMockupBox: {
        backgroundColor: '#EBEBEB',
        borderRadius: 28,
        padding: 24,
        justifyContent: 'space-between',
        position: 'relative',
        minHeight: 340,
    },
    agentMockupContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    agentMockupPlaceholderText: {
        color: '#71717A',
        fontSize: 14,
        fontWeight: '500',
    },
    agentMockupControlBar: {
        height: 24,
        width: 90,
        backgroundColor: '#A3A3A3',
        borderRadius: 99,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    agentMockupDotActive: {
        width: 24,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E5E5E5',
    },
    /* LIVE MOTION GRAPHIC STYLES */
    liveMotionContainer: {
        flex: 1,
        backgroundColor: '#0F0F15',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#27272A',
        position: 'relative',
        minHeight: 310,
    },
    liveMotionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#18181B',
        borderBottomWidth: 1,
        borderBottomColor: '#27272A',
    },
    windowDot: { width: 10, height: 10, borderRadius: 5 },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(124,58,237,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: 'rgba(124,58,237,0.4)',
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    liveBadgeText: { color: '#A78BFA', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    scanBeam: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(124,58,237,0.8)',
        zIndex: 5,
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    motionContentBox: {
        padding: 18,
        gap: 12,
    },
    motionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    motionMainStatusText: {
        color: '#A78BFA',
        fontSize: 12,
        fontWeight: '700',
    },
    strategyNodeGrid: {
        gap: 8,
    },
    strategyNodeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#18181B',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    nodeBadge: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nodeBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
    nodeTitle: { color: '#E4E4E7', fontSize: 11, fontWeight: '700', marginBottom: 4 },
    nodeProgressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
    nodeScore: { color: '#10B981', fontSize: 11, fontWeight: '800' },

    draftSimBox: {
        backgroundColor: '#18181B',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    draftBadgeDone: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16,185,129,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    typewritingLineBox: {
        backgroundColor: '#09090B',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    grantMotionCard: {
        backgroundColor: '#18181B',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#27272A',
    },
    grantMatchBadge: {
        backgroundColor: 'rgba(124,58,237,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },

    agentMockupDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#737373',
    },
    agentRightContent: {
        gap: 12,
        justifyContent: 'flex-start',
    },
    agentIconTabsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    agentIconTabBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    agentIconTabBtnActive: {
        backgroundColor: '#F5F3FF',
        borderColor: '#DDD6FE',
    },
    agentCategoryLabel: {
        color: '#7C3AED',
        fontSize: 12,
        fontWeight: '700',
    },
    agentMainTitle: {
        color: '#0F172A',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    agentHighlightTagline: {
        color: '#7C3AED',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 22,
    },
    agentBodyDesc: {
        color: '#64748B',
        fontSize: 13,
        lineHeight: 22,
        marginTop: 6,
    },
    agentLearnMoreBtn: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 99,
        alignSelf: 'flex-end',
    },
    agentLearnMoreText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
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

    /* CTA (IMAGE 1) STYLES */
    ctaSection: { paddingVertical: 100 },
    ctaCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 36,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 30,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    ctaTitle: { color: '#7C3AED', fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 48, marginBottom: 16 },
    ctaSub: { color: '#767676', fontSize: 17, lineHeight: 28, marginBottom: 32 },
    ctaBtn: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 99,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
    },
    ctaBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    ctaNote: { color: '#767676', fontSize: 14, fontWeight: '500' },

    ctaMockupOuter: {
        flex: 1.1,
        backgroundColor: '#F5F3FF',
        borderTopLeftRadius: 32,
        borderBottomLeftRadius: 32,
        paddingTop: 32,
        paddingLeft: 32,
        minHeight: 320,
    },
    ctaMockupInnerContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
    },
    ctaMockupHeaderRow: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 12,
    },
    ctaPLogoBadge: {
        width: 20,
        height: 20,
        borderRadius: 6,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaPLogoText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
    ctaSideIconRail: {
        width: 32,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 14,
    },
    ctaZapIconBox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaPurpleChatBanner: {
        backgroundColor: '#7C3AED',
        borderRadius: 20,
        padding: 18,
        transform: [{ rotate: '4deg' }],
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        marginBottom: 20,
    },
    ctaOngoingProjectCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
    },
});
