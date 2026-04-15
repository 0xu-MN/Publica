import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { FolderKanban, FileText, Zap, FileEdit, Clock, ChevronRight, MoreVertical, Trash2, Calendar } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import Footer from '../../Footer';

// ═══════════════════════════════════════════════════
// Portfolio — My Projects View
// Shows all workspace sessions as project cards
// with progress tracking and quick navigation
// ═══════════════════════════════════════════════════

interface MyProjectsViewProps {
    onNavigateToFlow?: (session: any) => void;
    onNavigateToEdit?: (session: any) => void;
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
            return { stage: '최종 작성', percent: 85, color: '#7C3AED' };
        } else if (hasBranches && hasChat) {
            return { stage: '아이디어 수립', percent: 55, color: '#7C3AED' };
        } else if (hasBranches) {
            return { stage: '분석 진행', percent: 35, color: '#7C3AED' };
        }
        return { stage: '초기 기획', percent: 15, color: '#94A3B8' };
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
        return d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                    <Text style={styles.loadingText}>당신의 혁신적인 프로젝트를 불러오는 중...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 items-center justify-center mr-3">
                        <FolderKanban size={20} color="#7C3AED" strokeWidth={2.5} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>My Portfolio</Text>
                        <Text className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest">Workspace Archive</Text>
                    </View>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{projects.length} PROJECTS</Text>
                </View>
            </View>

            {/* Projects Grid */}
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {projects.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View className="w-24 h-24 rounded-[32px] bg-white border border-[#E2E8F0] items-center justify-center mb-6 shadow-sm">
                            <FolderKanban size={48} color="#CBD5E1" strokeWidth={1} />
                        </View>
                        <Text style={styles.emptyTitle}>아직 프로젝트가 없습니다</Text>
                        <Text style={styles.emptyDesc}>
                            공고를 탐색하여 당신만의 전략 분석을 시작해보세요.{'\n'}
                            Publica AI가 든든한 연구 파트너가 되어드립니다.
                        </Text>
                        <TouchableOpacity className="mt-8 bg-[#7C3AED] px-8 py-4 rounded-2xl shadow-xl shadow-[#7C3AED]/20">
                            <Text className="text-white font-black uppercase text-xs tracking-widest">첫 프로젝트 시작하기</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {projects.map(p => {
                            const progress = getProgress(p);
                            const branchCount = getBranchCount(p);
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
                                            <MoreVertical size={16} color="#94A3B8" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Delete Confirm Overlay (Simplified) */}
                                    {deleteConfirm === p.id && (
                                        <View className="flex-row items-center justify-between bg-red-50 p-2 rounded-xl mb-3 border border-red-100">
                                            <Text className="text-red-500 text-[10px] font-black uppercase ml-2">정말 삭제할까요?</Text>
                                            <TouchableOpacity
                                                className="bg-red-500 px-3 py-1.5 rounded-lg"
                                                onPress={() => handleDelete(p.id)}
                                            >
                                                <Text className="text-white text-[10px] font-bold">삭제</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Title */}
                                    <Text style={styles.cardTitle} numberOfLines={2}>{p.title || '무제한 프로젝트'}</Text>

                                    {/* Progress Bar */}
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${progress.percent}%`, backgroundColor: progress.color }]} />
                                    </View>

                                    {/* Stats */}
                                    <View style={styles.stats}>
                                        <View style={styles.statItem}>
                                            <View className="w-6 h-6 rounded-lg bg-[#7C3AED]/5 items-center justify-center mr-1">
                                                <Zap size={10} color="#7C3AED" />
                                            </View>
                                            <Text style={styles.statText}>{branchCount} <Text className="text-[#CBD5E1]">Nodes</Text></Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <View className="w-6 h-6 rounded-lg bg-emerald-50 items-center justify-center mr-1">
                                                <FileText size={10} color="#10B981" />
                                            </View>
                                            <Text style={styles.statText}>{editorChars > 0 ? `${Math.round(editorChars / 100)}단락` : <Text className="text-[#CBD5E1]">미작성</Text>}</Text>
                                        </View>
                                    </View>

                                    {/* Footer Info */}
                                    <View className="flex-row items-center justify-between border-t border-[#F1F5F9] pt-4 mt-2">
                                        <View style={styles.dateRow}>
                                            <Calendar size={12} color="#94A3B8" />
                                            <Text style={styles.dateText}>{formatDate(p.updated_at)}</Text>
                                        </View>
                                        <View className="flex-row gap-2">
                                            <TouchableOpacity
                                                className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center active:bg-slate-50"
                                                onPress={() => onNavigateToFlow?.(p)}
                                            >
                                                <Zap size={14} color="#7C3AED" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                className="w-8 h-8 rounded-lg bg-[#7C3AED] items-center justify-center shadow-lg shadow-[#7C3AED]/20 active:opacity-90"
                                                onPress={() => onNavigateToEdit?.(p)}
                                            >
                                                <FileEdit size={14} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
                <Footer />
                <View className="h-20" />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#64748B', fontSize: 13, fontWeight: '700' },

    // Header
    header: {
        height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 32, borderBottomWidth: 1, borderColor: '#E2E8F0',
        backgroundColor: '#FDF8F3', paddingTop: 20,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { color: '#27272a', fontSize: 24, fontWeight: '900', letterSpacing: -1 },
    countBadge: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
        backgroundColor: '#7C3AED10', borderWidth: 1, borderColor: '#7C3AED20',
    },
    countText: { color: '#7C3AED', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { padding: 32 },

    // Empty
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 120 },
    emptyTitle: { color: '#27272a', fontSize: 20, fontWeight: '900', marginBottom: 12 },
    emptyDesc: { color: '#94A3B8', fontSize: 15, textAlign: 'center', lineHeight: 24, fontWeight: '500' },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },

    // Card
    card: {
        width: 320, padding: 28, borderRadius: 32,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 20,
        elevation: 10,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    progressDot: { width: 10, height: 10, borderRadius: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
    stageBadge: { color: '#64748B', fontSize: 12, fontWeight: '800', flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
    moreBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#F8FAFC' },
    cardTitle: { color: '#27272a', fontSize: 17, fontWeight: '900', lineHeight: 26, marginBottom: 20, letterSpacing: -0.5 },

    // Progress Bar
    progressBarBg: {
        height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', marginBottom: 20, overflow: 'hidden', shadowInner: true,
    },
    progressBarFill: { height: '100%', borderRadius: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },

    // Stats
    stats: { flexDirection: 'row', gap: 20, marginBottom: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center' },
    statText: { color: '#475569', fontSize: 12, fontWeight: '800' },

    // Date
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },

    // Actions
    actions: { flexDirection: 'row', gap: 10 },
});
