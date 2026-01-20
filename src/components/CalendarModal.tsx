import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, ChevronLeft, ChevronRight, Plus, Clock, CheckSquare } from 'lucide-react-native';

interface CalendarModalProps {
    visible: boolean;
    onClose: () => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const EVENTS = [
    { id: 1, date: 19, title: '정부지원사업 서류 마감 (D-2)', time: '오전 10:00', done: false },
    { id: 2, date: 19, title: '네이처 논문 리뷰 작성', time: '오후 2:00', done: false },
    { id: 3, date: 19, title: '개발팀 주간 회의', time: '오후 4:00', done: true },
    { id: 4, date: 21, title: '예비창업패키지 멘토링', time: '오전 11:00', done: false },
    { id: 5, date: 23, title: 'AI 컨퍼런스 참석', time: '종일', done: false },
];

export const CalendarModal = ({ visible, onClose }: CalendarModalProps) => {
    const [selectedDate, setSelectedDate] = useState(19);
    const currentMonth = '2026년 1월';

    // Generate calendar grid
    const getDaysInMonth = () => {
        const days = [];
        const firstDay = 3; // January 1, 2026 is Wednesday

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Days in month
        for (let i = 1; i <= 31; i++) {
            days.push(i);
        }

        return days;
    };

    const todaysEvents = EVENTS.filter(e => e.date === selectedDate);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/60 justify-center items-center p-6">
                <View className="w-full max-w-4xl h-[600px] bg-[#0F172A] rounded-3xl border border-white/10 overflow-hidden">

                    {/* Header */}
                    <View className="px-6 py-4 bg-[#1E293B] border-b border-white/5 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4">
                            <Clock size={20} color="#F59E0B" />
                            <Text className="text-white font-bold text-xl">일정 관리</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                            <X size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 flex-row">
                        {/* Calendar Section */}
                        <View className="flex-1 p-6 border-r border-white/5">
                            {/* Month Navigation */}
                            <View className="flex-row items-center justify-between mb-6">
                                <TouchableOpacity className="p-2 hover:bg-white/5 rounded-lg">
                                    <ChevronLeft size={20} color="#94A3B8" />
                                </TouchableOpacity>
                                <Text className="text-white font-bold text-lg">{currentMonth}</Text>
                                <TouchableOpacity className="p-2 hover:bg-white/5 rounded-lg">
                                    <ChevronRight size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            {/* Day Headers */}
                            <View className="flex-row mb-2">
                                {DAYS.map((day, i) => (
                                    <View key={i} className="flex-1 items-center">
                                        <Text className={`text-xs font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-500'}`}>
                                            {day}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Calendar Grid */}
                            <View className="gap-1">
                                {Array.from({ length: Math.ceil(getDaysInMonth().length / 7) }).map((_, rowIndex) => (
                                    <View key={rowIndex} className="flex-row gap-1">
                                        {getDaysInMonth().slice(rowIndex * 7, (rowIndex + 1) * 7).map((day, colIndex) => {
                                            const hasEvents = day && EVENTS.some(e => e.date === day);
                                            const isSelected = day === selectedDate;
                                            const isToday = day === 19;

                                            return (
                                                <TouchableOpacity
                                                    key={colIndex}
                                                    className={`flex-1 aspect-square items-center justify-center rounded-lg ${!day ? '' :
                                                            isSelected ? 'bg-blue-600' :
                                                                isToday ? 'bg-blue-500/20 border border-blue-500/30' :
                                                                    'hover:bg-white/5'
                                                        }`}
                                                    onPress={() => day && setSelectedDate(day)}
                                                    disabled={!day}
                                                >
                                                    {day && (
                                                        <>
                                                            <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                                {day}
                                                            </Text>
                                                            {hasEvents && !isSelected && (
                                                                <View className="w-1 h-1 bg-blue-500 rounded-full mt-1" />
                                                            )}
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Events Section */}
                        <View className="w-80 p-6 bg-[#050B14]">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-white font-bold text-lg">
                                    {selectedDate}일 일정
                                </Text>
                                <TouchableOpacity className="bg-blue-600 p-2 rounded-lg">
                                    <Plus size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                                {todaysEvents.length > 0 ? (
                                    <View className="gap-3">
                                        {todaysEvents.map((event) => (
                                            <View key={event.id} className="bg-[#1E293B] p-4 rounded-xl border border-white/5">
                                                <View className="flex-row items-start gap-3">
                                                    <TouchableOpacity className={`w-5 h-5 rounded border-2 mt-0.5 ${event.done ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                                                        {event.done && <CheckSquare size={12} color="#fff" />}
                                                    </TouchableOpacity>
                                                    <View className="flex-1">
                                                        <Text className={`text-sm font-semibold mb-1 ${event.done ? 'text-slate-500 line-through' : 'text-white'}`}>
                                                            {event.title}
                                                        </Text>
                                                        <Text className="text-slate-500 text-xs">{event.time}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View className="items-center justify-center h-full">
                                        <Text className="text-slate-500 text-sm">일정이 없습니다</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
