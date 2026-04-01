import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';

interface AIBriefingCardProps {
    message: string;
    onDismiss?: () => void;
}

export const AIBriefingCard = ({ message, onDismiss }: AIBriefingCardProps) => {
    return (
        <View className="bg-[#7C3AED]/5 border border-[#7C3AED]/10 rounded-[24px] p-6 flex-row items-center gap-4 shadow-sm shadow-[#7C3AED]/5">
            <View className="w-12 h-12 rounded-2xl bg-[#7C3AED] items-center justify-center shadow-lg shadow-[#7C3AED]/20">
                <Zap size={24} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <View className="flex-1">
                <Text className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest mb-1">AI Briefing</Text>
                <Text className="text-[#27272a] text-[13px] font-bold leading-relaxed">
                    {message}
                </Text>
            </View>
            {onDismiss && (
                <TouchableOpacity
                    onPress={onDismiss}
                    className="w-8 h-8 items-center justify-center rounded-full bg-white/50 border border-[#E2E8F0] active:scale-90"
                >
                    <Text className="text-[#94A3B8] text-lg font-light">×</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
