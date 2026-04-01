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
        <View className="bg-white rounded-[40px] p-8 border border-[#E2E8F0] min-h-[320px] shadow-2xl shadow-black/[0.03]">
            {/* Prominent Date Display */}
            <View className="mb-8 items-center flex-row justify-between">
                <View>
                    <Text className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest mb-1">Schedule</Text>
                    <Text className="text-[#27272a] text-2xl font-black tracking-tighter">
                        {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={onAddItem}
                    className="w-12 h-12 bg-[#7C3AED] rounded-2xl items-center justify-center shadow-xl shadow-[#7C3AED]/20 active:scale-95"
                >
                    <Plus size={24} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
            </View>

            {/* List Heading */}
            <View className="flex-row items-center gap-2 mb-6">
                <View className="w-1.5 h-6 rounded-full bg-[#7C3AED]" />
                <Text className="text-[#27272a] font-black text-sm uppercase tracking-widest">To-do list</Text>
            </View>

            {/* Schedule Items */}
            <View className="gap-6">
                {items.length === 0 ? (
                    <View className="items-center justify-center py-10 bg-[#F8FAFC]/50 rounded-[32px] border border-dashed border-[#E2E8F0]">
                        <Clock size={24} color="#CBD5E1" strokeWidth={1.5} className="mb-2" />
                        <Text className="text-[#94A3B8] text-xs font-bold text-center">
                            오늘 예정된 일정이 없습니다
                        </Text>
                    </View>
                ) : (
                    items.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => onToggleItem(item.id)}
                            className="flex-row items-center gap-4 active:opacity-70"
                        >
                            <View
                                className={`w-6 h-6 rounded-lg border-2 items-center justify-center ${item.checked
                                    ? 'bg-[#7C3AED] border-[#7C3AED]'
                                    : 'bg-white border-[#E2E8F0]'
                                    } shadow-sm`}
                            >
                                {item.checked && (
                                    <View className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 -mt-0.5" />
                                )}
                            </View>
                            <View className="flex-1">
                                <Text
                                    className={`text-sm font-bold ${item.checked
                                        ? 'text-[#CBD5E1] line-through'
                                        : 'text-[#27272a]'
                                        }`}
                                >
                                    {item.text}
                                </Text>
                                {item.dueDate && !item.checked && (
                                    <View className="flex-row items-center gap-1.5 mt-1">
                                        <View className="w-1 h-1 rounded-full bg-red-500" />
                                        <Text className="text-red-500 text-[10px] font-black uppercase tracking-tighter">{item.dueDate}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </View>
    );
};
