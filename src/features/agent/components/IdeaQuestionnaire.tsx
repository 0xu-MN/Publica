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
}) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<BusinessIdeaData>({
        description: '',
        teamComposition: '',
        currentStage: '',
        targetMarket: '',
        differentiator: '',
    });

    if (!visible) return null;

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
                                    <Text style={styles.backBtnText}>← 이전</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.skipQuestionBtn}
                                onPress={handleSkipQuestion}
                            >
                                <Text style={styles.skipQuestionText}>❓ 모르겠음</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
                                onPress={handleNext}
                                disabled={!canProceed}
                            >
                                <Text style={styles.nextBtnText}>
                                    {isLast ? '분석 시작 🚀' : '다음 →'}
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
        maxWidth: 520,
        backgroundColor: '#111827',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        overflow: 'hidden',
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderColor: '#1E293B',
    },
    headerTitle: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
    },
    grantName: {
        color: '#10B981',
        fontSize: 13,
        marginTop: 4,
        fontWeight: '500',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        height: 3,
        backgroundColor: '#1E293B',
        marginHorizontal: 20,
        borderRadius: 2,
        marginTop: 12,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    stepIndicator: {
        color: '#64748B',
        fontSize: 12,
        textAlign: 'right',
        paddingHorizontal: 20,
        marginTop: 6,
    },
    content: {
        padding: 20,
        paddingTop: 16,
    },
    questionIcon: {
        fontSize: 36,
        marginBottom: 10,
    },
    questionTitle: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 6,
    },
    questionSubtitle: {
        color: '#94A3B8',
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        color: '#F8FAFC',
        fontSize: 15,
        padding: 14,
        lineHeight: 22,
    },
    inputMultiline: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    choicesContainer: {
        gap: 10,
    },
    choiceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        padding: 14,
        gap: 12,
    },
    choiceButtonActive: {
        borderColor: '#10B981',
        backgroundColor: '#064E3B20',
    },
    choiceIcon: {
        fontSize: 20,
    },
    choiceLabel: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '500',
    },
    choiceLabelActive: {
        color: '#10B981',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderColor: '#1E293B',
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
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#1E293B',
    },
    backBtnText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
    nextBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#10B981',
    },
    nextBtnDisabled: {
        backgroundColor: '#1E293B',
        opacity: 0.5,
    },
    nextBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    skipQuestionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    skipQuestionText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '500',
    },
});
