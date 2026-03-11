import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { X, Bookmark, Bell, Moon, Settings as SettingsIcon, Crown, ChevronRight, Plus, User } from 'lucide-react-native';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
    const { user, signOut } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    if (!visible) return null;

    return (
        <View className="absolute inset-0 bg-black/60 justify-center items-center p-6 z-50">
            <View className="w-full max-w-md bg-[#0F172A] rounded-3xl border border-white/10 overflow-hidden">

                {/* Header */}
                <View className="px-6 py-4 bg-[#1E293B] border-b border-white/5 flex-row items-center justify-between">
                    <View>
                        <Text className="text-white font-bold text-xl">설정</Text>
                        <Text className="text-slate-400 text-xs">앱 설정 및 계정 관리</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} className="p-2 bg-white/5 rounded-full">
                        <X size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 max-h-[500px]">
                    {/* Profile Redirect */}
                    <View className="px-6 py-5 border-b border-white/5">
                        <View className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 flex-row items-center gap-3">
                            <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center">
                                <User size={20} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-bold text-sm">프로필 수정</Text>
                                <Text className="text-blue-400 text-xs mt-0.5">My Workspace → 프로필 버튼에서 수정하세요</Text>
                            </View>
                            <ChevronRight size={16} color="#3B82F6" />
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
                                <Text className="text-white font-medium">알림</Text>
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
                                <Text className="text-white font-medium">다크 모드</Text>
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
                    </View>

                    {/* Logout */}
                    <View className="px-6 py-4 border-t border-white/5">
                        <TouchableOpacity
                            onPress={signOut}
                            className="w-full py-4 rounded-2xl items-center justify-center border border-red-500/20 bg-red-500/5"
                        >
                            <Text className="text-red-400 font-bold text-sm">로그아웃</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

