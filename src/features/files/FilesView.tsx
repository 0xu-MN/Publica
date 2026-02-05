import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Folder, Clock, FileText, ChevronRight, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase'; // 경로 확인 필요

// Props 정의: 파일을 클릭했을 때 '워크스페이스'로 이동시키는 함수를 받아야 함
interface FilesViewProps {
    onOpenProject?: (sessionData: any) => void;
}

export const FilesView = ({ onOpenProject }: FilesViewProps) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 1. 저장된 프로젝트 목록 불러오기
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

    useEffect(() => {
        fetchProjects();
    }, []);

    // 2. 프로젝트 삭제하기
    const handleDelete = async (id: string) => {
        Alert.alert("프로젝트 삭제", "정말 삭제하시겠습니까?", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제", style: "destructive",
                onPress: async () => {
                    await supabase.from('workspace_sessions').delete().eq('id', id);
                    fetchProjects(); // 목록 갱신
                }
            }
        ]);
    };

    // 3. 프로젝트 열기 (AgentView로 데이터 전달)
    const handleOpen = (session: any) => {
        if (onOpenProject) {
            onOpenProject(session); // 부모 컴포넌트(App.tsx)에게 "이거 열어줘!"라고 알림
        } else {
            Alert.alert("알림", "워크스페이스 탭에서 '불러오기' 기능을 사용해주세요.\n(네비게이션 연동 필요)");
        }
    };

    return (
        <View className="flex-1 bg-[#050B14]">
            {/* Header */}
            <View className="p-6 border-b border-white/5 bg-[#0F172A]">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center">
                        <Folder size={20} color="#3B82F6" />
                    </View>
                    <View>
                        <Text className="text-white text-xl font-bold">Project Files</Text>
                        <Text className="text-slate-400 text-xs">Manage your research & hypotheses</Text>
                    </View>
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1 p-4"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchProjects} tintColor="#fff" />}
                >
                    {sessions.length === 0 ? (
                        <View className="items-center justify-center mt-20 opacity-50">
                            <Folder size={48} color="#475569" />
                            <Text className="text-slate-500 mt-4">저장된 프로젝트가 없습니다.</Text>
                        </View>
                    ) : (
                        sessions.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                className="bg-[#1E293B] mb-3 p-4 rounded-xl border border-white/5 flex-row items-center justify-between"
                                onPress={() => handleOpen(item)}
                            >
                                <View className="flex-row items-center flex-1 gap-4">
                                    <View className="w-10 h-10 bg-slate-800 rounded-lg items-center justify-center">
                                        <FileText size={18} color="#94A3B8" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-base mb-1">{item.title || "Untitled Project"}</Text>
                                        <View className="flex-row items-center gap-2">
                                            <View className="bg-blue-500/20 px-2 py-0.5 rounded text-xs">
                                                <Text className="text-blue-400 text-[10px] font-bold">{item.mode}</Text>
                                            </View>
                                            <View className="flex-row items-center gap-1">
                                                <Clock size={10} color="#64748B" />
                                                <Text className="text-slate-500 text-xs">
                                                    {new Date(item.updated_at).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View className="flex-row items-center gap-4">
                                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                                        <Trash2 size={18} color="#EF4444" style={{ opacity: 0.7 }} />
                                    </TouchableOpacity>
                                    <ChevronRight size={20} color="#475569" />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                    <View className="h-20" />
                </ScrollView>
            )}
        </View>
    );
};
