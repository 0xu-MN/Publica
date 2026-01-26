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
    viewMode: 'feed' | 'dashboard' | 'support' | 'workspace' | 'public_profile' | 'settings';
    setViewMode: (mode: 'feed' | 'dashboard' | 'support' | 'workspace' | 'public_profile' | 'settings') => void;
    activeCategory: string;
    setActiveCategory: (category: string) => void;
    supportSubMode: 'overview' | 'support' | 'connect';
    setSupportSubMode: (mode: 'overview' | 'support' | 'connect') => void;
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
    supportSubMode,
    setSupportSubMode,
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
                supportSubMode={supportSubMode}
                setSupportSubMode={setSupportSubMode}
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
