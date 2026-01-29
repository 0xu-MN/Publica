import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, SafeAreaView, Platform, StatusBar } from 'react-native';
import { ArrowLeft, Share2, Calendar, Building, CheckCircle, ExternalLink, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GovernmentDetailScreenProps {
    program: any;
    onBack: () => void;
}

export const GovernmentDetailScreen: React.FC<GovernmentDetailScreenProps> = ({ program, onBack }) => {

    if (!program) return null;

    const handleOpenLink = () => {
        if (program.link) {
            Linking.openURL(program.link);
        }
    };

    const handleShare = () => {
        // Implement share logic later
        console.log('Share pressed');
    };

    return (
        <SafeAreaView className="flex-1 bg-[#020617]">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/5 bg-[#020617] z-10">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="p-2 -ml-2 rounded-full active:bg-white/10"
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold flex-1 text-center mx-4" numberOfLines={1}>
                    정부사업 상세
                </Text>
                <TouchableOpacity
                    onPress={handleShare}
                    className="p-2 -mr-2 rounded-full active:bg-white/10"
                >
                    <Share2 size={22} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View className="relative overflow-hidden">
                    <LinearGradient
                        colors={['#4C1D95', '#020617']}
                        className="absolute inset-0 opacity-50"
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />

                    <View className="px-6 pt-8 pb-10">
                        {/* Badges */}
                        <View className="flex-row gap-2 mb-4">
                            {program.dDay && (
                                <View className="bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">
                                    <Text className="text-red-400 text-xs font-bold">{program.dDay}</Text>
                                </View>
                            )}
                            <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                <Text className="text-emerald-400 text-xs font-bold">{program.status}</Text>
                            </View>
                            <View className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
                                <Text className="text-slate-300 text-xs">{program.category}</Text>
                            </View>
                        </View>

                        <Text className="text-white text-2xl font-bold leading-9 mb-6">
                            {program.title}
                        </Text>

                        <View className="flex-row items-center gap-2 mb-2">
                            <Building size={16} color="#94A3B8" />
                            <Text className="text-slate-300 text-sm font-medium">{program.agency}</Text>
                        </View>
                        {program.department && (
                            <Text className="text-slate-400 text-xs pl-6 mb-4">{program.department}</Text>
                        )}

                        <View className="h-[1px] bg-white/10 my-4" />

                        <View className="flex-row items-center gap-2">
                            <Calendar size={16} color="#94A3B8" />
                            <Text className="text-slate-300 text-sm">
                                {program.period}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Content Cards */}
                <View className="px-5 -mt-6 gap-6 mb-24">

                    {/* Summary */}
                    {program.description && (
                        <View className="bg-slate-900 rounded-2xl p-5 border border-white/10">
                            <Text className="text-white text-lg font-bold mb-3">📋 사업 개요</Text>
                            <Text className="text-slate-300 leading-6 text-sm">
                                {program.description}
                            </Text>
                        </View>
                    )}

                    {/* Requirements */}
                    {program.requirements && program.requirements.length > 0 && (
                        <View className="bg-slate-900 rounded-2xl p-5 border border-white/10">
                            <Text className="text-white text-lg font-bold mb-3">🎯 지원 대상</Text>
                            {Array.isArray(program.requirements) ? (
                                program.requirements.map((req: string, i: number) => (
                                    <View key={i} className="flex-row gap-3 mb-2 last:mb-0">
                                        <CheckCircle size={16} color="#3B82F6" className="mt-0.5" />
                                        <Text className="text-slate-300 leading-6 text-sm flex-1">{req}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text className="text-slate-300 leading-6 text-sm">{program.requirements}</Text>
                            )}
                        </View>
                    )}

                    {/* Additional Details */}
                    <View className="bg-slate-900 rounded-2xl p-5 border border-white/10">
                        <Text className="text-white text-lg font-bold mb-4">ℹ️ 세부 정보</Text>

                        <View className="gap-4">
                            {program.budget && (
                                <View>
                                    <Text className="text-slate-500 text-xs mb-1">지원 예산</Text>
                                    <Text className="text-slate-200 font-medium">{program.budget}</Text>
                                </View>
                            )}
                            {program.target && (
                                <View>
                                    <Text className="text-slate-500 text-xs mb-1">타겟/분야</Text>
                                    <Text className="text-slate-200 font-medium">{program.target}</Text>
                                </View>
                            )}
                            <View>
                                <Text className="text-slate-500 text-xs mb-1">담당 기관</Text>
                                <Text className="text-slate-200 font-medium">{program.original_agency || program.agency}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Submission Documents & Attachments */}
                    <View className="bg-slate-900 rounded-2xl p-5 border border-white/10">
                        <Text className="text-white text-lg font-bold mb-4">📄 제출서류 및 첨부파일</Text>

                        <View className="mb-4">
                            <Text className="text-slate-500 text-xs mb-2">필수 제출 서류 (예시)</Text>
                            <View className="flex-row items-start gap-2 mb-1">
                                <CheckCircle size={14} color="#64748B" className="mt-0.5" />
                                <Text className="text-slate-300 text-sm">사업계획서 (필수)</Text>
                            </View>
                            <View className="flex-row items-start gap-2 mb-1">
                                <CheckCircle size={14} color="#64748B" className="mt-0.5" />
                                <Text className="text-slate-300 text-sm">사업자등록증 (해당 시)</Text>
                            </View>
                            <View className="flex-row items-start gap-2">
                                <CheckCircle size={14} color="#64748B" className="mt-0.5" />
                                <Text className="text-slate-300 text-sm">국세/지방세 완납증명서</Text>
                            </View>
                        </View>

                        <View className="h-[1px] bg-white/5 my-3" />

                        <TouchableOpacity
                            onPress={handleOpenLink}
                            className="flex-row items-center justify-between bg-slate-800 p-3 rounded-xl border border-white/5 active:bg-slate-700"
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="bg-blue-500/10 p-2 rounded-lg">
                                    <Globe size={20} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text className="text-white font-medium">공고문 및 신청서식 내려받기</Text>
                                    <Text className="text-slate-500 text-xs">원문 사이트에서 파일 다운로드</Text>
                                </View>
                            </View>
                            <ArrowLeft size={16} color="#94A3B8" style={{ transform: [{ rotate: '180deg' }] }} />
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-[#020617]/90 px-6 py-4 border-t border-white/10 pb-10"
                style={{ paddingBottom: Platform.OS === 'ios' ? 40 : 16 }}
            >
                <TouchableOpacity
                    onPress={handleOpenLink}
                    className="w-full bg-blue-600 rounded-xl py-4 flex-row items-center justify-center active:bg-blue-700"
                >
                    <Text className="text-white font-bold text-base mr-2">원문 공고 확인하기</Text>
                    <ExternalLink size={18} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
