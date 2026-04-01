import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Bookmark, CreditCard, LogOut, ChevronRight, User, Edit2 } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { ProfileSetupScreen } from './ProfileSetupScreen';

export const ProfileScreen = () => {
    const { user, profile, signOut } = useAuth();
    const [showEditModal, setShowEditModal] = useState(false);

    const userDisplayName = profile?.full_name || user?.email?.split('@')[0] || '사용자';
    const userRole = profile?.user_type === 'business' ? `사업자 (${profile.industry || '미지정'})` :
        profile?.user_type === 'pre_entrepreneur' ? `예비 창업자 (${profile.industry || '미지정'})` :
            profile?.user_type === 'researcher' ? `${profile.researcher_type || '연구원'} (${profile.major_category || '미지정'})` :
                profile?.user_type === 'other' ? '프리랜서/기타' : '일반 사용자';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarInner}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                            ) : (
                                <User size={40} color="#94A3B8" />
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowEditModal(true)}
                            style={styles.editBtn}
                        >
                            <Edit2 size={14} color="white" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{userDisplayName}</Text>
                    <Text style={styles.userRole}>{userRole}</Text>

                    {!user && (
                        <TouchableOpacity style={styles.loginBtn}>
                            <Text style={styles.loginBtnText}>로그인 / 회원가입</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Stats */}
                <View style={styles.statsCard}>
                    <View style={[styles.statItem, styles.statBorder]}>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>읽은 뉴스</Text>
                    </View>
                    <View style={[styles.statItem, styles.statBorder]}>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>스크랩</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={styles.badgeWrapper}>
                            <Text style={styles.statValue}>Basic</Text>
                        </View>
                        <Text style={styles.statLabel}>등급</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    <MenuItem icon={<Bookmark size={20} color="#7C3AED" />} label="스크랩북" />
                    <MenuItem icon={<CreditCard size={20} color="#7C3AED" />} label="구독 관리" />
                    <MenuItem icon={<Settings size={20} color="#7C3AED" />} label="설정" />
                </View>

                <View style={styles.logoutWrapper}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                        <LogOut size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>로그아웃</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Profile Edit Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <ProfileSetupScreen
                    isEditing={true}
                    onClose={() => setShowEditModal(false)}
                />
            </Modal>
        </SafeAreaView>
    );
};

const MenuItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconBox}>
            {icon}
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <ChevronRight size={16} color="#94A3B8" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF8F3' },
    scrollView: { flex: 1 },
    header: { paddingHorizontal: 24, paddingVertical: 16, alignItems: 'center' },
    avatarWrapper: { position: 'relative', marginBottom: 16 },
    avatarInner: {
        width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden'
    },
    avatarImage: { width: '100%', height: '100%' },
    editBtn: {
        position: 'absolute', bottom: 4, right: 0, backgroundColor: '#7C3AED',
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF'
    },
    userName: { color: '#18181b', fontSize: 22, fontWeight: '800', marginBottom: 4 },
    userRole: { color: '#64748B', fontSize: 14 },
    loginBtn: { marginTop: 16, backgroundColor: '#7C3AED', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
    loginBtnText: { color: '#FFFFFF', fontWeight: '700' },

    statsCard: {
        flexDirection: 'row', marginHorizontal: 24, backgroundColor: '#FFFFFF', borderRadius: 24,
        padding: 20, marginBottom: 32, marginTop: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
        borderWidth: 1, borderColor: '#F1F5F9'
    },
    statItem: { flex: 1, alignItems: 'center' },
    statBorder: { borderRightWidth: 1, borderRightColor: '#F1F5F9' },
    statValue: { color: '#18181b', fontWeight: '800', fontSize: 18 },
    statLabel: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
    badgeWrapper: { backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },

    menuContainer: { paddingHorizontal: 24 },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
        marginBottom: 12,
    },
    menuIconBox: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3FF',
        alignItems: 'center', justifyContent: 'center', marginRight: 14
    },
    menuLabel: { color: '#18181b', fontWeight: '600', fontSize: 16, flex: 1 },

    logoutWrapper: { marginTop: 32, paddingHorizontal: 24, paddingBottom: 40 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    logoutText: { color: '#EF4444', marginLeft: 12, fontWeight: '700', fontSize: 15 },
});
