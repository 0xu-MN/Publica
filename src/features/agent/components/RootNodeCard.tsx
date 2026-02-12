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
                    <Target size={16} color="#10B981" />
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
        backgroundColor: '#0A1628',
        borderRadius: 8,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#10B981',
        shadowColor: '#10B981',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
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
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    hypothesis: {
        color: '#F1F5F9',
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 22,
        marginBottom: 12,
    },
    footer: {
        borderTopWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        paddingTop: 10,
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
