import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Send, Paperclip, MoreVertical } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

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

export const ChatRoom = ({ targetUser }: ChatRoomProps) => {
    const { user } = useAuth();
    const otherName = targetUser?.name || 'User';
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);

    // Generate a unique key for this conversation
    const getChatKey = () => {
        if (!user?.id || !targetUser?.id) return null;
        const ids = [user.id, targetUser.id].sort();
        return `chat_room_${ids[0]}_${ids[1]}`;
    };

    // Load Messages
    useEffect(() => {
        if (user?.id && targetUser?.id) {
            loadMessages();
        } else {
            setMessages([]);
        }
    }, [user, targetUser]);

    const loadMessages = async () => {
        const key = getChatKey();
        if (!key) return;
        try {
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored);
                setMessages(parsed.map((m: any) => ({
                    ...m,
                    isMe: m.senderId === user?.id
                })));
            } else {
                setMessages([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const scrollViewRef = useRef<ScrollView>(null);

    const updateThread = async (userId: string, otherUser: { id: string, name: string }, lastMsg: string) => {
        const threadKey = `chat_threads_${userId}`;
        try {
            const stored = await AsyncStorage.getItem(threadKey);
            let threads = stored ? JSON.parse(stored) : [];

            threads = threads.filter((t: any) => t.id !== otherUser.id);

            const newThread = {
                id: otherUser.id,
                name: otherUser.name,
                lastMessage: lastMsg,
                timestamp: '방금 전',
                unread: userId === user?.id ? 0 : 1
            };

            threads.unshift(newThread);
            await AsyncStorage.setItem(threadKey, JSON.stringify(threads));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSend = async () => {
        if (!message.trim() || !user || !targetUser) return;

        const timestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const newMessage: Message = {
            id: Date.now().toString(),
            text: message,
            isMe: true,
            senderId: user.id,
            timestamp: timestamp
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setMessage('');

        const key = getChatKey();
        if (key) {
            await AsyncStorage.setItem(key, JSON.stringify(updatedMessages));
        }

        await updateThread(user.id, targetUser, message);
        const myName = user.email ? user.email.split('@')[0] : 'User';
        await updateThread(targetUser.id, { id: user.id, name: myName }, message);
    };

    useEffect(() => {
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages, targetUser]); // Scroll on new message or user change

    if (!targetUser) {
        return (
            <View className="flex-1 items-center justify-center bg-[#1E293B] rounded-3xl border border-white/10">
                <Text className="text-slate-500">대화 상대를 선택해주세요.</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-[#1E293B] rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
        >
            {/* Header */}
            <View className="px-5 py-4 bg-[#0F172A] border-b border-white/5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3 relative overflow-hidden">
                        {targetUser.imageUrl ? (
                            <Image source={{ uri: targetUser.imageUrl }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <Text className="text-white font-bold">{otherName[0]}</Text>
                        )}
                        <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0F172A]" />
                    </View>
                    <View>
                        <Text className="text-white font-bold text-base">{otherName}</Text>
                        <Text className="text-slate-400 text-xs">Online</Text>
                    </View>
                </View>
                <TouchableOpacity className="p-2">
                    <MoreVertical size={20} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <ScrollView
                className="flex-1 bg-[#050B14] p-4"
                ref={scrollViewRef}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {/* Simulated Welcome Message if Empty */}
                {messages.length === 0 && (
                    <View className="items-start mb-4">
                        <View className="flex-row items-end">
                            <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-2 mb-4">
                                <Text className="text-white text-xs font-bold">{otherName[0]}</Text>
                            </View>
                            <View>
                                <View className="p-3 rounded-2xl max-w-[280px] bg-[#1E293B] rounded-tl-none border border-white/5">
                                    <Text className="text-slate-200 text-sm leading-5">
                                        {`안녕하세요, ${otherName}입니다. 👋\n협업 제안이나 문의사항이 있으시면 언제든 메시지 남겨주세요.`}
                                    </Text>
                                </View>
                                <Text className="text-slate-500 text-[10px] mt-1 ml-1">
                                    자동 메시지
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {messages.map((msg) => (
                    <View key={msg.id} className={`items-${msg.isMe ? 'end' : 'start'} mb-4`}>
                        <View className={`flex-row items-end ${msg.isMe ? 'justify-end' : ''}`}>
                            {!msg.isMe && (
                                <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-2 mb-4 overflow-hidden">
                                    {targetUser.imageUrl ? (
                                        <Image source={{ uri: targetUser.imageUrl }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <Text className="text-white text-xs font-bold">{otherName[0]}</Text>
                                    )}
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
                        className={`ml-3 p-2 rounded-full ${message.trim() ? 'bg-blue-600' : 'bg-slate-700'}`}
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Send size={16} color={message.trim() ? "#fff" : "#94A3B8"} />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};
