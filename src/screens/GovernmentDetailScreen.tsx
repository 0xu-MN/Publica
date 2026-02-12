import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { ArrowLeft, Share2, Calendar, Building, CheckCircle, ExternalLink, Globe, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GovernmentDetailScreenProps {
    program: any;
    onBack: () => void;
    onAnalyzeComplete?: (result: any) => void;
    onStartAnalysis?: (program: any) => void;
}

export const GovernmentDetailScreen: React.FC<GovernmentDetailScreenProps> = ({ program, onBack, onAnalyzeComplete, onStartAnalysis }) => {
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [analysisStep, setAnalysisStep] = React.useState(0);

    if (!program) return null;

    const handleOpenOriginal = () => {
        if (program.original_url) {
            Linking.openURL(program.original_url);
        } else if (program.link) {
            Linking.openURL(program.link);
        } else {
            Linking.openURL('https://www.mss.go.kr');
        }
    };

    const handleDownloadFile = () => {
        if (program.file_url) {
            Linking.openURL(program.file_url);
        }
    };

    const handleShare = () => {
        console.log('Share pressed');
    };

    const handleAnalyze = async () => {
        if (onStartAnalysis) {
            onStartAnalysis(program);
            return;
        }

        // Fallback for demo simulation if onStartAnalysis is not provided
        setIsAnalyzing(true);
        setAnalysisStep(1);
        setTimeout(() => setAnalysisStep(2), 1500);
        setTimeout(() => setAnalysisStep(3), 3000);

        setTimeout(() => {
            const mockResult = {
                strategy: `## 🎯 Strategy for ${program.title}\n\n**Analysis:** Strong match for your profile.\n\n**Key Strengths:**\n- Matches ${program.tech_field}\n- Fits Graduate Student status.`,
            };
            setIsAnalyzing(false);
            if (onAnalyzeComplete) onAnalyzeComplete(mockResult);
        }, 4500);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#020617]">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/5 bg-[#020617] z-10">
                <TouchableOpacity
                    onPress={onBack}
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
                            onPress={handleDownloadFile}
                            className={`flex-row items-center justify-between bg-slate-800 p-3 rounded-xl border border-white/5 active:bg-slate-700 ${!program.file_url ? 'opacity-50' : ''}`}
                            disabled={!program.file_url}
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="bg-blue-500/10 p-2 rounded-lg">
                                    <Globe size={20} color={program.file_url ? "#3B82F6" : "#94A3B8"} />
                                </View>
                                <View>
                                    <Text className="text-white font-medium">
                                        {program.file_url ? '공고문 및 신청서식 내려받기' : '다운로드 가능한 파일 없음'}
                                    </Text>
                                    <Text className="text-slate-500 text-xs">
                                        {program.file_url ? '원문 사이트에서 파일 다운로드' : '해당 공고는 첨부파일이 제공되지 않습니다.'}
                                    </Text>
                                </View>
                            </View>
                            {program.file_url && (
                                <ArrowLeft size={16} color="#94A3B8" style={{ transform: [{ rotate: '180deg' }] }} />
                            )}
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>

            {/* Analysis Overlay Modal (Simple Implementation) */}
            {isAnalyzing && (
                <View className="absolute inset-0 bg-black/80 items-center justify-center z-50">
                    <View className="bg-slate-900 p-8 rounded-3xl items-center w-[80%] border border-blue-500/30">
                        <ActivityIndicator size="large" color="#3B82F6" className="mb-6" />
                        <Text className="text-white text-xl font-bold mb-2">AI 전략 분석 중...</Text>
                        <View className="items-start w-full px-4 gap-3 mt-4">
                            <View className="flex-row items-center gap-3">
                                <View className={`w-2 h-2 rounded-full ${analysisStep >= 1 ? 'bg-blue-500' : 'bg-slate-700'}`} />
                                <Text className={`${analysisStep >= 1 ? 'text-blue-400' : 'text-slate-600'}`}>공고문 PDF 분석</Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <View className={`w-2 h-2 rounded-full ${analysisStep >= 2 ? 'bg-purple-500' : 'bg-slate-700'}`} />
                                <Text className={`${analysisStep >= 2 ? 'text-purple-400' : 'text-slate-600'}`}>합격 전략 수립 (Gemini Pro)</Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <View className={`w-2 h-2 rounded-full ${analysisStep >= 3 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                <Text className={`${analysisStep >= 3 ? 'text-emerald-400' : 'text-slate-600'}`}>사업계획서 초안 작성</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* Bottom Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-[#020617]/90 px-6 py-4 border-t border-white/10 pb-10"
                style={{ paddingBottom: Platform.OS === 'ios' ? 40 : 16 }}
            >
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={handleOpenOriginal}
                        className="flex-1 bg-slate-800 rounded-xl py-4 flex-row items-center justify-center active:bg-slate-700 border border-white/10"
                    >
                        <Text className="text-slate-300 font-bold text-base mr-2">원문 공고</Text>
                        <ExternalLink size={18} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleAnalyze}
                        className="flex-2 flex-[2] bg-blue-600 rounded-xl py-4 flex-row items-center justify-center active:bg-blue-700 shadow-lg shadow-blue-500/30"
                    >
                        <LinearGradient
                            colors={['#2563EB', '#1D4ED8']}
                            className="absolute inset-0 rounded-xl"
                        />
                        <View className="flex-row items-center">
                            <Text className="text-white font-bold text-base mr-2">AI 전략 분석하기</Text>
                            <Zap size={18} color="white" fill="white" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};
