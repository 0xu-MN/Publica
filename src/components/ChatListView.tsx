import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mail, Search } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

interface ChatUser {
    id: string;
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
    const [chats, setChats] = useState<ChatUser[]>([]);

    useEffect(() => {
        if (user?.id) {
            loadChats();
            const interval = setInterval(loadChats, 2000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadChats = async () => {
        if (!user?.id) return;
        try {
            const stored = await AsyncStorage.getItem(`chat_threads_${user.id}`);
            if (stored) {
                setChats(JSON.parse(stored));
            } else {
                setChats([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View className="flex-1 bg-white border-r border-slate-200">
            {/* Header */}
            <View className="px-5 py-6 border-b border-slate-100">
                <Text className="text-[#27272a] font-extrabold text-xl mb-4 tracking-tight">Messages</Text>
                {/* Search Bar */}
                <View className="bg-slate-50 flex-row items-center px-4 py-3 rounded-2xl border border-slate-200">
                    <Search size={18} color="#94A3B8" />
                    <Text className="text-slate-400 text-sm ml-3 font-medium">채팅 검색...</Text>
                </View>
            </View>

            {/* Chat List */}
            <ScrollView className="flex-1 bg-white">
                {chats.length > 0 ? (
                    chats.map((chat) => (
                        <TouchableOpacity
                            key={chat.id}
                            className={`flex-row items-center p-4 border-b border-slate-50 transition-all ${activeChatId === chat.id ? 'bg-purple-500/5' : ''}`}
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
                    ))
                ) : (
                    <View className="flex-1 items-center justify-center p-10 mt-10">
                        <View className="w-20 h-20 rounded-full bg-slate-50 items-center justify-center mb-6">
                            <Mail size={32} color="#CBD5E1" />
                        </View>
                        <Text className="text-slate-400 text-center text-sm font-medium">
                            아직 진행 중인 대화가 없습니다
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};
