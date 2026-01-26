import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, TextInput, Animated, ScrollView } from 'react-native';
import { Icons } from '../utils/icons';
import { AnimatedPillNav } from './AnimatedPillNav';

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
}

export const AppHeader: React.FC<AppHeaderProps> = ({
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
    setNotifications
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
                <View className="flex-row items-center z-10">
                    <View className="w-9 h-9 bg-blue-500 rounded-lg items-center justify-center mr-3">
                        <Text className="text-white font-bold text-[22px]">I</Text>
                    </View>
                    <View>
                        <Text className="text-white font-extrabold text-lg tracking-tighter">InsightFlow</Text>
                        <Text className="text-slate-400 text-[11px] mt-0.5">AI 뉴스 큐레이션</Text>
                    </View>
                </View>

                {/* Centered Navigation (Desktop) */}
                {isDesktop && (
                    <View className="absolute inset-0 flex-row justify-center items-center pointer-events-none">
                        <View className="flex-row items-center pointer-events-auto gap-4">

                            {/* 1. Left Control: Home/Dashboard/Workspace Morphing */}
                            {viewMode === 'feed' ? (
                                <TouchableOpacity
                                    className="w-12 h-12 rounded-full bg-slate-800/50 border border-white/5 items-center justify-center hover:bg-slate-700 transition-all"
                                    onPress={() => {
                                        if (!user) {
                                            onAuthModalOpen();
                                        } else {
                                            setViewMode('dashboard');
                                        }
                                    }}
                                >
                                    <Icons.Home size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            ) : (viewMode === 'dashboard' || viewMode === 'workspace') ? (
                                <View className="h-12 px-6 rounded-full bg-blue-600 flex-row items-center shadow-lg shadow-blue-500/20">
                                    <TouchableOpacity
                                        className={`flex-row items-center transition-all ${viewMode === 'dashboard' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                        onPress={() => {
                                            if (!user) {
                                                onAuthModalOpen();
                                            } else {
                                                setViewMode('dashboard');
                                            }
                                        }}
                                    >
                                        <Icons.Home size={16} color="#fff" style={{ marginRight: 6 }} />
                                        <Text className="text-white font-bold text-sm">홈</Text>
                                    </TouchableOpacity>

                                    <View className="w-[1px] h-3 bg-white/30 mx-4" />

                                    <TouchableOpacity
                                        className={`flex-row items-center transition-all ${viewMode === 'workspace' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                        onPress={() => {
                                            if (!user) {
                                                onAuthModalOpen();
                                            } else {
                                                setViewMode('workspace');
                                            }
                                        }}
                                    >
                                        <Icons.Sparkles size={16} color="#fff" style={{ marginRight: 6 }} />
                                        <Text className="text-white font-bold text-sm">Workspace</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    className="w-12 h-12 rounded-full bg-slate-800/50 border border-white/5 items-center justify-center hover:bg-slate-700 transition-all"
                                    onPress={() => {
                                        if (!user) {
                                            onAuthModalOpen();
                                        } else {
                                            setViewMode('dashboard');
                                        }
                                    }}
                                >
                                    <Icons.Home size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            )}

                            {/* 2. Center Control: Category Morphing */}
                            {viewMode === 'feed' ? (
                                <AnimatedPillNav
                                    items={CATEGORIES}
                                    activeItem={activeCategory}
                                    onItemChange={setActiveCategory}
                                    backgroundColor="rgba(15, 23, 42, 0.5)"
                                    activeBackgroundColor="#3B82F6"
                                    textColor="rgb(148, 163, 184)"
                                    activeTextColor="rgb(255, 255, 255)"
                                    borderColor="rgba(255, 255, 255, 0.1)"
                                    renderIcon={(item, isActive) => {
                                        const iconColor = isActive ? '#fff' : '#94A3B8';
                                        if (item === '전체') return <Icons.Sparkles size={14} color={iconColor} />;
                                        if (item === '과학') return <Icons.Atom size={14} color={iconColor} />;
                                        if (item === '경제') return <Icons.TrendingUp size={14} color={iconColor} />;
                                        return null;
                                    }}
                                />
                            ) : (
                                <TouchableOpacity
                                    className="w-12 h-12 rounded-full bg-slate-800/50 border border-white/5 items-center justify-center hover:bg-slate-700 transition-all"
                                    onPress={() => setViewMode('feed')}
                                >
                                    <Icons.Folder size={20} color="#64748B" />
                                </TouchableOpacity>
                            )}

                            {/* 3. Right Control: Support Button / Toggle */}
                            {viewMode === 'support' ? (
                                <View className="ml-2">
                                    <AnimatedPillNav
                                        items={['Connect Hub', 'Support', 'Lounge']}
                                        activeItem={supportSubMode === 'overview' ? 'Connect Hub' : supportSubMode === 'support' ? 'Support' : 'Lounge'}
                                        onItemChange={(item) => setSupportSubMode(item === 'Connect Hub' ? 'overview' : item === 'Support' ? 'support' : 'connect')}
                                        backgroundColor="rgba(15, 23, 42, 0.5)"
                                        activeBackgroundColor="#10B981"
                                        textColor="rgb(148, 163, 184)"
                                        activeTextColor="rgb(255, 255, 255)"
                                        borderColor="rgba(255, 255, 255, 0.1)"
                                        renderIcon={(item, isActive) => {
                                            const iconColor = isActive ? '#fff' : '#94A3B8';
                                            if (item === 'Connect Hub') {
                                                return <Icons.Home size={14} color={iconColor} />;
                                            } else if (item === 'Support') {
                                                return <Icons.Building2 size={14} color={iconColor} />;
                                            } else {
                                                return <Icons.Users size={14} color={iconColor} />;
                                            }
                                        }}
                                    />
                                </View>
                            ) : (
                                <TouchableOpacity
                                    className="w-12 h-12 rounded-full flex-row items-center justify-center bg-slate-800/50 border border-white/10 hover:bg-slate-700 transition-all"
                                    onPress={() => {
                                        setViewMode('support');
                                        setSupportSubMode('overview');
                                    }}
                                >
                                    <Icons.HeartHandshake size={20} color="#94A3B8" />
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
                                    <Icons.User color="#fff" size={24} className="opacity-90" />
                                </TouchableOpacity>

                                {/* User Dropdown */}
                                {isUserMenuOpen && (
                                    <View className="absolute top-10 right-0 w-[200px] bg-[#1E293B] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[100]">
                                        <TouchableOpacity
                                            className="p-4 border-b border-white/5 flex-row items-center hover:bg-white/5"
                                            onPress={() => {
                                                setViewMode('dashboard');
                                                setIsUserMenuOpen(false);
                                            }}
                                        >
                                            <Icons.User size={16} color="#94A3B8" className="mr-3" />
                                            <Text className="text-slate-200">마이페이지</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="p-4 border-b border-white/5 flex-row items-center hover:bg-white/5"
                                            onPress={() => {
                                                setViewMode('settings');
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
        </View>
    );
};
