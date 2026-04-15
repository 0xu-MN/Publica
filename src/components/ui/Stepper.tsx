import React, { useState, Children, useRef, ReactNode, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';

interface StepperProps {
    children: ReactNode;
    initialStep?: number;
    onStepChange?: (step: number) => void;
    onFinalStepCompleted?: () => void;
    backButtonText?: string;
    nextButtonText?: string;
    disableStepIndicators?: boolean;
    stepCircleContainerClassName?: string;
    stepContainerClassName?: string;
    contentClassName?: string;
    footerClassName?: string;
    backButtonProps?: any;
    nextButtonProps?: any;
}

export default function Stepper({
    children,
    initialStep = 1,
    onStepChange,
    onFinalStepCompleted,
    backButtonText = '이전',
    nextButtonText = '다음',
    disableStepIndicators = false,
}: StepperProps) {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const steps = Children.toArray(children);
    const totalSteps = steps.length;

    const animateStep = () => {
        slideAnim.setValue(30);
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 200,
            friction: 20,
        }).start();
    };

    const goToStep = (step: number) => {
        const newStep = Math.max(1, Math.min(step, totalSteps));
        if (newStep !== currentStep) {
            setCurrentStep(newStep);
            onStepChange?.(newStep);
            animateStep();
        }
    };

    const handleNext = () => {
        if (currentStep < totalSteps) {
            goToStep(currentStep + 1);
        } else {
            onFinalStepCompleted?.();
        }
    };

    const handleBack = () => {
        goToStep(currentStep - 1);
    };

    return (
        <View style={{ flex: 1, width: '100%' }}>
            {/* Step Indicators */}
            {!disableStepIndicators && (
                <View style={styles.indicatorRow}>
                    {steps.map((_, index) => (
                        <React.Fragment key={index}>
                            <StepIndicator
                                step={index + 1}
                                currentStep={currentStep}
                                onClickStep={goToStep}
                            />
                            {index < totalSteps - 1 && (
                                <StepConnector isComplete={currentStep > index + 1} />
                            )}
                        </React.Fragment>
                    ))}
                </View>
            )}

            {/* Step Content */}
            <Animated.View
                style={[
                    styles.contentWrapper,
                    { transform: [{ translateY: slideAnim }] },
                ]}
            >
                {steps[currentStep - 1]}
            </Animated.View>

            {/* Navigation Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleBack}
                    disabled={currentStep === 1}
                    style={[styles.btn, styles.prevBtn, currentStep === 1 && { opacity: 0 }]}
                >
                    <Text style={styles.prevBtnText}>{backButtonText}</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                    onPress={handleNext}
                    style={[styles.btn, styles.nextBtn]}
                >
                    <Text style={styles.nextBtnText}>
                        {currentStep === totalSteps ? '완료' : nextButtonText}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function StepIndicator({
    step,
    currentStep,
    onClickStep,
}: {
    step: number;
    currentStep: number;
    onClickStep: (step: number) => void;
}) {
    const isComplete = currentStep > step;
    const isActive = currentStep === step;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: isActive ? 1.1 : 1,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
        }).start();
    }, [isActive]);

    return (
        <TouchableOpacity onPress={() => onClickStep(step)} activeOpacity={0.8}>
            <Animated.View
                style={[
                    styles.stepCircle,
                    (isComplete || isActive) && styles.stepCircleActive,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                {isComplete ? (
                    <Text style={styles.stepCheckmark}>✓</Text>
                ) : (
                    <Text style={[styles.stepNumber, (isActive) && styles.stepNumberActive]}>
                        {step}
                    </Text>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
    const widthAnim = useRef(new Animated.Value(isComplete ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(widthAnim, {
            toValue: isComplete ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isComplete]);

    return (
        <View style={styles.connector}>
            <Animated.View
                style={[
                    styles.connectorFill,
                    {
                        width: widthAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                        }),
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    indicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        gap: 0,
    },
    contentWrapper: {
        flex: 1,
        width: '100%',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 28,
        gap: 0,
    },
    btn: {
        minWidth: 120,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    prevBtn: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    prevBtnText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '700',
    },
    nextBtn: {
        backgroundColor: '#7C3AED',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    nextBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    stepCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    stepCircleActive: {
        borderColor: '#7C3AED',
        backgroundColor: '#7C3AED',
    },
    stepNumber: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '800',
    },
    stepNumberActive: {
        color: '#FFFFFF',
    },
    stepCheckmark: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },
    connector: {
        width: 48,
        height: 2,
        backgroundColor: '#F1F5F9',
        position: 'relative',
        overflow: 'hidden',
    },
    connectorFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        backgroundColor: '#7C3AED',
    },
});

export function Step({ children }: { children: ReactNode }) {
    return <View style={{ width: '100%' }}>{children}</View>;
}
