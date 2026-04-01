import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Sparkles, Pin, FileText, MessageCircle, MoreHorizontal, Copy, Globe } from 'lucide-react-native';

interface FloatingContextMenuProps {
    visible: boolean;
    x: number;
    y: number;
    text: string;
    type?: string; // 'paragraph' | 'figure' | 'formula' | 'heading'
    onAskAI: (text: string) => void;
    onPinToCanvas: (text: string) => void;
    onSummarize: (text: string) => void;
    onExplain: () => void;
    onTranslate: () => void;
    onClose: () => void;
}

export const FloatingContextMenu = ({
    visible, x, y, text, type,
    onAskAI, onPinToCanvas, onSummarize, onExplain, onTranslate, onClose
}: FloatingContextMenuProps) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: Platform.OS !== 'web'
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: Platform.OS !== 'web'
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    // Adjust position
    const style = {
        top: y + 20,
        left: x,
        opacity: fadeAnim,
    };

    const renderActions = () => {
        // 1. Math / Formula Actions
        if (type === 'math' || type === 'formula' || text.includes('$')) {
            return (
                <>
                    <TouchableOpacity style={styles.actionItem} onPress={() => { /* Copy LaTeX logic */ onClose(); }}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(219, 39, 119, 0.08)' }]}>
                            <Text style={{ color: '#DB2777', fontWeight: '900', fontSize: 13 }}>$fx$</Text>
                        </View>
                        <Text style={styles.actionLabel}>Copy LaTeX</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.actionItem} onPress={() => { onAskAI(`Explain this formula: ${text} `); onClose(); }}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
                            <Sparkles size={16} color="#3B82F6" />
                        </View>
                        <Text style={styles.actionLabel}>Explain</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.actionItem} onPress={() => { onPinToCanvas(text); onClose(); }}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(124, 58, 237, 0.08)' }]}>
                            <Pin size={16} color="#7C3AED" />
                        </View>
                        <Text style={styles.actionLabel}>To MindMap</Text>
                    </TouchableOpacity>
                </>
            );
        }

        // 2. Default Text Actions
        return (
            <>
                {/* 1. Explain (In-Place) */}
                <TouchableOpacity style={styles.actionItem} onPress={onExplain}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(124, 58, 237, 0.08)' }]}>
                        <Sparkles size={16} color="#7C3AED" />
                    </View>
                    <Text style={styles.actionLabel}>Explain</Text>
                </TouchableOpacity>

                {/* 2. Translate (In-Place) */}
                <TouchableOpacity style={styles.actionItem} onPress={onTranslate}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                        <Globe size={16} color="#10B981" />
                    </View>
                    <Text style={styles.actionLabel}>Translate</Text>
                </TouchableOpacity>

                <View style={styles.separator} />

                {/* 3. Mind Map */}
                <TouchableOpacity style={styles.actionItem} onPress={() => { onPinToCanvas(text); onClose(); }}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
                        <Pin size={16} color="#3B82F6" />
                    </View>
                    <Text style={styles.actionLabel}>To MindMap</Text>
                </TouchableOpacity>
            </>
        );
    };

    return (
        <Animated.View style={[styles.container, style]}>
            <View style={styles.menuContent}>
                {renderActions()}
            </View>
            {/* Tiny Arrow (Optional, for visual pointing) */}
            <View style={styles.arrow} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: 'transparent', // Container is transparent, content has shadow
        zIndex: 9999,
        // Positioning handled by style prop
    },
    menuContent: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 8,
        borderRadius: 10,
    },
    iconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#27272a',
    },
    separator: {
        width: 1,
        height: 24,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 6,
    },
    arrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'white',
        transform: [{ rotate: '180deg' }], // Point down
        alignSelf: 'center',
        marginTop: -1, // Overlap slightly
        shadowColor: "#000",
        shadowOpacity: 0.05,
        elevation: 2,
    }
});
