import React from 'react';
import { View, Text } from 'react-native';
import { Folder, Handshake } from 'lucide-react-native';

export const FilesView = () => (
    <View className="flex-1 bg-[#050B14] items-center justify-center">
        <View className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 items-center">
            <View className="w-16 h-16 bg-blue-500/10 rounded-2xl items-center justify-center mb-4">
                <Folder size={32} color="#3B82F6" />
            </View>
            <Text className="text-white text-xl font-bold mb-2">파일 관리자</Text>
            <Text className="text-slate-400 text-center max-w-[300px]">
                모든 프로젝트 파일과 참고 문헌을 이곳에서 통합 관리하세요.
                {"\n"}
                (준비 중인 기능입니다)
            </Text>
        </View>
    </View>
);

export const SupportView = () => (
    <View className="flex-1 bg-[#050B14] items-center justify-center">
        <View className="bg-[#0F172A] p-8 rounded-3xl border border-white/5 items-center">
            <View className="w-16 h-16 bg-emerald-500/10 rounded-2xl items-center justify-center mb-4">
                <Handshake size={32} color="#10B981" />
            </View>
            <Text className="text-white text-xl font-bold mb-2">커리어 & 서포트</Text>
            <Text className="text-slate-400 text-center max-w-[300px]">
                연구원님의 전문성을 분석하여 최적의 채용 공고와 지원 사업을 매칭해드립니다.
                {"\n"}
                (준비 중인 기능입니다)
            </Text>
        </View>
    </View>
);
