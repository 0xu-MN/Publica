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
    progressColor = '#3B82F6',
    onContinue,
    onViewFiles,
}: ActiveProjectCardProps) => {
    const IconComponent = ICON_MAP[icon];

    return (
        <View className="bg-[#0F172A]/80 rounded-2xl p-5 border border-white/5">
            <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1 flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-slate-800/50 items-center justify-center">
                        <IconComponent size={20} color="#94A3B8" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-semibold text-base mb-1">{name}</Text>
                        <Text className="text-slate-500 text-xs">{description}</Text>
                    </View>
                </View>
                <Text className="text-blue-400 font-bold text-lg ml-3">{progress}%</Text>
            </View>

            {/* Progress Bar */}
            <View className="h-2 bg-slate-800/50 rounded-full overflow-hidden mb-4">
                <View
                    style={{
                        width: `${progress}%`,
                        backgroundColor: progressColor,
                    }}
                    className="h-full rounded-full"
                />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={onContinue}
                    className="flex-1 bg-blue-600 py-3 rounded-xl items-center justify-center"
                >
                    <Text className="text-white font-semibold text-sm">이어서 작업</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onViewFiles}
                    className="px-5 py-3 rounded-xl items-center justify-center bg-slate-800/50 border border-white/10"
                >
                    <Text className="text-slate-300 font-semibold text-sm">파일 보기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
