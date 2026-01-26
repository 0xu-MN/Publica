import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, Camera, User, Mail as MailIcon, Briefcase, FileText, Lock, Bell, Moon, LogOut, Upload } from 'lucide-react-native';
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

    const saveProfile = async () => {
        setLoading(true);
        try {
            if (nickname.toLowerCase() === 'admin' || nickname.toLowerCase() === 'system') {
                Alert.alert('Error', 'This nickname is not allowed.');
                setLoading(false);
                return;
            }
            // Enforce Real Name for professional context? Optional but recommended.

            const profile = { nickname, realName, role, bio, imageUrl };
            await AsyncStorage.setItem('user_profile', JSON.stringify(profile));

            // Simulate API delay
            setTimeout(() => {
                setLoading(false);
                Alert.alert('Success', 'Profile updated successfully.');
            }, 500);
        } catch (e) {
            console.error(e);
            setLoading(false);
            Alert.alert('Error', 'Failed to save profile.');
        }
    };

    const handleImageUpload = () => {
        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                    const url = URL.createObjectURL(file);
                    setImageUrl(url);
                }
            };
            input.click();
        } else {
            Alert.alert('Notice', 'Image upload is currently supported on Web.');
        }
    };

    return (
        <ScrollView className="flex-1 bg-[#020617]" showsVerticalScrollIndicator={false}>
            <View className="max-w-[1400px] w-full mx-auto p-6 md:p-12 mb-20">

                <View className={isDesktop ? "flex-row gap-12 items-start" : "gap-8"}>

                    {/* LEFT: Live Preview (Sticky on Desktop) */}
                    <View className={isDesktop ? "w-[380px] sticky top-24" : "w-full"}>
                        <Text className="text-blue-400 font-bold mb-4 uppercase text-xs tracking-wider">Live Preview</Text>
                        <View className="h-[600px] pointer-events-none">
                            <ProfileCard
                                readOnly
                                previewData={{ nickname, realName, role, bio, imageUrl }}
                            />
                        </View>
                        <Text className="text-slate-500 text-xs mt-4 text-center">
                            * 프로필이 실제 화면에서 이렇게 표시됩니다.
                        </Text>
                    </View>

                    {/* RIGHT: Edit Form */}
                    <View className="flex-1 gap-10">

                        {/* Section: Public Profile */}
                        <View>
                            <Text className="text-white text-2xl font-bold mb-6">공개 프로필</Text>
                            <View className="bg-[#0F172A] rounded-3xl border border-white/5 p-8 gap-8">

                                {/* Image URL Input - Prominent */}
                                <View>
                                    <Text className="text-slate-400 text-sm font-bold mb-2">프로필 이미지 URL</Text>
                                    <View className="flex-row gap-4">
                                        <TextInput
                                            className="flex-1 bg-[#1E293B] text-white p-4 rounded-xl border border-white/10 text-base"
                                            value={imageUrl}
                                            onChangeText={setImageUrl}
                                            placeholder="https://example.com/my-profile.jpg"
                                            placeholderTextColor="#475569"
                                        />
                                        <TouchableOpacity
                                            onPress={handleImageUpload}
                                            className="bg-blue-600 px-6 rounded-xl items-center justify-center border border-white/10 hover:bg-blue-500 active:bg-blue-700"
                                        >
                                            <Upload size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-slate-500 text-xs mt-2">
                                        외부 이미지 URL을 입력하면 왼쪽 미리보기에 즉시 반영됩니다.
                                    </Text>
                                </View>

                                {/* Text Fields */}
                                <View className="gap-5">
                                    <View>
                                        <Text className="text-slate-400 text-sm font-bold mb-2">이름 (공개 프로필)</Text>
                                        <TextInput
                                            className="bg-[#1E293B] text-white p-4 rounded-xl border border-white/10 text-base"
                                            value={realName}
                                            onChangeText={setRealName}
                                            placeholder="실명을 입력하세요"
                                            placeholderTextColor="#475569"
                                        />
                                        <Text className="text-slate-500 text-xs mt-2">
                                            다른 사용자에게 표시되는 이름입니다. 신뢰성을 위해 실명 사용을 권장합니다.
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="text-slate-400 text-sm font-bold mb-2">직책 / 역할</Text>
                                        <TextInput
                                            className="bg-[#1E293B] text-white p-4 rounded-xl border border-white/10 text-base"
                                            value={role}
                                            onChangeText={setRole}
                                            placeholder="AI 연구원, 창업가 등"
                                            placeholderTextColor="#475569"
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-slate-400 text-sm font-bold mb-2">자기소개</Text>
                                        <TextInput
                                            className="bg-[#1E293B] text-white p-4 rounded-xl border border-white/10 text-base h-32"
                                            value={bio}
                                            onChangeText={setBio}
                                            placeholder="자신을 소개해주세요..."
                                            placeholderTextColor="#475569"
                                            multiline
                                            textAlignVertical="top"
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Section: Personal Information */}
                        <View>
                            <Text className="text-white text-2xl font-bold mb-6">개인 정보 (비공개)</Text>
                            <View className="bg-[#0F172A] rounded-3xl border border-white/5 p-8 gap-6">
                                <View>
                                    <Text className="text-slate-400 text-sm font-bold mb-2">익명 닉네임</Text>
                                    <View className="flex-row items-center bg-[#1E293B] rounded-xl border border-white/10 px-4">
                                        <Lock size={18} color="#64748B" className="mr-3" />
                                        <TextInput
                                            className="flex-1 text-white py-4 text-base"
                                            value={nickname}
                                            onChangeText={setNickname}
                                            placeholder="익명 닉네임 입력"
                                            placeholderTextColor="#475569"
                                        />
                                    </View>
                                    <Text className="text-slate-500 text-xs mt-2">
                                        * 익명으로 게시글을 작성하거나 활동할 때만 사용됩니다.
                                    </Text>
                                </View>

                                <View>
                                    <Text className="text-slate-400 text-sm font-bold mb-2">이메일 주소</Text>
                                    <View className="flex-row items-center bg-[#1E293B]/50 rounded-xl border border-white/5 px-4">
                                        <MailIcon size={18} color="#64748B" className="mr-3" />
                                        <View className="flex-1 py-4">
                                            <Text className="text-slate-400 text-base">{user?.email}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Preferences */}
                        <View>
                            <Text className="text-white text-2xl font-bold mb-6">앱 설정</Text>
                            <View className="bg-[#0F172A] rounded-3xl border border-white/5 overflow-hidden">
                                <View className="flex-row items-center justify-between p-6 border-b border-white/5">
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center">
                                            <Bell size={20} color="#3B82F6" />
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
                                            <Moon size={20} color="#A855F7" />
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
                                onPress={saveProfile}
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

            </View>
        </ScrollView>
        </View >
    );
};
</ScrollView>
