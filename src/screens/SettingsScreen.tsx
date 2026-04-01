import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, Alert, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Moon, LogOut, Save, ShieldCheck } from 'lucide-react-native';

interface SettingsScreenProps {
    onBack: () => void;
}

export const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);

    // Preferences
    const [notifications, setNotifications] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const prefs = await AsyncStorage.getItem('user_preferences');
            if (prefs) {
                const data = JSON.parse(prefs);
                setNotifications(data.notifications ?? true);
                setMarketingEmails(data.marketingEmails ?? false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveSettings = async () => {
        setLoading(true);
        try {
            await AsyncStorage.setItem('user_preferences', JSON.stringify({
                notifications,
                marketingEmails
            }));
            setTimeout(() => {
                setLoading(false);
                Alert.alert('성공', '설정이 저장되었습니다.');
            }, 500);
        } catch (e) {
            console.error(e);
            setLoading(false);
            Alert.alert('오류', '설정 저장에 실패했습니다.');
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.content}>
                
                <View style={styles.header}>
                    <Text style={styles.title}>설정</Text>
                    <Text style={styles.subtitle}>앱 기본 설정 및 계정 관리를 여기서 하실 수 있습니다.</Text>
                </View>

                {/* Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>앱 알림 설정</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#F5F3FF' }]}>
                                    <Bell size={20} color="#7C3AED" />
                                </View>
                                <View>
                                    <Text style={styles.rowTitle}>푸시 알림</Text>
                                    <Text style={styles.rowSubtitle}>실시간 인사이트 알림 받기</Text>
                                </View>
                            </View>
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: '#E2E8F0', true: '#7C3AED' }}
                                thumbColor="#FFF"
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                                    <ShieldCheck size={20} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text style={styles.rowTitle}>마케팅 정보 수신</Text>
                                    <Text style={styles.rowSubtitle}>이벤트 및 혜택 정보 안내</Text>
                                </View>
                            </View>
                            <Switch
                                value={marketingEmails}
                                onValueChange={setMarketingEmails}
                                trackColor={{ false: '#E2E8F0', true: '#7C3AED' }}
                                thumbColor="#FFF"
                            />
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        onPress={saveSettings}
                        disabled={loading}
                        style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                    >
                        <Save size={18} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.saveBtnText}>{loading ? '저장 중...' : '설정 저장하기'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={signOut}
                        style={styles.logoutBtn}
                    >
                        <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutBtnText}>로그아웃</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF8F3' },
    content: { maxWidth: 600, width: '100%', marginHorizontal: 'auto', padding: 24, paddingBottom: 60 },
    
    header: { marginBottom: 32, alignItems: 'center' },
    title: { color: '#18181b', fontSize: 28, fontWeight: '800', marginBottom: 8 },
    subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center' },

    section: { marginBottom: 32 },
    sectionTitle: { color: '#18181b', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: 8,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBox: {
        width: 40, height: 40, borderRadius: 12, 
        alignItems: 'center', justifyContent: 'center'
    },
    rowTitle: { color: '#18181b', fontWeight: '700', fontSize: 16 },
    rowSubtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 20 },

    actionSection: { gap: 12, marginTop: 12 },
    saveBtn: {
        backgroundColor: '#7C3AED', flexDirection: 'row',
        paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8,
    },
    saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

    logoutBtn: {
        flexDirection: 'row', paddingVertical: 16, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#FED7D7', backgroundColor: '#FFF5F5'
    },
    logoutBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
