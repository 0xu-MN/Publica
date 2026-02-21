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
                        <View style={[styles.iconBox, { backgroundColor: '#FDF2F8' }]}>
                            <Text style={{ color: '#DB2777', fontWeight: 'bold', fontSize: 12 }}>$fx$</Text>
                        </View>
                        <Text style={styles.actionLabel}>Copy LaTeX</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.actionItem} onPress={() => { onAskAI(`Explain this formula: ${text} `); onClose(); }}>
                        <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                            <Sparkles size={16} color="#3B82F6" />
                        </View>
                        <Text style={styles.actionLabel}>Explain</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.actionItem} onPress={() => { onPinToCanvas(text); onClose(); }}>
                        <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                            <Pin size={16} color="#16A34A" />
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
                    <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                        <Sparkles size={16} color="#3B82F6" />
                    </View>
                    <Text style={styles.actionLabel}>Explain</Text>
                </TouchableOpacity>

                {/* 2. Translate (In-Place) */}
                <TouchableOpacity style={styles.actionItem} onPress={onTranslate}>
                    <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                        <Globe size={16} color="#16A34A" />
                    </View>
                    <Text style={styles.actionLabel}>Translate</Text>
                </TouchableOpacity>

                <View style={styles.separator} />

                {/* 3. Mind Map */}
                <TouchableOpacity style={styles.actionItem} onPress={() => { onPinToCanvas(text); onClose(); }}>
                    <View style={[styles.iconBox, { backgroundColor: '#FDF2F8' }]}>
                        <Pin size={16} color="#EC4899" />
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
        borderRadius: 12,
        padding: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        gap: 6,
        borderRadius: 8,
        // Hover state handled by parent or platform specific
    },
    iconBox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
    },
    separator: {
        width: 1,
        height: 20,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 4,
    },
    arrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderBottomWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'white',
        transform: [{ rotate: '180deg' }], // Point down
        alignSelf: 'center',
        marginTop: -1, // Overlap slightly
        shadowColor: "#000",
        shadowOpacity: 0.1,
        elevation: 2,
    }
});
