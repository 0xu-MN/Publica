import React from 'react';
import { View, ScrollView, Text, StyleSheet, StatusBar } from 'react-native';
import { GovernmentProgramList } from '../components/GovernmentProgramList';
import { AdvancedSearchFilter } from '../components/AdvancedSearchFilter';
import { ConnectScreen } from './ConnectScreen';
import { ConnectHomeView } from '../components/ConnectHomeView';
import { Building2 } from 'lucide-react-native';

import { GovernmentDetailScreen } from './GovernmentDetailScreen';

interface SupportScreenProps {
    subMode: 'overview' | 'support' | 'connect';
    onSubModeChange: (mode: 'overview' | 'support' | 'connect') => void;
    onLoginRequired?: () => void;
    onNavigateToProfile?: (userId: string) => void;
}

export const SupportScreen: React.FC<Partial<SupportScreenProps>> = ({
    subMode: propSubMode,
    onSubModeChange: propOnSubModeChange,
    onLoginRequired,
    onNavigateToProfile
}) => {
    const [internalSubMode, setInternalSubMode] = React.useState<'overview' | 'support' | 'connect'>('overview');

    const subMode = propSubMode || internalSubMode;
    const onSubModeChange = propOnSubModeChange || setInternalSubMode;

    const [selectedProgram, setSelectedProgram] = React.useState<any | null>(null);

    // subMode 변경 시 상세 페이지 닫기
    React.useEffect(() => {
        setSelectedProgram(null);
    }, [subMode]);

    const onProgramSelect = (program: any) => {
        setSelectedProgram(program);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {/* 홈 (Overview) */}
            {subMode === 'overview' && (
                <ConnectHomeView
                    onNavigateToSupport={() => onSubModeChange('support')}
                    onNavigateToLounge={() => onSubModeChange('connect')}
                    onProgramSelect={onProgramSelect}
                />
            )}

            {/* 정부사업 (Support) */}
            {subMode === 'support' && (
                <ScrollView style={styles.flex1} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.headerTitleRow}>
                                <View style={styles.iconBox}>
                                    <Building2 size={28} color="#10B981" />
                                </View>
                                <Text style={styles.title}>정부사업 찾기</Text>
                            </View>
                            <Text style={styles.subtitle}>내 기업에 맞는 최적의 지원사업을 검색해보세요.</Text>
                        </View>

                        {/* Advanced Search Filter */}
                        <AdvancedSearchFilter />

                        <GovernmentProgramList onProgramClick={onProgramSelect} />
                    </View>
                </ScrollView>
            )}

            {/* 상세 페이지 (Detail View Overlay) */}
            {selectedProgram && (
                <View style={styles.detailOverlay}>
                    <GovernmentDetailScreen
                        program={selectedProgram}
                        onBack={() => setSelectedProgram(null)}
                    />
                </View>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FDF8F3' },
    flex1: { flex: 1 },
    content: { padding: 24, maxWidth: 1000, width: '100%', marginHorizontal: 'auto' },
    header: { marginBottom: 24, paddingTop: 16 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    iconBox: {
        width: 48, height: 48, borderRadius: 14, backgroundColor: '#ECFDF5',
        alignItems: 'center', justifyContent: 'center', marginRight: 14
    },
    title: { color: '#18181b', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: '#64748B', fontSize: 15, lineHeight: 22 },
    
    detailOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 50, backgroundColor: '#FDF8F3'
    },
});
