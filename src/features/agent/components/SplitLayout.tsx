import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Dimensions, Platform } from 'react-native';

interface SplitLayoutProps {
    leftNode: React.ReactNode;
    rightNode: React.ReactNode;
    initialLeftWidth?: number;
    minLeftWidth?: number;
    maxLeftWidth?: number;
}

export const SplitLayout = ({
    leftNode,
    rightNode,
    initialLeftWidth = Dimensions.get('window').width * 0.5,
    minLeftWidth = 300,
    maxLeftWidth = Dimensions.get('window').width * 0.8
}: SplitLayoutProps) => {
    const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
    const screenWidth = Dimensions.get('window').width;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                // Determine new width
                // Note: gestureState.moveX is the absolute X coordinate
                // We just use moveX as the new width
                const newWidth = Math.max(minLeftWidth, Math.min(gestureState.moveX, maxLeftWidth));
                setLeftWidth(newWidth);
            },
            onPanResponderRelease: () => {
                // Finalize width if needed (optional)
            }
        })
    ).current;

    return (
        <View style={styles.container}>
            {/* Left Panel */}
            <View style={[styles.panel, { width: leftWidth }]}>
                {leftNode}
            </View>

            {/* Resizer Handle */}
            <View
                {...panResponder.panHandlers}
                style={[
                    styles.resizer,
                    Platform.OS === 'web' && { cursor: 'col-resize' } as any
                ]}
            >
                <View style={styles.resizerLine} />
            </View>

            {/* Right Panel */}
            <View style={[styles.panel, { flex: 1 }]}>
                {rightNode}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#000'
    },
    panel: {
        height: '100%',
        overflow: 'hidden'
    },
    resizer: {
        width: 10,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#000'
    },
    resizerLine: {
        width: 2,
        height: 40,
        backgroundColor: '#475569',
        borderRadius: 1
    }
});
