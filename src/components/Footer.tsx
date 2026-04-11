import React from 'react';
import { View, Text, TouchableOpacity, Linking, Modal, ScrollView, StyleSheet, Image } from 'react-native';
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
        <View className="w-full bg-[#FDF8F3] dark:bg-[#0F172A] border-t border-slate-100 dark:border-white/[0.03] py-20 px-6 items-center">
            <View className="max-w-[1400px] w-full flex-col md:flex-row justify-between items-start gap-8">
                <View className="flex-1">
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                        <Image
                            source={require('../../assets/p_logo_test_6.png')}
                            style={{ height: 40, width: 140 }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text className="text-slate-600 dark:text-slate-400 text-[15px] leading-[26px] max-w-[480px] mb-8 font-semibold tracking-tight">
                        기업을 위한 가장 완벽한 정부지원사업 맞춤형 솔루션.{'\n'}수많은 기업의 성공을 이끈 AI 자동화 기술을 먼저 경험하세요.
                    </Text>

                    <View className="gap-2 opacity-60">
                        <Text className="text-slate-500 dark:text-slate-500 text-[11px] font-bold">상호명: (주)헤일로포지 | 대표자: 홍수민</Text>
                        <Text className="text-slate-500 dark:text-slate-500 text-[11px] font-medium">사업자등록번호: 846-04-03662 | 통신판매업신고: 2026-서울강남-00000</Text>
                        <Text className="text-slate-500 dark:text-slate-500 text-[11px] font-medium">주소: 경기도 안산시 단원구 고잔로 57-11, 510</Text>
                        <Text className="text-slate-500 dark:text-slate-500 text-[11px] font-medium">TEL. 031-501-4523 | Email: publica@publica.ai.kr</Text>
                    </View>
                </View>

                <View className="flex-row gap-16 md:gap-32">
                    <View>
                        <Text className="text-[#27272a] dark:text-slate-300 font-black text-xs uppercase tracking-widest mb-6">법적 안내</Text>
                        <View className="gap-5">
                            <TouchableOpacity onPress={() => setLegalType('terms')}><Text className="text-slate-600 dark:text-slate-400 text-[13px] font-bold hover:text-[#7C3AED]">이용약관</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setLegalType('privacy')}><Text className="text-slate-600 dark:text-slate-400 text-[13px] font-bold hover:text-[#7C3AED]">개인정보처리방침</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setLegalType('policy')}><Text className="text-slate-600 dark:text-slate-400 text-[13px] font-bold hover:text-[#7C3AED]">운영정책</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            <View className="w-full max-w-[1400px] mt-10 pt-6 border-t border-slate-200 dark:border-white/5 flex-row justify-between items-center">
                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-medium">
                    © {new Date().getFullYear()} Publica Inc. All rights reserved.
                </Text>
                <View className="flex-row items-center gap-6">
                    <TouchableOpacity><Icons.Youtube size={16} color="#94A3B8" /></TouchableOpacity>
                    <TouchableOpacity><Icons.Instagram size={16} color="#94A3B8" /></TouchableOpacity>
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
