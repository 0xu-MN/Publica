import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { FolderKanban, FileText, Zap, FileEdit, Clock, ChevronRight, MoreVertical, Trash2, Calendar } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════
// Portfolio — My Projects View
// Shows all workspace sessions as project cards
// with progress tracking and quick navigation
// ═══════════════════════════════════════════════════

interface MyProjectsViewProps {
    onNavigateToFlow?: (sessionId: string) => void;
    onNavigateToEdit?: (sessionId: string) => void;
}

interface ProjectSession {
    id: string;
    title: string;
    mode: string;
    workspace_data: any[];
    chat_history: any[];
    editor_content: string | null;
    editor_markdown: string | null;
    updated_at: string;
    created_at?: string;
}

export const MyProjectsView = ({ onNavigateToFlow, onNavigateToEdit }: MyProjectsViewProps) => {
    const [projects, setProjects] = useState<ProjectSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data, error } = await supabase
            .from('workspace_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (data) setProjects(data as ProjectSession[]);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        await supabase.from('workspace_sessions').delete().eq('id', id);
        setDeleteConfirm(null);
        fetchProjects();
    };

    const getProgress = (p: ProjectSession): { stage: string; percent: number; color: string } => {
        const hasBranches = (p.workspace_data?.reduce((acc: number, col: any) => acc + (col.branches?.length || 0), 0) || 0) > 0;
        const hasEditor = !!p.editor_content && p.editor_content.length > 50;
        const hasChat = (p.chat_history?.length || 0) > 2;

        if (hasEditor && hasBranches) {
            return { stage: '서류 작성 중', percent: 75, color: '#10B981' };
        } else if (hasBranches && hasChat) {
            return { stage: '브레인스톰 완료', percent: 50, color: '#3B82F6' };
        } else if (hasBranches) {
            return { stage: '분석 진행 중', percent: 30, color: '#F59E0B' };
        }
        return { stage: '시작됨', percent: 10, color: '#64748B' };
    };

    const getBranchCount = (p: ProjectSession): number => {
        return p.workspace_data?.reduce((acc: number, col: any) => acc + (col.branches?.length || 0), 0) || 0;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return '방금 전';
        if (hours < 24) return `${hours}시간 전`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}일 전`;
        return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#818CF8" />
                    <Text style={styles.loadingText}>프로젝트 불러오는 중...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <FolderKanban size={20} color="#818CF8" />
                    <Text style={styles.headerTitle}>My Portfolio</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{projects.length}</Text>
                    </View>
                </View>
            </View>

            {/* Projects Grid */}
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {projects.length === 0 ? (
                    <View style={styles.emptyState}>
                        <FolderKanban size={48} color="#1E293B" />
                        <Text style={styles.emptyTitle}>아직 프로젝트가 없습니다</Text>
                        <Text style={styles.emptyDesc}>
                            Smart Match Finder에서 공고를 선택하거나{'\n'}
                            NEXUS-Flow에서 브레인스톰을 시작하세요
                        </Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {projects.map(p => {
                            const progress = getProgress(p);
                            const branchCount = getBranchCount(p);
                            const chatCount = p.chat_history?.length || 0;
                            const editorChars = p.editor_content?.length || 0;

                            return (
                                <View key={p.id} style={styles.card}>
                                    {/* Card Header */}
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.progressDot, { backgroundColor: progress.color }]} />
                                        <Text style={styles.stageBadge}>{progress.stage}</Text>
                                        <TouchableOpacity
                                            style={styles.moreBtn}
                                            onPress={() => setDeleteConfirm(deleteConfirm === p.id ? null : p.id)}
                                        >
                                            <MoreVertical size={14} color="#475569" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Delete Confirm */}
                                    {deleteConfirm === p.id && (
                                        <TouchableOpacity
                                            style={styles.deleteBtn}
                                            onPress={() => handleDelete(p.id)}
                                        >
                                            <Trash2 size={12} color="#EF4444" />
                                            <Text style={styles.deleteText}>삭제</Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* Title */}
                                    <Text style={styles.cardTitle} numberOfLines={2}>{p.title || 'Untitled Project'}</Text>

                                    {/* Progress Bar */}
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${progress.percent}%`, backgroundColor: progress.color }]} />
                                    </View>

                                    {/* Stats */}
                                    <View style={styles.stats}>
                                        <View style={styles.statItem}>
                                            <Zap size={12} color="#818CF8" />
                                            <Text style={styles.statText}>{branchCount} 브랜치</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <FileText size={12} color="#10B981" />
                                            <Text style={styles.statText}>{editorChars > 0 ? `${Math.round(editorChars / 100) * 100}자` : '미작성'}</Text>
                                        </View>
                                    </View>

                                    {/* Date */}
                                    <View style={styles.dateRow}>
                                        <Clock size={11} color="#475569" />
                                        <Text style={styles.dateText}>{formatDate(p.updated_at)}</Text>
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            style={styles.actionBtn}
                                            onPress={() => onNavigateToFlow?.(p.id)}
                                        >
                                            <Zap size={13} color="#818CF8" />
                                            <Text style={styles.actionBtnText}>Flow</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.actionBtnPrimary]}
                                            onPress={() => onNavigateToEdit?.(p.id)}
                                        >
                                            <FileEdit size={13} color="#FFF" />
                                            <Text style={[styles.actionBtnText, styles.actionBtnPrimaryText]}>Edit</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#64748B', fontSize: 13, fontWeight: '500' },

    // Header
    header: {
        height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, borderBottomWidth: 1, borderColor: '#1E293B',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { color: '#E2E8F0', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    countBadge: {
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
        backgroundColor: 'rgba(129,140,248,0.12)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.2)',
    },
    countText: { color: '#818CF8', fontSize: 11, fontWeight: '800' },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { padding: 24 },

    // Empty
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
    emptyTitle: { color: '#334155', fontSize: 18, fontWeight: '700' },
    emptyDesc: { color: '#475569', fontSize: 13, textAlign: 'center', lineHeight: 20 },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },

    // Card
    card: {
        width: 280, padding: 20, borderRadius: 16,
        backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    progressDot: { width: 8, height: 8, borderRadius: 4 },
    stageBadge: { color: '#94A3B8', fontSize: 11, fontWeight: '700', flex: 1 },
    moreBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', marginBottom: 8,
    },
    deleteText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },
    cardTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '700', lineHeight: 22, marginBottom: 12 },

    // Progress Bar
    progressBarBg: {
        height: 4, borderRadius: 2, backgroundColor: '#1E293B', marginBottom: 14, overflow: 'hidden',
    },
    progressBarFill: { height: '100%', borderRadius: 2 },

    // Stats
    stats: { flexDirection: 'row', gap: 16, marginBottom: 8 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { color: '#64748B', fontSize: 11, fontWeight: '600' },

    // Date
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
    dateText: { color: '#475569', fontSize: 10, fontWeight: '500' },

    // Actions
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        flex: 1, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderRadius: 10, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1E293B',
    },
    actionBtnText: { color: '#818CF8', fontSize: 12, fontWeight: '700' },
    actionBtnPrimary: { backgroundColor: '#4F46E5', borderColor: '#6366F1' },
    actionBtnPrimaryText: { color: '#FFF' },
});
