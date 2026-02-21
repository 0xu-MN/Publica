import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Page } from 'react-pdf';
import { SmartBlockEngine, Block } from '../utils/smartBlockEngine';

interface PDFBookPageProps {
    pageNumber: number;
    width: number;
    selectedBlockId?: string | null;
    onLoadSuccess?: (page: any) => void;
    onBlockClick?: (block: Block, event: any) => void;
    onSparkle?: (block: Block, event: any) => void;
}

const BLOCK_COLORS: Record<string, { hover: string; selected: string; badge: string }> = {
    heading: { hover: 'rgba(139,92,246,0.07)', selected: 'rgba(139,92,246,0.14)', badge: '#8B5CF6' },
    paragraph: { hover: 'rgba(59,130,246,0.06)', selected: 'rgba(59,130,246,0.12)', badge: '#3B82F6' },
    figure: { hover: 'rgba(245,158,11,0.07)', selected: 'rgba(245,158,11,0.14)', badge: '#F59E0B' },
    formula: { hover: 'rgba(236,72,153,0.07)', selected: 'rgba(236,72,153,0.14)', badge: '#EC4899' },
    default: { hover: 'rgba(99,102,241,0.05)', selected: 'rgba(99,102,241,0.11)', badge: '#6366F1' },
};

export const PDFBookPage: React.FC<PDFBookPageProps> = ({
    pageNumber, width, selectedBlockId, onLoadSuccess, onBlockClick, onSparkle
}) => {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

    // ✅ 수정: onLoadSuccess 중복 호출 제거
    // 이전 코드는 즉시 호출(blocks 없음) + getTextContent 완료 후 호출 = 2번 호출되었음
    // 이제 getTextContent 완료 후 blocks와 함께 단 1번만 호출
    const handlePageLoadSuccess = (page: any) => {
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = width / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        page.getTextContent().then((content: any) => {
            const extractedBlocks = SmartBlockEngine.processPage(content.items, viewport);
            setBlocks(extractedBlocks);
            onLoadSuccess?.({ ...page, blocks: extractedBlocks, height: viewport.height });
        });
    };

    if (Platform.OS !== 'web') {
        return (
            <View style={styles.pageContainer}>
                <Page pageNumber={pageNumber} width={width}
                    renderAnnotationLayer={false} renderTextLayer={false}
                    onLoadSuccess={handlePageLoadSuccess} />
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {blocks.map(block => (
                        <TouchableOpacity key={block.id}
                            onPress={(e: any) => onBlockClick?.(block, e.nativeEvent)}
                            style={{ position: 'absolute', left: block.x, top: block.y, width: block.width, height: block.height }}
                        />
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.pageContainer}>
            <Page
                pageNumber={pageNumber}
                width={width}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                onLoadSuccess={handlePageLoadSuccess}
            />

            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {blocks.map(block => {
                    const isHovered = hoveredBlock === block.id;
                    const isSelected = selectedBlockId === block.id;
                    const colors = BLOCK_COLORS[block.type] || BLOCK_COLORS.default;
                    const showSparkle = (isHovered || isSelected) &&
                        (block.type === 'heading' || block.type === 'figure');

                    const bgColor = isSelected ? colors.selected
                        : isHovered ? colors.hover
                            : 'transparent';

                    const borderColor = isSelected ? colors.badge + '55'
                        : isHovered ? colors.badge + '22'
                            : 'transparent';

                    return (
                        <View
                            key={block.id}
                            // @ts-ignore
                            onMouseEnter={() => setHoveredBlock(block.id)}
                            onMouseLeave={() => setHoveredBlock(null)}
                            onClick={(e: any) => {
                                e.stopPropagation();
                                onBlockClick?.(block, { pageX: e.clientX, pageY: e.clientY });
                            }}
                            style={{
                                position: 'absolute',
                                left: block.x,
                                top: block.y,
                                width: block.width,
                                height: block.height,
                                backgroundColor: bgColor,
                                borderWidth: (isHovered || isSelected) ? 1 : 0,
                                borderColor,
                                borderRadius: 3,
                                cursor: 'pointer',
                                zIndex: isSelected ? 20 : isHovered ? 15 : 5,
                                transition: 'background-color 0.12s ease, border-color 0.12s ease',
                                pointerEvents: 'auto',
                            } as any}
                        >
                            {/* Left accent bar for headings */}
                            {block.type === 'heading' && (isHovered || isSelected) && (
                                <View style={[styles.headingBar, { backgroundColor: colors.badge }]} />
                            )}

                            {/* ✨ Sparkle button */}
                            {showSparkle && (
                                <View
                                    // @ts-ignore
                                    onClick={(e: any) => {
                                        e.stopPropagation();
                                        onSparkle?.(block, { pageX: e.clientX, pageY: e.clientY });
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: block.type === 'figure' ? 'auto' : -1,
                                        bottom: block.type === 'figure' ? 6 : 'auto',
                                        right: 4,
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: colors.badge,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 30,
                                        boxShadow: `0 2px 8px ${colors.badge}60`,
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s ease',
                                    } as any}
                                >
                                    <Text style={{ fontSize: 12, lineHeight: 24, textAlign: 'center' }}>✨</Text>
                                </View>
                            )}

                            {/* Citation count chip */}
                            {block.citations && block.citations.length > 0 && (isHovered || isSelected) && (
                                <View style={[styles.refChip, { borderColor: colors.badge + '70' }]}>
                                    <Text style={[styles.refChipText, { color: colors.badge }]}>
                                        {block.citations.length} ref{block.citations.length > 1 ? 's' : ''}
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    pageContainer: {
        marginBottom: 24,
        backgroundColor: 'white',
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        position: 'relative',
        overflow: 'visible',
    },
    headingBar: {
        position: 'absolute',
        left: -2,
        top: 4,
        bottom: 4,
        width: 3,
        borderRadius: 2,
    },
    refChip: {
        position: 'absolute',
        bottom: -18,
        right: 0,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'white',
    },
    refChipText: {
        fontSize: 10,
        fontWeight: '600',
    },
});