import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { GovernmentProgramList } from '../components/GovernmentProgramList';
import { ConnectScreen } from './ConnectScreen';
import { ConnectHomeView } from '../components/ConnectHomeView';
import Footer from '../components/Footer';
import { Building2 } from 'lucide-react-native';

interface SupportScreenProps {
    subMode: 'overview' | 'support' | 'connect';
    onSubModeChange: (mode: 'overview' | 'support' | 'connect') => void;
    onLoginRequired?: () => void;
    onNavigateToProfile?: (userId: string) => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({ subMode, onSubModeChange, onLoginRequired, onNavigateToProfile }) => {
    return (
        <View className="flex-1 bg-[#020617]">
            {/* 홈 (Overview) */}
            {subMode === 'overview' && (
                <ConnectHomeView
                    onNavigateToSupport={() => onSubModeChange('support')}
                    onNavigateToLounge={() => onSubModeChange('connect')}
                />
            )}

            {/* 정부사업 (Support) */}
            {subMode === 'support' && (
                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 0 }} showsVerticalScrollIndicator={false}>
                    <View className="p-6 max-w-[1400px] w-full mx-auto">
                        <View className="mb-6 pt-4">
                            <View className="flex-row items-center mb-2">
                                <Building2 size={28} color="#10B981" />
                                <Text className="text-white text-3xl font-bold ml-3">정부사업 찾기</Text>
                            </View>
                            <Text className="text-slate-400 text-base">내 기업에 맞는 최적의 지원사업을 검색해보세요.</Text>
                        </View>
                        <GovernmentProgramList />
                    </View>
                </ScrollView>
            )}

            {/* 라운지 (Connect/Lounge) */}
            {subMode === 'connect' && (
                <ConnectScreen
                    onLoginRequired={onLoginRequired}
                    onNavigateToProfile={onNavigateToProfile}
                />
            )}
        </View>
    );
};
