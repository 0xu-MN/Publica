import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MessageCircle, CheckCircle2, Users, Heart, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProfileCardProps {
    onChatPress: () => void;
}

const EXPERTISE_BADGES = ['AI/ML', 'Quantum', 'FinTech', 'Biotech'];

export const ProfileCard = ({ onChatPress }: ProfileCardProps) => {
    return (
        <View className="flex-1 rounded-[32px] overflow-hidden bg-[#1E293B] border border-white/5 relative">

            {/* 1. Background Image Area (Top 50%) */}
            <View className="h-[50%] w-full bg-slate-700 relative">
                {/* Simulated Image Placeholder with Gradient */}
                <LinearGradient
                    colors={['#3B82F6', '#6366F1']}
                    style={{ width: '100%', height: '100%' }}
                />

                {/* Image Overlay Gradient for Text Readability */}
                <LinearGradient
                    colors={['transparent', 'rgba(15, 23, 42, 0.8)', '#0F172A']}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
                />

                {/* Placeholder Text */}
                <View className="absolute inset-0 items-center justify-center">
                    <Text className="text-white/20 text-8xl font-bold">IMG</Text>
                </View>
            </View>

            {/* 2. Content Area (Bottom 50%) */}
            <View className="flex-1 bg-[#0F172A] px-6 pt-2 pb-6 justify-between">

                <View>
                    {/* Name & Verification */}
                    <View className="flex-row items-center mb-1">
                        <Text className="text-white text-2xl font-bold mr-2">Hong56800</Text>
                        <CheckCircle2 size={20} color="#10B981" fill="#10B981" />
                    </View>

                    {/* Role / Tagline */}
                    <Text className="text-slate-400 text-sm font-medium mb-3">
                        AI Service Planner & Developer
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
                    <Text className="text-slate-500 text-xs leading-5">
                        사용자 경험을 혁신하는 AI 서비스를 기획하고 개발합니다.
                    </Text>
                </View>

                {/* Bottom Row: Stats & Action Buttons */}
                <View className="mt-4">
                    {/* Stats */}
                    <View className="flex-row gap-6 mb-3">
                        <View className="flex-row items-center">
                            <Users size={14} color="#94A3B8" />
                            <Text className="text-slate-300 text-xs font-bold ml-1.5">1.2k</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Heart size={14} color="#94A3B8" />
                            <Text className="text-slate-300 text-xs font-bold ml-1.5">482</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            className="flex-1 bg-white py-2.5 rounded-full flex-row items-center justify-center shadow-lg active:bg-slate-200"
                            onPress={onChatPress}
                        >
                            <MessageCircle size={14} color="#0F172A" />
                            <Text className="text-slate-900 font-bold text-xs ml-1.5">Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-blue-600 py-2.5 rounded-full flex-row items-center justify-center shadow-lg shadow-blue-500/30 active:bg-blue-700"
                        >
                            <UserPlus size={14} color="#fff" />
                            <Text className="text-white font-bold text-xs ml-1.5">Follow</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};
