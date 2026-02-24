import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
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
    onSparkle?: (info: { id?: string; y: number; text: string; type: 'heading' }, event: any) => void;
}

const BLOCK_COLORS: Record<string, { hover: string; selected: string; badge: string }> = {
    heading: { hover: 'rgba(139,92,246,0.07)', selected: 'rgba(139,92,246,0.14)', badge: '#8B5CF6' },
    paragraph: { hover: 'rgba(59,130,246,0.06)', selected: 'rgba(59,130,246,0.12)', badge: '#3B82F6' },
    figure: { hover: 'rgba(245,158,11,0.07)', selected: 'rgba(245,158,11,0.14)', badge: '#F59E0B' },
    formula: { hover: 'rgba(236,72,153,0.07)', selected: 'rgba(236,72,153,0.14)', badge: '#EC4899' },
    default: { hover: 'rgba(99,102,241,0.05)', selected: 'rgba(99,102,241,0.11)', badge: '#6366F1' },
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
            const extractedBlocks = StructureEngine.analyzeStructure(initialBlocks);
            setBlocks(extractedBlocks);
            onLoadSuccess?.({ ...page, blocks: extractedBlocks, height: viewport.height });
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

                {/* ── 2. 서버 TOC ✨ 버튼 ── */}
                {/* ✅ FIX: pageScale이 null이면 렌더하지 않음 (scale=1로 잘못 표시되는 것 방지) */}
                {pageScale !== null && serverTOCItems.map((item, idx) => {
                    const isHovered = hoveredTOC === item.id;

                    // ✅ FIX: 좌표 변환
                    // Python pdfplumber의 item.y, item.x는 PDF 포인트 단위 (top 기준)
                    // pageScale = 렌더된 픽셀 너비 / PDF 포인트 너비
                    // → pixel_y = pdf_y * pageScale
                    const pixelY = item.y * pageScale;
                    const pixelX = item.x * pageScale;

                    // ✨ 버튼을 제목 왼쪽에 배치 (최소 0, 최대 제목 x의 왼쪽)
                    let btnLeft = Math.max(2, pixelX - 32);
                    let btnTop = pixelY - 1;

                    // 만약 PyMuPDF가 좌표를 찾지 못해 (0,0)을 반환했다면, 왼쪽 여백에 예쁘게 나열
                    if (item.x === 0 && item.y === 0) {
                        const itemsOnPage = serverTOCItems.filter(t => t.page === item.page);
                        const indexOnPage = itemsOnPage.indexOf(item);
                        btnLeft = 8;
                        btnTop = 40 + (indexOnPage * 36);
                    }

                    return (
                        <View
                            key={`toc-btn-${item.id}-${idx}`}
                            // @ts-ignore
                            onMouseEnter={() => setHoveredTOC(item.id)}
                            onMouseLeave={() => setHoveredTOC(null)}
                            onClick={(e: any) => {
                                e.stopPropagation();
                                onSparkle?.(
                                    { id: item.id, y: item.y, text: item.title, type: 'heading' },
                                    { clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY }
                                );
                            }}
                            style={{
                                position: 'absolute',
                                left: btnLeft,
                                top: btnTop,
                                width: 26,
                                height: 26,
                                borderRadius: 4,
                                backgroundColor: isHovered ? '#6366F1' : 'white',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 30,
                                borderWidth: 1,
                                borderColor: isHovered ? '#4F46E5' : '#E2E8F0',
                                // @ts-ignore
                                boxShadow: isHovered
                                    ? '0 4px 6px rgba(99,102,241,0.2)'
                                    : '0 1px 2px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                opacity: isHovered ? 1 : 0.75,
                                pointerEvents: 'auto',
                            } as any}
                        >
                            <Text style={{ fontSize: 13, color: isHovered ? 'white' : '#64748B' }}>
                                ✨
                            </Text>
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