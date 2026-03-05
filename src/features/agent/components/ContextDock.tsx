import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Platform } from 'react-native';
import { FileText, Edit3, FileIcon, X, ChevronLeft, ChevronRight, Settings2, Sparkles, FileDown, Copy, Minus, Send } from 'lucide-react-native';
import { GrantContentPanel } from './GrantContentPanel';

// Lazy load PDFViewerPanel
const PDFViewerPanel = React.lazy(() =>
    import('./PDFViewerPanel').then(module => ({ default: module.PDFViewerPanel }))
) as any;

type DockTab = 'grant' | 'editor' | 'pdf';

interface ContextDockProps {
    grantUrl?: string | null;
    grantTitle?: string;
    pdfUrl?: string | null;
    onClose: () => void;
    onMinimizeToggle?: (minimized: boolean) => void;
    onQuote?: (text: string, x: number, y: number, type?: string, context?: any) => void;
    onExplainSection?: (text: string, x: number, y: number, context?: any) => void;
    onAIGenerate?: () => Promise<string | null>;
    brainstormContent?: string;
    onBrainstormChange?: (text: string) => void;
    onSendToEdit?: () => void;
}

/**
 * ContextDock — 좌측 패널 멀티모달 탭 시스템
 * 📄 원문 (공고문) / ✏️ 작성 (에디터) / 📎 PDF (문서 분석)
 * 닫기 버튼 = 축소 모드로 전환 (완전히 사라지지 않음)
 */
export const ContextDock: React.FC<ContextDockProps> = ({
    grantUrl,
    grantTitle,
    pdfUrl,
    onClose,
    onMinimizeToggle,
    onQuote,
    onExplainSection,
    onAIGenerate,
    brainstormContent: externalBrainstorm,
    onBrainstormChange,
    onSendToEdit,
}) => {
    const getInitialTab = (): DockTab => {
        if (grantUrl) return 'grant';
        if (pdfUrl) return 'pdf';
        return 'editor';
    };

    const [activeTab, setActiveTab] = useState<DockTab>(getInitialTab());
    const [minimized, setMinimized] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (pdfUrl) setActiveTab('pdf');
    }, [pdfUrl]);

    // Brainstorm memo state
    const [memoText, setMemoText] = useState(externalBrainstorm || '');
    const [isSaved, setIsSaved] = useState(true);

    useEffect(() => {
        if (externalBrainstorm !== undefined && externalBrainstorm !== memoText) {
            setMemoText(externalBrainstorm);
        }
    }, [externalBrainstorm]);

    const handleMemoChange = (text: string) => {
        setMemoText(text);
        setIsSaved(false);
        onBrainstormChange?.(text);
        // Auto-mark as saved after debounce
        setTimeout(() => setIsSaved(true), 1500);
    };

    const tabs: { key: DockTab; label: string; emoji: string; available: boolean }[] = [
        { key: 'grant', label: '원문', emoji: '📄', available: !!grantUrl },
        { key: 'editor', label: '메모', emoji: '📝', available: true },
        { key: 'pdf', label: 'PDF', emoji: '📎', available: !!pdfUrl },
    ];
    const availableTabs = tabs.filter(t => t.available);

    const getTabColor = (tab: DockTab) => {
        switch (tab) {
            case 'grant': return '#10B981';
            case 'editor': return '#8B5CF6';
            case 'pdf': return '#3B82F6';
        }
    };

    // 🌟 MINIMIZED STATE — Just a vertical tab strip
    if (minimized) {
        return (
            <View style={styles.minimizedContainer}>
                {availableTabs.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.miniTab, activeTab === tab.key && { backgroundColor: getTabColor(tab.key) + '22' }]}
                        onPress={() => {
                            setActiveTab(tab.key);
                            setMinimized(false);
                            if (onMinimizeToggle) onMinimizeToggle(false);
                        }}
                    >
                        <Text style={{ fontSize: 16 }}>{tab.emoji}</Text>
                        <Text style={[styles.miniTabLabel, { color: getTabColor(tab.key) }]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.miniExpandBtn} onPress={() => {
                    setMinimized(false);
                    if (onMinimizeToggle) onMinimizeToggle(false);
                }}>
                    <ChevronRight size={14} color="#64748B" />
                </TouchableOpacity>
            </View>
        );
    }

    const renderBrainstormMemo = () => (
        <View style={styles.editorContainer}>
            {/* Brainstorm Header */}
            <View style={styles.editorToolbar}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} color="#F59E0B" />
                    <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '700' }}>브레인스퇰 메모</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.statusDot, { backgroundColor: isSaved ? '#10B981' : '#F59E0B' }]} />
                    <Text style={{ color: '#475569', fontSize: 10 }}>{isSaved ? '저장됨' : '저장 중...'}</Text>
                </View>
            </View>

            {/* Memo Text Area */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
                <TextInput
                    style={{
                        color: '#E2E8F0', fontSize: 14, lineHeight: 24,
                        textAlignVertical: 'top', minHeight: 300,
                    }}
                    placeholder={'브레인스퇰 내용을 자유롭게 정리하세요...\n\n• 핵심 아이디어\n• 참고할 브랜치 내용\n• 중요 포인트\n\n이 메모는 자동 저장되며,\n"서류 작성하러 가기" 시 Edit으로 전달됩니다.'}
                    placeholderTextColor="#334155"
                    value={memoText}
                    onChangeText={handleMemoChange}
                    multiline={true}
                    numberOfLines={15}
                />
            </ScrollView>

            {/* Bottom Bar: Send to Edit */}
            {onSendToEdit && (
                <View style={styles.editorFooter}>
                    <Text style={styles.footerText}>{memoText.length}자</Text>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
                        onPress={onSendToEdit}
                    >
                        <Send size={12} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Edit으로 보내기</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'grant':
                if (!grantUrl) return null;
                return <GrantContentPanel grantUrl={grantUrl} grantTitle={grantTitle} />;

            case 'editor':
                return renderBrainstormMemo();

            case 'pdf':
                if (!pdfUrl) return null;
                return (
                    <React.Suspense fallback={
                        <View style={styles.loading}><Text style={styles.loadingText}>PDF 로딩 중...</Text></View>
                    }>
                        <PDFViewerPanel
                            url={pdfUrl}
                            onQuote={onQuote}
                            onExplainSection={onExplainSection}
                        />
                    </React.Suspense>
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Tab Header */}
            <View style={styles.tabHeader}>
                <View style={styles.tabRow}>
                    {availableTabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.tab,
                                activeTab === tab.key && [
                                    styles.tabActive,
                                    { borderBottomColor: getTabColor(tab.key) }
                                ],
                            ]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
                            <Text style={[
                                styles.tabLabel,
                                activeTab === tab.key && { color: getTabColor(tab.key) },
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {/* Minimize button (collapse to mini-tab strip) */}
                <TouchableOpacity onPress={() => {
                    setMinimized(true);
                    if (onMinimizeToggle) onMinimizeToggle(true);
                }} style={styles.closeBtn}>
                    <Minus size={16} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={styles.content}>
                {renderContent()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },

    // Minimized strip
    minimizedContainer: {
        width: 56, backgroundColor: '#0a0a0a',
        borderRightWidth: 1, borderColor: '#1E293B',
        paddingTop: 8, alignItems: 'center', gap: 4,
    },
    miniTab: {
        width: 48, paddingVertical: 10, borderRadius: 8,
        alignItems: 'center', gap: 4,
    },
    miniTabLabel: { fontSize: 9, fontWeight: '700' },
    miniExpandBtn: {
        marginTop: 'auto' as any, marginBottom: 12,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#1E293B',
    },

    // Tab Header
    tabHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#111827', borderBottomWidth: 1, borderColor: '#1E293B', paddingRight: 8,
    },
    tabRow: { flexDirection: 'row', flex: 1 },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomWidth: 2 },
    tabLabel: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    closeBtn: { padding: 8 },
    content: { flex: 1 },

    // Loading
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingText: { color: '#94A3B8', fontSize: 13 },

    // Editor Playground
    editorContainer: { flex: 1, backgroundColor: '#0a0a0a' },
    editorToolbar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 8, borderBottomWidth: 1, borderColor: '#1E293B', backgroundColor: '#0F172A',
    },
    modeSelector: { flexDirection: 'row', gap: 4 },
    modeBtn: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
        backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
    },
    modeBtnActive: { backgroundColor: '#8B5CF622', borderColor: '#8B5CF6' },
    modeBtnText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
    modeBtnTextActive: { color: '#8B5CF6' },
    toolBtn: {
        width: 28, height: 28, borderRadius: 6,
        backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center',
    },

    formatBar: {
        flexDirection: 'row', alignItems: 'center', gap: 2,
        paddingHorizontal: 8, paddingVertical: 6,
        borderBottomWidth: 1, borderColor: '#1E293B', backgroundColor: '#0F172A',
    },
    formatBtn: {
        width: 32, height: 28, borderRadius: 4,
        alignItems: 'center', justifyContent: 'center',
    },
    formatDivider: { width: 1, height: 16, backgroundColor: '#1E293B', marginHorizontal: 4 },
    aiBtn: {
        flexDirection: 'row', gap: 4, width: 'auto' as any,
        paddingHorizontal: 8, backgroundColor: '#8B5CF615',
        borderRadius: 6, borderWidth: 1, borderColor: '#8B5CF633',
    },
    aiBtnText: { color: '#8B5CF6', fontSize: 11, fontWeight: '700' },

    editorArea: { flex: 1, padding: 16 },
    editorInput: {
        flex: 1, color: '#E2E8F0', fontSize: 14, lineHeight: 24,
        textAlignVertical: 'top',
    },

    editorFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 8,
        borderTopWidth: 1, borderColor: '#1E293B', backgroundColor: '#0F172A',
    },
    footerText: { color: '#475569', fontSize: 11, fontWeight: '600' },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
});
