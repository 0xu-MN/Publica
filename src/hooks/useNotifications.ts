import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
    id: string;
    userId: string; // The specific user who receives this notification
    type: 'comment' | 'like';
    message: string;
    timestamp: string;
    read: boolean;
    relatedId?: string; // postId
}

const NOTIFICATIONS_KEY = 'user_notifications';

export const useNotifications = (currentUserId?: string) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        loadNotifications();
    }, [currentUserId]);

    const loadNotifications = async () => {
        try {
            const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
            if (stored) {
                const all = JSON.parse(stored);
                // In real app, backend filters. Here we filter by target userId
                // If not logged in, empty? Or just show all?
                // Let's emulate backend: currentUserId needed
                setNotifications(all);
            }
        } catch (e) { console.error(e); }
    };

    const addNotification = useCallback(async (targetUserId: string, message: string, type: 'comment' | 'like', relatedId?: string) => {
        const newNoti: Notification = {
            id: Date.now().toString(),
            userId: targetUserId,
            type,
            message,
            timestamp: '방금 전',
            read: false,
            relatedId
        };

        try {
            const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
            const all: Notification[] = stored ? JSON.parse(stored) : [];
            const updated = [newNoti, ...all];
            await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
            setNotifications(updated);
        } catch (e) { console.error(e); }
    }, []);

    const markAsRead = useCallback(async (notiId: string) => {
        try {
            const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
            if (stored) {
                const all: Notification[] = JSON.parse(stored);
                const updated = all.map(n => n.id === notiId ? { ...n, read: true } : n);
                await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
                setNotifications(updated);
            }
        } catch (e) { console.error(e); }
    }, []);

    // Filter for current user
    const myNotifications = currentUserId
        ? notifications.filter(n => n.userId === currentUserId || n.userId === 'all')
        : [];

    const unreadCount = myNotifications.filter(n => !n.read).length;

    return { notifications: myNotifications, addNotification, markAsRead, unreadCount };
};
