import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, CheckCircle2, Users, Heart, UserPlus, Share2, Mail } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SettingsModal } from './SettingsModal';

interface ProfileCardProps {
    onChatPress?: (user?: { id: string; name: string }) => void;
    onShowInbox?: () => void;
    readOnly?: boolean;
    targetUserId?: string;
    onEditProfile?: () => void;
}

const EXPERTISE_BADGES = ['AI/ML', 'Quantum', 'FinTech', 'Biotech'];

export const ProfileCard = ({ onChatPress, onShowInbox, readOnly, targetUserId, onEditProfile }: ProfileCardProps) => {
    const { user } = useAuth();
    // In real app, fetch targetUserId if present.
    // For now, if readOnly is true and targetUserId is different, we simulate "Another User".

    // For simulation: if readOnly, show a generic "Dr. Strange" profile or similar if not me.
    const isMe = !readOnly || (targetUserId === user?.id);

    // State for Dynamic Data
    const [nickname, setNickname] = useState('');
    const [realName, setRealName] = useState('');
    const [role, setRole] = useState('AI Researcher');
    const [bio, setBio] = useState('인공지능과 금융의 결합에 관심이 많습니다.');
    const [imageUrl, setImageUrl] = useState('');
    const [profile, setProfile] = useState<{ nickname?: string, job?: string, bio?: string }>({});
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    // Stats & Interaction
    const [followers, setFollowers] = useState(0);
    const [likes, setLikes] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (readOnly && targetUserId && targetUserId !== user?.id) {
                // Simulate loading another user's profile which has stats
                setNickname('Dr. Strange');
                setRealName('Stephen Vincent Strange');
                setRole('Master of the Mystic Arts');
                setBio('Sorcerer Supreme, protecting Earth from magical and mystical threats.');
                setProfile({ nickname: 'Dr. Strange', job: 'Master of the Mystic Arts', bio: 'Sorcerer Supreme' });

                // Load persistent 'followed' state for this user
                try {
                    const followed = await AsyncStorage.getItem(`following_${targetUserId}`);
                    setIsFollowing(followed === 'true');
                    // Mock followers count (base + 1 if following)
                    setFollowers(followed === 'true' ? 1241 : 1240);
                } catch (e) {
                    setFollowers(1240);
                }
                setLikes(482);
            } else {
                // Load current user's profile (Defaults to 0 for new users)
                try {
                    const stored = await AsyncStorage.getItem('user_profile');
                    if (stored) {
                        const parsedProfile = JSON.parse(stored);
                        setProfile(parsedProfile);
                        setNickname(parsedProfile.nickname || user?.email?.split('@')[0] || 'Guest');
                        setRealName(parsedProfile.realName || ''); // Load Real Name
                        setRole(parsedProfile.job || 'AI Service Planner & Developer');
                        setBio(parsedProfile.bio || '사용자 경험을 혁신하는 AI 서비스를 기획하고 개발합니다.');
                        setImageUrl(parsedProfile.imageUrl || '');

                        // Load My Stats
                        const myFollowers = await AsyncStorage.getItem('my_followers_count');
                        setFollowers(myFollowers ? parseInt(myFollowers) : 0);
                        setLikes(0);
                    } else {
                        // Default for NEW USER
                        setNickname(user?.email?.split('@')[0] || 'Guest');
                        setRole('AI Service Planner & Developer');
                        setBio('사용자 경험을 혁신하는 AI 서비스를 기획하고 개발합니다.');
                        setFollowers(0);
                        setLikes(0);
                    }
                } catch (e) { console.log(e); }
            }
        };
        loadProfile();

        const interval = setInterval(loadProfile, 2000);
        return () => clearInterval(interval);
    }, [readOnly, targetUserId, user]);

    const handleFollowToggle = async () => {
        if (!targetUserId) return;
        const newState = !isFollowing;
        setIsFollowing(newState);
        setFollowers(prev => newState ? prev + 1 : prev - 1);
        await AsyncStorage.setItem(`following_${targetUserId}`, newState.toString());

        // In a real app, looking at my own 'following' count would increase.
        // And looking at targetUser's 'followers' would increase. 
        // Logic simplified for this view.
    };

    return (
        <View className="flex-1 rounded-[32px] overflow-hidden bg-[#1E293B] border border-white/5 relative">

            {/* 1. Background Image Area (Top 50%) */}
            <View className="h-[50%] w-full bg-slate-700 relative">
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-full absolute inset-0"
                        resizeMode="cover"
                    />
                ) : (
                    <LinearGradient
                        colors={['#3B82F6', '#6366F1']}
                        style={{ width: '100%', height: '100%' }}
                    />
                )}

                <LinearGradient
                    colors={['transparent', 'rgba(15, 23, 42, 0.8)', '#0F172A']}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
                />
                {!imageUrl && (
                    <View className="absolute inset-0 items-center justify-center">
                        <Text className="text-white/20 text-8xl font-bold">IMG</Text>
                    </View>
                )}
            </View>

            {/* 2. Content Area (Bottom 50%) */}
            <View className="flex-1 bg-[#0F172A] px-6 pt-2 pb-6 justify-between">

                <View>
                    {/* Name & Verification */}
                    <View className="flex-row items-center mb-1">
                        <Text className="text-white text-2xl font-bold mr-2">
                            {realName || nickname}
                        </Text>
                        <CheckCircle2 size={20} color="#10B981" fill="#10B981" />
                    </View>

                    {/* Role / Tagline */}
                    <Text className="text-slate-400 text-sm font-medium mb-3">
                        {role}
                    </Text>

                    {/* Expertise Badges */}
                    <View className="flex-row flex-wrap gap-2 mb-3">
                        {EXPERTISE_BADGES.map((badge) => (
                            <View key={badge} className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                <Text className="text-blue-400 text-xs font-bold">{badge}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Description */}
                    <Text className="text-slate-500 text-xs leading-5" numberOfLines={3}>
                        {bio}
                    </Text>
                </View>

                {/* Bottom Row: Stats & Action Buttons */}
                <View className="mt-4">
                    {/* Stats */}
                    <View className="flex-row gap-6 mb-3">
                        <View className="flex-row items-center">
                            <Users size={14} color="#94A3B8" />
                            <Text className="text-slate-300 text-xs font-bold ml-1.5">{followers.toLocaleString()}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Heart size={14} color="#94A3B8" />
                            <Text className="text-slate-300 text-xs font-bold ml-1.5">{likes.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* Action Buttons - Conditional */}
                    {readOnly ? (
                        // Public View Actions: Follow & Chat
                        <View className="flex-row gap-3 w-full">
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-xl items-center justify-center shadow-lg ${isFollowing ? 'bg-slate-700 border border-white/10' : 'bg-blue-600 shadow-blue-500/30'}`}
                                onPress={handleFollowToggle}
                            >
                                <Text className="text-white font-bold text-sm">{isFollowing ? 'Following' : 'Follow'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-[#1E293B] py-3 rounded-xl items-center justify-center border border-white/10"
                                onPress={() => onChatPress?.({ id: targetUserId || 'unknown', name: nickname })}
                            >
                                <Text className="text-white font-bold text-sm">Chat</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // Owner Actions: Edit & Messages
                        <View className="flex-row gap-3 w-full">
                            <TouchableOpacity
                                className="flex-1 bg-blue-600 py-3 rounded-xl items-center justify-center shadow-lg shadow-blue-500/30"
                                onPress={() => onEditProfile?.()}
                            >
                                <Text className="text-white font-bold text-sm">프로필 수정</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="w-12 items-center justify-center bg-[#1E293B] rounded-xl border border-white/10"
                                onPress={onShowInbox}
                            >
                                <Mail size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* <SettingsModal
                visible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
            /> */}
        </View>
    );
};
