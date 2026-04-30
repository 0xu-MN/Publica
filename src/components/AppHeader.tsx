import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, useWindowDimensions,
    Animated, ScrollView, Modal, Image, StyleSheet, Platform
} from 'react-native';
import { Icons } from '../utils/icons';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { useAuth } from '../contexts/AuthContext';
import { useProjectStore } from '../store/useProjectStore';

interface FeedNotification {
    id: string;
    type: 'like' | 'comment' | 'chat';
    content: string;
    time: string;
    isRead: boolean;
    sender: string;
}

interface AppHeaderProps {
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
    const isDesktop = width >= 900;

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const hasNotification = notifications.some(n => !n.isRead);
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // Scroll listener for glass effect intensity
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleScroll = () => setScrolled(window.scrollY > 20);
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, []);

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

    // 항상 동일한 light glass 헤더
    const headerStyle = [
        styles.headerContainer,
        scrolled && (styles.headerScrolled as any),
    ];

    return (
        <View style={headerStyle}>
            <View style={styles.headerInner}>

                {/* ── Left: Logo ── */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setViewMode(user ? 'connect' : 'landing'); setActiveCategory('전체'); }}
                    style={styles.logoWrapper}
                >
                    <Image
                        source={require('../../assets/p_logo_test_5.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                {/* ── Center Nav (Desktop) ── */}
                {isDesktop && (
                    <View style={styles.navCentered}>
                        <View style={styles.navRow}>
                            {!user ? (
                                /* ── GUEST NAV ── */
                                <>
                                    <NavItem label="서비스 소개" active={viewMode === 'landing'} onPress={() => setViewMode('landing')} />
                                    <NavItem label="요금안내" active={viewMode === 'pricing'} onPress={() => setViewMode('pricing')} />
                                    <NavItem label="Insight" active={viewMode === 'feed'} onPress={() => { setViewMode('feed'); setActiveCategory('전체'); }} />
                                </>
                            ) : (
                                /* ── USER NAV ── */
                                <>
                                    <NavItem label="Connect Hub" active={viewMode === 'connect' || viewMode === 'grants'} onPress={() => setViewMode('connect')} />
                                    <NavItem label="Insight" active={viewMode === 'feed'} onPress={() => { setViewMode('feed'); setActiveCategory('전체'); }} />
                                    <NavItem label="Lounge" active={viewMode === 'lounge'} onPress={() => setViewMode('lounge')} />
                                    <TouchableOpacity
                                        style={[styles.headerWorkspaceBtn, { marginLeft: 16 }]}
                                        onPress={() => setViewMode('workspace')}
                                    >
                                        <Icons.Zap size={14} color="#FFF" />
                                        <Text style={styles.headerWorkspaceText}>My Workspace</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                )}

                {/* ── Right: Actions ── */}
                <View style={styles.rightActions}>
                    {!user ? (
                        /* Guest: login + register button */
                        <View style={styles.authGroup}>
                            <TouchableOpacity onPress={onAuthModalOpen} style={styles.loginBtn}>
                                <Text style={styles.loginBtnText}>로그인</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onAuthModalOpen} style={styles.registerBtn}>
                                <Text style={styles.registerBtnText}>회원가입</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Logged in: notification + profile */
                        <View style={styles.utilityGroup}>
                            {/* Notification */}
                            <View style={styles.notificationWrapper}>
                                <TouchableOpacity onPress={() => { setIsNotificationOpen(!isNotificationOpen); setIsUserMenuOpen(false); }}>
                                    <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                                        <Icons.Bell color={hasNotification ? '#F59E0B' : '#64748B'} size={22} fill={hasNotification ? '#F59E0B' : 'none'} />
                                    </Animated.View>
                                    {hasNotification && <View style={styles.notificationDot} />}
                                </TouchableOpacity>
                                {isNotificationOpen && (
                                    <View style={styles.dropdownMenu}>
                                        <View style={styles.dropdownHeader}>
                                            <Text style={styles.dropdownHeaderText}>알림</Text>
                                            <TouchableOpacity onPress={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}>
                                                <Text style={styles.markReadText}>모두 읽음</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <ScrollView style={{ maxHeight: 280 }}>
                                            {notifications.map((item) => (
                                                <TouchableOpacity key={item.id} style={[styles.dropdownItem, !item.isRead && { backgroundColor: '#7C3AED05' }]}>
                                                    <View style={[styles.notifIcon, item.type === 'like' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#F5F3FF' }]}>
                                                        {item.type === 'like' ? <Icons.Heart size={13} color="#EF4444" fill="#EF4444" /> : <Icons.MessageCircle size={13} color="#7C3AED" />}
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={styles.notifMeta}>
                                                            <Text style={styles.notifSender}>{item.sender}</Text>
                                                            <Text style={styles.notifTime}>{item.time}</Text>
                                                        </View>
                                                        <Text style={styles.notifContent} numberOfLines={2}>{item.content}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Profile */}
                            <View style={styles.userMenuWrapper}>
                                <TouchableOpacity style={styles.userAvatar} onPress={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationOpen(false); }}>
                                    <Icons.User color="#64748B" size={20} />
                                </TouchableOpacity>
                                {isUserMenuOpen && (
                                    <View style={[styles.dropdownMenu, { right: 0, width: 180 }]}>
                                        <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                            <Text style={{ color: '#18181B', fontSize: 13, fontWeight: '800' }}>{user?.email?.split('@')[0]}</Text>
                                            <Text style={{ color: '#94A3B8', fontSize: 11 }}>{profile?.industry || 'Researcher'}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.menuItem} onPress={() => { setViewMode('workspace'); setIsUserMenuOpen(false); }}>
                                            <Icons.LayoutDashboard size={15} color="#94A3B8" style={{ marginRight: 10 }} />
                                            <Text style={styles.menuItemText}>워크스페이스</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.menuItem} onPress={() => { setIsProfileModalOpen(true); setIsUserMenuOpen(false); }}>
                                            <Icons.Settings size={15} color="#94A3B8" style={{ marginRight: 10 }} />
                                            <Text style={styles.menuItemText}>계정 설정</Text>
                                        </TouchableOpacity>
                                        <View style={styles.menuDivider} />
                                        <TouchableOpacity style={styles.menuItem} onPress={() => { onSignOut(); setIsUserMenuOpen(false); }}>
                                            <Icons.LogOut size={15} color="#EF4444" style={{ marginRight: 10 }} />
                                            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>로그아웃</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </View>

            <Modal visible={isProfileModalOpen} animationType="fade" transparent={true} onRequestClose={() => setIsProfileModalOpen(false)}>
                <ProfileSetupScreen isEditing={true} onClose={() => setIsProfileModalOpen(false)} />
            </Modal>
        </View>
    );
};

/* ── Small NavItem sub-component ── */
const NavItem: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.navItem}>
        <Text style={[styles.navItemText, active && styles.navItemActive]}>{label}</Text>
        {active && <View style={styles.navItemDot} />}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    headerContainer: {
        width: '100%',
        position: 'absolute' as any,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        ...(Platform.OS === 'web' ? {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
        } : {}),
    } as any,

    headerScrolled: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottomColor: 'rgba(0,0,0,0.08)',
    } as any,

    headerInner: {
        maxWidth: 1400,
        width: '100%',
        alignSelf: 'center',
        height: 72,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
    },

    logoWrapper: { flexDirection: 'row', alignItems: 'center' },
    headerLogo: { height: 36, width: 140 },

    /* Center nav */
    navCentered: {
        position: 'absolute' as any,
        left: 0,
        right: 0,
        alignItems: 'center',
        pointerEvents: 'none' as any,
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 36,
        pointerEvents: 'auto' as any,
    },
    navItem: { alignItems: 'center', gap: 4 },
    navItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
        letterSpacing: 0.2,
    },
    navItemActive: { color: '#18181B', fontWeight: '800' },
    navItemDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#7C3AED',
    },

    /* Right */
    rightActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },

    authGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    loginBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    loginBtnText: { color: '#475569', fontSize: 13, fontWeight: '700' },
    registerBtn: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 99,
        backgroundColor: '#7C3AED',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
    },
    registerBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

    /* Logged-in utility */
    utilityGroup: { flexDirection: 'row', alignItems: 'center', gap: 20 },

    workspaceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 99,
        backgroundColor: '#7C3AED',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    workspaceBtnActive: {
        backgroundColor: '#6D28D9',
    },
    workspaceBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },

    notificationWrapper: { position: 'relative' },
    notificationDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },

    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userMenuWrapper: { position: 'relative' },

    /* Dropdowns */
    dropdownMenu: {
        position: 'absolute' as any,
        top: 44,
        right: -20,
        width: 300,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 12,
        overflow: 'hidden',
    },
    dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    dropdownHeaderText: { fontSize: 13, fontWeight: '800', color: '#18181B' },
    markReadText: { fontSize: 11, color: '#7C3AED', fontWeight: '700' },
    dropdownItem: { flexDirection: 'row', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    notifIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    notifMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    notifSender: { fontSize: 12, fontWeight: '700', color: '#18181B' },
    notifTime: { fontSize: 10, color: '#94A3B8' },
    notifContent: { fontSize: 11, color: '#64748B', lineHeight: 16 },

    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, margin: 4 },
    menuItemText: { fontSize: 13, fontWeight: '600', color: '#475569' },
    menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 2 },
});
