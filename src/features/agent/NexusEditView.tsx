import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Platform, Animated } from 'react-native';
import { FileText, MessageCircle, ChevronLeft, ChevronRight, Save, FolderOpen, Sparkles, Send, Bot, User as UserIcon, ArrowLeft, Zap, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useSessionManager } from './hooks/useSessionManager';
import { NotionEditor } from './components/NotionEditor';

// ═══════════════════════════════════════════════════
// NEXUS-Edit: Document Editor Page
// Left: Brainstorm Viewer + AI Chat
// Right: Notion-like Editor
// ═══════════════════════════════════════════════════

export const NexusEditView = () => {
    // --- Auth ---
    const [user, setUser] = useState<any>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }: any) => setUser(data.user));
    }, []);

    const { sessions, saveEditorContent, loadSession, fetchSessions } = useSessionManager(user?.id);

    // --- State ---
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [editorContent, setEditorContent] = useState('');
    const [editorMarkdown, setEditorMarkdown] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
    const [showSessionList, setShowSessionList] = useState(true);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [lastSessionId, setLastSessionId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const leftPanelWidth = useRef(new Animated.Value(420)).current;
    const chatScrollRef = useRef<ScrollView>(null);
    const autoSaveTimerRef = useRef<any>(null);

    // --- Load last session from localStorage on mount ---
    useEffect(() => {
        if (Platform.OS === 'web') {
            const lastId = localStorage.getItem('NEXUS_EDIT_LAST_SESSION');
            if (lastId) {
                setLastSessionId(lastId);
                setShowResumePrompt(true);
            }
        }
    }, []);

    // --- Toggle Left Panel ---
    const toggleLeftPanel = () => {
        Animated.spring(leftPanelWidth, {
            toValue: isLeftPanelOpen ? 0 : 420,
            useNativeDriver: false,
            friction: 12,
            tension: 65,
        }).start();
        setIsLeftPanelOpen(!isLeftPanelOpen);
    };

    const handleLoadSession = async (sessionId: string) => {
        const data = await loadSession(sessionId);
        if (data) {
            setSelectedSession(data);
            setChatMessages(data.chat_history || []);
            setShowSessionList(false);
            setShowResumePrompt(false);

            // Prioritize saved editor_content, fallback to brainstorm branches
            if (data.editor_content) {
                setEditorContent(data.editor_content);
            } else {
                const branches = data.workspace_data || [];
                const content = buildEditorContentFromBranches(branches);
                setEditorContent(content);
            }

            setHasUnsavedChanges(false);
            setLastSaved(null);

            // Save last session ID
            if (Platform.OS === 'web') {
                localStorage.setItem('NEXUS_EDIT_LAST_SESSION', sessionId);
            }
        }
    };

    // --- Build Editor Content from Brainstorm Branches ---
    const buildEditorContentFromBranches = (columns: any[]): string => {
        let html = '';
        for (const col of columns) {
            if (!col.nodes) continue;
            for (const node of col.nodes) {
                if (node.type === 'root') {
                    html += `<h1>${node.label || 'Untitled'}</h1>`;
                    if (node.description) html += `<p>${node.description}</p>`;
                } else {
                    html += `<h2>${node.label || ''}</h2>`;
                    if (node.description) html += `<p>${node.description}</p>`;
                }
            }
        }
        return html || '<h1>새 문서</h1><p>브레인스톰 데이터를 불러오거나, 직접 작성을 시작하세요.</p>';
    };

    // --- AI Chat ---
    const handleSendChat = async () => {
        if (!chatInput.trim() || chatLoading) return;

        const userMsg = { role: 'user', content: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setChatLoading(true);

        try {
            const context = editorMarkdown || editorContent;
            const res = await supabase.functions.invoke('insight-agent-gateway', {
                body: {
                    userMessage: `[문서 작성 도움 요청] ${chatInput}`,
                    branchLabel: selectedSession?.title || '새 문서',
                    branchDescription: context.substring(0, 500),
                    chatHistory: chatMessages.slice(-6),
                    mode: 'editor-assist',
                },
            });

            const aiResponse = res.data?.response || res.data?.analysis?.summary || '응답을 생성할 수 없습니다.';
            setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ AI 응답 오류가 발생했습니다.' }]);
        } finally {
            setChatLoading(false);
            setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    // --- Editor onChange ---
    const handleEditorChange = useCallback((html: string, markdown: string) => {
        setEditorContent(html);
        setEditorMarkdown(markdown);
        setHasUnsavedChanges(true);
    }, []);

    // --- Save Handler ---
    const handleSave = async () => {
        if (!selectedSession?.id || isSaving) return;
        setIsSaving(true);
        const success = await saveEditorContent(selectedSession.id, editorContent, editorMarkdown);
        setIsSaving(false);
        if (success) {
            setHasUnsavedChanges(false);
            const now = new Date();
            setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        }
    };

    // --- Auto-save every 30 seconds ---
    useEffect(() => {
        if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
        if (selectedSession?.id) {
            autoSaveTimerRef.current = setInterval(() => {
                if (hasUnsavedChanges && editorContent) {
                    handleSave();
                }
            }, 30000);
        }
        return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); };
    }, [selectedSession?.id, hasUnsavedChanges, editorContent]);

    // --- Render ---
    return (
        <View style={styles.container}>
            {/* ─── Header Bar ─── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={toggleLeftPanel} style={styles.headerBtn}>
                        {isLeftPanelOpen ? <PanelLeftClose size={18} color="#94A3B8" /> : <PanelLeftOpen size={18} color="#94A3B8" />}
                    </TouchableOpacity>
                    <View style={styles.headerBrand}>
                        <Zap size={16} color="#818CF8" />
                        <Text style={styles.headerTitle}>Publica NEXUS</Text>
                        <Text style={styles.headerSubtitle}>— Edit</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    {selectedSession && (
                        <>
                            {lastSaved && <Text style={{ color: '#475569', fontSize: 10, fontWeight: '500' }}>저장됨 {lastSaved}</Text>}
                            {hasUnsavedChanges && !isSaving && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' }} />}
                        </>
                    )}
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={isSaving || !selectedSession}
                    >
                        <Save size={16} color="#10B981" />
                        <Text style={styles.saveBtnText}>{isSaving ? '저장 중...' : '저장'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── Main Content ─── */}
            <View style={styles.main}>
                {/* ─── Left Panel: Brainstorm + Chat ─── */}
                <Animated.View style={[styles.leftPanel, { width: leftPanelWidth }]}>
                    {isLeftPanelOpen && (
                        <View style={{ flex: 1 }}>
                            {/* Resume Prompt */}
                            {showResumePrompt && lastSessionId && (
                                <View style={styles.resumeBanner}>
                                    <Text style={styles.resumeText}>📝 이전 작업을 이어서 하시겠어요?</Text>
                                    <View style={styles.resumeActions}>
                                        <TouchableOpacity
                                            style={styles.resumeBtn}
                                            onPress={() => handleLoadSession(lastSessionId)}
                                        >
                                            <Text style={styles.resumeBtnText}>이어하기</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.resumeBtn, { backgroundColor: '#1E293B' }]}
                                            onPress={() => {
                                                setShowResumePrompt(false);
                                                if (Platform.OS === 'web') localStorage.removeItem('NEXUS_EDIT_LAST_SESSION');
                                            }}
                                        >
                                            <Text style={[styles.resumeBtnText, { color: '#94A3B8' }]}>새로 시작</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Session List or Brainstorm Viewer */}
                            {showSessionList ? (
                                <View style={styles.sessionListContainer}>
                                    <View style={styles.sectionHeader}>
                                        <FolderOpen size={16} color="#818CF8" />
                                        <Text style={styles.sectionTitle}>브레인스톰 프로젝트</Text>
                                    </View>
                                    <ScrollView style={styles.sessionScroll}>
                                        {sessions.length === 0 ? (
                                            <View style={styles.emptyState}>
                                                <FileText size={32} color="#334155" />
                                                <Text style={styles.emptyText}>NEXUS-Flow에서 브레인스톰을 먼저 진행하세요</Text>
                                            </View>
                                        ) : (
                                            sessions.map((s: any) => (
                                                <TouchableOpacity
                                                    key={s.id}
                                                    style={styles.sessionItem}
                                                    onPress={() => handleLoadSession(s.id)}
                                                >
                                                    <FileText size={16} color="#60A5FA" />
                                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                                        <Text style={styles.sessionItemTitle} numberOfLines={1}>{s.title}</Text>
                                                        <Text style={styles.sessionItemMeta}>
                                                            {s.workspace_data?.reduce((acc: number, col: any) => acc + (col.nodes?.length || 0), 0) || 0} 브랜치 · {new Date(s.updated_at).toLocaleDateString('ko-KR')}
                                                        </Text>
                                                    </View>
                                                    <ChevronRight size={16} color="#475569" />
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            ) : (
                                /* Brainstorm Viewer (selected session branches) */
                                <View style={styles.brainstormViewer}>
                                    <TouchableOpacity
                                        style={styles.backToList}
                                        onPress={() => { setShowSessionList(true); setSelectedSession(null); }}
                                    >
                                        <ArrowLeft size={16} color="#60A5FA" />
                                        <Text style={styles.backToListText}>프로젝트 목록</Text>
                                    </TouchableOpacity>

                                    <View style={styles.sectionHeader}>
                                        <Sparkles size={16} color="#F59E0B" />
                                        <Text style={styles.sectionTitle}>브레인스톰 데이터</Text>
                                    </View>

                                    <ScrollView style={styles.branchScroll}>
                                        {(selectedSession?.workspace_data || []).map((col: any, ci: number) => (
                                            <View key={ci}>
                                                {(col.nodes || []).map((node: any, ni: number) => (
                                                    <TouchableOpacity
                                                        key={node.id || ni}
                                                        style={[styles.branchCard, node.type === 'root' && styles.branchCardRoot]}
                                                        onPress={() => {
                                                            // Insert this branch content into editor
                                                            const insertHtml = `<h2>${node.label || ''}</h2><p>${node.description || ''}</p>`;
                                                            setEditorContent(prev => prev + insertHtml);
                                                        }}
                                                    >
                                                        <Text style={styles.branchLabel}>{node.label || 'Untitled'}</Text>
                                                        <Text style={styles.branchDesc} numberOfLines={2}>{node.description || ''}</Text>
                                                        <Text style={styles.branchInsertHint}>탭하여 에디터에 삽입</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* ─── Chat Section ─── */}
                            <View style={styles.chatSection}>
                                <View style={styles.chatHeader}>
                                    <Bot size={16} color="#818CF8" />
                                    <Text style={styles.chatHeaderText}>AI 작성 도우미</Text>
                                </View>

                                <ScrollView ref={chatScrollRef} style={styles.chatMessages}>
                                    {chatMessages.length === 0 && (
                                        <View style={styles.chatEmpty}>
                                            <Text style={styles.chatEmptyText}>💡 문서 작성 중 궁금한 점이나 도움이 필요하면 질문하세요</Text>
                                        </View>
                                    )}
                                    {chatMessages.map((msg, i) => (
                                        <View key={i} style={[styles.chatBubble, msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI]}>
                                            {msg.role === 'assistant' && <Bot size={14} color="#818CF8" style={{ marginRight: 6, marginTop: 2 }} />}
                                            <Text style={styles.chatBubbleText}>{msg.content}</Text>
                                        </View>
                                    ))}
                                    {chatLoading && (
                                        <View style={[styles.chatBubble, styles.chatBubbleAI]}>
                                            <ActivityIndicator size="small" color="#818CF8" />
                                            <Text style={[styles.chatBubbleText, { marginLeft: 8 }]}>작성 중...</Text>
                                        </View>
                                    )}
                                </ScrollView>

                                <View style={styles.chatInputRow}>
                                    <TextInput
                                        style={styles.chatInput}
                                        value={chatInput}
                                        onChangeText={setChatInput}
                                        placeholder="문서 작성 도움 요청..."
                                        placeholderTextColor="#475569"
                                        onSubmitEditing={handleSendChat}
                                        returnKeyType="send"
                                    />
                                    <TouchableOpacity
                                        style={[styles.chatSendBtn, chatInput.trim() && styles.chatSendBtnActive]}
                                        onPress={handleSendChat}
                                        disabled={!chatInput.trim() || chatLoading}
                                    >
                                        <Send size={16} color={chatInput.trim() ? '#818CF8' : '#475569'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* ─── Right Panel: Editor + Progress Tracker ─── */}
                <View style={styles.rightPanel}>
                    {selectedSession ? (
                        <View style={{ flex: 1, flexDirection: 'row' as any }}>
                            {/* Editor */}
                            <View style={{ flex: 1 }}>
                                <NotionEditor
                                    initialContent={editorContent}
                                    onChange={handleEditorChange}
                                    placeholder="/ 를 입력하여 블록 타입을 선택하세요..."
                                />
                            </View>
                            {/* Progress Tracker Strip */}
                            <View style={styles.progressStrip}>
                                <Text style={styles.progressStripTitle}>작성 진행</Text>
                                {[
                                    { id: 1, label: '문제인식', key: '문제인식' },
                                    { id: 2, label: '실현가능성', key: '실현가능성' },
                                    { id: 3, label: '성장전략', key: '성장전략' },
                                    { id: 4, label: '팀 구성', key: '팀' },
                                    { id: 5, label: '사업비', key: '사업비' },
                                ].map((step, idx, arr) => {
                                    const isCompleted = editorContent.toLowerCase().includes(step.key.toLowerCase()) && editorContent.length > 100;
                                    const isActive = !isCompleted && (idx === 0 || editorContent.toLowerCase().includes(arr[idx - 1]?.key.toLowerCase()));
                                    return (
                                        <View key={step.id} style={styles.progressStep}>
                                            {/* Connecting Line (above) */}
                                            {idx > 0 && (
                                                <View style={[styles.progressLine, isCompleted && styles.progressLineCompleted]} />
                                            )}
                                            {/* Circle */}
                                            <View style={[
                                                styles.progressCircle,
                                                isCompleted && styles.progressCircleCompleted,
                                                isActive && styles.progressCircleActive,
                                            ]}>
                                                {isCompleted ? (
                                                    <Text style={styles.progressCheckmark}>✓</Text>
                                                ) : (
                                                    <Text style={[styles.progressNumber, isActive && { color: '#818CF8' }]}>{step.id}</Text>
                                                )}
                                            </View>
                                            {/* Label */}
                                            <Text style={[
                                                styles.progressLabel,
                                                isCompleted && styles.progressLabelCompleted,
                                                isActive && styles.progressLabelActive,
                                            ]}>{step.label}</Text>
                                            {/* Connecting Line (below) */}
                                            {idx < arr.length - 1 && (
                                                <View style={[styles.progressLineBelow, isCompleted && styles.progressLineCompleted]} />
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.editorPlaceholder}>
                            <FileText size={48} color="#1E293B" />
                            <Text style={styles.placeholderTitle}>문서 작성 준비</Text>
                            <Text style={styles.placeholderDesc}>
                                왼쪽 패널에서 브레인스톰 프로젝트를 선택하거나{'\n'}
                                NEXUS-Flow에서 "서류 작성하러 가기"를 클릭하세요
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

// ═══════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },

    // Header
    header: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: '#1E293B',
        backgroundColor: '#0F172A',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E293B',
    },
    headerBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        color: '#818CF8',
        fontSize: 13,
        fontWeight: '600',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sessionTitle: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
        maxWidth: 200,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
    },
    saveBtnText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
    },

    // Main
    main: {
        flex: 1,
        flexDirection: 'row',
    },

    // Left Panel
    leftPanel: {
        borderRightWidth: 1,
        borderColor: '#1E293B',
        backgroundColor: '#0B1120',
        overflow: 'hidden',
    },

    // Resume Banner
    resumeBanner: {
        padding: 16,
        backgroundColor: 'rgba(129,140,248,0.08)',
        borderBottomWidth: 1,
        borderColor: 'rgba(129,140,248,0.15)',
    },
    resumeText: {
        color: '#C7D2FE',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 10,
    },
    resumeActions: {
        flexDirection: 'row',
        gap: 8,
    },
    resumeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#4F46E5',
    },
    resumeBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // Session List
    sessionListContainer: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 10,
    },
    sectionTitle: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '800',
    },
    sessionScroll: {
        flex: 1,
        paddingHorizontal: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        color: '#475569',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#111827',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    sessionItemTitle: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '700',
    },
    sessionItemMeta: {
        color: '#475569',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },

    // Brainstorm Viewer
    brainstormViewer: {
        flex: 1,
    },
    backToList: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    backToListText: {
        color: '#60A5FA',
        fontSize: 12,
        fontWeight: '700',
    },
    branchScroll: {
        flex: 1,
        padding: 12,
    },
    branchCard: {
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#111827',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    branchCardRoot: {
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79,70,229,0.08)',
    },
    branchLabel: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 4,
    },
    branchDesc: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 18,
    },
    branchInsertHint: {
        color: '#4F46E5',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 6,
    },

    // Chat Section
    chatSection: {
        height: 280,
        borderTopWidth: 1,
        borderColor: '#1E293B',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#1E293B',
    },
    chatHeaderText: {
        color: '#C7D2FE',
        fontSize: 12,
        fontWeight: '700',
    },
    chatMessages: {
        flex: 1,
        padding: 12,
    },
    chatEmpty: {
        padding: 16,
        alignItems: 'center',
    },
    chatEmptyText: {
        color: '#475569',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    chatBubble: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 10,
        marginBottom: 8,
        maxWidth: '90%',
    },
    chatBubbleUser: {
        backgroundColor: '#1E293B',
        alignSelf: 'flex-end',
    },
    chatBubbleAI: {
        backgroundColor: 'rgba(129,140,248,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(129,140,248,0.15)',
        alignSelf: 'flex-start',
    },
    chatBubbleText: {
        color: '#CBD5E1',
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
    },
    chatInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
        borderTopWidth: 1,
        borderColor: '#1E293B',
    },
    chatInput: {
        flex: 1,
        height: 36,
        backgroundColor: '#111827',
        borderRadius: 10,
        paddingHorizontal: 12,
        color: '#E2E8F0',
        fontSize: 13,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    chatSendBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E293B',
    },
    chatSendBtnActive: {
        backgroundColor: 'rgba(129,140,248,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(129,140,248,0.3)',
    },

    // Right Panel
    rightPanel: {
        flex: 1,
        backgroundColor: '#020617',
    },

    // Editor Placeholder
    editorPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    placeholderTitle: {
        color: '#334155',
        fontSize: 18,
        fontWeight: '700',
    },
    placeholderDesc: {
        color: '#475569',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },

    // ─── Progress Tracker Strip ───
    progressStrip: {
        width: 80,
        paddingVertical: 24,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderLeftWidth: 1,
        borderColor: '#1E293B',
        backgroundColor: '#0B1120',
    },
    progressStripTitle: {
        color: '#64748B',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 20,
    },
    progressStep: {
        alignItems: 'center',
    },
    progressLine: {
        width: 2,
        height: 20,
        backgroundColor: '#1E293B',
    },
    progressLineBelow: {
        width: 2,
        height: 20,
        backgroundColor: '#1E293B',
    },
    progressLineCompleted: {
        backgroundColor: '#818CF8',
    },
    progressCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
        borderWidth: 2,
        borderColor: '#1E293B',
    },
    progressCircleCompleted: {
        backgroundColor: 'rgba(129,140,248,0.15)',
        borderColor: '#818CF8',
    },
    progressCircleActive: {
        borderColor: '#818CF8',
        backgroundColor: 'rgba(129,140,248,0.08)',
    },
    progressCheckmark: {
        color: '#818CF8',
        fontSize: 14,
        fontWeight: '800',
    },
    progressNumber: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '700',
    },
    progressLabel: {
        color: '#475569',
        fontSize: 9,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
    progressLabelCompleted: {
        color: '#818CF8',
    },
    progressLabelActive: {
        color: '#C7D2FE',
    },
});
