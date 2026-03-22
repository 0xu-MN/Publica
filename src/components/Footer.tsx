import React from 'react';
import { View, Text, TouchableOpacity, Linking, Modal, ScrollView, StyleSheet } from 'react-native';
import { Icons } from '../utils/icons';
import { X } from 'lucide-react-native';

const PRIVACY_POLICY = `
[개인정보 처리방침]
1. 수집 항목: 이메일, 이름, 프로필 사진
2. 수집 목적: 회원 식별 및 서비스 제공
3. 보유 기간: 회원 탈퇴 시 즉시 파기
4. 담당자: 홍수민 (contact@publica.ai)
`;

const TERMS_OF_SERVICE = `
[서비스 이용약관]
1. 목적: Publica AI 서비스 이용 규정 안내
2. 회원 가입: 소셜 계정 연동을 통한 가입
3. 서비스 책임: AI 생성 결과의 최종 판단은 사용자에게 있음
4. 시행일: 2026년 3월 18일
`;

const OPERATING_POLICY = `
[운영정책]
1. 계정 관리: 1인 1계정 원칙
2. 금지 행위: 불법 데이터 생성 및 시스템 남용 금지
3. 제재 조치: 정책 위반 시 서비스 이용 제한 가능
`;

const Footer = () => {
    const [legalType, setLegalType] = React.useState<'privacy' | 'terms' | 'policy' | null>(null);

    const getLegalTitle = () => {
        if (legalType === 'privacy') return '개인정보 처리방침';
        if (legalType === 'terms') return '이용약관';
        if (legalType === 'policy') return '운영정책';
        return '';
    };

    const getLegalContent = () => {
        if (legalType === 'privacy') return PRIVACY_POLICY;
        if (legalType === 'terms') return TERMS_OF_SERVICE;
        if (legalType === 'policy') return OPERATING_POLICY;
        return '';
    };

    return (
        <View className="border-t border-white/10 mt-12 bg-[#050B14]">
            <View className="max-w-[1400px] w-full mx-auto px-6 py-12">
                <View className="flex-row flex-wrap justify-between gap-8">
                    {/* Left: Brand & Business Info */}
                    <View className="gap-4">
                        <View>
                            <Text className="text-white font-bold text-xl mb-1">Publica</Text>
                            <Text className="text-slate-500 text-sm">Empowering Researchers & Founders</Text>
                        </View>

                        <View className="gap-1">
                            <Text className="text-slate-600 text-xs">상호명: HALOFORGE 헤일로포지 | 대표자: 홍수민</Text>
                            <Text className="text-slate-600 text-xs">사업자등록번호: 846-04-03662 | 통신판매업신고: 2026-서울강남-00000</Text>
                            <Text className="text-slate-600 text-xs">주소: 경기도 안산시 단원구 고잔로 57-11</Text>
                            <Text className="text-slate-600 text-xs">문의: contact@publica.ai | s</Text>
                        </View>

                        <Text className="text-slate-700 text-[10px] mt-2">
                            Copyright © 2026 Publica Inc. All rights reserved.
                        </Text>
                    </View>

                    {/* Right: SNS & Links */}
                    <View className="gap-6">
                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity className="bg-slate-800/50 p-3 rounded-full hover:bg-slate-700 transition-all border border-white/5">
                                <Icons.Youtube size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-slate-800/50 p-3 rounded-full hover:bg-slate-700 transition-all border border-white/5">
                                <Icons.Twitter size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-slate-800/50 p-3 rounded-full hover:bg-slate-700 transition-all border border-white/5">
                                <Icons.Instagram size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-slate-800/50 p-3 rounded-full hover:bg-slate-700 transition-all border border-white/5">
                                <Icons.Send size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-6">
                            <TouchableOpacity onPress={() => setLegalType('terms')}><Text className="text-slate-500 text-xs hover:text-slate-300">이용약관</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setLegalType('privacy')}><Text className="text-slate-500 text-xs hover:text-slate-300">개인정보처리방침</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setLegalType('policy')}><Text className="text-slate-500 text-xs hover:text-slate-300">운영정책</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Legal Modal (Footer Only) */}
            <Modal
                visible={legalType !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setLegalType(null)}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{getLegalTitle()}</Text>
                            <TouchableOpacity onPress={() => setLegalType(null)}>
                                <X size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.modalText}>{getLegalContent()}</Text>
                        </ScrollView>
                        <TouchableOpacity 
                            style={styles.modalFooter} 
                            onPress={() => setLegalType(null)}
                        >
                            <Text style={styles.modalFooterText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 550,
        maxHeight: '75%',
        backgroundColor: '#0F172A',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    modalTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
    },
    modalContent: {
        padding: 24,
    },
    modalText: {
        color: '#CBD5E1',
        fontSize: 14,
        lineHeight: 22,
        whiteSpace: 'pre-wrap',
    } as any,
    modalFooter: {
        padding: 16,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    modalFooterText: {
        color: '#818CF8',
        fontWeight: '700',
        fontSize: 14,
    }
});

export default Footer;
