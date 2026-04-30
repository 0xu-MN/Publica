import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { X, Send, Paperclip, MoreVertical } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ChatModalProps {
    visible: boolean;
    onClose: () => void;
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

export const ChatModal = ({ visible, onClose, targetUser }: ChatModalProps) => {
    const { user } = useAuth();
    const otherName = targetUser?.name || 'User';
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (!visible || !user?.id || !targetUser?.id) {
            setMessages([]);
            return;
        }
        loadMessages();

        const channel = supabase
            .channel(`chatmodal_${[user.id, targetUser.id].sort().join('_')}`)
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
    }, [visible, user?.id, targetUser?.id]);

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
        if (visible) {
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages, visible]);

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

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end sm:justify-center sm:items-center bg-black/60">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="w-full sm:w-[400px] sm:h-[600px] h-[85%] bg-[#1E293B] sm:rounded-3xl rounded-t-3xl border border-white/10 overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <View className="px-5 py-4 bg-[#0F172A] border-b border-white/5 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3 relative">
                                <Text className="text-white font-bold text-base">{otherName[0]?.toUpperCase()}</Text>
                                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0F172A]" />
                            </View>
                            <View>
                                <Text className="text-white font-bold text-base">{otherName}</Text>
                                <Text className="text-slate-400 text-xs">Online</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity className="p-2">
                                <MoreVertical size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} className="p-2 bg-white/5 rounded-full">
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Chat Area */}
                    <ScrollView
                        className="flex-1 bg-[#050B14] p-4"
                        ref={scrollViewRef}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    >
                        {loading && (
                            <View className="items-center py-6">
                                <ActivityIndicator size="small" color="#3B82F6" />
                            </View>
                        )}

                        {!loading && messages.length === 0 && (
                            <View className="items-center py-10">
                                <Text className="text-slate-500 text-sm text-center">
                                    {`${otherName}님에게 첫 메시지를 보내보세요 👋`}
                                </Text>
                            </View>
                        )}

                        {messages.map((msg) => (
                            <View key={msg.id} className={`items-${msg.isMe ? 'end' : 'start'} mb-4`}>
                                <View className={`flex-row items-end ${msg.isMe ? 'justify-end' : ''}`}>
                                    {!msg.isMe && (
                                        <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-2 mb-4">
                                            <Text className="text-white text-xs font-bold">{otherName[0]?.toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <View>
                                        <View className={`p-3 rounded-2xl max-w-[280px] ${msg.isMe
                                            ? 'bg-blue-600 rounded-tr-none'
                                            : 'bg-[#1E293B] rounded-tl-none border border-white/5'
                                            }`}>
                                            <Text className={`${msg.isMe ? 'text-white' : 'text-slate-200'} text-sm leading-5`}>
                                                {msg.text}
                                            </Text>
                                        </View>
                                        <Text className={`text-slate-500 text-[10px] mt-1 ${msg.isMe ? 'text-right mr-1' : 'ml-1'}`}>
                                            {msg.timestamp}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Input Area */}
                    <View className="p-4 bg-[#0F172A] border-t border-white/5">
                        <View className="flex-row items-center bg-[#1E293B] rounded-full px-4 py-2 border border-white/5">
                            <TouchableOpacity className="mr-3">
                                <Paperclip size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            <TextInput
                                className="flex-1 text-white py-2 text-sm max-h-24"
                                placeholder="메시지 보내기..."
                                placeholderTextColor="#64748B"
                                multiline
                                value={message}
                                onChangeText={setMessage}
                            />
                            <TouchableOpacity
                                className={`ml-3 p-2 rounded-full ${message.trim() && !sending ? 'bg-blue-600' : 'bg-slate-700'}`}
                                onPress={handleSend}
                                disabled={!message.trim() || sending}
                            >
                                {sending
                                    ? <ActivityIndicator size="small" color="#3B82F6" />
                                    : <Send size={16} color={message.trim() ? "#fff" : "#94A3B8"} />
                                }
                            </TouchableOpacity>
                        </View>
                        <Text className="text-center text-slate-600 text-[10px] mt-3">
                            개인정보 보호를 위해 민감한 정보는 주의해주세요.
                        </Text>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};
