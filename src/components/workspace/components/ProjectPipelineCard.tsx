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
        <View className="bg-[#F8FAFC] rounded-[24px] p-6 border border-[#E2E8F0] shadow-sm active:border-[#7C3AED]/30 transition-all">
            {/* Header */}
            <View className="mb-5">
                <Text className="text-[#27272a] font-black text-[15px] mb-1.5 leading-tight">{title}</Text>
                {subtitle && (
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                        <Text className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">{subtitle}</Text>
                    </View>
                )}
            </View>

            {/* Progress */}
            <View className="mb-6">
                <View className="flex-row items-center justify-between mb-2.5">
                    <Text className="text-[#94A3B8] text-[11px] font-black uppercase tracking-widest">분석 진행률</Text>
                    <Text className="text-[#7C3AED] font-black text-xl">{progress}%</Text>
                </View>
                <View className="h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden shadow-inner">
                    <View
                        style={{ width: `${progress}%` }}
                        className="h-full bg-[#7C3AED] rounded-full shadow-sm"
                    />
                </View>
            </View>

            {/* Stages */}
            <View className="mb-6">
                <Text className="text-[#10B981] text-[10px] font-black uppercase mb-3 tracking-[2px]">현재 스테이지: {currentStage}</Text>
                <View className="flex-row gap-2">
                    {stages.map((stage, index) => (
                        <View
                            key={index}
                            className={`flex-1 h-1.5 rounded-full ${index <= stages.indexOf(currentStage)
                                    ? 'bg-[#10B981] shadow-sm shadow-emerald-500/20'
                                    : 'bg-[#E2E8F0]'
                                }`}
                        />
                    ))}
                </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
                onPress={onViewReport}
                className="bg-[#7C3AED] py-4 rounded-2xl flex-row items-center justify-center gap-2.5 shadow-xl shadow-[#7C3AED]/20 active:opacity-90 transition-all"
            >
                <Text className="text-white font-black text-xs uppercase tracking-widest">전략 분석 보고서</Text>
                <ArrowRight size={16} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
        </View>
    );
};
