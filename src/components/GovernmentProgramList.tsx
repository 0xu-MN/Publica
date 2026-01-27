import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ArrowRight, Building, Calendar, CheckCircle, AlertCircle } from 'lucide-react-native';
import { fetchGovernmentPrograms } from '../services/newsService';

interface Program {
    id: string;
    title: string;
    agency: string;
    deadline?: string;
    status: string;
    d_day?: string;
    category?: string[];
    tags?: string[];
}

export const GovernmentProgramList = () => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadPrograms = async () => {
        try {
            setError(null);
            const data = await fetchGovernmentPrograms();
            setPrograms(data);
        } catch (err) {
            console.error('Failed to load programs:', err);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadPrograms();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadPrograms();
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center min-h-[400px]">
                <ActivityIndicator size="large" color="#10B981" />
                <Text className="text-slate-400 mt-4">정부지원사업을 불러오는 중...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center min-h-[400px]">
                <AlertCircle size={48} color="#EF4444" />
                <Text className="text-red-400 mt-4 mb-6 text-center px-4">{error}</Text>
                <TouchableOpacity
                    onPress={loadPrograms}
                    className="bg-blue-500 px-6 py-3 rounded-lg active:opacity-80"
                >
                    <Text className="text-white font-bold">다시 시도</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (programs.length === 0) {
        return (
            <View className="flex-1 justify-center items-center min-h-[400px]">
                <Building size={48} color="#64748B" />
                <Text className="text-slate-400 mt-4 text-center px-4">
                    현재 등록된 사업공고가 없습니다
                </Text>
                <TouchableOpacity
                    onPress={onRefresh}
                    className="mt-6 bg-slate-700 px-4 py-2 rounded-lg active:opacity-80"
                >
                    <Text className="text-slate-300">새로고침</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="gap-4">
            {programs.map((program) => (
                <TouchableOpacity
                    key={program.id}
                    className="bg-[#1E293B] p-5 rounded-2xl border border-white/5 active:bg-slate-800"
                >
                    <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-row items-center gap-2">
                            <View className="bg-slate-800 px-2.5 py-1 rounded-lg border border-white/5">
                                <Text className="text-slate-400 text-[11px] font-bold">{program.agency}</Text>
                            </View>
                            {program.status === '마감임박' && program.d_day && (
                                <View className="bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                                    <Text className="text-red-400 text-[10px] font-bold">{program.d_day}</Text>
                                </View>
                            )}
                        </View>
                        <ArrowRight size={16} color="#64748B" />
                    </View>

                    <Text className="text-white text-lg font-bold mb-2 leading-7">{program.title}</Text>

                    <View className="flex-row items-center gap-4 mb-4">
                        {program.deadline && (
                            <View className="flex-row items-center">
                                <Calendar size={14} color="#94A3B8" />
                                <Text className="text-slate-400 text-xs ml-1.5">~ {program.deadline}</Text>
                            </View>
                        )}
                        <View className="flex-row items-center">
                            <CheckCircle
                                size={14}
                                color={program.status === '마감임박' ? '#F87171' : '#4ADE80'}
                            />
                            <Text
                                className={`text-xs ml- 1.5 font-bold ${program.status === '마감임박' ? 'text-red-400' : 'text-green-400'
                                    }`}
                            >
                                {program.status}
                            </Text>
                        </View>
                    </View>

                    {program.tags && program.tags.length > 0 && (
                        <View className="flex-row gap-2 flex-wrap">
                            {program.tags.slice(0, 3).map((tag, i) => (
                                <View key={i} className="bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                    <Text className="text-blue-300 text-[10px] font-medium">#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>
            ))}

            <TouchableOpacity
                onPress={onRefresh}
                className="bg-slate-800/50 p-4 rounded-xl border border-white/5 items-center justify-center mt-2 active:opacity-80"
            >
                {refreshing ? (
                    <ActivityIndicator size="small" color="#64748B" />
                ) : (
                    <Text className="text-slate-400 font-bold">새로고침</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};
