import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, Plus } from 'lucide-react-native';

interface ScheduleItem {
    id: string;
    text: string;
    checked: boolean;
    dueDate?: string;
}

interface TodayScheduleWidgetProps {
    items: ScheduleItem[];
    onToggleItem: (id: string) => void;
    onAddItem: () => void;
}

export const TodayScheduleWidget = ({ items, onToggleItem, onAddItem }: TodayScheduleWidgetProps) => {
    return (
        <View className="bg-[#0F172A]/80 rounded-2xl p-8 border border-white/5 min-h-[280px]">
            {/* Prominent Date Display */}
            <View className="mb-6 border-b border-white/10 pb-4">
                <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">TODAY</Text>
                <Text className="text-white text-3xl font-black">
                    {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                </Text>
            </View>

            {/* Header / List Title */}
            <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-2">
                    <Clock size={18} color="#F59E0B" />
                    <Text className="text-slate-200 font-bold text-base">오늘의 일정</Text>
                </View>
                <TouchableOpacity
                    onPress={onAddItem}
                    className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Schedule Items */}
            <View className="gap-5">
                {items.length === 0 ? (
                    <Text className="text-slate-500 text-sm text-center py-4">
                        일정이 없습니다
                    </Text>
                ) : (
                    items.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => onToggleItem(item.id)}
                            className="flex-row items-center gap-4 py-1"
                        >
                            <View
                                className={`w-5 h-5 rounded border-2 items-center justify-center ${item.checked
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-slate-600'
                                    }`}
                            >
                                {item.checked && <Text className="text-white text-xs">✓</Text>}
                            </View>
                            <View className="flex-1">
                                <Text
                                    className={`text-sm ${item.checked
                                        ? 'text-slate-500 line-through'
                                        : 'text-white'
                                        }`}
                                >
                                    {item.text}
                                </Text>
                                {item.dueDate && !item.checked && (
                                    <Text className="text-red-400 text-xs mt-0.5">{item.dueDate}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </View>
    );
};
