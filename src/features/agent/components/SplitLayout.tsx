import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';

interface SplitLayoutProps {
    leftNode: React.ReactNode;
    rightNode: React.ReactNode;
    initialLeftWidth?: number;
    minLeftWidth?: number;
    maxLeftWidth?: number;
    isLeftMinimized?: boolean;
}

export const SplitLayout = ({
    leftNode,
    rightNode,
    initialLeftWidth = Dimensions.get('window').width * 0.45,
    minLeftWidth = 200,
    maxLeftWidth = Dimensions.get('window').width * 0.75,
    isLeftMinimized = false
}: SplitLayoutProps) => {
    const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
    const containerRef = useRef<View>(null);
    const isDragging = useRef(false);
    const containerLeft = useRef(0);

    // Web: Use native mouse events for smooth, reliable resizing
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            e.preventDefault();
            // Calculate width relative to the container's left edge
            const newWidth = e.clientX - containerLeft.current;
            const clamped = Math.max(minLeftWidth, Math.min(newWidth, maxLeftWidth));
            setLeftWidth(clamped);
        };

        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [minLeftWidth, maxLeftWidth]);

    const handleMouseDown = useCallback(() => {
        if (Platform.OS !== 'web') return;
        isDragging.current = true;
        // @ts-ignore - web only
        document.body.style.cursor = 'col-resize';
        // @ts-ignore - web only
        document.body.style.userSelect = 'none';

        // Measure container offset
        if (containerRef.current) {
            // @ts-ignore - web DOM access
            const el = containerRef.current as any;
            if (el && typeof el.getBoundingClientRect === 'function') {
                containerLeft.current = (el as any).getBoundingClientRect().left;
            } else if (el && el.measure) {
                el.measure((_x: number, _y: number, _w: number, _h: number, pageX: number) => {
                    containerLeft.current = pageX;
                });
            }
        }
    }, []);

    return (
        <View ref={containerRef} style={styles.container}>
            {/* Left Panel */}
            <View style={[styles.panel, { width: isLeftMinimized ? 56 : leftWidth }]}>
                {leftNode}
            </View>

            {/* Resizer Handle */}
            <View
                style={[
                    styles.resizer,
                    Platform.OS === 'web' && { cursor: 'col-resize' } as any
                ]}
                // @ts-ignore - web event
                onMouseDown={handleMouseDown}
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
        backgroundColor: '#FDF8F3'
    },
    panel: {
        height: '100%',
        overflow: 'hidden'
    },
    resizer: {
        width: 12,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    resizerLine: {
        width: 4,
        height: 40,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
    }
});
