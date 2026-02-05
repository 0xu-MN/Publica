import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';

interface AIBriefingCardProps {
    message: string;
    onDismiss?: () => void;
}

export const AIBriefingCard = ({ message, onDismiss }: AIBriefingCardProps) => {
    return (
        <View className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center">
                <Zap size={20} color="#60A5FA" fill="#60A5FA" />
            </View>
            <Text className="flex-1 text-white text-sm font-medium leading-5">
                {message}
            </Text>
            {onDismiss && (
                <TouchableOpacity
                    onPress={onDismiss}
                    className="w-6 h-6 items-center justify-center"
                >
                    <Text className="text-slate-400 text-lg">×</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
