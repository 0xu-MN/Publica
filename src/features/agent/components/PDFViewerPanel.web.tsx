import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Document, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PDFBookPage } from './PDFBookPage';
import { Block } from '../utils/smartBlockEngine';
import { StructureEngine } from '../utils/StructureEngine';
import { TableOfContents } from './TableOfContents';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

export interface PDFViewerRef {
    scrollToPage: (page: number) => void;
}

interface PDFViewerPanelProps {
    url: string;
    onQuote?: (text: string, x: number, y: number, type?: string, context?: any) => void;
    onExplainSection?: (text: string, x: number, y: number, context?: any) => void;
}

const PAGE_GAP = 8;      // 페이지 간 gap (px) — PDFBookPage 마진과 일치시켜야 함
const PAGE_PADDING = 20; // scrollContent paddingVertical

function sortTOCItems(items: any[]): any[] {
    return [...items].sort((a, b) => {
        const aNum = a.number;
        const bNum = b.number;
        if (aNum && bNum) return StructureEngine.compareSectionNumbers(aNum, bNum);
        if (!aNum && !bNum) {
            if (a.page !== b.page) return a.page - b.page;
            return (a.y ?? 0) - (b.y ?? 0);
        }
        if (a.page !== b.page) return a.page - b.page;
        return (a.y ?? 0) - (b.y ?? 0);
    });
}

export const PDFViewerPanel = forwardRef<PDFViewerRef, PDFViewerPanelProps>(
    ({ url, onQuote, onExplainSection }, ref) => {
        const [numPages, setNumPages] = useState<number | null>(null);
        const [containerWidth, setContainerWidth] = useState<number>(0);
        const scrollViewRef = useRef<ScrollView>(null);
        const [tocItems, setTocItems] = useState<any[]>([]);
        const [showTOC] = useState(true);
        const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

        // ✅ 페이지별 렌더링 높이 추적 (누적 offset 계산용)
        const pageHeightsRef = useRef<number[]>([]);
        const [pageHeightsReady, setPageHeightsReady] = useState(false);

        const sectionTextAccumulator = useRef<Map<string, string>>(new Map());
        const currentSectionId = useRef<string | null>(null);
        const currentSectionHeading = useRef<string>('');
        const globalTOCSeen = useRef<Set<string>>(new Set());

        // ✅ 페이지 n의 스크롤 상단 offset 계산
        // offset = paddingTop + sum(height[0..n-2]) + (n-1) * gap
        const getPageTopOffset = useCallback((pageNumber: number): number => {
            let offset = PAGE_PADDING;
            for (let i = 0; i < pageNumber - 1; i++) {
                offset += (pageHeightsRef.current[i] || 850) + PAGE_GAP;
            }
            return offset;
        }, []);

        useImperativeHandle(ref, () => ({
            scrollToPage: (page: number) => {
                const offset = getPageTopOffset(page);
                scrollViewRef.current?.scrollTo({ y: offset, animated: true });
            },
        }));

        function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
            setNumPages(numPages);
            setTocItems([]);
            globalTOCSeen.current.clear();
            sectionTextAccumulator.current.clear();
            currentSectionId.current = null;
            currentSectionHeading.current = '';
            pageHeightsRef.current = new Array(numPages).fill(0);
            setPageHeightsReady(false);
            StructureEngine.resetState();
            console.log(`📄 Document loaded: ${numPages} pages`);
        }

        // ✅ TOC 항목 클릭 → 해당 페이지 + 블록 y 위치로 정확하게 스크롤
        const handleTOCClick = useCallback((page: number, y: number) => {
            const pageTop = getPageTopOffset(page);
            // y는 블록의 페이지 내 픽셀 위치 (viewport 좌표)
            // 페이지 상단에서 y만큼 아래 = pageTop + y
            // 단, y가 페이지 높이보다 크면 clamp
            const pageH = pageHeightsRef.current[page - 1] || 850;
            const safeY = Math.min(y, pageH - 50);
            scrollViewRef.current?.scrollTo({ y: pageTop + safeY, animated: true });
        }, [getPageTopOffset]);

        const processPageBlocks = useCallback((blocks: Block[], pageNumber: number) => {
            const rawItems = StructureEngine.buildTOC(blocks, pageNumber);

            const freshItems = rawItems.filter(item => {
                const key = item.number
                    ? `num:${item.number}`
                    : `title:${item.title.toLowerCase().trim().substring(0, 60)}`;
                if (globalTOCSeen.current.has(key)) return false;
                globalTOCSeen.current.add(key);
                return true;
            });

            if (freshItems.length > 0) {
                setTocItems(prev => sortTOCItems([...prev, ...freshItems]));
            }

            for (const block of blocks) {
                if (block.type === 'heading') {
                    currentSectionId.current = block.id;
                    currentSectionHeading.current = block.text.split('\n')[0].trim();
                    sectionTextAccumulator.current.set(block.id, block.text + '\n');
                } else if (currentSectionId.current) {
                    const prev = sectionTextAccumulator.current.get(currentSectionId.current) || '';
                    sectionTextAccumulator.current.set(currentSectionId.current, prev + block.text + '\n');
                }
            }
        }, []);

        const getSectionText = (block: Block): string => {
            if (!block.sectionId) return block.text;
            return sectionTextAccumulator.current.get(block.sectionId) || block.text;
        };

        return (
            <View
                style={[styles.container, Platform.OS === 'web' && { userSelect: 'text', overflow: 'hidden' } as any]}
                onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
                {showTOC && (
                    <TableOfContents
                        items={tocItems}
                        onItemClick={handleTOCClick}
                        activeId={selectedBlockId || undefined}
                    />
                )}

                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={[styles.scrollContent, showTOC && { marginLeft: 220 }]}
                >
                    <Document
                        file={url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                            </View>
                        }
                        error={
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>PDF를 불러오지 못했습니다.</Text>
                            </View>
                        }
                    >
                        {Array.from(new Array(numPages || 0), (_, i) => (
                            <PDFBookPage
                                key={i + 1}
                                pageNumber={i + 1}
                                width={containerWidth > 200 ? containerWidth - 240 : 400}
                                selectedBlockId={selectedBlockId}
                                onLoadSuccess={(data: any) => {
                                    // ✅ 각 페이지 높이를 인덱스별로 저장
                                    if (data.height) {
                                        pageHeightsRef.current[i] = data.height;
                                        console.log(`📏 Page ${i + 1} height: ${data.height.toFixed(0)}px`);
                                    }
                                    if (data.blocks) {
                                        processPageBlocks(data.blocks, i + 1);
                                    }
                                }}
                                onBlockClick={(block: Block, event: any) => {
                                    setSelectedBlockId(block.id);
                                    if (onQuote) {
                                        const cx = event.pageX ?? event.clientX ?? 400;
                                        const cy = event.pageY ?? event.clientY ?? 300;
                                        onQuote(block.text, cx, cy, block.type, {
                                            sectionTitle: block.sectionTitle,
                                            sectionId: block.sectionId,
                                            sectionText: getSectionText(block),
                                        });
                                    }
                                }}
                                onSparkle={(block: Block, event: any) => {
                                    if (onExplainSection) {
                                        const sectionText = getSectionText(block);
                                        const cx = event.pageX ?? event.clientX ?? 400;
                                        const cy = event.pageY ?? event.clientY ?? 300;
                                        onExplainSection(sectionText, cx, cy, {
                                            sectionTitle: block.sectionTitle || block.text.split('\n')[0],
                                            heading: block.text.split('\n')[0].trim(),
                                        });
                                    }
                                }}
                            />
                        ))}
                    </Document>
                </ScrollView>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#525659' },
    scrollContent: { paddingVertical: PAGE_PADDING, alignItems: 'center', gap: PAGE_GAP },
    loadingContainer: { flex: 1, height: 200, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ef4444', fontSize: 14 },
});