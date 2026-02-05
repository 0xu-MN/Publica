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
        <View className="bg-[#0F172A]/80 rounded-2xl p-5 border border-white/5">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                    <Clock size={18} color="#F59E0B" />
                    <Text className="text-white font-bold text-base">오늘의 일정</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <Text className="text-slate-500 text-xs">
                        {new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </Text>
                    <TouchableOpacity
                        onPress={onAddItem}
                        className="w-8 h-8 bg-blue-600 rounded-lg items-center justify-center"
                    >
                        <Plus size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Schedule Items */}
            <View className="gap-3">
                {items.length === 0 ? (
                    <Text className="text-slate-500 text-sm text-center py-4">
                        일정이 없습니다
                    </Text>
                ) : (
                    items.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => onToggleItem(item.id)}
                            className="flex-row items-center gap-3"
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
