import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mail, Search, MoreVertical, X } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

interface ChatUser {
    id: string;
    name: string;
    lastMessage: string;
    timestamp: string;
    unread: number;
}

interface ChatListModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectChat: (user: { id: string; name: string }) => void;
}

export const ChatListModal = ({ visible, onClose, onSelectChat }: ChatListModalProps) => {
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatUser[]>([]);

    useEffect(() => {
        if (visible && user?.id) {
            loadChats();
        }
    }, [visible, user]);

    // Simple poller to refresh Inbox when open
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (visible && user?.id) {
            interval = setInterval(loadChats, 2000);
        }
        return () => clearInterval(interval);
    }, [visible, user]);

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
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                className="flex-1 bg-black/60 items-center justify-center p-4"
            >
                <View
                    className="w-full max-w-sm bg-[#1E293B] rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-[500px]"
                    onStartShouldSetResponder={() => true}
                >
                    {/* Header */}
                    <View className="px-5 py-4 bg-[#0F172A] border-b border-white/5 flex-row items-center justify-between">
                        <Text className="text-white font-bold text-lg">Messages</Text>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-white/5 rounded-full">
                            <X size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Chat List */}
                    <ScrollView className="flex-1">
                        {chats.length > 0 ? (
                            chats.map((chat) => (
                                <TouchableOpacity
                                    key={chat.id}
                                    className="flex-row items-center p-4 border-b border-white/5 hover:bg-white/5"
                                    onPress={() => {
                                        onSelectChat({ id: chat.id, name: chat.name });
                                        onClose();
                                    }}
                                >
                                    <View className="w-12 h-12 rounded-full bg-blue-600/20 items-center justify-center mr-3 relative border border-blue-500/30">
                                        <Text className="text-blue-400 font-bold text-lg">{chat.name[0]}</Text>
                                        {chat.unread > 0 && (
                                            <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1E293B]" />
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-white font-bold text-sm">{chat.name}</Text>
                                            <Text className="text-slate-500 text-xs">{chat.timestamp}</Text>
                                        </View>
                                        <Text className="text-slate-400 text-xs" numberOfLines={1}>{chat.lastMessage}</Text>
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
                                    대화 기록이 없습니다. {'\n'}첫 메시지를 보내보세요!
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};
