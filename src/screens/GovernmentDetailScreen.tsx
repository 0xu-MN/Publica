import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, SafeAreaView, Platform, StatusBar, ActivityIndicator, StyleSheet } from 'react-native';
import { ArrowLeft, Share2, Calendar, Building, CheckCircle, ExternalLink, Globe, Zap, AlertTriangle, XCircle, DollarSign, FileText, MapPin, Phone, Clock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GovernmentDetailScreenProps {
    program: any;
    onBack: () => void;
    onAnalyzeComplete?: (result: any) => void;
    onStartAnalysis?: (program: any) => void;
}

export const GovernmentDetailScreen: React.FC<GovernmentDetailScreenProps> = ({ program, onBack, onAnalyzeComplete, onStartAnalysis }) => {
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [analysisStep, setAnalysisStep] = React.useState(0);

    if (!program) return null;

    const openUrl = (url: string) => {
        if (Platform.OS === 'web') {
            window.open(url, '_blank');
        } else {
            Linking.openURL(url);
        }
    };

    const handleOpenOriginal = () => {
        const url = program.application_url || program.original_url || program.link;
        if (url) openUrl(url);
    };

    const handleDownloadFile = () => {
        // Open the application page where official files/documents can be found
        const url = program.application_url || program.original_url || program.link;
        if (url) openUrl(url);
    };

    const handleShare = () => {
        console.log('Share pressed');
    };

    const handleAnalyze = async () => {
        if (onStartAnalysis) {
            onStartAnalysis(program);
            return;
        }

        // Fallback for demo simulation if onStartAnalysis is not provided
        setIsAnalyzing(true);
        setAnalysisStep(1);
        setTimeout(() => setAnalysisStep(2), 1500);
        setTimeout(() => setAnalysisStep(3), 3000);

        setTimeout(() => {
            const mockResult = {
                strategy: `## 🎯 Strategy for ${program.title}\n\n**Analysis:** Strong match for your profile.\n\n**Key Strengths:**\n- Matches ${program.tech_field}\n- Fits Graduate Student status.`,
            };
            setIsAnalyzing(false);
            if (onAnalyzeComplete) onAnalyzeComplete(mockResult);
        }, 4500);
    };

    // Helper to render bullet-point text
    const renderBulletList = (text: string, icon: 'check' | 'x' | 'dot' = 'check') => {
        if (!text) return null;
        const lines = text.split('\n').filter(l => l.trim());
        return lines.map((line, i) => {
            const cleanLine = line.replace(/^[•\-\s]+/, '').trim();
            if (!cleanLine) return null;

            return (
                <View key={i} style={styles.bulletRow}>
                    {icon === 'check' && <CheckCircle size={15} color="#7C3AED" style={{ marginTop: 3 }} />}
                    {icon === 'x' && <XCircle size={15} color="#EF4444" style={{ marginTop: 3 }} />}
                    {icon === 'dot' && <View style={styles.bulletDot} />}
                    <Text style={styles.bulletText}>
                        {cleanLine.replace(/\*\*/g, '')}
                    </Text>
                </View>
            );
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerIconBtn}>
                    <ArrowLeft size={24} color="#27272a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    공고 상세 정보
                </Text>
                <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
                    <Share2 size={22} color="#27272a" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.scroll} 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 140 }}
            >
                {/* Hero / Cover Section */}
                <View style={styles.heroSection}>
                    <LinearGradient
                        colors={['#7C3AED08', '#FDF8F3']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />

                    <View style={styles.heroContent}>
                        {/* Badges */}
                        <View style={styles.badgeRow}>
                            {program.d_day && (
                                <View style={styles.dDayBadge}>
                                    <Text style={styles.dDayText}>{program.d_day}</Text>
                                </View>
                            )}
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{program.status || '모집중'}</Text>
                            </View>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{program.category}</Text>
                            </View>
                        </View>

                        <Text style={styles.titleText}>{program.title}</Text>

                        <View style={styles.agencyRow}>
                            <Building size={16} color="#64748B" />
                            <Text style={styles.agencyName}>{program.agency}</Text>
                            {program.department && (
                                <Text style={styles.departmentName}> · {program.department}</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.quickInfoGrid}>
                            {program.application_period && (
                                <View style={styles.quickInfoItem}>
                                    <View style={styles.quickIconBox}>
                                        <Calendar size={14} color="#7C3AED" />
                                    </View>
                                    <View>
                                        <Text style={styles.quickLabel}>신청기간</Text>
                                        <Text style={styles.quickValueText}>{program.application_period}</Text>
                                    </View>
                                </View>
                            )}
                            {program.budget && (
                                <View style={styles.quickInfoItem}>
                                    <View style={[styles.quickIconBox, { backgroundColor: '#10B98110' }]}>
                                        <DollarSign size={14} color="#10B981" />
                                    </View>
                                    <View>
                                        <Text style={styles.quickLabel}>지원금액</Text>
                                        <Text style={[styles.quickValueText, { color: '#10B981' }]}>{program.budget}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Content Cards */}
                <View style={styles.contentContainer}>
                    {/* 📋 사업 개요 */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>📋</Text>
                            <Text style={styles.cardTitle}>사업 개요</Text>
                        </View>
                        {program.description && (
                            <Text style={styles.cardDescText}>
                                {program.description}
                            </Text>
                        )}
                        
                        <View style={styles.summaryGrid}>
                            {program.target_audience && (
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>지원대상</Text>
                                    <Text style={styles.summaryValue}>{program.target_audience}</Text>
                                </View>
                            )}
                            {program.region && (
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>지역</Text>
                                    <Text style={styles.summaryValue}>{program.region}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* ⚠️ 자격 요건 */}
                    {program.eligibility && (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardIcon}>⚠️</Text>
                                <Text style={styles.cardTitle}>자격 요건</Text>
                            </View>
                            <View style={styles.eligibilityBox}>
                                <Text style={styles.eligibilitySubTitle}>필수 요건</Text>
                                {renderBulletList(program.eligibility, 'check')}
                            </View>
                        </View>
                    )}

                    {/* ❌ 제외 대상 */}
                    {program.exclusions && (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardIcon}>❌</Text>
                                <Text style={styles.cardTitle}>제외 대상</Text>
                            </View>
                            <View style={styles.exclusionBox}>
                                {renderBulletList(program.exclusions, 'x')}
                            </View>
                        </View>
                    )}

                    {/* 💰 지원 내용 */}
                    {program.support_details && (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardIcon}>💰</Text>
                                <Text style={styles.cardTitle}>지원 내용</Text>
                            </View>
                            <View style={styles.supportBox}>
                                {renderBulletList(program.support_details, 'dot')}
                            </View>
                        </View>
                    )}

                    {/* 📄 신청 서류 */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>📄</Text>
                            <Text style={styles.cardTitle}>제출 서류</Text>
                        </View>
                        <View style={styles.documentList}>
                            <View style={styles.docItem}>
                                <CheckCircle size={16} color="#CBD5E1" />
                                <Text style={styles.docItemText}>사업계획서 (필수)</Text>
                            </View>
                            <View style={styles.docItem}>
                                <CheckCircle size={16} color="#CBD5E1" />
                                <Text style={styles.docItemText}>사업자등록증 원본</Text>
                            </View>
                            <View style={styles.docItem}>
                                <CheckCircle size={16} color="#CBD5E1" />
                                <Text style={styles.docItemText}>국세/지방세 납세증명서</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleDownloadFile}
                            style={styles.originalLinkBtn}
                        >
                            <View style={styles.originalLinkLeft}>
                                <View style={styles.globeIconBox}>
                                    <Globe size={18} color="#7C3AED" />
                                </View>
                                <View>
                                    <Text style={styles.originalLinkTitle}>공고문 원본 및 서식 확인</Text>
                                    <Text style={styles.originalLinkSub}>주관 기관 공식 홈페이지로 이동합니다</Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Analysis Overlay */}
            {isAnalyzing && (
                <View style={styles.overlay}>
                    <View style={styles.analysisModal}>
                        <ActivityIndicator size="large" color="#7C3AED" style={{ marginBottom: 24 }} />
                        <Text style={styles.analysisTitle}>AI 전략 분석 중...</Text>
                        <View style={styles.analysisSteps}>
                            <View style={styles.analysisStepItem}>
                                <View style={[styles.stepDot, analysisStep >= 1 && styles.stepDotActive]} />
                                <Text style={[styles.stepText, analysisStep >= 1 && styles.stepTextActive]}>공고문 핵심 지표 추출</Text>
                            </View>
                            <View style={styles.analysisStepItem}>
                                <View style={[styles.stepDot, analysisStep >= 2 && styles.stepDotActive, { backgroundColor: '#818CF8' }]} />
                                <Text style={[styles.stepText, analysisStep >= 2 && styles.stepTextActive]}>합격 가능성 및 리스크 진단</Text>
                            </View>
                            <View style={styles.analysisStepItem}>
                                <View style={[styles.stepDot, analysisStep >= 3 && styles.stepDotActive, { backgroundColor: '#10B981' }]} />
                                <Text style={[styles.stepText, analysisStep >= 3 && styles.stepTextActive]}>맞춤형 사업계획서 가이드 생성</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        onPress={handleOpenOriginal}
                        style={styles.secondaryBtn}
                    >
                        <Text style={styles.secondaryBtnText}>원문 보기</Text>
                        <ExternalLink size={18} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleAnalyze}
                        style={styles.primaryBtn}
                    >
                        <Zap size={18} color="white" fill="white" />
                        <Text style={styles.primaryBtnText}>AI 전략 분석 시작</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF8F3' },
    header: { 
        height: 64, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderColor: '#F1F5F9'
    },
    headerIconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#27272a', letterSpacing: -0.5 },
    
    scroll: { flex: 1 },
    heroSection: { minHeight: 280, paddingTop: 40, paddingBottom: 60 },
    heroContent: { paddingHorizontal: 28 },
    badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    dDayBadge: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    dDayText: { color: 'white', fontSize: 12, fontWeight: '900' },
    statusBadge: { backgroundColor: '#7C3AED10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#7C3AED20' },
    statusText: { color: '#7C3AED', fontSize: 12, fontWeight: '800' },
    categoryBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    categoryText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
    
    titleText: { fontSize: 26, fontWeight: '900', color: '#27272a', lineHeight: 36, marginBottom: 20, letterSpacing: -1 },
    agencyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    agencyName: { color: '#475569', fontSize: 15, fontWeight: '700', marginLeft: 8 },
    departmentName: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 24, width: '100%' },
    
    quickInfoGrid: { flexDirection: 'row', gap: 24 },
    quickInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    quickIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#7C3AED08', alignItems: 'center', justifyContent: 'center' },
    quickLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', marginBottom: 2 },
    quickValueText: { color: '#475569', fontSize: 14, fontWeight: '800' },

    contentContainer: { paddingHorizontal: 20, marginTop: -32, gap: 16 },
    card: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 28, 
        padding: 24, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
    cardIcon: { fontSize: 18 },
    cardTitle: { fontSize: 17, fontWeight: '900', color: '#27272a', letterSpacing: -0.5 },
    cardDescText: { color: '#475569', fontSize: 14, lineHeight: 24, fontWeight: '500', marginBottom: 20 },
    
    summaryGrid: { flexDirection: 'row', gap: 12 },
    summaryItem: { flex: 1, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    summaryLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', marginBottom: 4 },
    summaryValue: { color: '#27272a', fontSize: 13, fontWeight: '800' },

    eligibilityBox: { backgroundColor: '#FDF8F3', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#7C3AED10' },
    eligibilitySubTitle: { color: '#7C3AED', fontSize: 12, fontWeight: '900', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    bulletRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#94A3B8', marginTop: 8 },
    bulletText: { color: '#475569', fontSize: 14, lineHeight: 22, fontWeight: '500', flex: 1 },

    exclusionBox: { backgroundColor: '#FEF2F2', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#FEE2E2' },
    supportBox: { gap: 4 },
    
    documentList: { marginBottom: 20 },
    docItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    docItemText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
    
    originalLinkBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        backgroundColor: '#F8FAFC', 
        padding: 16, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: '#F1F5F9' 
    },
    originalLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    globeIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#7C3AED08', alignItems: 'center', justifyContent: 'center' },
    originalLinkTitle: { color: '#27272a', fontSize: 14, fontWeight: '800' },
    originalLinkSub: { color: '#94A3B8', fontSize: 12, marginTop: 2, fontWeight: '500' },

    bottomBar: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: '#FFFFFF', 
        paddingHorizontal: 24, 
        paddingTop: 16, 
        borderTopWidth: 1, 
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    actionRow: { flexDirection: 'row', gap: 12 },
    secondaryBtn: { 
        flex: 1, 
        height: 56, 
        borderRadius: 18, 
        backgroundColor: '#F8FAFC', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    secondaryBtnText: { color: '#64748B', fontSize: 15, fontWeight: '800' },
    primaryBtn: { 
        flex: 2, 
        height: 56, 
        borderRadius: 18, 
        backgroundColor: '#7C3AED', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 10,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '900' },

    overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    analysisModal: { backgroundColor: '#FFFFFF', padding: 32, borderRadius: 32, width: '85%', maxWidth: 400, alignItems: 'center' },
    analysisTitle: { color: '#27272a', fontSize: 22, fontWeight: '900', marginBottom: 32, letterSpacing: -0.5 },
    analysisSteps: { width: '100%', gap: 20 },
    analysisStepItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E2E8F0' },
    stepDotActive: { backgroundColor: '#7C3AED' },
    stepText: { color: '#94A3B8', fontSize: 15, fontWeight: '700' },
    stepTextActive: { color: '#27272a' },
});
