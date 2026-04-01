import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, TextInput, Animated, ScrollView, Modal, Image, StyleSheet } from 'react-native';
import { Svg, Path, Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { Icons } from '../utils/icons';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { useAuth } from '../contexts/AuthContext';
import { useProjectStore } from '../store/useProjectStore';

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
    const isDesktop = width >= 1024;

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
        <View style={styles.headerContainer}>
            <View style={styles.headerInner}>
                {/* Left: Logo */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => { setViewMode(user ? 'connect' : 'landing'); setActiveCategory('전체'); }}
                    style={styles.logoWrapper}
                >
                    <View style={styles.logoIcon}>
                        <Image
                            source={require('../../assets/publica logo.png')}
                            style={{ width: 32, height: 32 }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.logoText}>PUBLICA</Text>
                </TouchableOpacity>

                {/* Centered Navigation (Desktop) */}
                {isDesktop && (
                    <View style={styles.navCentered}>
                        <View style={styles.navRow}>
                            {!user ? (
                                <View style={styles.guestNav}>
                                    <TouchableOpacity onPress={() => setViewMode('landing')}>
                                        <Text style={[styles.navItemText, viewMode === 'landing' && styles.navItemActive]}>서비스 소개</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setViewMode('pricing')}>
                                        <Text style={[styles.navItemText, viewMode === 'pricing' && styles.navItemActive]}>요금안내</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setViewMode('connect')}>
                                        <Text style={[styles.navItemText, viewMode === 'connect' && styles.navItemActive]}>Connect Hub</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        onPress={() => setViewMode('workspace')}
                                        style={[styles.workspaceBtn, viewMode === 'workspace' && styles.workspaceBtnActive]}
                                    >
                                        <Icons.Zap size={16} color={viewMode === 'workspace' ? '#FFF' : '#7C3AED'} style={{ marginRight: 8 }} />
                                        <Text style={[styles.workspaceBtnText, viewMode === 'workspace' && { color: '#FFF' }]}>My Workspace</Text>
                                    </TouchableOpacity>

                                    {viewMode !== 'workspace' ? (
                                        <View style={styles.hubNav}>
                                            <TouchableOpacity onPress={() => setViewMode('connect')} style={[styles.hubItem, viewMode === 'connect' && styles.hubItemActive]}>
                                                <Text style={[styles.hubItemText, viewMode === 'connect' && { color: '#FFF' }]}>Connect Hub</Text>
                                            </TouchableOpacity>
                                            <View style={styles.hubDivider} />
                                            <TouchableOpacity onPress={() => { setViewMode('feed'); setActiveCategory('전체'); }} style={[styles.hubItem, viewMode === 'feed' && styles.hubItemActive]}>
                                                <Text style={[styles.hubItemText, viewMode === 'feed' && { color: '#FFF' }]}>Insight</Text>
                                            </TouchableOpacity>
                                            <View style={styles.hubDivider} />
                                            <TouchableOpacity onPress={() => setViewMode('lounge')} style={[styles.hubItem, viewMode === 'lounge' && styles.hubItemActive]}>
                                                <Text style={[styles.hubItemText, viewMode === 'lounge' && { color: '#FFF' }]}>Lounge</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => { setViewMode('connect'); setActiveCategory('전체'); }}
                                            style={styles.hubCollapsedBtn}
                                        >
                                            <Icons.Globe size={20} color="#7C3AED" />
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                )}

                {/* Right: Actions */}
                <View style={styles.rightActions}>
                    <TouchableOpacity
                        onPress={() => {
                            if (user) {
                                setViewMode('workspace');
                                useProjectStore.getState().setGlobalTabRequest('pricing');
                            } else {
                                setViewMode('pricing');
                            }
                        }}
                        style={styles.proBadge}
                    >
                        <Icons.Crown color="#F59E0B" size={14} />
                        <Text style={styles.proBadgeText}>PRO</Text>
                    </TouchableOpacity>

                    {!user ? (
                        <View style={styles.authGroup}>
                            <TouchableOpacity onPress={onAuthModalOpen} style={styles.loginBtn}>
                                <Text style={styles.loginBtnText}>로그인</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onAuthModalOpen} style={styles.startBtn}>
                                <Text style={styles.startBtnText}>프로젝트 시작</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View style={styles.utilityGroup}>
                                <View style={styles.notificationWrapper}>
                                    <TouchableOpacity onPress={() => { setIsNotificationOpen(!isNotificationOpen); setIsUserMenuOpen(false); }}>
                                        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                                            <Icons.Bell color={hasNotification ? "#F59E0B" : "#94A3B8"} size={22} fill={hasNotification ? "#F59E0B" : "none"} />
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
                                            <ScrollView style={{ maxHeight: 300 }}>
                                                {notifications.map((item) => (
                                                    <TouchableOpacity key={item.id} style={[styles.dropdownItem, !item.isRead && { backgroundColor: '#7C3AED05' }]}>
                                                        <View style={[styles.notifIcon, item.type === 'like' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#F5F3FF' }]}>
                                                            {item.type === 'like' ? <Icons.Heart size={14} color="#EF4444" fill="#EF4444" /> : <Icons.MessageCircle size={14} color="#7C3AED" />}
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

                                <View style={styles.userMenuWrapper}>
                                    <TouchableOpacity style={styles.profileSummary} onPress={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationOpen(false); }}>
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{user?.email?.split('@')[0]}</Text>
                                            <Text style={styles.userRole}>{profile?.industry || 'Researcher'}</Text>
                                        </View>
                                        <View style={styles.userAvatar}>
                                            <Icons.User color="#7C3AED" size={20} />
                                        </View>
                                    </TouchableOpacity>

                                    {isUserMenuOpen && (
                                        <View style={[styles.dropdownMenu, { right: 0, width: 180 }]}>
                                            <TouchableOpacity style={styles.menuItem} onPress={() => { setViewMode('workspace'); setIsUserMenuOpen(false); }}>
                                                <Icons.LayoutDashboard size={16} color="#94A3B8" style={{ marginRight: 12 }} />
                                                <Text style={styles.menuItemText}>워크스페이스</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsProfileModalOpen(true); setIsUserMenuOpen(false); }}>
                                                <Icons.Settings size={16} color="#94A3B8" style={{ marginRight: 12 }} />
                                                <Text style={styles.menuItemText}>계정 설정</Text>
                                            </TouchableOpacity>
                                            <View style={styles.menuDivider} />
                                            <TouchableOpacity style={styles.menuItem} onPress={() => { onSignOut(); setIsUserMenuOpen(false); }}>
                                                <Icons.LogOut size={16} color="#EF4444" style={{ marginRight: 12 }} />
                                                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>로그아웃</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </View>

            <Modal visible={isProfileModalOpen} animationType="fade" transparent={true} onRequestClose={() => setIsProfileModalOpen(false)}>
                <ProfileSetupScreen isEditing={true} onClose={() => setIsProfileModalOpen(false)} />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: { width: '100%', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', zIndex: 1000 },
    headerInner: { maxWidth: 1400, width: '100%', alignSelf: 'center', height: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
    
    logoWrapper: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FDF8F3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7C3AED15' },
    logoText: { marginLeft: 12, fontSize: 20, fontWeight: '900', color: '#18181B', letterSpacing: -1 },

    navCentered: { position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' },
    navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, pointerEvents: 'auto' },
    
    guestNav: { flexDirection: 'row', alignItems: 'center', gap: 32 },
    navItemText: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
    navItemActive: { color: '#18181B', fontWeight: '900' },

    workspaceBtn: { height: 48, paddingHorizontal: 20, borderRadius: 24, backgroundColor: '#FDF8F3', borderWidth: 1, borderColor: '#7C3AED20', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    workspaceBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
    workspaceBtnText: { color: '#7C3AED', fontSize: 13, fontWeight: '800' },

    hubNav: { height: 48, paddingHorizontal: 6, borderRadius: 24, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' },
    hubItem: { height: 36, paddingHorizontal: 16, borderRadius: 18, justifyContent: 'center' },
    hubItemActive: { backgroundColor: '#7C3AED' },
    hubItemText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
    hubDivider: { width: 1, height: 16, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
    hubCollapsedBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FDF8F3', borderWidth: 1, borderColor: '#7C3AED20', alignItems: 'center', justifyContent: 'center' },

    rightActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    proBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#FED7AA', gap: 6 },
    proBadgeText: { color: '#F59E0B', fontSize: 11, fontWeight: '900' },

    authGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    loginBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, borderWidth: 1, borderColor: '#E2E8F0' },
    loginBtnText: { color: '#444', fontSize: 13, fontWeight: '700' },
    startBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, backgroundColor: '#7C3AED' },
    startBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

    utilityGroup: { flexDirection: 'row', alignItems: 'center', gap: 24 },
    notificationWrapper: { position: 'relative' },
    notificationDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },
    
    dropdownMenu: { position: 'absolute', top: 40, right: -40, width: 320, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, overflow: 'hidden', padding: 8 },
    dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    dropdownHeaderText: { fontSize: 14, fontWeight: '800', color: '#18181B' },
    markReadText: { fontSize: 11, color: '#7C3AED', fontWeight: '700' },
    dropdownItem: { flexDirection: 'row', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    notifIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    notifMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    notifSender: { fontSize: 13, fontWeight: '700', color: '#18181B' },
    notifTime: { fontSize: 10, color: '#94A3B8' },
    notifContent: { fontSize: 12, color: '#64748B', lineHeight: 18 },

    userMenuWrapper: { position: 'relative' },
    profileSummary: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    userInfo: { alignItems: 'flex-end', display: 'none' /* Toggleable if needed */ },
    userName: { color: '#18181B', fontSize: 13, fontWeight: '800' },
    userRole: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },
    userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FDF8F3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7C3AED15' },

    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12 },
    menuItemText: { fontSize: 14, fontWeight: '700', color: '#475569' },
    menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
});
