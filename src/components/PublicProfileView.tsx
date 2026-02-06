import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { X, Briefcase, Award, Activity, Users, Heart, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    const [followers, setFollowers] = useState(1240);
    const [likes, setLikes] = useState(482);

    useEffect(() => {
        loadUserProfile();
    }, [userId]);

    const loadUserProfile = async () => {
        try {
            // In a real app, fetch user profile by userId from backend/AsyncStorage
            // For now, use mock data
            const mockProfile: UserProfile = {
                nickname: 'hong56800',
                realName: '안녕안녕',
                bio: '전자기술로 안녕하세요! 나누고 있는 AI 서비스를 기획하고 개발합니다. 고객 경험을 중심으로 데이터 기반의 혁신적인 솔루션을 만듭니다.',
                imageUrl: '',
                job: 'AI/Computer Science',
                interests: ['AI/ML', 'Quantum', 'FinTech', 'Biotech'],
                careers: [
                    {
                        id: '1',
                        company: 'nollyungwoo 회사1(메인)',
                        role: '고객대리인',
                        period: '2019.04 - 현재(진행중)',
                        description: 'AI 기반 고객 서비스 플랫폼 개발 및 운영, 데이터 분석을 통한 서비스 개선'
                    },
                    {
                        id: '2',
                        company: 'nollyungwoo 회사2(경력)',
                        role: '선임개발자',
                        period: '2016.03 - 2019.03',
                        description: '웹 애플리케이션 개발 및 시스템 아키텍처 설계'
                    }
                ],
                qualifications: [
                    {
                        id: '1',
                        type: 'certification',
                        title: '정보처리기사',
                        issuer: '한국산업인력공단',
                        date: '2018.06'
                    },
                    {
                        id: '2',
                        type: 'activity',
                        title: 'AI 스타트업 멘토링',
                        issuer: '서울창업허브',
                        date: '2022.01 - 2023.12'
                    },
                    {
                        id: '3',
                        type: 'award',
                        title: '우수 AI 서비스 대상',
                        issuer: 'AI 협회',
                        date: '2023.11'
                    }
                ]
            };

            setProfile(mockProfile);
        } catch (e) {
            console.error('Failed to load user profile', e);
        }
    };

    if (!profile) {
        return (
            <View className="flex-1 bg-[#020617] items-center justify-center">
                <Text className="text-slate-400">Loading...</Text>
            </View>
        );
    }

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
                        <View className="items-center">
                            <View className="flex-row items-center gap-1.5 mb-1">
                                <Heart size={16} color="#94A3B8" />
                                <Text className="text-white text-xl font-bold">{likes.toLocaleString()}</Text>
                            </View>
                            <Text className="text-slate-500 text-xs">좋아요</Text>
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
                    <View className="gap-3">
                        <TouchableOpacity className="bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-500/30">
                            <Text className="text-white font-bold text-base">팔로우</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-[#0F172A] py-4 rounded-2xl items-center border border-white/10">
                            <View className="flex-row items-center gap-2">
                                <MessageCircle size={18} color="white" />
                                <Text className="text-white font-bold text-base">메시지 보내기</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
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
