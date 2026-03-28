import React from 'react';
import { View, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { AppHeader } from './AppHeader';

interface FeedNotification {
    id: string;
    type: 'like' | 'comment' | 'chat';
    content: string;
    time: string;
    isRead: boolean;
    sender: string;
}

interface MainLayoutProps {
    children: React.ReactNode;
    viewMode: 'feed' | 'connect' | 'lounge' | 'workspace' | 'settings' | 'grants' | 'pricing' | 'landing';
    setViewMode: (mode: 'feed' | 'connect' | 'lounge' | 'workspace' | 'settings' | 'grants' | 'pricing' | 'landing') => void;
    activeCategory: string;
    setActiveCategory: (category: string) => void;
    user: any;
    onAuthModalOpen: () => void;
    onSignOut: () => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isSearchVisible: boolean;
    setIsSearchVisible: (visible: boolean) => void;
    notifications: FeedNotification[];
    setNotifications: React.Dispatch<React.SetStateAction<FeedNotification[]>>;
    showFooter?: boolean; // Optional: some screens may not need footer
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    viewMode,
    setViewMode,
    activeCategory,
    setActiveCategory,
    user,
    onAuthModalOpen,
    onSignOut,
    searchQuery,
    setSearchQuery,
    isSearchVisible,
    setIsSearchVisible,
    notifications,
    setNotifications,
    showFooter = true
}) => {
    return (
        <SafeAreaView className="flex-1 bg-[#020617]">
            <StatusBar barStyle="light-content" />

            <AppHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                user={user}
                onAuthModalOpen={onAuthModalOpen}
                onSignOut={onSignOut}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isSearchVisible={isSearchVisible}
                setIsSearchVisible={setIsSearchVisible}
                notifications={notifications}
                setNotifications={setNotifications}
            />

            <View className="flex-1">
                {children}
            </View>
        </SafeAreaView>
    );
};
