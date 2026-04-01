import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Svg, Path, G, Rect, Text as SvgText } from 'react-native-svg';
import { Page } from 'react-pdf';
import { SmartBlockEngine, Block } from '../utils/smartBlockEngine';
import { StructureEngine } from '../utils/StructureEngine';

interface PDFBookPageProps {
    pageNumber: number;
    width: number;
    selectedBlockId?: string | null;
    serverTOCItems?: any[];
    onLoadSuccess?: (page: any) => void;
    onBlockClick?: (block: Block, event: any) => void;
    onSparkle?: (info: Block, event: any) => void;
}

const BLOCK_COLORS: Record<string, { hover: string; selected: string; badge: string }> = {
    heading: { hover: 'rgba(124, 58, 237, 0.08)', selected: 'rgba(124, 58, 237, 0.15)', badge: '#7C3AED' },
    paragraph: { hover: 'rgba(100, 116, 139, 0.05)', selected: 'rgba(100, 116, 139, 0.1)', badge: '#64748B' },
    figure: { hover: 'rgba(245, 158, 11, 0.07)', selected: 'rgba(245, 158, 11, 0.14)', badge: '#F59E0B' },
    formula: { hover: 'rgba(124, 58, 237, 0.05)', selected: 'rgba(124, 58, 237, 0.1)', badge: '#7C3AED' },
    default: { hover: 'rgba(124, 58, 237, 0.04)', selected: 'rgba(124, 58, 237, 0.1)', badge: '#7C3AED' },
};

export const PDFBookPage: React.FC<PDFBookPageProps> = ({
    pageNumber, width, selectedBlockId, serverTOCItems = [],
    onLoadSuccess, onBlockClick, onSparkle
}) => {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
    const [hoveredTOC, setHoveredTOC] = useState<string | null>(null);

    // ✅ FIX: pageScale은 실제 PDF 렌더 완료 후에만 설정
    // null = 아직 렌더 안됨 → ✨ 버튼 표시 안함 (잘못된 위치 방지)
    const [pageScale, setPageScale] = useState<number | null>(null);

    const handlePageLoadSuccess = (page: any) => {
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = width / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        // ✅ 페이지 렌더 완료 후 scale 확정 → ✨ 버튼 이제 정확한 위치에 렌더됨
        setPageScale(scale);

        page.getTextContent().then((content: any) => {
            const initialBlocks = SmartBlockEngine.processPage(content.items, viewport);
            const analyzedBlocks = StructureEngine.analyzeStructure(initialBlocks);
            setBlocks(analyzedBlocks);
            onLoadSuccess?.({ ...page, blocks: analyzedBlocks, height: viewport.height });
        });
    };

    if (Platform.OS !== 'web') {
        return (
            <View style={styles.pageContainer}>
                <Page
                    pageNumber={pageNumber}
                    width={width}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    onLoadSuccess={handlePageLoadSuccess}
                />
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

                {/* ── 1. 클라이언트 파싱 블록 (hover/click 영역) ── */}
                {blocks.map(block => {
                    const isHovered = hoveredBlock === block.id;
                    const isSelected = selectedBlockId === block.id;
                    const colors = BLOCK_COLORS[block.type] || BLOCK_COLORS.default;

                    return (
                        <View
                            key={block.id}
                            // @ts-ignore
                            onMouseEnter={() => setHoveredBlock(block.id)}
                            onMouseLeave={() => setHoveredBlock(null)}
                            onClick={(e: any) => {
                                e.stopPropagation();
                                onBlockClick?.(block, { clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY });
                            }}
                            style={{
                                position: 'absolute',
                                left: block.x,
                                top: block.y,
                                width: block.width,
                                height: block.height,
                                backgroundColor: isSelected
                                    ? colors.selected
                                    : isHovered ? colors.hover : 'transparent',
                                borderWidth: (isHovered || isSelected) ? 1 : 0,
                                borderColor: isSelected
                                    ? colors.badge + '55'
                                    : isHovered ? colors.badge + '22' : 'transparent',
                                borderRadius: 3,
                                cursor: 'pointer',
                                zIndex: isSelected ? 20 : isHovered ? 15 : 5,
                                transition: 'background-color 0.12s ease',
                                pointerEvents: 'auto',
                            } as any}
                        />
                    );
                })}

                {/* ── 2. 제목 네비게이션(Sparkle) 버튼 ── */}
                {pageScale !== null && blocks.filter(b => b.type === 'heading').map((block, idx) => {
                    const isHovered = hoveredTOC === block.id;

                    // 클라이언트 파싱된 block 좌표는 이미 viewport scale이 적용되어 있음
                    let btnLeft = Math.max(2, block.x - 32);
                    let btnTop = Math.max(0, block.y - 1);

                    return (
                        <View
                            key={`toc-btn-${block.id}-${idx}`}
                            // @ts-ignore
                            onMouseEnter={() => setHoveredTOC(block.id)}
                            onMouseLeave={() => setHoveredTOC(null)}
                            onClick={(e: any) => {
                                e.stopPropagation();
                                onSparkle?.(
                                    block,
                                    { clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY }
                                );
                            }}
                            style={{
                                position: 'absolute',
                                left: btnLeft,
                                top: btnTop,
                                width: 26,
                                height: 30,
                                borderRadius: 8,
                                backgroundColor: isHovered ? '#7C3AED' : 'white',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 30,
                                borderWidth: 1.5,
                                borderColor: isHovered ? '#7C3AED' : '#E2E8F0',
                                // @ts-ignore
                                boxShadow: isHovered
                                    ? '0 6px 15px rgba(124, 58, 237, 0.25)'
                                    : '0 2px 4px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                opacity: isHovered ? 1 : 0.75,
                                pointerEvents: 'auto',
                            } as any}
                        >
                            <Svg width="18" height="18" viewBox="0 0 36 36">
                                <G transform="translate(6, 4)">
                                    <Path
                                        d="M 4,4 L 4,26 M 4,4 C 14,4 16,9 16,13 C 16,17 14,22 4,22"
                                        stroke={isHovered ? 'white' : '#64748B'}
                                        strokeWidth="4.5"
                                        fill="none"
                                        strokeLinecap="round"
                                    />
                                    <SvgText
                                        fill={isHovered ? 'white' : '#64748B'}
                                        fontSize="5"
                                        fontWeight="900"
                                        x="16"
                                        y="11"
                                    >
                                        UBLICA
                                    </SvgText>
                                    <Rect x="16" y="20" width="5.5" height="5.5" rx="1.5" fill={isHovered ? 'white' : '#64748B'} />
                                </G>
                            </Svg>
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
});