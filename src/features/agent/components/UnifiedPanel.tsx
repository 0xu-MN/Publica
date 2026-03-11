import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { PanelRightOpen, PanelRightClose, PanelLeftOpen, Search, ChevronLeft } from 'lucide-react-native';
import { DetailPanel, DetailPanelRef } from './DetailPanel';

/**
 * UnifiedPanel — 수평 2단 서랍 (Horizontal 2-Drawer with Resizer)
 * 
 * State is lifted to AgentView for header-level controls.
 */

interface UnifiedPanelProps {
    activeNode: any;
    onCloseNode: () => void;
    onAction: (type: string, node: any) => void;
    chatHistory: any[];
    onChatSend: (text: string) => void;
    loading: boolean;
    suggestions: any[];
    onFileUpload?: () => void;
    onCitationClick?: (page: number) => void;
    onAppendToMemo?: (text: string) => void;
    detailPanelRef?: React.RefObject<DetailPanelRef | null>;
    editorNode: React.ReactNode;
    // Lifted state from AgentView
    isEditorMinimized: boolean;
    onEditorMinimizeChange: (minimized: boolean) => void;
    isInspectorOpen: boolean;
    onInspectorOpenChange: (open: boolean) => void;
}

export const UnifiedPanel: React.FC<UnifiedPanelProps> = ({
    activeNode,
    onCloseNode,
    onAction,
    chatHistory,
    onChatSend,
    loading,
    suggestions,
    onFileUpload,
    onCitationClick,
    onAppendToMemo,
    detailPanelRef,
    editorNode,
    isEditorMinimized,
    onEditorMinimizeChange,
    isInspectorOpen,
    onInspectorOpenChange,
}) => {
    const [inspectorWidth, setInspectorWidth] = React.useState(480);
    const isDragging = useRef(false);
    const containerRef = useRef<View>(null);
    const containerWidthRef = useRef(0);

    // Web: native mouse events for smooth resizing
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            e.preventDefault();
            const el = containerRef.current as any;
            if (el && typeof el.getBoundingClientRect === 'function') {
                const rect = el.getBoundingClientRect();
                const newInspectorWidth = rect.right - e.clientX;
                // Minimum inspector width is 200, maximum is container width minus editor minimum width (180) minus some padding
                const maxAllowedWidth = containerWidthRef.current - 200; // Leave 200px for Editor
                const clamped = Math.max(200, Math.min(newInspectorWidth, maxAllowedWidth > 200 ? maxAllowedWidth : 400));
                setInspectorWidth(clamped);
            }
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
    }, []);

    const handleMouseDown = useCallback(() => {
        if (Platform.OS !== 'web') return;
        isDragging.current = true;
        // @ts-ignore
        document.body.style.cursor = 'col-resize';
        // @ts-ignore
        document.body.style.userSelect = 'none';
    }, []);

    const bothClosed = isEditorMinimized && !isInspectorOpen;

    return (
        <View
            ref={containerRef}
            style={styles.container}
            onLayout={(e) => { containerWidthRef.current = e.nativeEvent.layout.width; }}
        >
            {/* ====== DRAWER 1: ContextDock (에디터/원문/PDF) ====== */}
            {!isEditorMinimized ? (
                <View style={[styles.editorDrawer, isInspectorOpen && { flex: 1 }]}>
                    {editorNode}
                </View>
            ) : (
                /* Editor minimized — show thin expand bar */
                <View style={styles.editorMinBar}>
                    <TouchableOpacity
                        style={styles.minBarBtn}
                        onPress={() => onEditorMinimizeChange(false)}
                    >
                        <PanelLeftOpen size={16} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
            )}

            {/* ====== RESIZER / COLLAPSE TOGGLE ====== */}
            {!isEditorMinimized && (
                <View
                    style={[styles.resizer, Platform.OS === 'web' && { cursor: 'col-resize' } as any]}
                    // @ts-ignore
                    onMouseDown={isInspectorOpen ? handleMouseDown : undefined}
                >
                    <TouchableOpacity
                        style={styles.toggleBtn}
                        onPress={() => onInspectorOpenChange(!isInspectorOpen)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        {isInspectorOpen
                            ? <PanelRightClose size={12} color="#94A3B8" />
                            : <PanelRightOpen size={12} color="#8B5CF6" />
                        }
                    </TouchableOpacity>
                    {isInspectorOpen && <View style={styles.resizerLine} />}
                </View>
            )}

            {/* ====== DRAWER 2: INSPECTOR (resizable, fully collapsible, independent) ====== */}
            {isInspectorOpen && (
                <View style={[
                    styles.inspectorDrawer,
                    { width: isEditorMinimized ? undefined : inspectorWidth },
                    isEditorMinimized && { flex: 1 },
                ]}>
                    <DetailPanel
                        ref={detailPanelRef}
                        node={activeNode}
                        onClose={onCloseNode}
                        onAction={onAction}
                        chatHistory={chatHistory}
                        onSend={onChatSend}
                        loading={loading}
                        suggestions={suggestions}
                        onFileUpload={onFileUpload}
                        onCitationClick={onCitationClick}
                        onAppendToMemo={onAppendToMemo}
                        embedded={true}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#0a0a0a',
    },
    editorDrawer: {
        flex: 1,
        minWidth: 180,
    },
    editorMinBar: {
        width: 40,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        paddingTop: 12,
        borderRightWidth: 1,
        borderRightColor: '#1E293B',
    },
    minBarBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resizer: {
        width: 20,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#1E293B',
    },
    toggleBtn: {
        width: 20,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resizerLine: {
        width: 3,
        height: 24,
        backgroundColor: '#334155',
        borderRadius: 2,
        marginTop: 8,
    },
    inspectorDrawer: {
        backgroundColor: '#0a0a0a',
    },
});
