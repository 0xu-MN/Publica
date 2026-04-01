import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Animated, Image, StyleSheet, Platform, StatusBar } from 'react-native';
import { ArrowRight, Sparkles, FileEdit, Download, CheckCircle2, ChevronRight, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Footer from './Footer';

interface LandingPageProps {
    onLoginPress: () => void;
    onStartFree: () => void;
    onNavigateToPricing: () => void;
}

const FEATURES = [
    {
        id: '01',
        icon: <Sparkles size={24} color="#7C3AED" />,
        tag: 'AI 전략 수립',
        title: 'NEXUS Flow',
        desc: '지원사업 공고를 1초 만에 분석하여, 제출해야 할 문서의 핵심 항목을 시각적 전략 트리로 전개합니다.',
        active: true,
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop'
    },
    {
        id: '02',
        icon: <FileEdit size={24} color="#7C3AED" />,
        tag: '자동 작성',
        title: 'NEXUS Edit',
        desc: 'PSST 프레임워크에 특화된 사업계획서 텍스트 초안을 AI가 자동 작성하고 실시간으로 검수합니다.',
        active: false
    },
    {
        id: '03',
        icon: <Download size={24} color="#7C3AED" />,
        tag: '양식 매핑',
        title: 'HWPX/DOCX 매핑',
        desc: 'AI가 작성한 내용을 실제 서식 파일의 정확한 셀 좌표에 자동 병합하여 완성된 파일을 다운로드하세요.',
        active: false
    }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginPress, onStartFree }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    
    // Animations
    const heroFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(30)).current;
    const cardsOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(heroFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(heroSlide, { toValue: 0, duration: 1000, useNativeDriver: true }),
            Animated.timing(cardsOpacity, { toValue: 1, duration: 1000, delay: 400, useNativeDriver: true })
        ]).start();
    }, []);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="dark-content" />
            
            {/* ═══════════ HERO SECTION ═══════════ */}
            <View style={styles.heroWrapper}>
                <Animated.View style={[styles.heroCard, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2564&auto=format&fit=crop' }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['rgba(253, 248, 243, 0.95)', 'rgba(253, 248, 243, 0.6)', 'rgba(253, 248, 243, 0.95)']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.heroContent}>
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>기업 맞춤형 최적의 공공사업 확보 솔루션</Text>
                        </View>
                        <Text style={[styles.heroTitle, { fontSize: isDesktop ? 64 : 40, lineHeight: isDesktop ? 76 : 52 }]}>
                            사업계획서,{'\n'}
                            <Text style={styles.accentText}>AI</Text>가 대신 써드립니다
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            전국 30,000개 기관의 공고를 맞춤형으로 추천받고,{'\n'}
                            공고 분석부터 작성까지 AI와 단 10분 만에 끝내세요.
                        </Text>
                        
                        <TouchableOpacity onPress={onStartFree} style={styles.ctaBtn}>
                            <Text style={styles.ctaBtnText}>지금 무료로 체험하기</Text>
                            <View style={styles.ctaIconBox}>
                                <ArrowRight size={18} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>

            {/* ═══════════ FEATURES SECTION ═══════════ */}
            <View style={styles.section}>
                <View style={styles.contentContainer}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTag}>[ PUBLIC SERVICES ]</Text>
                            <Text style={styles.sectionTitle}>한 발 앞선 공공사업 성공 관리</Text>
                        </View>
                        <Text style={styles.sectionDesc}>
                            기획 탈락의 위험을 줄이고 합격률을 압도적으로 높이는{'\n'}
                            Publica만의 독자적인 AI 기술을 만나보세요.
                        </Text>
                    </View>

                    <Animated.View style={[styles.featureGrid, { opacity: cardsOpacity }, isDesktop ? styles.row : styles.col]}>
                        {FEATURES.map((feature, idx) => (
                            <View key={idx} style={[styles.featureCard, isDesktop && styles.featureCardBorder]}>
                                <View style={styles.featureIconBox}>
                                    {feature.icon}
                                </View>
                                <Text style={styles.featureId}>{feature.id}</Text>
                                <Text style={styles.featureLabel}>{feature.title}</Text>
                                <Text style={styles.featureDesc}>{feature.desc}</Text>
                                {feature.active && feature.image && (
                                    <View style={styles.featureImageWrapper}>
                                        <Image source={{ uri: feature.image }} style={styles.featureImage} />
                                        <LinearGradient
                                            colors={['transparent', 'rgba(255,255,255,0.8)']}
                                            style={StyleSheet.absoluteFill}
                                        />
                                    </View>
                                )}
                            </View>
                        ))}
                    </Animated.View>
                </View>
            </View>

            {/* ═══════════ PROCESS SECTION ═══════════ */}
            <View style={[styles.section, { backgroundColor: '#FDF8F3' }]}>
                <View style={styles.contentContainer}>
                    <View style={styles.processLayout}>
                        <View style={styles.processInfo}>
                            <Text style={styles.sectionTag}>[ OUR PROCESS ]</Text>
                            <Text style={styles.sectionTitle}>혁신적인{'\n'}프로세스</Text>
                            <Text style={styles.processSub}>
                                구조화된 4단계의 자동화 워크플로우를 통해{'\n'}복잡한 서류 작업을 가장 효율적으로 처리합니다.
                            </Text>
                            <View style={styles.checkList}>
                                <CheckItem text="3만개 기관 공고 실시간 수집" />
                                <CheckItem text="AI 기반 지원 전략 자동 수립" />
                                <CheckItem text="정부 양식 100% 매핑 지원" />
                            </View>
                        </View>

                        <View style={styles.processSteps}>
                            {[
                                { num: '01', title: '공고 분석', desc: '심사위원의 필수 평가 요소를 도출합니다.', icon: <Zap size={20} color="#7C3AED" /> },
                                { num: '02', title: '전략 수립', desc: '독창적인 해결 가설을 구축합니다.', icon: <Sparkles size={20} color="#7C3AED" /> },
                                { num: '03', title: '상세 작성', desc: '논리적인 본문을 자동 작성합니다.', icon: <FileEdit size={20} color="#7C3AED" /> },
                                { num: '04', title: '최종 매핑', desc: '정부 서식에 픽셀 단위로 병합합니다.', icon: <Download size={20} color="#7C3AED" /> },
                            ].map((step, idx) => (
                                <View key={idx} style={styles.stepCard}>
                                    <Text style={styles.stepNum}>{step.num}</Text>
                                    <View style={styles.stepIcon}>{step.icon}</View>
                                    <View>
                                        <Text style={styles.stepTitle}>{step.title}</Text>
                                        <Text style={styles.stepDesc}>{step.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            <Footer />
        </ScrollView>
    );
};

const CheckItem = ({ text }: { text: string }) => (
    <View style={styles.checkRow}>
        <CheckCircle2 size={16} color="#7C3AED" />
        <Text style={styles.checkText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    heroWrapper: { width: '100%', alignItems: 'center', paddingVertical: 40 },
    heroCard: {
        width: '94%', maxWidth: 1400, height: 600, borderRadius: 48,
        overflow: 'hidden', backgroundColor: '#FDF8F3', elevation: 15,
        shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 30,
        position: 'relative'
    },
    heroContent: { flex: 1, paddingLeft: '8%', justifyContent: 'center', zIndex: 10 },
    tagBadge: {
        backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 999, alignSelf: 'flex-start', marginBottom: 24
    },
    tagText: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
    heroTitle: { color: '#18181b', fontWeight: '900', letterSpacing: -1 },
    accentText: { color: '#7C3AED' },
    heroSubtitle: { color: '#4b5563', fontSize: 18, marginTop: 32, lineHeight: 30, fontWeight: '500' },
    ctaBtn: {
        backgroundColor: '#18181b', paddingHorizontal: 32, paddingVertical: 20,
        borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginTop: 48,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15,
        alignSelf: 'flex-start'
    },
    ctaBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800', marginRight: 16 },
    ctaIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    
    section: { paddingVertical: 120, width: '100%', alignItems: 'center' },
    contentContainer: { width: '100%', maxWidth: 1400, paddingHorizontal: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 80 },
    sectionTag: { color: '#7C3AED', fontWeight: '800', letterSpacing: 2, fontSize: 12, marginBottom: 16 },
    sectionTitle: { color: '#18181b', fontSize: 44, fontWeight: '900', letterSpacing: -1 },
    sectionDesc: { color: '#64748B', fontSize: 16, textAlign: 'right', lineHeight: 28 },
    
    row: { flexDirection: 'row' },
    col: { flexDirection: 'column' },
    featureGrid: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    featureCard: { flex: 1, padding: 40, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    featureCardBorder: { borderRightWidth: 1, borderRightColor: '#F1F5F9' },
    featureIconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#FDF8F3', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#7C3AED22' },
    featureId: { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 8 },
    featureLabel: { color: '#18181b', fontSize: 24, fontWeight: '800', marginBottom: 16 },
    featureDesc: { color: '#64748B', fontSize: 15, lineHeight: 24 },
    featureImageWrapper: { height: 200, borderRadius: 24, marginTop: 40, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    featureImage: { width: '100%', height: '100%' },

    processLayout: { flexDirection: 'row', gap: 60, flexWrap: 'wrap' },
    processInfo: { flex: 1, minWidth: 320 },
    processSub: { color: '#475569', fontSize: 18, marginTop: 24, lineHeight: 32 },
    checkList: { marginTop: 40, gap: 16 },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkText: { color: '#18181b', fontWeight: '600', fontSize: 16 },
    
    processSteps: { flex: 1.2, minWidth: 320, gap: 16 },
    stepCard: {
        backgroundColor: '#FFF', padding: 24, borderRadius: 24,
        flexDirection: 'row', alignItems: 'center', gap: 20,
        borderWidth: 1, borderColor: '#F1F5F9', elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10
    },
    stepNum: { color: '#F1F5F9', fontSize: 40, fontWeight: '900', position: 'absolute', right: 24, top: 12 },
    stepIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FDF8F3', alignItems: 'center', justifyContent: 'center' },
    stepTitle: { color: '#18181b', fontSize: 18, fontWeight: '800', marginBottom: 4 },
    stepDesc: { color: '#64748B', fontSize: 14 }
});
