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
        <View className="flex-1 bg-[#0A1628] border-r border-white/5">
            {/* Header */}
            <View className="px-5 py-4 border-b border-white/5">
                <Text className="text-white font-bold text-lg mb-4">Messages</Text>
                {/* Search Bar Placeholder */}
                <View className="bg-[#1E293B] flex-row items-center px-3 py-2 rounded-xl border border-white/5">
                    <Search size={16} color="#64748B" />
                    <Text className="text-slate-500 text-sm ml-2">검색...</Text>
                </View>
            </View>

            {/* Chat List */}
            <ScrollView className="flex-1">
                {chats.length > 0 ? (
                    chats.map((chat) => (
                        <TouchableOpacity
                            key={chat.id}
                            className={`flex-row items-center p-4 border-b border-white/5 hover:bg-white/5 ${activeChatId === chat.id ? 'bg-blue-600/10' : ''}`}
                            onPress={() => onSelectChat({ id: chat.id, name: chat.name })}
                        >
                            <View className="w-12 h-12 rounded-full bg-blue-600/20 items-center justify-center mr-3 relative border border-blue-500/30">
                                <Text className="text-blue-400 font-bold text-lg">{chat.name[0]}</Text>
                                {chat.unread > 0 && (
                                    <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A1628]" />
                                )}
                            </View>
                            <View className="flex-1">
                                <View className="flex-row justify-between mb-1">
                                    <Text className="text-white font-bold text-sm" numberOfLines={1}>{chat.name}</Text>
                                    <Text className="text-slate-500 text-[10px]">{chat.timestamp}</Text>
                                </View>
                                <Text className={`text-xs ${chat.unread > 0 ? 'text-white font-bold' : 'text-slate-400'}`} numberOfLines={1}>
                                    {chat.lastMessage}
                                </Text>
                            </View>
                            {chat.unread > 0 && (
                                <View className="ml-2 bg-blue-600 w-5 h-5 rounded-full items-center justify-center">
                                    <Text className="text-white text-[10px] font-bold">{chat.unread}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                ) : (
                    <View className="flex-1 items-center justify-center p-6 mt-10">
                        <Mail size={48} color="#475569" />
                        <Text className="text-slate-500 text-center mt-4 text-sm">
                            대화 시작하기
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};
