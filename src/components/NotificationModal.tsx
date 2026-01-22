import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { X, Bell, MessageCircle, Heart } from 'lucide-react-native';
import { Notification } from '../hooks/useNotifications';

interface NotificationModalProps {
    visible: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
}

export const NotificationModal = ({ visible, onClose, notifications, onMarkAsRead }: NotificationModalProps) => {
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
                className="flex-1 bg-black/60 items-end justify-start pt-20 pr-4 sm:pr-20"
            >
                <View
                    className="w-80 bg-[#1E293B] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
                    onStartShouldSetResponder={() => true} // Prevent closing when clicking inside
                >
                    <View className="px-4 py-3 border-b border-white/5 flex-row items-center justify-between bg-[#0F172A]">
                        <View className="flex-row items-center gap-2">
                            <Bell size={16} color="#3B82F6" />
                            <Text className="text-white font-bold">알림</Text>
                        </View>
                        {/* <TouchableOpacity onPress={onClose}>
                            <X size={18} color="#94A3B8" />
                        </TouchableOpacity> */}
                    </View>

                    <ScrollView className="max-h-[400px]">
                        {notifications.length === 0 ? (
                            <View className="p-8 items-center justify-center">
                                <Text className="text-slate-500 text-sm">새로운 알림이 없습니다.</Text>
                            </View>
                        ) : (
                            notifications.map((noti) => (
                                <TouchableOpacity
                                    key={noti.id}
                                    className={`p-4 border-b border-white/5 flex-row gap-3 ${noti.read ? 'opacity-50' : 'bg-blue-500/5'}`}
                                    onPress={() => onMarkAsRead(noti.id)}
                                >
                                    <View className={`w-8 h-8 rounded-full items-center justify-center ${noti.type === 'like' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                                        {noti.type === 'like' ? <Heart size={14} color="#EF4444" /> : <MessageCircle size={14} color="#3B82F6" />}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-200 text-xs leading-5 mb-1">{noti.message}</Text>
                                        <Text className="text-slate-500 text-[10px]">{noti.timestamp}</Text>
                                    </View>
                                    {!noti.read && (
                                        <View className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};
