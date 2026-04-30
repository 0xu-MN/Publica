import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, BookOpen, X, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface WelcomeGuideModalProps {
    onNavigateToGuide: () => void;
}

export const WelcomeGuideModal = ({ onNavigateToGuide }: WelcomeGuideModalProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkFirstTime = async () => {
            try {
                const hasSeen = await AsyncStorage.getItem('hasSeenWelcomeGuide');
                if (!hasSeen) {
                    setIsVisible(true);
                }
            } catch (e) {
                console.error('Failed to check welcome guide status:', e);
            }
        };
        checkFirstTime();
    }, []);

    const handleClose = async () => {
        setIsVisible(false);
        try {
            await AsyncStorage.setItem('hasSeenWelcomeGuide', 'true');
        } catch (e) {
            console.error('Failed to save welcome guide status:', e);
        }
    };

    const handleViewGuide = () => {
        handleClose();
        onNavigateToGuide();
    };

    if (!isVisible) return null;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <X size={20} color="#94A3B8" />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#7C3AED', '#4C1D95']}
                            style={styles.iconGradient}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <Sparkles size={32} color="#FFFFFF" fill="#FFFFFF" />
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>Publica에 오신 것을 환영합니다!</Text>
                    
                    <Text style={styles.description}>
                        정부 지원사업 공고 분석부터 사업계획서 자동 작성까지,{'\n'}
                        Publica AI 에이전트가 여러분의 비즈니스 성장을 돕습니다.
                    </Text>

                    <View style={styles.featuresContainer}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIconBox}><Text style={styles.featureNumber}>1</Text></View>
                            <Text style={styles.featureText}>공고 URL 입력으로 <Text style={styles.highlightText}>핵심 전략 자동 수립</Text></Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIconBox}><Text style={styles.featureNumber}>2</Text></View>
                            <Text style={styles.featureText}>수립된 전략을 바탕으로 <Text style={styles.highlightText}>자동 초안 생성</Text></Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIconBox}><Text style={styles.featureNumber}>3</Text></View>
                            <Text style={styles.featureText}>과거 이력을 저장하여 <Text style={styles.highlightText}>스마트한 포트폴리오 관리</Text></Text>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.guideBtn} onPress={handleViewGuide}>
                            <BookOpen size={16} color="#7C3AED" />
                            <Text style={styles.guideBtnText}>가이드 상세보기</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.startBtn} onPress={handleClose}>
                            <Text style={styles.startBtnText}>바로 이용하기</Text>
                            <ArrowRight size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 520,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 40,
        alignItems: 'center',
        position: 'relative',
        ...Platform.select({
            web: { boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)' },
            default: { elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 40 }
        })
    },
    closeBtn: {
        position: 'absolute',
        top: 24,
        right: 24,
        padding: 8,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconGradient: {
        width: 72,
        height: 72,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#18181B',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    featuresContainer: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        padding: 24,
        borderRadius: 20,
        marginBottom: 36,
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureIconBox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureNumber: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
    featureText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '600',
    },
    highlightText: {
        color: '#18181B',
        fontWeight: '800',
    },
    actions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    guideBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        backgroundColor: '#F5F3FF',
        borderRadius: 16,
    },
    guideBtnText: {
        color: '#7C3AED',
        fontSize: 15,
        fontWeight: '800',
    },
    startBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        backgroundColor: '#7C3AED',
        borderRadius: 16,
    },
    startBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
});
