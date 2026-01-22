import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, CheckCircle2, ChevronRight, User, Building2, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingModalProps {
    visible: boolean;
    onClose: () => void;
}

const INTERESTS = ['AI/ML', 'Startups', 'FinTech', 'Marketing', 'Policy', 'Biotech', 'Web3', 'Design', 'Data Science'];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onClose }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState('');
    const [job, setJob] = useState('');
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const handleNext = () => {
        if (step === 1) {
            if (nickname.trim()) setStep(2);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        // Save profile
        const profileData = {
            nickname,
            job,
            interests: selectedInterests,
            email: user?.email,
            id: user?.id,
            bio: '안녕하세요! 인사이트플로우에 오신 것을 환영합니다.'
        };

        try {
            await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));
            // In a real app, also save to Supabase "profiles" table here
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    const toggleInterest = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(prev => prev.filter(i => i !== interest));
        } else {
            if (selectedInterests.length < 5) {
                setSelectedInterests(prev => [...prev, interest]);
            }
        }
    };

    if (!visible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-center items-center bg-black/80 px-4"
            >
                <View className="bg-[#0F172A] w-full max-w-[500px] rounded-3xl border border-white/10 overflow-hidden shadow-2xl p-8">

                    {/* Progress Indicator */}
                    <View className="flex-row gap-2 mb-8 justify-center">
                        <View className={`h-1.5 w-12 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-slate-700'}`} />
                        <View className={`h-1.5 w-12 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-slate-700'}`} />
                    </View>

                    {step === 1 ? (
                        /* STEP 1: Profile Info */
                        <View>
                            <View className="items-center mb-8">
                                <View className="w-16 h-16 bg-blue-500/20 rounded-full items-center justify-center mb-4 border border-blue-500/30">
                                    <User size={32} color="#60A5FA" />
                                </View>
                                <Text className="text-white text-2xl font-bold mb-2">프로필 설정</Text>
                                <Text className="text-slate-400 text-center">다른 사용자들에게 보여질 모습을 설정해주세요.</Text>
                            </View>

                            <View className="gap-5">
                                <View>
                                    <Text className="text-slate-300 text-sm font-bold mb-2 ml-1">닉네임</Text>
                                    <View className="flex-row items-center bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3">
                                        <User size={18} color="#64748B" />
                                        <TextInput
                                            className="flex-1 ml-3 text-white text-base"
                                            placeholder="닉네임을 입력하세요"
                                            placeholderTextColor="#64748B"
                                            value={nickname}
                                            onChangeText={setNickname}
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-slate-300 text-sm font-bold mb-2 ml-1">직업 / 소속</Text>
                                    <View className="flex-row items-center bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3">
                                        <Building2 size={18} color="#64748B" />
                                        <TextInput
                                            className="flex-1 ml-3 text-white text-base"
                                            placeholder="예: 스타트업 대표, 마케터, 개발자"
                                            placeholderTextColor="#64748B"
                                            value={job}
                                            onChangeText={setJob}
                                        />
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleNext}
                                disabled={!nickname.trim()}
                                className={`mt-8 w-full py-4 rounded-xl flex-row items-center justify-center ${nickname.trim() ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-800 opacity-50'}`}
                            >
                                <Text className="text-white font-bold text-lg mr-2">다음</Text>
                                <ChevronRight size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* STEP 2: Interests */
                        <View>
                            <View className="items-center mb-8">
                                <View className="w-16 h-16 bg-emerald-500/20 rounded-full items-center justify-center mb-4 border border-emerald-500/30">
                                    <Sparkles size={32} color="#34D399" />
                                </View>
                                <Text className="text-white text-2xl font-bold mb-2">관심 분야 선택</Text>
                                <Text className="text-slate-400 text-center">관심있는 주제를 선택하면 맞춤형 콘텐츠를 추천해드립니다.</Text>
                            </View>

                            <View className="flex-row flex-wrap gap-3 justify-center mb-4">
                                {INTERESTS.map((interest) => (
                                    <TouchableOpacity
                                        key={interest}
                                        onPress={() => toggleInterest(interest)}
                                        className={`px-4 py-2.5 rounded-full border ${selectedInterests.includes(interest)
                                            ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/30'
                                            : 'bg-slate-800/50 border-white/10 hover:bg-slate-700'
                                            }`}
                                    >
                                        <Text className={`font-medium ${selectedInterests.includes(interest) ? 'text-white' : 'text-slate-400'}`}>
                                            {interest}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text className="text-slate-500 text-xs text-center">최대 5개까지 선택 가능합니다.</Text>

                            <TouchableOpacity
                                onPress={handleComplete}
                                className="mt-8 w-full bg-blue-600 py-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-blue-500/30"
                            >
                                <Text className="text-white font-bold text-lg mr-2">시작하기</Text>
                                <CheckCircle2 size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
