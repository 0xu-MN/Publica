import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatsCardProps {
    icon: LucideIcon;
    iconColor: string;
    title: string;
    value: number | string;
    subtitle?: string;
    valueColor?: string;
}

export const StatsCard = ({
    icon: Icon,
    iconColor,
    title,
    value,
    subtitle,
    valueColor = '#fff',
}: StatsCardProps) => {
    return (
        <View className="flex-1 bg-[#0F172A]/80 rounded-2xl p-4 border border-white/5">
            <View className="flex-row items-center gap-2 mb-2">
                <Icon size={16} color={iconColor} />
                <Text className="text-slate-400 text-xs font-medium">{title}</Text>
            </View>
            <Text
                className="text-2xl font-bold mb-1"
                style={{ color: valueColor }}
            >
                {value}
            </Text>
            {subtitle && (
                <Text className="text-slate-500 text-xs">{subtitle}</Text>
            )}
        </View>
    );
};
