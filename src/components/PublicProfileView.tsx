import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { X, Briefcase, Award, Activity, Users, MessageCircle, UserCheck, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PublicProfileViewProps {
    userId: string;
    onClose: () => void;
}

interface CareerEntry {
    id: string;
    company: string;
    role: string;
    period: string;
    description: string;
}

interface QualificationEntry {
    id: string;
    type: 'certification' | 'activity' | 'award';
    title: string;
    issuer: string;
    date: string;
}

interface UserProfile {
    nickname: string;
    realName: string;
    bio: string;
    imageUrl: string;
    job: string;
    interests: string[];
    careers: CareerEntry[];
    qualifications: QualificationEntry[];
}

export const PublicProfileView = ({ userId, onClose }: PublicProfileViewProps) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [followers, setFollowers] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id || null);
        });
    }, []);

    useEffect(() => {
        if (userId) loadUserProfile();
    }, [userId]);

    useEffect(() => {
        if (currentUserId && userId) checkFollowStatus();
    }, [currentUserId, userId]);

    const loadUserProfile = async () => {
        setLoading(true);
        try {
            // Supabase profiles 테이블에서 실제 데이터 조회
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) throw new Error('프로필을 불러올 수 없습니다.');

            // AsyncStorage에서 추가 정보 (경력, 자격증 등) 조회
            let asyncProfile: any = {};
            try {
                const stored = await AsyncStorage.getItem(`public_profile_${userId}`);
                if (stored) asyncProfile = JSON.parse(stored);
            } catch { /* 없으면 기본값 사용 */ }

            const mapped: UserProfile = {
                nickname: data.full_name || data.id?.slice(0, 8) || '익명',
                realName: data.full_name || '',
                bio: data.item_one_liner || data.item_description || asyncProfile.bio || '',
                imageUrl: data.avatar_url || '',
                job: data.industry || data.major_category || data.expertise || asyncProfile.job || '',
                interests: data.research_keywords || asyncProfile.interests || [],
                careers: asyncProfile.careers || [],
                qualifications: asyncProfile.qualifications || [],
            };

            setProfile(mapped);
            setFollowers(data.followers_count || 0);
        } catch (e) {
            console.error('프로필 로드 실패:', e);
            // 최소한의 fallback — userId 기반
            setProfile({
                nickname: userId.slice(0, 8),
                realName: '',
                bio: '',
                imageUrl: '',
                job: '',
                interests: [],
                careers: [],
                qualifications: [],
            });
        } finally {
            setLoading(false);
        }
    };

    const checkFollowStatus = async () => {
        if (!currentUserId || currentUserId === userId) return;

        // AsyncStorage를 항상 먼저 확인 (즉각 반영, 오프라인 대응)
        const stored = await AsyncStorage.getItem(`following_${currentUserId}_${userId}`);
        if (stored !== null) {
            setIsFollowing(stored === 'true');
        }

        // Supabase에서 최신 상태 동기화 (follows 테이블 있을 때만)
        try {
            const { data, error } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', currentUserId)
                .eq('following_id', userId)
                .maybeSingle();

            if (!error) {
                // 테이블 조회 성공 시 DB 상태가 정답 (RLS 정상 작동 경우)
                const dbFollowing = !!data;
                setIsFollowing(dbFollowing);
                await AsyncStorage.setItem(`following_${currentUserId}_${userId}`, String(dbFollowing));
            }
            // error 있으면 (테이블 없음/RLS) → AsyncStorage 값 유지
        } catch {
            // 네트워크 오류 등 → AsyncStorage 값 유지
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUserId || currentUserId === userId || followLoading) return;
        setFollowLoading(true);

        const next = !isFollowing;
        // 즉각 UI 반영
        setIsFollowing(next);
        setFollowers(f => next ? f + 1 : Math.max(0, f - 1));
        await AsyncStorage.setItem(`following_${currentUserId}_${userId}`, String(next));

        try {
            if (!next) {
                // 언팔로우
                await supabase.from('follows').delete()
                    .eq('follower_id', currentUserId)
                    .eq('following_id', userId);
                await supabase.from('profiles')
                    .update({ followers_count: Math.max(0, followers - 1) })
                    .eq('id', userId);
            } else {
                // 팔로우
                await supabase.from('follows').insert({
                    follower_id: currentUserId,
                    following_id: userId,
                    created_at: new Date().toISOString(),
                });
                await supabase.from('profiles')
                    .update({ followers_count: followers + 1 })
                    .eq('id', userId);
            }
        } catch {
            // DB 실패해도 UI/AsyncStorage 상태는 이미 반영됨 → 무시
        } finally {
            setFollowLoading(false);
        }
    };

    const handleMessage = () => {
        Alert.alert(
            '메시지 기능',
            '메시지 기능은 곧 출시될 예정입니다.\n팔로우하고 업데이트를 기다려주세요!',
            [{ text: '확인' }]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-[#020617] items-center justify-center gap-3">
                <ActivityIndicator size="large" color="#818CF8" />
                <Text className="text-slate-400 text-sm">프로필 불러오는 중...</Text>
            </View>
        );
    }

    if (!profile) return null;

    const certifications = profile.qualifications.filter(q => q.type === 'certification');
    const activities = profile.qualifications.filter(q => q.type === 'activity');
    const awards = profile.qualifications.filter(q => q.type === 'award');

    return (
        <View className="flex-1 bg-[#020617] flex-row">
            {/* LEFT CARD: Profile Summary */}
            <View className="w-[380px] p-8 border-r border-white/5">
                <View className="flex-row items-center justify-between mb-8">
                    <Text className="text-white text-2xl font-bold">프로필</Text>
                    <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10">
                        <X size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Profile Image & Name */}
                    <View className="items-center mb-8">
                        <View className="w-40 h-40 rounded-full bg-slate-800 mb-4 overflow-hidden border-4 border-white/10">
                            {profile.imageUrl ? (
                                <Image source={{ uri: profile.imageUrl }} className="w-full h-full" />
                            ) : (
                                <LinearGradient
                                    colors={['#3B82F6', '#6366F1']}
                                    style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Text className="text-white text-5xl font-bold">{profile.nickname[0].toUpperCase()}</Text>
                                </LinearGradient>
                            )}
                        </View>
                        <Text className="text-white text-3xl font-bold mb-2">{profile.realName}</Text>
                        <Text className="text-slate-400 text-lg mb-1">@{profile.nickname}</Text>
                        <Text className="text-blue-400 text-sm font-medium">{profile.job}</Text>
                    </View>

                    {/* Stats */}
                    <View className="flex-row gap-6 mb-8 justify-center">
                        <View className="items-center">
                            <View className="flex-row items-center gap-1.5 mb-1">
                                <Users size={16} color="#94A3B8" />
                                <Text className="text-white text-xl font-bold">{followers.toLocaleString()}</Text>
                            </View>
                            <Text className="text-slate-500 text-xs">팔로워</Text>
                        </View>
                    </View>

                    {/* Interests */}
                    {profile.interests && profile.interests.length > 0 && (
                        <View className="mb-8">
                            <Text className="text-slate-400 text-sm font-bold mb-3">관심 분야</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {profile.interests.map((interest, idx) => (
                                    <View key={idx} className="bg-blue-500/10 px-3 py-2 rounded-full border border-blue-500/20">
                                        <Text className="text-blue-400 text-sm font-bold">{interest}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Action Buttons */}
                    {currentUserId !== userId && (
                        <View className="gap-3">
                            <TouchableOpacity
                                onPress={handleFollowToggle}
                                disabled={followLoading}
                                className={`py-4 rounded-2xl items-center ${isFollowing ? 'bg-white/10 border border-white/20' : 'bg-blue-600 shadow-lg'}`}
                            >
                                {followLoading ? (
                                    <ActivityIndicator size="small" color={isFollowing ? '#94A3B8' : 'white'} />
                                ) : (
                                    <View className="flex-row items-center gap-2">
                                        {isFollowing
                                            ? <UserCheck size={18} color="#94A3B8" />
                                            : <UserPlus size={18} color="white" />
                                        }
                                        <Text className={`font-bold text-base ${isFollowing ? 'text-slate-400' : 'text-white'}`}>
                                            {isFollowing ? '팔로잉' : '팔로우'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleMessage}
                                className="bg-[#0F172A] py-4 rounded-2xl items-center border border-white/10"
                            >
                                <View className="flex-row items-center gap-2">
                                    <MessageCircle size={18} color="white" />
                                    <Text className="text-white font-bold text-base">메시지 보내기</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* RIGHT PANEL: Detailed Information */}
            <View className="flex-1 p-8">
                <Text className="text-white text-3xl font-bold mb-8">게시글 상세</Text>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Bio Section */}
                    {profile.bio && (
                        <View className="mb-8">
                            <Text className="text-slate-400 text-lg font-bold mb-4">소개</Text>
                            <View className="bg-[#0F172A] p-6 rounded-3xl border border-white/5">
                                <Text className="text-slate-300 text-base leading-relaxed">{profile.bio}</Text>
                            </View>
                        </View>
                    )}

                    {/* Career Section */}
                    {profile.careers && profile.careers.length > 0 && (
                        <View className="mb-8">
                            <View className="flex-row items-center gap-2 mb-4">
                                <Briefcase size={20} color="#94A3B8" />
                                <Text className="text-slate-400 text-lg font-bold">경력</Text>
                            </View>
                            <View className="gap-4">
                                {profile.careers.map((career) => (
                                    <View key={career.id} className="bg-[#0F172A] p-6 rounded-3xl border border-white/5">
                                        <Text className="text-white text-xl font-bold mb-2">{career.company}</Text>
                                        <Text className="text-blue-400 text-base font-medium mb-2">{career.role}</Text>
                                        <Text className="text-slate-500 text-sm mb-4">{career.period}</Text>
                                        {career.description && (
                                            <Text className="text-slate-300 text-sm leading-relaxed">{career.description}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Certifications */}
                    {certifications.length > 0 && (
                        <View className="mb-8">
                            <View className="flex-row items-center gap-2 mb-4">
                                <Award size={20} color="#34D399" />
                                <Text className="text-slate-400 text-lg font-bold">자격증</Text>
                            </View>
                            <View className="gap-3">
                                {certifications.map((cert) => (
                                    <View key={cert.id} className="bg-[#0F172A] p-5 rounded-2xl border border-emerald-500/20">
                                        <Text className="text-white text-base font-bold mb-1">{cert.title}</Text>
                                        <Text className="text-emerald-400 text-sm">{cert.issuer} · {cert.date}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Awards */}
                    {awards.length > 0 && (
                        <View className="mb-8">
                            <View className="flex-row items-center gap-2 mb-4">
                                <Award size={20} color="#F59E0B" />
                                <Text className="text-slate-400 text-lg font-bold">수상경력</Text>
                            </View>
                            <View className="gap-3">
                                {awards.map((award) => (
                                    <View key={award.id} className="bg-[#0F172A] p-5 rounded-2xl border border-amber-500/20">
                                        <Text className="text-white text-base font-bold mb-1">{award.title}</Text>
                                        <Text className="text-amber-400 text-sm">{award.issuer} · {award.date}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Activities */}
                    {activities.length > 0 && (
                        <View className="mb-8">
                            <View className="flex-row items-center gap-2 mb-4">
                                <Activity size={20} color="#A78BFA" />
                                <Text className="text-slate-400 text-lg font-bold">대외활동</Text>
                            </View>
                            <View className="gap-3">
                                {activities.map((activity) => (
                                    <View key={activity.id} className="bg-[#0F172A] p-5 rounded-2xl border border-purple-500/20">
                                        <Text className="text-white text-base font-bold mb-1">{activity.title}</Text>
                                        <Text className="text-purple-400 text-sm">{activity.issuer} · {activity.date}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
};
