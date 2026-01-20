import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Bookmark, CreditCard, LogOut, ChevronRight, User } from 'lucide-react-native';

export const ProfileScreen = () => {
    return (
        <SafeAreaView className="flex-1 bg-[#050B14]">
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="px-6 py-6 items-center">
                    <View className="w-24 h-24 rounded-full bg-slate-800 items-center justify-center mb-4 border-2 border-slate-700">
                        <User size={40} color="#94A3B8" />
                    </View>
                    <Text className="text-white text-xl font-bold mb-1">게스트</Text>
                    <Text className="text-slate-400 text-sm">로그인이 필요합니다</Text>

                    <TouchableOpacity className="mt-4 bg-blue-600 px-6 py-2.5 rounded-full">
                        <Text className="text-white font-semibold">로그인 / 회원가입</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View className="flex-row mx-6 bg-slate-900 rounded-2xl p-4 mb-8 border border-white/5">
                    <View className="flex-1 items-center border-r border-white/10">
                        <Text className="text-white font-bold text-lg">0</Text>
                        <Text className="text-slate-500 text-xs">읽은 뉴스</Text>
                    </View>
                    <View className="flex-1 items-center border-r border-white/10">
                        <Text className="text-white font-bold text-lg">0</Text>
                        <Text className="text-slate-500 text-xs">스크랩</Text>
                    </View>
                    <View className="flex-1 items-center">
                        <Text className="text-white font-bold text-lg">Basic</Text>
                        <Text className="text-slate-500 text-xs">등급</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View className="px-6 gap-3">
                    <MenuItem icon={<Bookmark size={20} color="#fff" />} label="스크랩북" />
                    <MenuItem icon={<CreditCard size={20} color="#fff" />} label="구독 관리" />
                    <MenuItem icon={<Settings size={20} color="#fff" />} label="설정" />
                </View>

                <View className="mt-8 px-6">
                    <TouchableOpacity className="flex-row items-center py-3">
                        <LogOut size={20} color="#EF4444" />
                        <Text className="text-red-500 ml-3 font-medium">로그아웃</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const MenuItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <TouchableOpacity className="flex-row items-center bg-slate-900/50 p-4 rounded-xl border border-white/5">
        <View className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center mr-3">
            {icon}
        </View>
        <Text className="text-white font-medium flex-1">{label}</Text>
        <ChevronRight size={16} color="#64748B" />
    </TouchableOpacity>
);
