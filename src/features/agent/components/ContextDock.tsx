import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Platform } from 'react-native';
import { FileText, Edit3, FileIcon, X, ChevronLeft, ChevronRight, Settings2, Sparkles, FileDown, Copy, Minus } from 'lucide-react-native';
import { GrantContentPanel } from './GrantContentPanel';
import { NotionEditor } from './NotionEditor';

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

    // Editor state
    const [editorContent, setEditorContent] = useState('');
    const [editorHtml, setEditorHtml] = useState('');
    const [editorMode, setEditorMode] = useState<'사업계획서' | '제안서' | '자유형식'>('사업계획서');

    const tabs: { key: DockTab; label: string; emoji: string; available: boolean }[] = [
        { key: 'grant', label: '원문', emoji: '📄', available: !!grantUrl },
        { key: 'editor', label: '작성', emoji: '✏️', available: true },
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

    const renderEditorPlayground = () => (
        <View style={styles.editorContainer}>
            {/* Editor Toolbar — shadcn playground style */}
            <View style={styles.editorToolbar}>
                <View style={styles.modeSelector}>
                    {(['\uc0ac\uc5c5\uacc4\ud68d\uc11c', '\uc81c\uc548\uc11c', '\uc790\uc720\ud615\uc2dd'] as const).map(mode => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.modeBtn, editorMode === mode && styles.modeBtnActive]}
                            onPress={() => setEditorMode(mode)}
                        >
                            <Text style={[styles.modeBtnText, editorMode === mode && styles.modeBtnTextActive]}>
                                {mode}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity style={styles.toolBtn} onPress={() => {
                        if (!editorHtml || Platform.OS !== 'web') return;
                        try {
                            const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Doc Export</title></head><body>";
                            const footer = "</body></html>";
                            const sourceHTML = header + editorHtml + footer;
                            const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
                            const fileDownload = document.createElement("a");
                            document.body.appendChild(fileDownload);
                            fileDownload.href = source;
                            fileDownload.download = 'business_plan_draft.doc';
                            fileDownload.click();
                            document.body.removeChild(fileDownload);
                        } catch (e) {
                            console.error("Export DOC failed", e);
                        }
                    }}>
                        <Text style={{ fontSize: 12, marginRight: 4 }}>DOC</Text>
                        <FileDown size={12} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.toolBtn} onPress={() => {
                        if (!editorHtml || Platform.OS !== 'web') return;
                        try {
                            const iframe = document.createElement('iframe');
                            iframe.style.display = 'none';
                            document.body.appendChild(iframe);
                            const doc = iframe.contentWindow?.document;
                            if (doc) {
                                doc.open();
                                doc.write(`
                                    <html>
                                        <head>
                                            <title>Business_Plan_Draft</title>
                                            <style>
                                                body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #000; padding: 40px; }
                                                h1, h2, h3 { color: #111; }
                                                hr { border: 0; border-top: 1px solid #ccc; margin: 20px 0; }
                                            </style>
                                        </head>
                                        <body>${editorHtml}</body>
                                    </html>
                                `);
                                doc.close();
                                setTimeout(() => {
                                    iframe.contentWindow?.focus();
                                    iframe.contentWindow?.print();
                                    setTimeout(() => document.body.removeChild(iframe), 1000);
                                }, 250);
                            }
                        } catch (e) {
                            console.error("PDF Export failed", e);
                        }
                    }}>
                        <Text style={{ fontSize: 12, marginRight: 4 }}>PDF</Text>
                        <FileDown size={12} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Compact AI Bar */}
            <View style={styles.formatBar}>
                <TouchableOpacity
                    style={[styles.formatBtn, styles.aiBtn, isGenerating && { opacity: 0.5 }]}
                    disabled={isGenerating}
                    onPress={async () => {
                        if (onAIGenerate) {
                            setIsGenerating(true);
                            try {
                                const draft = await onAIGenerate();
                                if (draft) setEditorContent(draft);
                            } finally {
                                setIsGenerating(false);
                            }
                        }
                    }}
                >
                    {isGenerating ? <Text style={{ fontSize: 10, color: '#8B5CF6' }}>{'\u23f3'}</Text> : <Sparkles size={12} color="#8B5CF6" />}
                    <Text style={styles.aiBtnText}>{isGenerating ? 'AI \uc791\uc131 \uc911...' : 'AI \uc791\uc131'}</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <Text style={{ color: '#334155', fontSize: 10 }}>{editorMode}</Text>
            </View>

            {/* Notion-Style Editor */}
            <NotionEditor
                initialContent={editorHtml}
                placeholder={editorMode === '\uc0ac\uc5c5\uacc4\ud68d\uc11c'
                    ? '/ \ub97c \uc785\ub825\ud558\uc5ec \uc0ac\uc5c5\uacc4\ud68d\uc11c \uc791\uc131\uc744 \uc2dc\uc791\ud558\uc138\uc694...'
                    : editorMode === '\uc81c\uc548\uc11c'
                        ? '/ \ub97c \uc785\ub825\ud558\uc5ec \uc81c\uc548\uc11c \uc791\uc131\uc744 \uc2dc\uc791\ud558\uc138\uc694...'
                        : '/ \ub97c \uc785\ub825\ud558\uc5ec \ube14\ub85d \ud0c0\uc785\uc744 \uc120\ud0dd\ud558\uc138\uc694...'}
                onChange={(html, markdown) => {
                    setEditorHtml(html);
                    setEditorContent(markdown);
                }}
            />
        </View>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'grant':
                if (!grantUrl) return null;
                return <GrantContentPanel grantUrl={grantUrl} grantTitle={grantTitle} />;

            case 'editor':
                return renderEditorPlayground();

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
