import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowRight, Building, Calendar, CheckCircle } from 'lucide-react-native';

const MOCK_PROGRAMS = [
    {
        id: '1',
        title: '2026년도 AI 바우처 지원사업 수요기업 모집',
        department: '과학기술정보통신부',
        deadline: '2026.02.28',
        status: '접수중',
        tags: ['AI 도입', '최대 3억', '바우처']
    },
    {
        id: '2',
        title: '청년창업사관학교 16기 입교생 모집',
        department: '중소벤처기업진흥공단',
        deadline: '2026.02.05',
        status: '마감임박',
        tags: ['창업가', '최대 1억', '교육/멘토링']
    },
    {
        id: '3',
        title: '데이터바우처 지원사업 상반기 공고',
        department: '한국데이터산업진흥원',
        deadline: '2026.03.15',
        status: '예정',
        tags: ['데이터 구매', '가공', '최대 4500만']
    },
    {
        id: '4',
        title: '글로벌 강소기업 1000+ 프로젝트',
        department: '중소벤처기업부',
        deadline: '2026.02.20',
        status: '접수중',
        tags: ['수출', '마케팅', 'R&D']
    },
    {
        id: '5',
        title: '소상공인 스마트상점 기술보급사업',
        department: '소상공인시장진흥공단',
        deadline: '2026.04.01',
        status: '예정',
        tags: ['키오스크', '서빙로봇', '최대 1500만']
    }
];

export const GovernmentProgramList = () => {
    return (
        <View className="gap-4">
            {MOCK_PROGRAMS.map((program) => (
                <TouchableOpacity
                    key={program.id}
                    className="bg-[#1E293B] p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all active:bg-slate-800"
                >
                    <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-row items-center gap-2">
                            <View className="bg-slate-800 px-2.5 py-1 rounded-lg border border-white/5">
                                <Text className="text-slate-400 text-[11px] font-bold">{program.department}</Text>
                            </View>
                            {program.status === '마감임박' && (
                                <View className="bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                                    <Text className="text-red-400 text-[10px] font-bold">D-3</Text>
                                </View>
                            )}
                        </View>
                        <ArrowRight size={16} color="#64748B" />
                    </View>

                    <Text className="text-white text-lg font-bold mb-2 leading-7">{program.title}</Text>

                    <View className="flex-row items-center gap-4 mb-4">
                        <View className="flex-row items-center">
                            <Calendar size={14} color="#94A3B8" />
                            <Text className="text-slate-400 text-xs ml-1.5">~ {program.deadline}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <CheckCircle size={14} color={program.status === '마감임박' ? '#F87171' : '#4ADE80'} />
                            <Text className={`text-xs ml-1.5 font-bold ${program.status === '마감임박' ? 'text-red-400' : 'text-green-400'}`}>
                                {program.status}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row gap-2">
                        {program.tags.map((tag, i) => (
                            <View key={i} className="bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                <Text className="text-blue-300 text-[10px] font-medium">#{tag}</Text>
                            </View>
                        ))}
                    </View>
                </TouchableOpacity>
            ))}

            <TouchableOpacity className="bg-slate-800/50 p-4 rounded-xl border border-white/5 items-center justify-center mt-2 group">
                <Text className="text-slate-400 font-bold group-hover:text-white transition-colors">더 많은 사업 보기</Text>
            </TouchableOpacity>
        </View>
    );
};
