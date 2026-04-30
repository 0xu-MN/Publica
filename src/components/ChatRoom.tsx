import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Send, Paperclip, MoreVertical } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ChatRoomProps {
    targetUser?: { id: string; name: string; imageUrl?: string };
}

interface Message {
    id: string;
    text: string;
    isMe: boolean;
    senderId: string;
    timestamp: string;
}

const toMsg = (row: any, currentUserId: string): Message => ({
    id: row.id,
    text: row.content,
    isMe: row.sender_id === currentUserId,
    senderId: row.sender_id,
    timestamp: new Date(row.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
});

export const ChatRoom = ({ targetUser }: ChatRoomProps) => {
    const { user } = useAuth();
    const otherName = targetUser?.name || 'User';
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (!user?.id || !targetUser?.id) {
            setMessages([]);
            return;
        }
        loadMessages();

        const channel = supabase
            .channel(`chat_${[user.id, targetUser.id].sort().join('_')}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
                (payload) => {
                    const row = payload.new as any;
                    if (row.sender_id === targetUser.id) {
                        setMessages(prev => [...prev, toMsg(row, user.id)]);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id, targetUser?.id]);

    const loadMessages = async () => {
        if (!user?.id || !targetUser?.id) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .or(
                    `and(sender_id.eq.${user.id},receiver_id.eq.${targetUser.id}),` +
                    `and(sender_id.eq.${targetUser.id},receiver_id.eq.${user.id})`
                )
                .order('created_at', { ascending: true });

            if (data) setMessages(data.map(r => toMsg(r, user.id)));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages, targetUser]);

    const handleSend = async () => {
        if (!message.trim() || !user || !targetUser || sending) return;
        setSending(true);
        const text = message.trim();
        setMessage('');
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({ sender_id: user.id, receiver_id: targetUser.id, content: text })
                .select()
                .single();

            if (!error && data) {
                setMessages(prev => [...prev, toMsg(data, user.id)]);
            }
        } finally {
            setSending(false);
        }
    };

    if (!targetUser) {
        return (
            <View className="flex-1 items-center justify-center bg-white rounded-3xl border border-slate-200/60">
                <Text className="text-slate-400 font-medium">대화 상대를 선택해주세요.</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-2xl"
        >
            {/* Header */}
            <View className="px-5 py-4 bg-white border-b border-slate-100 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-purple-500/10 items-center justify-center mr-3 relative overflow-hidden">
                        {targetUser.imageUrl ? (
                            <Image source={{ uri: targetUser.imageUrl }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <Text className="text-purple-600 font-bold">{otherName[0]}</Text>
                        )}
                        <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </View>
                    <View>
                        <Text className="text-[#27272a] font-bold text-base">{otherName}</Text>
                        <Text className="text-slate-400 text-xs font-medium">Online</Text>
                    </View>
                </View>
                <TouchableOpacity className="p-2">
                    <MoreVertical size={20} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <ScrollView
                className="flex-1 bg-slate-50/30 p-4"
                ref={scrollViewRef}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {loading && (
                    <View className="items-center py-6">
                        <ActivityIndicator size="small" color="#9333EA" />
                    </View>
                )}

                {!loading && messages.length === 0 && (
                    <View className="items-start mb-4">
                        <View className="flex-row items-end">
                            <View className="w-8 h-8 rounded-full bg-purple-500/10 items-center justify-center mr-2 mb-4">
                                <Text className="text-purple-600 text-xs font-bold">{otherName[0]}</Text>
                            </View>
                            <View>
                                <View className="p-3 rounded-2xl max-w-[280px] bg-white rounded-tl-none border border-slate-200/60 shadow-sm">
                                    <Text className="text-slate-600 text-sm leading-5 font-medium">
                                        {`안녕하세요, ${otherName}입니다. 👋\n협업 제안이나 문의사항이 있으시면 언제든 메시지 남겨주세요.`}
                                    </Text>
                                </View>
                                <Text className="text-slate-400 text-[10px] mt-1 ml-1 font-medium">자동 메시지</Text>
                            </View>
                        </View>
                    </View>
                )}

                {messages.map((msg) => (
                    <View key={msg.id} className={`items-${msg.isMe ? 'end' : 'start'} mb-4`}>
                        <View className={`flex-row items-end ${msg.isMe ? 'justify-end' : ''}`}>
                            {!msg.isMe && (
                                <View className="w-8 h-8 rounded-full bg-purple-500/10 items-center justify-center mr-2 mb-4 overflow-hidden shadow-sm">
                                    {targetUser.imageUrl ? (
                                        <Image source={{ uri: targetUser.imageUrl }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <Text className="text-purple-600 text-xs font-bold">{otherName[0]}</Text>
                                    )}
                                </View>
                            )}
                            <View>
                                <View className={`p-3 rounded-2xl max-w-[280px] shadow-sm ${msg.isMe
                                    ? 'bg-purple-600 rounded-tr-none'
                                    : 'bg-white rounded-tl-none border border-slate-200/60'
                                    }`}>
                                    <Text className={`${msg.isMe ? 'text-white' : 'text-slate-700'} text-sm leading-5 font-medium`}>
                                        {msg.text}
                                    </Text>
                                </View>
                                <Text className={`text-slate-400 text-[10px] mt-1 font-medium ${msg.isMe ? 'text-right mr-1' : 'ml-1'}`}>
                                    {msg.timestamp}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Input Area */}
            <View className="p-4 bg-white border-t border-slate-100">
                <View className="flex-row items-center bg-slate-50 rounded-full px-4 py-2 border border-slate-200">
                    <TouchableOpacity className="mr-3">
                        <Paperclip size={20} color="#94A3B8" />
                    </TouchableOpacity>
                    <TextInput
                        className="flex-1 text-[#27272a] py-2 text-sm max-h-24 bg-transparent"
                        placeholder="메시지 보내기..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        value={message}
                        onChangeText={setMessage}
                        onSubmitEditing={handleSend}
                        style={{ outlineWidth: 0 } as any}
                    />
                    <TouchableOpacity
                        className={`ml-3 p-2 rounded-full ${message.trim() && !sending ? 'bg-purple-600' : 'bg-slate-200'}`}
                        onPress={handleSend}
                        disabled={!message.trim() || sending}
                    >
                        {sending
                            ? <ActivityIndicator size="small" color="#9333EA" />
                            : <Send size={16} color={message.trim() ? "#fff" : "#94A3B8"} />
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};
