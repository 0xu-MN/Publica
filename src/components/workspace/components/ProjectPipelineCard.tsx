import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

interface ProjectPipelineCardProps {
    title: string;
    subtitle?: string;
    progress: number;
    currentStage: string;
    stages: string[];
    onViewReport: () => void;
}

export const ProjectPipelineCard = ({
    title,
    subtitle,
    progress,
    currentStage,
    stages,
    onViewReport
}: ProjectPipelineCardProps) => {
    return (
        <View className="bg-[#0F172A]/80 rounded-2xl p-5 border border-white/5">
            {/* Header */}
            <View className="mb-4">
                <Text className="text-white font-bold text-base mb-1">{title}</Text>
                {subtitle && <Text className="text-slate-500 text-xs">{subtitle}</Text>}
            </View>

            {/* Progress */}
            <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-slate-400 text-xs">진행률</Text>
                    <Text className="text-blue-400 font-bold text-lg">{progress}%</Text>
                </View>
                <View className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                    <View
                        style={{ width: `${progress}%` }}
                        className="h-full bg-blue-500 rounded-full"
                    />
                </View>
            </View>

            {/* Stages */}
            <View className="mb-4">
                <Text className="text-green-400 text-xs font-semibold mb-2">현재 {currentStage}</Text>
                <View className="flex-row gap-1">
                    {stages.map((stage, index) => (
                        <View
                            key={index}
                            className={`flex-1 h-1 rounded-full ${index <= stages.indexOf(currentStage)
                                    ? 'bg-green-400'
                                    : 'bg-slate-700'
                                }`}
                        />
                    ))}
                </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
                onPress={onViewReport}
                className="bg-blue-600 py-3 rounded-xl flex-row items-center justify-center gap-2"
            >
                <Text className="text-white font-semibold text-sm">전략보고서 보기</Text>
                <ArrowRight size={16} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};
