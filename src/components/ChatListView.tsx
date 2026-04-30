import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Mail, Search } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ConversationItem {
    id: string;         // 상대방 user id
    name: string;
    lastMessage: string;
    timestamp: string;
    unread: number;
}

interface ChatListViewProps {
    onSelectChat: (user: { id: string; name: string }) => void;
    activeChatId?: string;
}

export const ChatListView = ({ onSelectChat, activeChatId }: ChatListViewProps) => {
    const { user } = useAuth();
    const [chats, setChats] = useState<ConversationItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        loadChats();

        // 새 메시지 수신 시 목록 갱신
        const channel = supabase
            .channel(`chatlist_${user.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
                () => loadChats()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    const loadChats = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            // 내가 보내거나 받은 최근 메시지들 가져오기
            const { data } = await supabase
                .from('messages')
                .select('id, sender_id, receiver_id, content, created_at, read_at')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false })
                .limit(200);

            if (!data) return;

            // 상대방 ID별로 그룹화, 각 대화의 최신 메시지만
            const seen = new Set<string>();
            const grouped: typeof data = [];
            for (const msg of data) {
                const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                if (!seen.has(otherId)) {
                    seen.add(otherId);
                    grouped.push(msg);
                }
            }

            if (grouped.length === 0) {
                setChats([]);
                return;
            }

            // 상대방 프로필 조회
            const otherIds = grouped.map(m =>
                m.sender_id === user.id ? m.receiver_id : m.sender_id
            );

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, username, email')
                .in('id', otherIds);

            const profileMap = new Map((profiles || []).map(p => [p.id, p]));

            const items: ConversationItem[] = grouped.map(msg => {
                const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                const p = profileMap.get(otherId);
                const name = p?.full_name || p?.username || p?.email?.split('@')[0] || '사용자';
                const unread = msg.sender_id !== user.id && !msg.read_at ? 1 : 0;
                const ts = new Date(msg.created_at);
                const now = new Date();
                const diffMin = Math.floor((now.getTime() - ts.getTime()) / 60000);
                let timestamp = '';
                if (diffMin < 1) timestamp = '방금 전';
                else if (diffMin < 60) timestamp = `${diffMin}분 전`;
                else if (diffMin < 1440) timestamp = `${Math.floor(diffMin / 60)}시간 전`;
                else timestamp = ts.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

                return { id: otherId, name, lastMessage: msg.content, timestamp, unread };
            });

            setChats(items);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white border-r border-slate-200">
            {/* Header */}
            <View className="px-5 py-6 border-b border-slate-100">
                <Text className="text-[#27272a] font-extrabold text-xl mb-4 tracking-tight">Messages</Text>
                <View className="bg-slate-50 flex-row items-center px-4 py-3 rounded-2xl border border-slate-200">
                    <Search size={18} color="#94A3B8" />
                    <Text className="text-slate-400 text-sm ml-3 font-medium">채팅 검색...</Text>
                </View>
            </View>

            {/* Chat List */}
            <ScrollView className="flex-1 bg-white">
                {loading && chats.length === 0 && (
                    <View className="items-center py-10">
                        <ActivityIndicator size="small" color="#9333EA" />
                    </View>
                )}

                {!loading && chats.length === 0 && (
                    <View className="flex-1 items-center justify-center p-10 mt-10">
                        <View className="w-20 h-20 rounded-full bg-slate-50 items-center justify-center mb-6">
                            <Mail size={32} color="#CBD5E1" />
                        </View>
                        <Text className="text-slate-400 text-center text-sm font-medium">
                            아직 진행 중인 대화가 없습니다
                        </Text>
                    </View>
                )}

                {chats.map((chat) => (
                    <TouchableOpacity
                        key={chat.id}
                        className={`flex-row items-center p-4 border-b border-slate-50 ${activeChatId === chat.id ? 'bg-purple-500/5' : ''}`}
                        onPress={() => onSelectChat({ id: chat.id, name: chat.name })}
                    >
                        <View className="w-14 h-14 rounded-full bg-purple-500/10 items-center justify-center mr-3 relative border border-purple-500/10 shadow-sm">
                            <Text className="text-purple-600 font-bold text-xl">{chat.name[0]}</Text>
                            {chat.unread > 0 && (
                                <View className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                            )}
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-[#27272a] font-bold text-base" numberOfLines={1}>{chat.name}</Text>
                                <Text className="text-slate-400 text-[10px] font-medium">{chat.timestamp}</Text>
                            </View>
                            <Text className={`text-xs ${chat.unread > 0 ? 'text-[#27272a] font-bold' : 'text-slate-400 font-medium'}`} numberOfLines={1}>
                                {chat.lastMessage}
                            </Text>
                        </View>
                        {chat.unread > 0 && (
                            <View className="ml-2 bg-purple-600 w-5 h-5 rounded-full items-center justify-center shadow-lg shadow-purple-500/20">
                                <Text className="text-white text-[10px] font-black">{chat.unread}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};
