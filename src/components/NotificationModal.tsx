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
                    className="w-80 bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xl"
                    onStartShouldSetResponder={() => true} // Prevent closing when clicking inside
                >
                    <View className="px-5 py-4 border-b border-[#F1F5F9] flex-row items-center justify-between bg-white">
                        <View className="flex-row items-center gap-2.5">
                            <Bell size={18} color="#7C3AED" strokeWidth={2.5} />
                            <Text className="text-[#27272a] font-bold text-base">알림</Text>
                        </View>
                    </View>

                    <ScrollView className="max-h-[450px]">
                        {notifications.length === 0 ? (
                            <View className="p-10 items-center justify-center">
                                <Bell size={32} color="#CBD5E1" strokeWidth={1.5} className="mb-3" />
                                <Text className="text-[#94A3B8] text-sm font-medium">새로운 알림이 없습니다.</Text>
                            </View>
                        ) : (
                            notifications.map((noti) => (
                                <TouchableOpacity
                                    key={noti.id}
                                    className={`px-5 py-4 border-b border-[#F8FAFC] flex-row gap-3.5 transition-all ${noti.read ? 'opacity-40' : 'bg-[#7C3AED]/5 active:bg-[#7C3AED]/10'}`}
                                    onPress={() => onMarkAsRead(noti.id)}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center shadow-sm ${noti.type === 'like' ? 'bg-red-50' : 'bg-[#7C3AED]/10'}`}>
                                        {noti.type === 'like' ? <Heart size={16} color="#F87171" fill="#F87171" /> : <MessageCircle size={16} color="#7C3AED" fill="#7C3AED" />}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[#27272a] text-[13px] leading-5 mb-1.5 font-medium">{noti.message}</Text>
                                        <Text className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-tighter">{noti.timestamp}</Text>
                                    </View>
                                    {!noti.read && (
                                        <View className="w-2 h-2 rounded-full bg-[#7C3AED] mt-1.5 shadow-sm shadow-[#7C3AED]/50" />
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
