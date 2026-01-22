import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { X, Bookmark, Bell, Moon, Settings as SettingsIcon, Crown, ChevronRight, Plus } from 'lucide-react-native';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const INTERESTS = ['AI/ML', 'Biotech', 'Quantum', 'Macro', 'Crypto', 'Climate'];

export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    // Profile State
    const [nickname, setNickname] = useState('');
    const [realName, setRealName] = useState(''); // Added Real Name
    const [role, setRole] = useState('');
    const [bio, setBio] = useState('');
    const [imageUrl, setImageUrl] = useState(''); // Added Image URL
    const [isEditing, setIsEditing] = useState(false);

    // Load Profile
    React.useEffect(() => {
        if (visible) {
            loadProfile();
        }
    }, [visible]);

    const loadProfile = async () => {
        try {
            const profile = await AsyncStorage.getItem('user_profile');
            if (profile) {
                const data = JSON.parse(profile);
                setNickname(data.nickname || '');
                setRealName(data.realName || ''); // Load Real Name
                setRole(data.job || '');
                setBio(data.bio || '');
                setImageUrl(data.imageUrl || ''); // Load Image URL
            } else if (user?.email) {
                // Default to email username if no profile
                setNickname(user.email.split('@')[0]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveProfile = async () => {
        try {
            // Check for duplicate nickname (Simulated)
            if (nickname.toLowerCase() === 'admin' || nickname.toLowerCase() === 'system') {
                alert('This nickname is not allowed.');
                return;
            }
            if (!realName.trim()) {
                alert('Real Name is required for profile verification.');
                return;
            }

            const profile = { nickname, realName, role, bio, imageUrl };
            await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
            setIsEditing(false);
            // Optionally notify other components to reload profile
        } catch (e) {
            console.error(e);
        }
    };

    if (!visible) return null;

    return (
        <View className="absolute inset-0 bg-black/60 justify-center items-center p-6 z-50">
            <View className="w-full max-w-md bg-[#0F172A] rounded-3xl border border-white/10 overflow-hidden">

                {/* Header */}
                <View className="px-6 py-4 bg-[#1E293B] border-b border-white/5 flex-row items-center justify-between">
                    <View>
                        <Text className="text-white font-bold text-xl">InsightFlow</Text>
                        <Text className="text-slate-400 text-xs">AI 뉴스 큐레이션</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} className="p-2 bg-white/5 rounded-full">
                        <X size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 max-h-[500px]">
                    {/* Profile Edit Section */}
                    <View className="px-6 py-6 border-b border-white/5">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-white font-bold text-lg">My Profile</Text>
                            <TouchableOpacity onPress={() => isEditing ? saveProfile() : setIsEditing(true)}>
                                <Text className="text-blue-400 font-bold text-sm">
                                    {isEditing ? 'Save' : 'Edit'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text className="text-slate-400 text-xs mb-1.5 font-semibold uppercase">Profile Image URL</Text>
                                {isEditing ? (
                                    <TextInput
                                        className="bg-slate-800 text-white p-3 rounded-xl border border-white/10 mb-1"
                                        value={imageUrl}
                                        onChangeText={setImageUrl}
                                        placeholder="https://example.com/me.jpg"
                                        placeholderTextColor="#64748B"
                                    />
                                ) : (
                                    <Text className="text-white font-medium text-base" numberOfLines={1}>{imageUrl || 'No image set'}</Text>
                                )}
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs mb-1.5 font-semibold uppercase">Real Name (Private)</Text>
                                {isEditing ? (
                                    <>
                                        <TextInput
                                            className="bg-slate-800 text-white p-3 rounded-xl border border-white/10 mb-1"
                                            value={realName}
                                            onChangeText={setRealName}
                                            placeholder="Enter your real name"
                                            placeholderTextColor="#64748B"
                                        />
                                        <Text className="text-slate-500 text-[10px]">
                                            Required for identity verification. Not shown publicly without permission.
                                        </Text>
                                    </>
                                ) : (
                                    <Text className="text-white font-medium text-base">{realName || 'No Name Set'}</Text>
                                )}
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs mb-1.5 font-semibold uppercase">Nickname (Public)</Text>
                                {isEditing ? (
                                    <>
                                        <TextInput
                                            className="bg-slate-800 text-white p-3 rounded-xl border border-white/10"
                                            value={nickname}
                                            onChangeText={setNickname}
                                            placeholder="Unique nickname"
                                            placeholderTextColor="#64748B"
                                        />
                                        <Text className="text-slate-500 text-[10px] mt-1">
                                            This will be your display name in the community.
                                        </Text>
                                    </>
                                ) : (
                                    <Text className="text-white font-medium text-base">{nickname || 'No nickname set'}</Text>
                                )}
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs mb-1.5 font-semibold uppercase">Role / Job</Text>
                                {isEditing ? (
                                    <TextInput
                                        className="bg-slate-800 text-white p-3 rounded-xl border border-white/10"
                                        value={role}
                                        onChangeText={setRole}
                                        placeholder="e.g. AI Researcher"
                                        placeholderTextColor="#64748B"
                                    />
                                ) : (
                                    <Text className="text-white font-medium text-base">{role || 'No role set'}</Text>
                                )}
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs mb-1.5 font-semibold uppercase">Bio</Text>
                                {isEditing ? (
                                    <TextInput
                                        className="bg-slate-800 text-white p-3 rounded-xl border border-white/10 h-20"
                                        value={bio}
                                        onChangeText={setBio}
                                        placeholder="Write a short bio..."
                                        placeholderTextColor="#64748B"
                                        multiline
                                        textAlignVertical="top"
                                    />
                                ) : (
                                    <Text className="text-slate-300 text-sm leading-relaxed">{bio || 'No bio yet.'}</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View className="px-4 py-2">
                        {/* Saved Insights */}
                        <TouchableOpacity className="flex-row items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5">
                            <View className="flex-row items-center gap-3">
                                <Bookmark size={18} color="#94A3B8" />
                                <Text className="text-white font-medium">Saved Insights</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <Text className="text-slate-500 text-sm">0</Text>
                                <ChevronRight size={16} color="#64748B" />
                            </View>
                        </TouchableOpacity>

                        {/* Notifications */}
                        <View className="flex-row items-center justify-between px-4 py-3">
                            <View className="flex-row items-center gap-3">
                                <Bell size={18} color="#94A3B8" />
                                <Text className="text-white font-medium">Notifications</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <Text className="text-slate-500 text-sm">{notifications ? 'On' : 'Off'}</Text>
                                <Switch
                                    value={notifications}
                                    onValueChange={setNotifications}
                                    trackColor={{ false: '#334155', true: '#3B82F6' }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </View>

                        {/* Dark Mode */}
                        <View className="flex-row items-center justify-between px-4 py-3">
                            <View className="flex-row items-center gap-3">
                                <Moon size={18} color="#94A3B8" />
                                <Text className="text-white font-medium">Dark Mode</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <Text className="text-slate-500 text-sm">{darkMode ? 'On' : 'Off'}</Text>
                                <Switch
                                    value={darkMode}
                                    onValueChange={setDarkMode}
                                    trackColor={{ false: '#334155', true: '#3B82F6' }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </View>

                        {/* Settings */}
                        <TouchableOpacity className="flex-row items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5">
                            <View className="flex-row items-center gap-3">
                                <SettingsIcon size={18} color="#94A3B8" />
                                <Text className="text-white font-medium">Settings</Text>
                            </View>
                            <ChevronRight size={16} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Your Interests */}
                    <View className="px-6 py-4 border-t border-white/5">
                        <Text className="text-white font-bold mb-3">Your Interests</Text>
                        <View className="flex-row flex-wrap gap-2 mb-3">
                            {INTERESTS.map((interest) => (
                                <View key={interest} className="bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                                    <Text className="text-blue-400 text-sm font-semibold">{interest}</Text>
                                </View>
                            ))}
                            <TouchableOpacity className="bg-white/5 px-4 py-2 rounded-full border border-white/10 flex-row items-center gap-1">
                                <Plus size={14} color="#94A3B8" />
                                <Text className="text-slate-400 text-sm font-semibold">Add more</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Go Premium */}
                    <View className="mx-6 mb-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 overflow-hidden relative">
                        <View className="flex-row items-center gap-2 mb-1">
                            <Crown size={18} color="#fff" />
                            <Text className="text-white font-bold">Go Premium</Text>
                        </View>
                        <Text className="text-white/80 text-xs mb-3">
                            Unlock unlimited insights, advanced AI analysis, and priority alerts.
                        </Text>
                        <TouchableOpacity className="bg-white rounded-full py-3 items-center">
                            <Text className="text-orange-600 font-bold text-sm">Upgrade Now</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};
