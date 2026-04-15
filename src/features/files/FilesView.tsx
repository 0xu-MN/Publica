import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, StyleSheet } from 'react-native';
import { Folder, Clock, FileText, ChevronRight, Trash2, FolderOpen } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

interface FilesViewProps {
    onOpenProject?: (sessionData: any) => void;
}

export const FilesView = ({ onOpenProject }: FilesViewProps) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProjects = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('workspace_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setSessions(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleDelete = async (id: string) => {
        Alert.alert("프로젝트 삭제", "정말 삭제하시겠습니까?", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제", style: "destructive",
                onPress: async () => {
                    await supabase.from('workspace_sessions').delete().eq('id', id);
                    fetchProjects();
                }
            }
        ]);
    };

    const handleOpen = (session: any) => {
        if (onOpenProject) {
            onOpenProject(session);
        } else {
            Alert.alert("알림", "워크스페이스 탭에서 '불러오기' 기능을 사용해주세요.");
        }
    };

    const getModeColor = (mode: string) => {
        if (!mode) return { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
        if (mode.includes('Grant') || mode.includes('공고')) return { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' };
        if (mode.includes('Edit') || mode.includes('작성')) return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
        return { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <FolderOpen size={20} color="#7C3AED" />
                </View>
                <View>
                    <Text style={styles.headerTitle}>프로젝트 파일</Text>
                    <Text style={styles.headerSub}>저장된 워크스페이스 및 분석 결과</Text>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProjects(); }} tintColor="#7C3AED" />
                    }
                >
                    {sessions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Folder size={32} color="#A78BFA" />
                            </View>
                            <Text style={styles.emptyTitle}>저장된 프로젝트가 없습니다</Text>
                            <Text style={styles.emptyDesc}>Flow 탭에서 공고를 분석하면{'\n'}자동으로 저장됩니다.</Text>
                        </View>
                    ) : (
                        sessions.map((item) => {
                            const modeColor = getModeColor(item.mode);
                            const branchCount = item.workspace_data?.reduce(
                                (acc: number, col: any) => acc + (col.branches?.length || 0), 0
                            ) || 0;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.card}
                                    onPress={() => handleOpen(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.cardLeft}>
                                        <View style={styles.cardIcon}>
                                            <FileText size={18} color="#7C3AED" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>
                                                {item.title || "Untitled Project"}
                                            </Text>
                                            <View style={styles.cardMeta}>
                                                <View style={[styles.modeBadge, { backgroundColor: modeColor.bg, borderColor: modeColor.border }]}>
                                                    <Text style={[styles.modeBadgeText, { color: modeColor.text }]}>
                                                        {item.mode || 'Research'}
                                                    </Text>
                                                </View>
                                                {branchCount > 0 && (
                                                    <Text style={styles.branchCount}>{branchCount}개 브랜치</Text>
                                                )}
                                                <View style={styles.dateRow}>
                                                    <Clock size={10} color="#94A3B8" />
                                                    <Text style={styles.dateText}>
                                                        {new Date(item.updated_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.cardRight}>
                                        <TouchableOpacity
                                            style={styles.deleteBtn}
                                            onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Trash2 size={15} color="#F87171" />
                                        </TouchableOpacity>
                                        <ChevronRight size={18} color="#CBD5E1" />
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDF8F3',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    headerIcon: {
        width: 40, height: 40,
        backgroundColor: '#F5F3FF',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    headerSub: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyIcon: {
        width: 72, height: 72,
        backgroundColor: '#F5F3FF',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardIcon: {
        width: 40, height: 40,
        backgroundColor: '#F5F3FF',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 6,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    modeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    modeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    branchCount: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    dateText: {
        fontSize: 11,
        color: '#94A3B8',
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
    },
    deleteBtn: {
        width: 30, height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
    },
});
