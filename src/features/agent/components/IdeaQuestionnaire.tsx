import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Animated, KeyboardAvoidingView, Platform,
    Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface BusinessIdeaData {
    description: string;
    teamComposition: string;
    currentStage: string;
    targetMarket: string;
    differentiator: string;
}

interface Props {
    visible: boolean;
    grantTitle: string;
    onComplete: (data: BusinessIdeaData) => void;
    onSkip: () => void;
    onClose: () => void;
    // 프로필에서 가져온 기본값 — 있으면 자동 채움
    profileDefaults?: Partial<BusinessIdeaData>;
}

const QUESTIONS = [
    {
        key: 'description' as const,
        icon: '💡',
        title: '사업 아이디어',
        subtitle: '이 공고에 어떤 아이디어로 지원하시나요?',
        placeholder: '예: AI 기반 정부 문서 자동화 SaaS 플랫폼으로, 중소기업의 지원사업 신청을 자동화합니다.',
        multiline: true,
    },
    {
        key: 'teamComposition' as const,
        icon: '👥',
        title: '팀 구성',
        subtitle: '현재 팀 구성원과 역할을 알려주세요.',
        placeholder: '예: 대표(기획) 1명, 풀스택 개발자 2명, 디자이너 1명',
        multiline: false,
    },
    {
        key: 'currentStage' as const,
        icon: '📊',
        title: '사업 진행 단계',
        subtitle: '현재 어느 단계에 계신가요?',
        placeholder: '',
        multiline: false,
        isChoice: true,
        choices: [
            { label: '아이디어 단계', value: '아이디어 단계', icon: '🌱' },
            { label: '프로토타입 개발 중', value: '프로토타입 개발 중', icon: '🔧' },
            { label: '프로토타입 완성', value: '프로토타입 완성', icon: '✅' },
            { label: 'MVP 출시', value: 'MVP 출시', icon: '🚀' },
            { label: '매출 발생', value: '매출 발생', icon: '💰' },
            { label: '미정 / 잘 모르겠음', value: '미정', icon: '❓' },
        ],
    },
    {
        key: 'targetMarket' as const,
        icon: '🎯',
        title: '타겟 시장',
        subtitle: '주요 고객과 시장을 설명해주세요.',
        placeholder: '예: 국내 중소기업 및 스타트업 대상 B2B SaaS (시장 규모 약 5,000억원)',
        multiline: false,
    },
    {
        key: 'differentiator' as const,
        icon: '⚡',
        title: '핵심 차별점',
        subtitle: '기존 경쟁 서비스 대비 차별점은 무엇인가요?',
        placeholder: '예: 공공데이터에 특화된 자체 AI 모델 보유, 정부 서류 양식을 자동으로 채워주는 유일한 서비스',
        multiline: true,
    },
];

export const IdeaQuestionnaire: React.FC<Props> = ({
    visible,
    grantTitle,
    onComplete,
    onSkip,
    onClose,
    profileDefaults,
}) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<BusinessIdeaData>({
        description: profileDefaults?.description || '',
        teamComposition: profileDefaults?.teamComposition || '',
        currentStage: profileDefaults?.currentStage || '',
        targetMarket: profileDefaults?.targetMarket || '',
        differentiator: profileDefaults?.differentiator || '',
    });

    // 프로필 기본값이 바뀌면 answers 갱신
    React.useEffect(() => {
        if (profileDefaults && visible) {
            setAnswers({
                description: profileDefaults.description || '',
                teamComposition: profileDefaults.teamComposition || '',
                currentStage: profileDefaults.currentStage || '',
                targetMarket: profileDefaults.targetMarket || '',
                differentiator: profileDefaults.differentiator || '',
            });
        }
    }, [profileDefaults, visible]);

    // 모든 핵심 필드가 프로필에서 채워진 경우 → 질문 없이 바로 완료
    const allPrefilled = !!(
        profileDefaults?.description &&
        profileDefaults?.targetMarket &&
        profileDefaults?.differentiator
    );

    if (!visible) return null;

    // 프로필로 이미 채워진 경우 → 간단한 확인 화면으로 대체
    if (allPrefilled) {
        return (
            <View style={styles.overlay}>
                <View style={[styles.modal, { paddingVertical: 32 }]}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>✅ 프로필 정보 확인</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={{ color: '#94A3B8', fontSize: 18 }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ color: '#64748B', fontSize: 13, marginHorizontal: 20, marginBottom: 16, lineHeight: 20 }}>
                        등록된 AI 프로필 정보로 자동 완성됩니다.{'\n'}수정이 필요하면 직접 편집하세요.
                    </Text>
                    {/* 프리뷰 */}
                    {[
                        { label: '아이디어', value: profileDefaults.description },
                        { label: '타겟 시장', value: profileDefaults.targetMarket },
                        { label: '차별점', value: profileDefaults.differentiator },
                        profileDefaults.teamComposition ? { label: '팀 구성', value: profileDefaults.teamComposition } : null,
                    ].filter(Boolean).map((item: any, idx) => (
                        <View key={idx} style={{ marginHorizontal: 20, marginBottom: 10, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ color: '#7C3AED', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>{item.label}</Text>
                            <Text style={{ color: '#334155', fontSize: 13 }} numberOfLines={2}>{item.value}</Text>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 16 }}>
                        <TouchableOpacity
                            style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
                            onPress={() => { setStep(0); /* 수동 입력 모드 진입 */ }}
                        >
                            <Text style={{ color: '#475569', fontWeight: '700' }}>직접 입력</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ flex: 2, backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
                            onPress={() => {
                                onComplete(answers);
                                setStep(0);
                            }}
                        >
                            <Text style={{ color: '#FFF', fontWeight: '800' }}>이대로 시작하기 →</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    const currentQ = QUESTIONS[step];
    const isLast = step === QUESTIONS.length - 1;
    const isFirst = step === 0;
    const progress = ((step + 1) / QUESTIONS.length) * 100;

    const canProceed = answers[currentQ.key].trim().length > 0;

    const handleSkipQuestion = () => {
        setAnswers(a => ({ ...a, [currentQ.key]: '미정' }));
        if (isLast) {
            onComplete({ ...answers, [currentQ.key]: '미정' });
            setStep(0);
            setAnswers({ description: '', teamComposition: '', currentStage: '', targetMarket: '', differentiator: '' });
        } else {
            setStep(s => s + 1);
        }
    };

    const handleNext = () => {
        if (isLast) {
            onComplete(answers);
            setStep(0);
            setAnswers({ description: '', teamComposition: '', currentStage: '', targetMarket: '', differentiator: '' });
        } else {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        if (!isFirst) setStep(s => s - 1);
    };

    return (
        <View style={styles.overlay}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
            >
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>📋 사업 아이디어 수집</Text>
                            <Text style={styles.grantName} numberOfLines={1}>{grantTitle}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={{ color: '#94A3B8', fontSize: 18 }}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.stepIndicator}>
                        Step {step + 1} / {QUESTIONS.length}
                    </Text>

                    {/* Question Content */}
                    <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                        <Text style={styles.questionIcon}>{currentQ.icon}</Text>
                        <Text style={styles.questionTitle}>{currentQ.title}</Text>
                        <Text style={styles.questionSubtitle}>{currentQ.subtitle}</Text>

                        {currentQ.isChoice ? (
                            <View style={styles.choicesContainer}>
                                {currentQ.choices?.map((choice) => (
                                    <TouchableOpacity
                                        key={choice.value}
                                        style={[
                                            styles.choiceButton,
                                            answers[currentQ.key] === choice.value && styles.choiceButtonActive,
                                        ]}
                                        onPress={() => setAnswers(a => ({ ...a, [currentQ.key]: choice.value }))}
                                    >
                                        <Text style={styles.choiceIcon}>{choice.icon}</Text>
                                        <Text style={[
                                            styles.choiceLabel,
                                            answers[currentQ.key] === choice.value && styles.choiceLabelActive,
                                        ]}>
                                            {choice.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <TextInput
                                style={[
                                    styles.input,
                                    currentQ.multiline && styles.inputMultiline,
                                ]}
                                value={answers[currentQ.key]}
                                onChangeText={(text) => setAnswers(a => ({ ...a, [currentQ.key]: text }))}
                                placeholder={currentQ.placeholder}
                                placeholderTextColor="#475569"
                                multiline={currentQ.multiline}
                                textAlignVertical={currentQ.multiline ? 'top' : 'center'}
                                autoFocus
                            />
                        )}
                    </ScrollView>

                    {/* Navigation Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.skipBtn}
                            onPress={() => {
                                onSkip();
                                setStep(0);
                                setAnswers({ description: '', teamComposition: '', currentStage: '', targetMarket: '', differentiator: '' });
                            }}
                        >
                            <Text style={styles.skipText}>전체 건너뛰기</Text>
                        </TouchableOpacity>

                        <View style={styles.navButtons}>
                            {!isFirst && (
                                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                                    <Text style={styles.backBtnText}>이전</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.skipQuestionBtn}
                                onPress={handleSkipQuestion}
                            >
                                <Text style={styles.skipQuestionText}>잘 모르겠음</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
                                onPress={handleNext}
                                disabled={!canProceed}
                            >
                                <Text style={styles.nextBtnText}>
                                    {isLast ? '전략 분석 시작 🚀' : '다음 단계 →'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 560,
        alignItems: 'center',
    },
    modal: {
        width: '90%',
        maxWidth: 560,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
    },
    headerTitle: {
        color: '#27272a',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    grantName: {
        color: '#7C3AED',
        fontSize: 13,
        marginTop: 6,
        fontWeight: '700',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 0,
        marginTop: 0,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#7C3AED',
    },
    stepIndicator: {
        color: '#64748B',
        fontSize: 12,
        textAlign: 'right',
        paddingHorizontal: 20,
        marginTop: 6,
    },
    content: {
        padding: 24,
        paddingTop: 24,
    },
    questionIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    questionTitle: {
        color: '#27272a',
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    questionSubtitle: {
        color: '#64748B',
        fontSize: 15,
        marginBottom: 24,
        lineHeight: 22,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        color: '#27272a',
        fontSize: 16,
        padding: 16,
        lineHeight: 24,
        fontWeight: '500',
    },
    inputMultiline: {
        minHeight: 140,
        textAlignVertical: 'top',
    },
    choicesContainer: {
        gap: 10,
    },
    choiceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 16,
        gap: 14,
    },
    choiceButtonActive: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
    },
    choiceIcon: {
        fontSize: 24,
    },
    choiceLabel: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '700',
    },
    choiceLabelActive: {
        color: '#7C3AED',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    skipBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    skipText: {
        color: '#64748B',
        fontSize: 14,
    },
    navButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    backBtn: {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
    },
    backBtnText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '800',
    },
    nextBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        backgroundColor: '#7C3AED',
        shadowColor: '#7C3AED',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    nextBtnDisabled: {
        backgroundColor: '#E2E8F0',
        shadowOpacity: 0,
    },
    nextBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
    skipQuestionBtn: {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    skipQuestionText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
    },
});
