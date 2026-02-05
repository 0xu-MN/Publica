import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Icons } from '../utils/icons';

interface InsightListItemProps {
    item: any; // NewsItem
    onPress?: () => void;
    isScrapped?: boolean;
    onBookmarkPress?: () => void;
}

export const InsightListItem: React.FC<InsightListItemProps> = ({
    item,
    onPress,
    isScrapped,
    onBookmarkPress
}) => {
    // Determine Category Logic
    const category = item.category || 'All';
    const isScience = category === 'Science';
    const categoryColor = isScience ? '#38BDF8' : '#34D399'; // Sky vs Emerald
    const categoryBg = isScience ? 'bg-sky-500/10' : 'bg-emerald-500/10';
    const categoryText = isScience ? 'text-sky-400' : 'text-emerald-400';
    const categoryLabel = isScience ? '과학' : '경제';

    return (
        <TouchableOpacity
            onPress={onPress}
            className="w-full flex-row items-center bg-slate-900/60 rounded-xl mb-3 border border-white/5 overflow-hidden hover:bg-slate-800/80 transition-all group h-[72px]"
        >
            {/* Left Decorator Bar */}
            <View className="w-1.5 h-full" style={{ backgroundColor: categoryColor }} />

            {/* Content Container */}
            <View className="flex-1 flex-row items-center px-4 justify-between">

                {/* Left: Category Label + Title */}
                <View className="flex-[0.6] flex-row items-center gap-4">
                    {/* Category Pill */}
                    <View className={`px-3 py-1.5 rounded-lg ${categoryBg} border border-white/5 justify-center items-center h-[32px] w-[60px]`}>
                        <Text className={`text-[12px] font-bold ${categoryText}`}>
                            {categoryLabel}
                        </Text>
                    </View>

                    {/* Divider */}
                    <View className="w-[1px] h-4 bg-slate-700" />

                    {/* Title */}
                    <Text className="text-white text-[15px] font-medium leading-6" numberOfLines={1}>
                        {item.title}
                    </Text>
                </View>

                {/* Right: Keywords + Actions */}
                <View className="flex-[0.4] flex-row items-center justify-end gap-6">
                    {/* Keywords (Desktop only usually, but we have space) */}
                    <View className="flex-row gap-2">
                        {item.tags?.slice(0, 3).map((tag: string, i: number) => (
                            <View key={i} className="bg-slate-800 px-3 py-1.5 rounded-full border border-white/5">
                                <Text className="text-slate-400 text-[11px]">{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Bookmark */}
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onBookmarkPress && onBookmarkPress();
                        }}
                        className="p-2 hover:bg-white/10 rounded-full"
                    >
                        <Icons.Bookmark size={18} color={isScrapped ? "#3B82F6" : "#64748B"} fill={isScrapped ? "#3B82F6" : "none"} />
                    </TouchableOpacity>
                </View>

            </View>
        </TouchableOpacity>
    );
};
