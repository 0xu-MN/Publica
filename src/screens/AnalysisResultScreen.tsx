import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { ArrowLeft, CheckCircle, FileText, Share2 } from 'lucide-react-native';

interface AnalysisResult {
    strategy: string;
    initial_draft_content?: string;
}

interface AnalysisResultScreenProps {
    result: AnalysisResult;
    onClose: () => void;
    onOpenDraft?: (content: string) => void;
}

export const AnalysisResultScreen: React.FC<AnalysisResultScreenProps> = ({ result, onClose, onOpenDraft }) => {

    // Simple Markdown Renderer
    const renderMarkdown = (text: string) => {
        if (!text) return null;

        const lines = text.split('\n');
        return lines.map((line, index) => {
            // Header 2 (##)
            if (line.startsWith('## ')) {
                return (
                    <Text key={index} style={styles.mdH2}>
                        {line.replace('## ', '')}
                    </Text>
                );
            }
            // Header 3 (###) or Bold Line
            if (line.startsWith('### ') || line.startsWith('**') && line.endsWith('**')) {
                return (
                    <Text key={index} style={styles.mdH3}>
                        {line.replace(/### |\*\*/g, '')}
                    </Text>
                );
            }
            // Bullet points
            if (line.trim().startsWith('- ')) {
                return (
                    <View key={index} style={styles.mdBulletBox}>
                        <View style={styles.mdBulletDot} />
                        <Text style={styles.mdBulletText}>
                            {parseBold(line.replace('- ', ''))}
                        </Text>
                    </View>
                );
            }
            // Normal paragraph (handle **bold** inside)
            if (line.trim().length > 0) {
                return (
                    <Text key={index} style={styles.mdParagraph}>
                        {parseBold(line)}
                    </Text>
                );
            }
            return <View key={index} style={{ height: 8 }} />;
        });
    };

    // Helper to parse **bold** inside text
    const parseBold = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <Text key={i} style={styles.mdBold}>{part.replace(/\*\*/g, '')}</Text>;
            }
            return <Text key={i}>{part}</Text>;
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={onClose}
                    style={styles.backBtn}
                >
                    <ArrowLeft size={24} color="#18181b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI 전략 분석 결과</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Intro Card */}
                <View style={styles.contentCard}>
                    <View style={styles.introHeader}>
                        <View style={styles.iconBox}>
                            <FileText size={20} color="#7C3AED" />
                        </View>
                        <View>
                            <Text style={styles.cardMainTitle}>맞춤형 합격 전략</Text>
                            <Text style={styles.cardSubTitle}>Gemini Pro Analysis</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    {renderMarkdown(result.strategy)}
                </View>

                {/* Action Suggestion */}
                <View style={styles.tipBox}>
                    <Text style={styles.tipLabel}>💡 다음 단계 추천</Text>
                    <Text style={styles.tipText}>사업계획서 초안 작성하기 (Beta)</Text>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomRow}>
                    <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={() => console.log('Share')}
                    >
                        <Share2 size={20} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.mainActionBtn}
                        onPress={() => {
                            if (onOpenDraft) {
                                onOpenDraft(result.strategy);
                            } else {
                                onClose();
                            }
                        }}
                    >
                        <Text style={styles.mainActionBtnText}>
                            🚀 서류 작성 계획하기
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF8F3' },
    header: {
        paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FDF8F3'
    },
    backBtn: {
        width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
        borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0'
    },
    headerTitle: { color: '#18181b', fontSize: 18, fontWeight: '800' },
    scrollView: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    
    contentCard: {
        backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
        borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    },
    introHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#F5F3FF',
        alignItems: 'center', justifyContent: 'center', marginRight: 14
    },
    cardMainTitle: { color: '#18181b', fontWeight: '800', fontSize: 18, letterSpacing: -0.5 },
    cardSubTitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },

    mdH2: { color: '#18181b', fontSize: 20, fontWeight: '800', marginTop: 24, marginBottom: 12 },
    mdH3: { color: '#7C3AED', fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    mdBulletBox: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, paddingLeft: 4 },
    mdBulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#94A3B8', marginTop: 10, marginRight: 10 },
    mdBulletText: { color: '#475569', fontSize: 16, lineHeight: 26, flex: 1 },
    mdParagraph: { color: '#475569', fontSize: 16, lineHeight: 28, marginBottom: 10 },
    mdBold: { color: '#18181b', fontWeight: '800' },

    tipBox: {
        backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16,
        borderWidth: 1, borderColor: '#F5F3FF', marginBottom: 40,
        shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03, shadowRadius: 6,
    },
    tipLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 6 },
    tipText: { color: '#18181b', fontWeight: '700', fontSize: 15 },

    bottomBar: {
        paddingBottom: 32, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FDF8F3'
    },
    bottomRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 24 },
    shareBtn: {
        flex: 1, backgroundColor: '#FFFFFF', height: 56, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0'
    },
    mainActionBtn: {
        flex: 3, backgroundColor: '#7C3AED', height: 56, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8,
    },
    mainActionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
