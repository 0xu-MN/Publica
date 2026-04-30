import React from 'react';
import { View, SafeAreaView, StatusBar, useColorScheme, StyleSheet } from 'react-native';
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
}) => {
    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

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

            <View style={[
                styles.mainContainer,
                { paddingTop: 0 }
            ]}>
                {children}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingTop: 0,
    },
});
