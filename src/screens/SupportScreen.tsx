import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { GovernmentProgramList } from '../components/GovernmentProgramList';
import { ConnectScreen } from './ConnectScreen';
import { ConnectHomeView } from '../components/ConnectHomeView';

interface SupportScreenProps {
    subMode: 'overview' | 'support' | 'connect';
    onSubModeChange: (mode: 'overview' | 'support' | 'connect') => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({ subMode, onSubModeChange }) => {
    return (
        <View className="flex-1 bg-[#0F172A]">
            {/* 홈 (Overview) */}
            {subMode === 'overview' && (
                <ConnectHomeView
                    onNavigateToSupport={() => onSubModeChange('support')}
                    onNavigateToLounge={() => onSubModeChange('connect')}
                />
            )}

            {/* 정부사업 (Support) */}
            {subMode === 'support' && (
                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    <View className="px-6 py-6 max-w-[1400px] w-full mx-auto">
                        <View className="mb-6">
                            <Text className="text-white text-2xl font-bold mb-2">정부사업 찾기</Text>
                            <Text className="text-slate-400">내 기업에 맞는 최적의 지원사업을 검색해보세요.</Text>
                        </View>
                        <GovernmentProgramList />
                    </View>
                </ScrollView>
            )}

            {/* 라운지 (Connect/Lounge) */}
            {subMode === 'connect' && (
                <ConnectScreen />
            )}
        </View>
    );
};
