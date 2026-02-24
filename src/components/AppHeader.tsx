import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, TextInput, Animated, ScrollView, Modal, Image } from 'react-native';
import { Svg, Path, Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { Icons } from '../utils/icons';
import { AnimatedPillNav } from './AnimatedPillNav';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ['전체', '과학', '경제'];

interface FeedNotification {
    id: string;
    type: 'like' | 'comment' | 'chat';
    content: string;
    time: string;
    isRead: boolean;
    sender: string;
}

interface AppHeaderProps {
    viewMode: 'feed' | 'connect' | 'lounge' | 'workspace' | 'settings' | 'grants';
    setViewMode: (mode: 'feed' | 'connect' | 'lounge' | 'workspace' | 'settings' | 'grants') => void;
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

export const AppHeader: React.FC<AppHeaderProps> = ({
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
    setNotifications
}) => {
    const { profile } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const hasNotification = notifications.some(n => !n.isRead);
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (hasNotification) {
            const wiggle = Animated.sequence([
                Animated.timing(rotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
                Animated.delay(1000)
            ]);
            Animated.loop(wiggle).start();
        } else {
            rotateAnim.setValue(0);
        }
    }, [hasNotification]);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-15deg', '15deg']
    });

    return (
        <View className="px-6 py-4 z-50">
            <View className="max-w-[1400px] w-full mx-auto flex-row justify-between items-center relative">
                {/* Left: Logo */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => { setViewMode('feed'); setActiveCategory('전체'); }}
                    className="flex-row items-center z-10"
                >
                    <View className="w-12 h-12 items-center justify-center bg-[#FDF8F3] rounded-[14px]">
                        <Image
                            source={require('../../assets/publica logo.png')}
                            style={{ width: 36, height: 36 }}
                            resizeMode="contain"
                        />
                    </View>
                    <View className="ml-3">
                        <Text className="text-white font-extrabold text-xl tracking-tighter">Publica</Text>
                    </View>
                </TouchableOpacity>

                {/* Centered Navigation (Desktop) - 🌟 MORPHING NAVIGATION */}
                {isDesktop && (
                    <View className="absolute inset-0 flex-row justify-center items-center pointer-events-none">
                        <View className="pointer-events-auto flex-row items-center gap-3">

                            {/* 1. Workspace Button */}
                            <TouchableOpacity
                                onPress={() => setViewMode('workspace')}
                                className={`h-12 px-5 rounded-full border items-center justify-center shadow-lg backdrop-blur-md transition-all ${viewMode === 'workspace'
                                    ? 'bg-purple-600 border-purple-500 shadow-purple-500/20'
                                    : 'bg-slate-800/80 border-white/10 shadow-black/20'}`}
                            >
                                <View className="flex-row items-center">
                                    <Icons.Zap size={16} color={viewMode === 'workspace' ? '#fff' : '#94A3B8'} style={{ marginRight: 6 }} />
                                    <Text className={`text-sm font-bold ${viewMode === 'workspace' ? 'text-white' : 'text-slate-400'}`}>My Workspace</Text>
                                </View>
                            </TouchableOpacity>


                            {/* 2. HUB Section */}
                            {!(viewMode === 'workspace') ? (
                                /* EXPANDED HUB: [ Connect Hub | Insight | Lounge ] */
                                <View className="h-12 px-2 rounded-full bg-slate-800/80 border border-white/10 flex-row items-center shadow-lg shadow-black/20 backdrop-blur-md">

                                    {/* Connect Hub */}
                                    <TouchableOpacity
                                        onPress={() => setViewMode('connect')}
                                        className={`h-9 px-3 rounded-full justify-center ${viewMode === 'connect' ? 'bg-emerald-600' : 'hover:bg-white/5'}`}
                                    >
                                        <Text className={`text-[13px] font-bold ${viewMode === 'connect' ? 'text-white' : 'text-slate-400'}`}>Connect Hub</Text>
                                    </TouchableOpacity>

                                    <View className="w-[1px] h-4 bg-white/10 mx-1" />

                                    {/* Insight: All */}
                                    <TouchableOpacity
                                        onPress={() => { setViewMode('feed'); setActiveCategory('전체'); }}
                                        className={`h-9 px-3 rounded-full justify-center ${viewMode === 'feed' && activeCategory === '전체' ? 'bg-blue-600' : 'hover:bg-white/5'}`}
                                    >
                                        <Text className={`text-[13px] font-bold ${viewMode === 'feed' && activeCategory === '전체' ? 'text-white' : 'text-slate-400'}`}>Insight</Text>
                                    </TouchableOpacity>

                                    <View className="w-[1px] h-4 bg-white/10 mx-1" />

                                    {/* Lounge */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (!user) {
                                                onAuthModalOpen();
                                            } else {
                                                setViewMode('lounge');
                                            }
                                        }}
                                        className={`h-9 px-3 rounded-full justify-center ${viewMode === 'lounge' ? 'bg-pink-600' : 'hover:bg-white/5'}`}
                                    >
                                        <Text className={`text-[13px] font-bold ${viewMode === 'lounge' ? 'text-white' : 'text-slate-400'}`}>Lounge</Text>
                                    </TouchableOpacity>

                                </View>
                            ) : (
                                /* COLLAPSED HUB: (Globe Icon) */
                                <TouchableOpacity
                                    onPress={() => { setViewMode('feed'); setActiveCategory('전체'); }}
                                    className="w-12 h-12 rounded-full bg-slate-800/50 border border-white/5 items-center justify-center hover:bg-slate-700 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Icons.Globe size={20} color="#64748B" />
                                </TouchableOpacity>
                            )}

                        </View>
                    </View>
                )}

                <View className="flex-row items-center z-10">
                    {!user ? (
                        <TouchableOpacity
                            onPress={onAuthModalOpen}
                            className="bg-white/10 px-4 py-2 rounded-xl flex-row items-center border border-white/10"
                        >
                            <Icons.User size={16} color="#fff" style={{ marginRight: 6 }} />
                            <Text className="text-white font-semibold text-sm">로그인</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            {!isDesktop && (
                                isSearchVisible ? (
                                    <View className="flex-row items-center bg-slate-800/80 rounded-2xl px-3 py-1.5 ml-2.5 border border-white/10 min-w-[200px]">
                                        <TextInput
                                            className="flex-1 text-white text-sm mr-2 min-w-[150px] p-0"
                                            placeholder="검색어 입력..."
                                            placeholderTextColor="#94A3B8"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            autoFocus
                                        />
                                        <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearchVisible(false); }}>
                                            <Icons.Close color="#94A3B8" size={20} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity onPress={() => setIsSearchVisible(true)}>
                                        <Icons.Search color="#fff" size={24} className="opacity-90 ml-5" />
                                    </TouchableOpacity>
                                )
                            )}

                            {/* Notification Bell Area */}
                            <View className="relative z-50">
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsNotificationOpen(!isNotificationOpen);
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="ml-5 relative"
                                >
                                    <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                                        <Icons.Bell color={hasNotification ? "#FDBA74" : "#fff"} size={24} className="opacity-90" fill={hasNotification ? "#FDBA74" : "none"} />
                                    </Animated.View>
                                    {hasNotification && (
                                        <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#020617]" />
                                    )}
                                </TouchableOpacity>

                                {/* Notification Dropdown */}
                                {isNotificationOpen && (
                                    <View className="absolute top-10 right-[-50px] w-[320px] bg-[#1E293B] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[100]">
                                        <View className="p-4 border-b border-white/5 flex-row justify-between items-center bg-[#0F172A]">
                                            <Text className="text-white font-bold">알림</Text>
                                            <TouchableOpacity onPress={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}>
                                                <Text className="text-xs text-slate-400">모두 읽음</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <ScrollView className="max-h-[300px]">
                                            {notifications.map((item) => (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    onPress={() => {
                                                        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
                                                    }}
                                                    className={`p-4 border-b border-white/5 flex-row gap-3 ${item.isRead ? 'opacity-50' : 'bg-blue-500/5'}`}
                                                >
                                                    <View className={`w-8 h-8 rounded-full items-center justify-center ${item.type === 'like' ? 'bg-pink-500/20' :
                                                        item.type === 'comment' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                                                        }`}>
                                                        {item.type === 'like' && <Icons.Heart size={14} color="#EC4899" fill="#EC4899" />}
                                                        {item.type === 'comment' && <Icons.MessageCircle size={14} color="#3B82F6" fill="#3B82F6" />}
                                                        {item.type === 'chat' && <Icons.MessageSquare size={14} color="#A855F7" fill="#A855F7" />}
                                                    </View>
                                                    <View className="flex-1">
                                                        <View className="flex-row justify-between mb-1">
                                                            <Text className="text-white font-bold text-sm">{item.sender}</Text>
                                                            <Text className="text-slate-500 text-xs">{item.time}</Text>
                                                        </View>
                                                        <Text className="text-slate-300 text-xs leading-4" numberOfLines={2}>{item.content}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* User Menu Area */}
                            <View className="relative z-50">
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsUserMenuOpen(!isUserMenuOpen);
                                        setIsNotificationOpen(false);
                                    }}
                                    className="ml-5"
                                >
                                    <View className="flex-row items-center ml-5">
                                        <View className="mr-3 items-end">
                                            <Text className="text-white text-[13px] font-bold">
                                                {user?.email?.split('@')[0]}
                                            </Text>
                                            <Text className="text-slate-400 text-[10px]">
                                                {profile?.user_type === 'business' || profile?.user_type === 'pre_entrepreneur'
                                                    ? (profile?.industry || '미지정')
                                                    : profile?.user_type === 'researcher'
                                                        ? (profile?.expertise || profile?.major_category || '미지정')
                                                        : (profile?.industry || user?.user_metadata?.user_role || '일반 사용자')}
                                            </Text>
                                        </View>
                                        <Icons.User color="#fff" size={24} className="opacity-90" />
                                    </View>
                                </TouchableOpacity>

                                {/* User Dropdown */}
                                {isUserMenuOpen && (
                                    <View className="absolute top-10 right-0 w-[200px] bg-[#1E293B] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[100]">
                                        <TouchableOpacity
                                            className="p-4 border-b border-white/5 flex-row items-center hover:bg-white/5"
                                            onPress={() => {
                                                setViewMode('workspace');
                                                setIsUserMenuOpen(false);
                                            }}
                                        >
                                            <Icons.User size={16} color="#94A3B8" className="mr-3" />
                                            <Text className="text-slate-200">마이페이지</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="p-4 border-b border-white/5 flex-row items-center hover:bg-white/5"
                                            onPress={() => {
                                                setIsProfileModalOpen(true);
                                                setIsUserMenuOpen(false);
                                            }}
                                        >
                                            <Icons.Settings size={16} color="#94A3B8" className="mr-3" />
                                            <Text className="text-slate-200">계정 설정</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="p-4 flex-row items-center hover:bg-white/5"
                                            onPress={() => {
                                                onSignOut();
                                                setIsUserMenuOpen(false);
                                            }}
                                        >
                                            <Icons.LogOut size={16} color="#EF4444" className="mr-3" />
                                            <Text className="text-red-400">로그아웃</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* Unified Profile Edit Modal */}
            <Modal
                visible={isProfileModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsProfileModalOpen(false)}
            >
                <ProfileSetupScreen
                    isEditing={true}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            </Modal>
        </View>
    );
};
