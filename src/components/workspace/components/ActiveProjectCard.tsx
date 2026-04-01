import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Folder, FileText, Code } from 'lucide-react-native';

interface ActiveProjectCardProps {
    id: string;
    name: string;
    description: string;
    progress: number;
    icon: 'folder' | 'document' | 'code';
    progressColor?: string;
    onContinue: () => void;
    onViewFiles: () => void;
}

const ICON_MAP = {
    folder: Folder,
    document: FileText,
    code: Code,
};

export const ActiveProjectCard = ({
    name,
    description,
    progress,
    icon,
    progressColor = '#7C3AED',
    onContinue,
    onViewFiles,
}: ActiveProjectCardProps) => {
    const IconComponent = ICON_MAP[icon];

    return (
        <View className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] shadow-2xl shadow-black/[0.03] active:scale-[0.99] transition-all">
            <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-4 flex-1">
                    <View className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 items-center justify-center shadow-inner">
                        <IconComponent size={24} color="#7C3AED" strokeWidth={2.5} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[#27272a] font-black text-lg mb-1 leading-tight" numberOfLines={1}>{name}</Text>
                        <View className="flex-row items-center gap-1.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                            <Text className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">{description}</Text>
                        </View>
                    </View>
                </View>
                <View className="bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
                    <Text className="text-[#7C3AED] font-black text-base">{progress}%</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-8 shadow-inner">
                <View
                    style={{
                        width: `${progress}%`,
                        backgroundColor: progressColor,
                    }}
                    className="h-full rounded-full shadow-sm"
                />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-4">
                <TouchableOpacity
                    onPress={onContinue}
                    className="flex-1 bg-[#7C3AED] py-4 rounded-2xl items-center justify-center shadow-xl shadow-[#7C3AED]/20 active:opacity-90"
                >
                    <Text className="text-white font-black text-xs uppercase tracking-widest">이어서 분석하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onViewFiles}
                    className="px-6 py-4 rounded-2xl items-center justify-center bg-white border border-[#E2E8F0] shadow-sm active:bg-slate-50"
                >
                    <Text className="text-[#64748B] font-black text-xs uppercase tracking-widest">결과물</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
