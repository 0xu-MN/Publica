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
    iconColor = '#7C3AED',
    title,
    value,
    subtitle,
    valueColor = '#27272a',
}: StatsCardProps) => {
    return (
        <View className="flex-1 bg-white rounded-[28px] p-6 border border-[#E2E8F0] shadow-sm shadow-black/[0.02] active:scale-[0.98] transition-transform">
            <View className="flex-row items-center gap-3 mb-4">
                <View className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 items-center justify-center">
                    <Icon size={16} color={iconColor} strokeWidth={2.5} />
                </View>
                <Text className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest leading-none">{title}</Text>
            </View>
            <View>
                <Text
                    className="text-3xl font-black mb-1.5 tracking-tighter"
                    style={{ color: valueColor }}
                >
                    {value}
                </Text>
                {subtitle && (
                    <Text className="text-[#64748B] text-[11px] font-bold leading-tight">{subtitle}</Text>
                )}
            </View>
        </View>
    );
};
