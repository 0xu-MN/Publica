import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions
} from 'react-native';
import {
    Zap, FileEdit, ClipboardList, FolderKanban, ChevronDown, ChevronUp,
    CheckCircle2, ArrowRight, Sparkles, Target, Clock, Star, BookOpen,
    AlertTriangle, Lightbulb, TrendingUp, Shield
} from 'lucide-react-native';

/* ──────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────── */
const AGENTS = [
    {
        id: 'nexus-flow',
        icon: Zap,
        color: '#7C3AED',
        bg: '#F5F3FF',
        tag: 'STEP 01 · AI 전략 수립',
        name: 'Publica Nexus Flow',
        tagline: '공고를 붙여넣으면, 전략이 나옵니다.',
        desc: `대부분의 사업계획서 탈락은 "내용이 부족해서"가 아닙니다.\n심사위원이 원하는 핵심 평가 요소를 놓쳤기 때문입니다.\n\nNexus Flow는 공고 URL 하나로 평가 기준을 역방향으로 분석해 전략 트리를 자동 생성합니다. 무엇을 어떤 순서로 써야 하는지, AI가 먼저 그려줍니다.`,
        steps: [
            '공고 URL 또는 PDF를 붙여넣기',
            'AI가 평가 기준과 필수 항목 자동 추출',
            'PSST 프레임워크 기반 전략 트리 생성',
            '각 항목별 작성 가이드라인 확인',
        ],
        tip: '공고 분석 후 "Nexus Edit로 이어서 작성하기" 버튼을 누르면 전략과 초안이 자동으로 연결됩니다.',
    },
    {
        id: 'nexus-edit',
        icon: FileEdit,
        color: '#0EA5E9',
        bg: '#F0F9FF',
        tag: 'STEP 02 · 자동 초안 작성',
        name: 'Publica Nexus Edit',
        tagline: '전략이 글이 됩니다. 10분 안에.',
        desc: `Nexus Flow의 전략 결과를 그대로 이어받아 사업계획서 각 항목의 초안을 자동 작성합니다.\n\nPSST(Problem·Solution·Strategy·Traction) 프레임워크에 특화된 글쓰기 AI가 논리적 흐름을 유지하며 작성하고, 작성 중에도 실시간으로 검수합니다.`,
        steps: [
            'Nexus Flow 전략 결과 자동 연동',
            'PSST 구조로 각 문항 초안 생성',
            '문맥 기반 실시간 품질 검수',
            'HWPX / DOCX 정부 양식에 자동 매핑 후 다운로드',
        ],
        tip: '"재작성" 버튼으로 특정 항목만 반복 수정이 가능합니다. 전체를 다시 작성할 필요가 없습니다.',
    },
    {
        id: 'grants',
        icon: ClipboardList,
        color: '#10B981',
        bg: '#F0FDF4',
        tag: 'DISCOVERY · 공고 탐색',
        name: '공고 탐색',
        tagline: '3만 개 기관, 오늘 마감 공고를 한눈에.',
        desc: `전국 중앙부처, 지자체, 공공기관 등 30,000개 이상 기관의 지원사업 공고를 실시간으로 수집합니다.\n\n업종·기업 규모·기술 분야로 필터링하여 내 회사에 맞는 공고를 빠르게 찾고, 바로 에이전트 분석으로 연결하세요.`,
        steps: [
            '분야·지역·공고 유형으로 필터 설정',
            '맞춤 공고 목록 정렬 (D-Day, 지원 금액 등)',
            '공고 상세 페이지에서 핵심 내용 미리 확인',
            '바로 Nexus Flow 분석 시작',
        ],
        tip: '스크랩 기능을 활용하면 나중에 작성할 공고를 북마크로 저장할 수 있습니다.',
    },
    {
        id: 'projects',
        icon: FolderKanban,
        color: '#F59E0B',
        bg: '#FFFBEB',
        tag: 'MANAGEMENT · 포트폴리오',
        name: 'Portfolio',
        tagline: '진행 중인 사업, 완성된 전략을 한 곳에.',
        desc: `이전에 분석하고 작성한 모든 사업계획서 세션이 자동으로 포트폴리오에 저장됩니다.\n\n과거 프로젝트를 불러와 수정하거나, 성공한 전략을 참고해 새 공고에 재활용하세요. 기업의 사업 이력을 자산으로 쌓아가는 공간입니다.`,
        steps: [
            '모든 에이전트 세션 자동 저장',
            '프로젝트 클릭으로 이전 작업 바로 재개',
            '공고별 작성 상태 (진행중/완료) 관리',
            '성공 전략을 템플릿으로 재활용',
        ],
        tip: '각 프로젝트 카드에서 "에이전트로 이어서" 버튼을 누르면 마지막 저장 상태가 복원됩니다.',
    },
];

const FAQS = [
    {
        q: 'Nexus Flow와 Nexus Edit, 꼭 둘 다 써야 하나요?',
        a: '권장하지만 필수는 아닙니다. Nexus Flow 없이 Nexus Edit에서 처음부터 직접 작성하는 것도 가능합니다. 다만 Flow의 전략 분석을 먼저 거치면 합격률이 훨씬 높아집니다. 처음 사용하신다면 Flow → Edit 순서로 진행하시길 강력히 권장합니다.',
    },
    {
        q: '생성된 사업계획서를 그대로 제출해도 되나요?',
        a: 'AI가 작성한 초안은 반드시 직접 검토 및 수정 후 제출하시기 바랍니다. Publica는 우수한 초안을 빠르게 생성하는 도구이며, 최종 책임과 판단은 사용자에게 있습니다. 특히 회사 고유의 실적, 수치, 대표 사례는 직접 추가하셔야 합니다.',
    },
    {
        q: '어떤 종류의 공고를 분석할 수 있나요?',
        a: '중앙부처(중기부, 과기부, 산업부 등), 지자체, TIPS, 민간 VC 공고 등 텍스트가 포함된 거의 모든 공고를 분석할 수 있습니다. URL 또는 PDF 파일 형태로 입력하세요.',
    },
    {
        q: '작성 중인 내용은 자동 저장되나요?',
        a: '네, 에이전트에서 작업한 모든 내용은 실시간으로 Portfolio에 자동 저장됩니다. 브라우저를 닫아도 Portfolio에서 이어서 작업할 수 있습니다.',
    },
    {
        q: 'HWPX, DOCX 다운로드가 안 될 때는 어떻게 하나요?',
        a: 'Nexus Edit에서 "최종 매핑" 단계까지 완료한 후 다운로드를 시도해주세요. 문제가 지속되면 아래 이메일로 문의해 주시면 빠르게 도움을 드리겠습니다: publica@publica.ai.kr',
    },
];

const TIPS = [
    { icon: Target, color: '#7C3AED', title: '처음이라면 이 순서로', desc: '공고 탐색 → Nexus Flow 분석 → Nexus Edit 작성 → 다운로드. 이 4단계가 기본 워크플로우입니다.' },
    { icon: Clock, color: '#0EA5E9', title: '평균 소요 시간', desc: '공고 분석 2분, 전략 검토 5분, 초안 생성 3분. 총 10분이면 기본 사업계획서 초안이 완성됩니다.' },
    { icon: Lightbulb, color: '#F59E0B', title: '합격률을 높이는 팁', desc: 'AI 초안에 회사의 실제 수치(매출, 특허, 고객사 등)를 반드시 추가하세요. 구체성이 합격의 핵심입니다.' },
    { icon: TrendingUp, color: '#10B981', title: 'PRO 플랜 추천', desc: '월 3회 이상 공고를 작성하신다면 PRO 플랜이 훨씬 경제적입니다. 무제한 분석 + 우선 처리 속도를 제공합니다.' },
];

/* ──────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────── */
export const GuideView: React.FC = () => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const [activeAgent, setActiveAgent] = useState(0);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const agent = AGENTS[activeAgent];
    const AgentIcon = agent.icon;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <View style={styles.headerBadge}>
                    <BookOpen size={14} color="#7C3AED" />
                    <Text style={styles.headerBadgeText}>Publica 에이전트 가이드</Text>
                </View>
                <Text style={styles.headerTitle}>에이전트를 처음 사용하신가요?{'\n'}이 페이지 하나면 충분합니다.</Text>
                <Text style={styles.headerSub}>
                    Publica의 AI 에이전트는 공공지원사업 전문가 없이도{'\n'}
                    누구나 전문가 수준의 사업계획서를 완성할 수 있도록 설계되었습니다.
                </Text>
            </View>

            {/* ─── QUICK TIPS ─── */}
            <View style={[styles.section, { backgroundColor: '#FDF8F3' }]}>
                <View style={styles.inner}>
                    <Text style={styles.sectionTag}>[ 알아두면 좋은 것 ]</Text>
                    <Text style={styles.sectionTitle}>시작 전에 꼭 읽어보세요</Text>
                    <View style={[styles.tipsGrid, isDesktop && styles.tipsGridRow]}>
                        {TIPS.map((tip, i) => {
                            const TipIcon = tip.icon;
                            return (
                                <View key={i} style={styles.tipCard}>
                                    <View style={[styles.tipIconBox, { backgroundColor: tip.color + '15' }]}>
                                        <TipIcon size={20} color={tip.color} />
                                    </View>
                                    <Text style={styles.tipTitle}>{tip.title}</Text>
                                    <Text style={styles.tipDesc}>{tip.desc}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* ─── AGENT GUIDE TABS ─── */}
            <View style={styles.section}>
                <View style={styles.inner}>
                    <Text style={styles.sectionTag}>[ 에이전트 상세 가이드 ]</Text>
                    <Text style={styles.sectionTitle}>각 에이전트, 이렇게 사용하세요</Text>

                    {/* Tab selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                        <View style={styles.tabRow}>
                            {AGENTS.map((a, i) => {
                                const Icon = a.icon;
                                const isActive = activeAgent === i;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setActiveAgent(i)}
                                        style={[styles.tab, isActive && { backgroundColor: a.color, borderColor: a.color }]}
                                    >
                                        <Icon size={16} color={isActive ? '#FFF' : '#94A3B8'} />
                                        <Text style={[styles.tabText, isActive && { color: '#FFF' }]}>{a.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* Agent detail card */}
                    <View style={[styles.agentCard, isDesktop && styles.agentCardRow]}>
                        {/* Left: description */}
                        <View style={styles.agentLeft}>
                            <View style={[styles.agentIconBox, { backgroundColor: agent.bg }]}>
                                <AgentIcon size={32} color={agent.color} />
                            </View>
                            <Text style={[styles.agentTag, { color: agent.color }]}>{agent.tag}</Text>
                            <Text style={styles.agentName}>{agent.name}</Text>
                            <Text style={styles.agentTagline}>{agent.tagline}</Text>
                            <Text style={styles.agentDesc}>{agent.desc}</Text>

                            <View style={[styles.tipBanner, { backgroundColor: agent.bg, borderColor: agent.color + '30' }]}>
                                <Star size={14} color={agent.color} />
                                <Text style={[styles.tipBannerText, { color: agent.color }]}>{agent.tip}</Text>
                            </View>
                        </View>

                        {/* Right: steps */}
                        <View style={[styles.agentRight, isDesktop && { borderLeftWidth: 1, borderLeftColor: '#F1F5F9', paddingLeft: 40 }]}>
                            <Text style={styles.stepsLabel}>사용 방법 단계별 안내</Text>
                            {agent.steps.map((step, i) => (
                                <View key={i} style={styles.stepRow}>
                                    <View style={[styles.stepNum, { backgroundColor: agent.color }]}>
                                        <Text style={styles.stepNumText}>{i + 1}</Text>
                                    </View>
                                    <Text style={styles.stepText}>{step}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* ─── WORKFLOW OVERVIEW ─── */}
            <View style={[styles.section, { backgroundColor: '#FDF8F3' }]}>
                <View style={styles.inner}>
                    <Text style={styles.sectionTag}>[ 전체 워크플로우 ]</Text>
                    <Text style={styles.sectionTitle}>공고 발견부터 제출까지, 한 흐름으로</Text>
                    <View style={[styles.flowRow, !isDesktop && { flexDirection: 'column' }]}>
                        {[
                            { num: '01', label: '공고 발견', sub: '공고 탐색에서\n원하는 공고 찾기', icon: ClipboardList, color: '#10B981' },
                            { num: '02', label: '전략 분석', sub: 'Nexus Flow로\n평가 기준 파악', icon: Zap, color: '#7C3AED' },
                            { num: '03', label: '초안 작성', sub: 'Nexus Edit로\n사업계획서 완성', icon: FileEdit, color: '#0EA5E9' },
                            { num: '04', label: '저장 & 반복', sub: 'Portfolio에 저장,\n다음 공고에 재활용', icon: FolderKanban, color: '#F59E0B' },
                        ].map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <React.Fragment key={i}>
                                    <View style={styles.flowStep}>
                                        <View style={[styles.flowIcon, { backgroundColor: step.color + '15' }]}>
                                            <Icon size={24} color={step.color} />
                                        </View>
                                        <Text style={styles.flowNum}>{step.num}</Text>
                                        <Text style={styles.flowLabel}>{step.label}</Text>
                                        <Text style={styles.flowSub}>{step.sub}</Text>
                                    </View>
                                    {i < 3 && isDesktop && (
                                        <View style={styles.flowArrow}>
                                            <ArrowRight size={20} color="#CBD5E1" />
                                        </View>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* ─── FAQ ─── */}
            <View style={styles.section}>
                <View style={styles.inner}>
                    <Text style={styles.sectionTag}>[ FAQ ]</Text>
                    <Text style={styles.sectionTitle}>자주 묻는 질문</Text>
                    <View style={styles.faqList}>
                        {FAQS.map((faq, i) => (
                            <View key={i} style={styles.faqItem}>
                                <TouchableOpacity
                                    onPress={() => setOpenFaq(openFaq === i ? null : i)}
                                    style={styles.faqQ}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.faqQText}>{faq.q}</Text>
                                    {openFaq === i
                                        ? <ChevronUp size={18} color="#7C3AED" />
                                        : <ChevronDown size={18} color="#94A3B8" />}
                                </TouchableOpacity>
                                {openFaq === i && (
                                    <View style={styles.faqA}>
                                        <Text style={styles.faqAText}>{faq.a}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* ─── CAUTION BANNER ─── */}
            <View style={[styles.section, { backgroundColor: '#FFF7ED', paddingVertical: 48 }]}>
                <View style={styles.inner}>
                    <View style={styles.cautionCard}>
                        <AlertTriangle size={24} color="#F59E0B" />
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={styles.cautionTitle}>제출 전 반드시 확인하세요</Text>
                            <Text style={styles.cautionDesc}>
                                AI가 생성한 초안은 반드시 직접 검토 후 제출해야 합니다. 회사 고유의 실적·수치·사례를 추가하고, 공고 요건과 일치하는지 확인하세요. Publica는 초안 작성 도구이며 최종 책임은 사용자에게 있습니다.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={{ height: 80 }} />
        </ScrollView>
    );
};

/* ──────────────────────────────────────────────
   STYLES
   ────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },

    header: { paddingHorizontal: 48, paddingTop: 64, paddingBottom: 56, backgroundColor: '#FFFFFF' },
    headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F3FF', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, alignSelf: 'flex-start', marginBottom: 24, borderWidth: 1, borderColor: '#DDD6FE' },
    headerBadgeText: { color: '#7C3AED', fontWeight: '800', fontSize: 12 },
    headerTitle: { color: '#18181B', fontSize: 40, fontWeight: '900', letterSpacing: -1, lineHeight: 52, marginBottom: 20 },
    headerSub: { color: '#64748B', fontSize: 17, lineHeight: 30, fontWeight: '500' },

    section: { paddingVertical: 80, alignItems: 'center' },
    inner: { width: '100%', maxWidth: 1200, paddingHorizontal: 48 },
    sectionTag: { color: '#7C3AED', fontWeight: '800', fontSize: 12, letterSpacing: 2, marginBottom: 12 },
    sectionTitle: { color: '#18181B', fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 48 },

    tipsGrid: { gap: 16 },
    tipsGridRow: { flexDirection: 'row' },
    tipCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
    tipIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    tipTitle: { color: '#18181B', fontWeight: '800', fontSize: 15, marginBottom: 8 },
    tipDesc: { color: '#64748B', fontSize: 13, lineHeight: 20 },

    tabScroll: { marginBottom: 32 },
    tabRow: { flexDirection: 'row', gap: 10 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
    tabText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },

    agentCard: { backgroundColor: '#FAFAFA', borderRadius: 32, padding: 40, borderWidth: 1, borderColor: '#F1F5F9', gap: 40 },
    agentCardRow: { flexDirection: 'row', alignItems: 'flex-start' },
    agentLeft: { flex: 1 },
    agentRight: { flex: 1 },
    agentIconBox: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    agentTag: { fontWeight: '800', fontSize: 12, letterSpacing: 1, marginBottom: 8 },
    agentName: { color: '#18181B', fontSize: 26, fontWeight: '900', marginBottom: 8 },
    agentTagline: { color: '#7C3AED', fontSize: 16, fontWeight: '700', marginBottom: 16 },
    agentDesc: { color: '#475569', fontSize: 14, lineHeight: 24, marginBottom: 24 },
    tipBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1 },
    tipBannerText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 20 },
    stepsLabel: { color: '#94A3B8', fontWeight: '800', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 20 },
    stepNum: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    stepNumText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
    stepText: { color: '#18181B', fontWeight: '600', fontSize: 14, lineHeight: 22, flex: 1, paddingTop: 4 },

    flowRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
    flowStep: { flex: 1, alignItems: 'center', gap: 12 },
    flowIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    flowNum: { color: '#CBD5E1', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    flowLabel: { color: '#18181B', fontSize: 16, fontWeight: '800' },
    flowSub: { color: '#64748B', fontSize: 12, textAlign: 'center', lineHeight: 18 },
    flowArrow: { paddingHorizontal: 8 },

    faqList: { gap: 12 },
    faqItem: { borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', backgroundColor: '#FFFFFF' },
    faqQ: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, gap: 16 },
    faqQText: { flex: 1, color: '#18181B', fontWeight: '700', fontSize: 15 },
    faqA: { backgroundColor: '#FAFAFA', padding: 24, paddingTop: 0 },
    faqAText: { color: '#475569', fontSize: 14, lineHeight: 24 },

    cautionCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#FDE68A' },
    cautionTitle: { color: '#92400E', fontWeight: '800', fontSize: 16, marginBottom: 8 },
    cautionDesc: { color: '#78350F', fontSize: 14, lineHeight: 22 },
});
