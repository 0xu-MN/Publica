import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../utils/icons';
import Footer from '../components/Footer';
import { ProfileCard } from '../components/ProfileCard';
import { useWindowDimensions, Platform } from 'react-native';

interface SettingsScreenProps {
    onBack: () => void;
}

export const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
    const { user, signOut } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const [loading, setLoading] = useState(false);

    // Profile State
    const [nickname, setNickname] = useState('');
    const [realName, setRealName] = useState('');
    const [role, setRole] = useState('');
    const [bio, setBio] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // Preferences
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const profile = await AsyncStorage.getItem('user_profile');
            if (profile) {
                const data = JSON.parse(profile);
                setNickname(data.nickname || '');
                setRealName(data.realName || '');
                setRole(data.job || '');
                setBio(data.bio || '');
                setImageUrl(data.imageUrl || '');
            } else if (user?.email) {
                setNickname(user.email.split('@')[0]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Settings don't need to save profile anymore, moving logic to Workspace Profile
    const saveSettings = async () => {
        setLoading(true);
        try {
            // Save preferences logic here
            setTimeout(() => {
                setLoading(false);
                Alert.alert('Success', 'Settings updated successfully.');
            }, 500);
        } catch (e) {
            console.error(e);
            setLoading(false);
            Alert.alert('Error', 'Failed to save settings.');
        }
    };

    return (
        <ScrollView className="flex-1 bg-[#020617]" showsVerticalScrollIndicator={false}>
            <View className="max-w-[1400px] w-full mx-auto p-6 md:p-12 mb-20">

                <View className="gap-8 max-w-2xl mx-auto w-full">
                    {/* EDIT PROFILE MOVED TO WORKSPACE SIDEBAR */}

                    <View className="mb-6 items-center">
                        <Text className="text-white text-3xl font-bold mb-2">설정</Text>
                        <Text className="text-slate-400">앱 기본 설정 및 계정 관리를 여기서 하실 수 있습니다.</Text>
                    </View>

                    {/* Preferences */}
                    <View>
                        <Text className="text-white text-2xl font-bold mb-6">앱 설정</Text>
                        <View className="bg-[#0F172A] rounded-3xl border border-white/5 overflow-hidden">
                            <View className="flex-row items-center justify-between p-6 border-b border-white/5">
                                <View className="flex-row items-center gap-4">
                                    <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center">
                                        <Icons.Bell size={20} color="#3B82F6" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-base">알림 설정</Text>
                                        <Text className="text-slate-400 text-sm">푸시 알림 받기</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={notifications}
                                    onValueChange={setNotifications}
                                    trackColor={{ false: '#334155', true: '#3B82F6' }}
                                    thumbColor="#fff"
                                />
                            </View>
                            <View className="flex-row items-center justify-between p-6">
                                <View className="flex-row items-center gap-4">
                                    <View className="w-10 h-10 rounded-full bg-purple-500/10 items-center justify-center">
                                        <Icons.Moon size={20} color="#A855F7" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-base">다크 모드</Text>
                                        <Text className="text-slate-400 text-sm">항상 어두운 테마 사용</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={darkMode}
                                    onValueChange={setDarkMode}
                                    trackColor={{ false: '#334155', true: '#3B82F6' }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <View className="gap-4">
                        <TouchableOpacity
                            onPress={saveSettings}
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20 ${loading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-500'}`}
                        >
                            <Text className="text-white font-bold text-lg">{loading ? '저장 중...' : '변경사항 저장'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={signOut}
                            className="w-full py-5 rounded-2xl items-center justify-center border border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                        >
                            <Text className="text-red-400 font-bold text-base">로그아웃</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </ScrollView>
    );
};
