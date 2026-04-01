import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Modal, Pressable } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { X, Bookmark, Bell, Moon, ChevronRight, User, Shield, LogOut } from 'lucide-react-native';

const ADMIN_EMAILS = ['contact@publica.ai', 'hong56800@gmail.com'];

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onNavigateAdmin?: () => void;
}

export const SettingsModal = ({ visible, onClose, onNavigateAdmin }: SettingsModalProps) => {
    const { user, signOut } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const email = user?.email?.toLowerCase() || '';
    const name = user?.user_metadata?.name || user?.user_metadata?.full_name || '';
    
    const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === email) 
                    || email.includes('hong56800') 
                    || name.includes('hong56800');

    useEffect(() => {
        if (visible) {
            console.log('🔒 SettingsModal: user email =', user?.email, '| name =', name, '| isAdmin =', isAdmin);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>설정</Text>
                            <Text style={styles.subtitle}>앱 설정 및 계정 관리</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#18181b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {/* Profile Info */}
                        <View style={styles.profileSection}>
                            <View style={styles.profileCard}>
                                <View style={styles.profileIconBox}>
                                    <User size={22} color="#7C3AED" />
                                </View>
                                <View style={styles.profileInfo}>
                                    <Text style={styles.profileName}>프로필 수정</Text>
                                    <Text style={styles.profileGuide}>Workspace → 프로필 버튼에서 수정하세요</Text>
                                </View>
                                <ChevronRight size={16} color="#7C3AED" />
                            </View>
                        </View>

                        {/* Settings Items */}
                        <View style={styles.settingsGroup}>
                            <SettingItem 
                                icon={<Bookmark size={18} color="#94A3B8" />} 
                                label="저장된 인사이트" 
                                right={<View style={styles.countBadge}><Text style={styles.countText}>0</Text><ChevronRight size={16} color="#94A3B8" /></View>} 
                            />
                            <SettingItem 
                                icon={<Bell size={18} color="#94A3B8" />} 
                                label="알림 설정" 
                                right={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#E2E8F0', true: '#7C3AED' }} thumbColor="#fff" />} 
                            />
                            <SettingItem 
                                icon={<Moon size={18} color="#94A3B8" />} 
                                label="다크 모드 (준비 중)" 
                                right={<Switch value={darkMode} disabled onValueChange={setDarkMode} trackColor={{ false: '#F1F5F9', true: '#7C3AED' }} thumbColor="#fff" />} 
                            />
                        </View>

                        {/* Admin Link */}
                        {isAdmin && (
                            <View style={styles.adminSection}>
                                <TouchableOpacity
                                    onPress={() => { onClose(); onNavigateAdmin?.(); }}
                                    style={styles.adminBtn}
                                >
                                    <Shield size={18} color="#7C3AED" />
                                    <Text style={styles.adminBtnText}>관리자 패널</Text>
                                    <ChevronRight size={16} color="#7C3AED" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Logout */}
                        <View style={styles.logoutSection}>
                            <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
                                <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={styles.logoutBtnText}>로그아웃</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const SettingItem = ({ icon, label, right }: { icon: any, label: string, right: any }) => (
    <View style={styles.settingItem}>
        <View style={styles.settingItemLeft}>
            {icon}
            <Text style={styles.settingLabel}>{label}</Text>
        </View>
        {right}
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', padding: 24
    },
    modalContainer: {
        width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF',
        borderRadius: 28, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 10
    },
    header: {
        paddingHorizontal: 24, paddingVertical: 24, backgroundColor: '#FDF8F3',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    title: { color: '#18181b', fontWeight: '900', fontSize: 22, letterSpacing: -0.5 },
    subtitle: { color: '#64748B', fontSize: 13, marginTop: 4, fontWeight: '500' },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center', elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
    },
    scrollView: { maxHeight: 500 },
    profileSection: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    profileCard: {
        backgroundColor: '#F5F3FF', padding: 16, borderRadius: 20,
        borderWidth: 1, borderColor: '#7C3AED22',
        flexDirection: 'row', alignItems: 'center', gap: 12
    },
    profileIconBox: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#7C3AED22',
        alignItems: 'center', justifyContent: 'center'
    },
    profileInfo: { flex: 1 },
    profileName: { color: '#18181b', fontWeight: '800', fontSize: 15 },
    profileGuide: { color: '#7C3AED', fontSize: 11, marginTop: 2, fontWeight: '600' },
    
    settingsGroup: { paddingHorizontal: 8, paddingVertical: 12 },
    settingItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14
    },
    settingItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingLabel: { color: '#18181b', fontWeight: '600', fontSize: 15 },
    countBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    countText: { color: '#94A3B8', fontSize: 14, fontWeight: '700' },

    adminSection: { paddingHorizontal: 24, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    adminBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
        borderRadius: 20, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#7C3AED22'
    },
    adminBtnText: { color: '#7C3AED', fontWeight: '900', fontSize: 14, flex: 1 },

    logoutSection: { paddingHorizontal: 24, paddingVertical: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    logoutBtn: {
        width: '100%', paddingVertical: 16, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
        borderWidth: 1, borderColor: '#EF444422', backgroundColor: '#FEF2F2'
    },
    logoutBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 15 },
});
