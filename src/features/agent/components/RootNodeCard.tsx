import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Target, ChevronRight } from 'lucide-react-native';

interface RootNodeCardProps {
    hypothesis: string;
    branchCount: number;
}

export const RootNodeCard = ({ hypothesis, branchCount }: RootNodeCardProps) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(-20)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.iconRow}>
                <View style={styles.iconBg}>
                    <Target size={16} color="#7C3AED" />
                </View>
                <Text style={styles.label}>핵심 전략</Text>
            </View>

            <Text style={styles.hypothesis} numberOfLines={3}>
                {hypothesis}
            </Text>

            <View style={styles.footer}>
                <View style={styles.branchIndicator}>
                    <ChevronRight size={12} color="#64748B" />
                    <Text style={styles.footerText}>{branchCount}개 실행 단계</Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 240,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 2,
        borderColor: '#7C3AED',
        shadowColor: '#7C3AED',
        shadowOpacity: 0.2,
        shadowRadius: 25,
        shadowOffset: { width: 0, height: 10 },
        marginRight: 60,
        alignSelf: 'center',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    iconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: '#7C3AED',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    hypothesis: {
        color: '#27272a',
        fontSize: 16,
        fontWeight: '900',
        lineHeight: 24,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    footer: {
        borderTopWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.1)',
        paddingTop: 12,
    },
    branchIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '600',
    },
});
