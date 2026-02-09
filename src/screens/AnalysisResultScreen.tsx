import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { ArrowLeft, CheckCircle, FileText, Share2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnalysisResult {
    strategy: string;
    initial_draft_content?: string;
}

interface AnalysisResultScreenProps {
    result: AnalysisResult;
    onClose: () => void;
    onOpenDraft?: (content: string) => void;
}

export const AnalysisResultScreen: React.FC<AnalysisResultScreenProps> = ({ result, onClose, onOpenDraft }) => {

    // Simple Markdown Renderer
    const renderMarkdown = (text: string) => {
        if (!text) return null;

        const lines = text.split('\n');
        return lines.map((line, index) => {
            // Header 2 (##)
            if (line.startsWith('## ')) {
                return (
                    <Text key={index} className="text-white text-xl font-bold mt-6 mb-3">
                        {line.replace('## ', '')}
                    </Text>
                );
            }
            // Header 3 (###) or Bold Line
            if (line.startsWith('### ') || line.startsWith('**') && line.endsWith('**')) {
                return (
                    <Text key={index} className="text-blue-400 text-lg font-semibold mt-4 mb-2">
                        {line.replace(/### |\*\*/g, '')}
                    </Text>
                );
            }
            // Bullet points
            if (line.trim().startsWith('- ')) {
                return (
                    <View key={index} className="flex-row items-start mb-2 pl-2">
                        <View className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 mr-3" />
                        <Text className="text-slate-300 text-base leading-6 flex-1">
                            {parseBold(line.replace('- ', ''))}
                        </Text>
                    </View>
                );
            }
            // Normal paragraph (handle **bold** inside)
            if (line.trim().length > 0) {
                return (
                    <Text key={index} className="text-slate-300 text-base leading-7 mb-2">
                        {parseBold(line)}
                    </Text>
                );
            }
            return <View key={index} className="h-2" />;
        });
    };

    // Helper to parse **bold** inside text
    const parseBold = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <Text key={i} className="text-white font-bold">{part.replace(/\*\*/g, '')}</Text>;
            }
            return <Text key={i}>{part}</Text>;
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#020617]">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/5">
                <TouchableOpacity
                    onPress={onClose}
                    className="w-10 h-10 items-center justify-center rounded-full bg-slate-800/50"
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">AI 전략 분석 결과</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {/* Intro Card */}
                <LinearGradient
                    colors={['#1e293b', '#0f172a']}
                    className="p-6 rounded-2xl border border-blue-500/20 mb-6"
                >
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                            <FileText size={20} color="#60A5FA" />
                        </View>
                        <View>
                            <Text className="text-white font-bold text-lg">맞춤형 합격 전략</Text>
                            <Text className="text-slate-400 text-sm">Gemini Pro Analysis</Text>
                        </View>
                    </View>
                    <View className="h-[1px] bg-white/10 mb-4" />
                    {renderMarkdown(result.strategy)}
                </LinearGradient>

                {/* Action Suggestion */}
                <View className="bg-slate-900 p-5 rounded-xl border border-white/5 mb-10">
                    <Text className="text-slate-400 text-sm mb-2">💡 다음 단계 추천</Text>
                    <Text className="text-white font-medium">사업계획서 초안 작성하기 (Beta)</Text>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="px-6 pb-8 pt-4 border-t border-white/10 bg-[#020617]">
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        className="flex-1 bg-slate-800 py-4 rounded-xl items-center justify-center border border-white/10"
                        onPress={() => console.log('Share')}
                    >
                        <Share2 size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-[3] bg-blue-600 py-4 rounded-xl items-center justify-center shadow-lg shadow-blue-900/50"
                        onPress={() => {
                            if (result.initial_draft_content && onOpenDraft) {
                                onOpenDraft(result.initial_draft_content);
                            } else {
                                onClose();
                            }
                        }}
                    >
                        <Text className="text-white font-bold text-base">
                            {result.initial_draft_content ? '🚀 사업계획서 초안 열기' : '확인 완료'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};
