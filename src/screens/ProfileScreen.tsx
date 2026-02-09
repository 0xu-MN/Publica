import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
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
        <SafeAreaView className="flex-1 bg-[#050B14]">
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="px-6 py-8 items-center">
                    <View className="relative">
                        <View className="w-24 h-24 rounded-full bg-slate-800 items-center justify-center mb-4 border-2 border-slate-700 overflow-hidden">
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} className="w-full h-full" />
                            ) : (
                                <User size={40} color="#94A3B8" />
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowEditModal(true)}
                            className="absolute bottom-4 right-0 bg-blue-600 w-8 h-8 rounded-full items-center justify-center border-2 border-[#050B14]"
                        >
                            <Edit2 size={14} color="white" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-white text-xl font-bold mb-1">{userDisplayName}</Text>
                    <Text className="text-slate-400 text-sm">{userRole}</Text>

                    {!user && (
                        <TouchableOpacity className="mt-4 bg-blue-600 px-6 py-2.5 rounded-full">
                            <Text className="text-white font-semibold">로그인 / 회원가입</Text>
                        </TouchableOpacity>
                    )}
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

                <View className="mt-8 px-6 pb-12">
                    <TouchableOpacity className="flex-row items-center py-3" onPress={signOut}>
                        <LogOut size={20} color="#EF4444" />
                        <Text className="text-red-500 ml-3 font-medium">로그아웃</Text>
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
    <TouchableOpacity className="flex-row items-center bg-slate-900/50 p-4 rounded-xl border border-white/5">
        <View className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center mr-3">
            {icon}
        </View>
        <Text className="text-white font-medium flex-1">{label}</Text>
        <ChevronRight size={16} color="#64748B" />
    </TouchableOpacity>
);
