import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { X, Bookmark, Bell, Moon, ChevronRight, User, Shield } from 'lucide-react-native';

// 🔐 Add any admin emails here (case-insensitive check)
const ADMIN_EMAILS = ['contact@publica.ai', 'hong56800@gmail.com'];

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onNavigateAdmin?: () => void;
}

export const SettingsModal = ({ visible, onClose, onNavigateAdmin }: SettingsModalProps) => {
    const { user, signOut } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    // Sync check — no async, no Supabase call needed
    const email = user?.email?.toLowerCase() || '';
    const name = user?.user_metadata?.name || user?.user_metadata?.full_name || '';
    
    const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === email) 
                    || email.includes('hong56800') 
                    || name.includes('hong56800');

    // Debug log on every render when visible
    useEffect(() => {
        if (visible) {
            console.log('🔒 SettingsModal: user email =', user?.email, '| name =', name, '| isAdmin =', isAdmin);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center', alignItems: 'center',
            padding: 24, zIndex: 9999,
        }}>
            <View style={{
                width: '100%', maxWidth: 420,
                backgroundColor: '#0F172A',
                borderRadius: 24,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <View style={{
                    paddingHorizontal: 24, paddingVertical: 16,
                    backgroundColor: '#1E293B',
                    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <View>
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 20 }}>설정</Text>
                        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>앱 설정 및 계정 관리</Text>
                    </View>
                    <TouchableOpacity onPress={onClose}
                        style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999 }}>
                        <X size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 480 }}>
                    {/* Profile Info */}
                    <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        <View style={{
                            backgroundColor: 'rgba(59,130,246,0.07)',
                            padding: 16, borderRadius: 16,
                            borderWidth: 1, borderColor: 'rgba(59,130,246,0.12)',
                            flexDirection: 'row', alignItems: 'center', gap: 12,
                        }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={20} color="#3B82F6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>프로필 수정</Text>
                                <Text style={{ color: '#60A5FA', fontSize: 12, marginTop: 2 }}>My Workspace → 프로필 버튼에서 수정하세요</Text>
                            </View>
                            <ChevronRight size={16} color="#3B82F6" />
                        </View>
                    </View>

                    {/* Settings */}
                    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                        {/* Saved Insights */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Bookmark size={18} color="#94A3B8" />
                                <Text style={{ color: '#fff', fontWeight: '500' }}>Saved Insights</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ color: '#475569', fontSize: 14 }}>0</Text>
                                <ChevronRight size={16} color="#475569" />
                            </View>
                        </View>

                        {/* Notifications */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Bell size={18} color="#94A3B8" />
                                <Text style={{ color: '#fff', fontWeight: '500' }}>알림</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ color: '#475569', fontSize: 13 }}>{notifications ? 'On' : 'Off'}</Text>
                                <Switch value={notifications} onValueChange={setNotifications}
                                    trackColor={{ false: '#334155', true: '#3B82F6' }} thumbColor="#fff" />
                            </View>
                        </View>

                        {/* Dark Mode */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Moon size={18} color="#94A3B8" />
                                <Text style={{ color: '#fff', fontWeight: '500' }}>다크 모드</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ color: '#475569', fontSize: 13 }}>{darkMode ? 'On' : 'Off'}</Text>
                                <Switch value={darkMode} onValueChange={setDarkMode}
                                    trackColor={{ false: '#334155', true: '#3B82F6' }} thumbColor="#fff" />
                            </View>
                        </View>
                    </View>

                    {/* Admin Panel — shows current email + admin status for debugging */}
                    {isAdmin ? (
                        <View style={{ paddingHorizontal: 24, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
                            <TouchableOpacity
                                onPress={() => { onClose(); onNavigateAdmin?.(); }}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 12,
                                    paddingHorizontal: 16, paddingVertical: 14,
                                    borderRadius: 14,
                                    backgroundColor: 'rgba(129,140,248,0.1)',
                                    borderWidth: 1, borderColor: 'rgba(129,140,248,0.25)',
                                }}
                            >
                                <Shield size={18} color="#818CF8" />
                                <Text style={{ color: '#818CF8', fontWeight: '800', fontSize: 14, flex: 1 }}>관리자 패널 (카드뉴스 관리)</Text>
                                <ChevronRight size={16} color="#818CF8" />
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    {/* Logout */}
                    <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
                        <TouchableOpacity onPress={signOut} style={{
                            width: '100%', paddingVertical: 16,
                            borderRadius: 16, alignItems: 'center',
                            borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
                            backgroundColor: 'rgba(239,68,68,0.07)',
                        }}>
                            <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 14 }}>로그아웃</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};
