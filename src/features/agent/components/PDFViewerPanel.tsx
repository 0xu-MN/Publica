import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
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

export const PDFViewerPanel = forwardRef<PDFViewerRef, PDFViewerPanelProps>(
    ({ url, onQuote, onExplainSection }, ref) => {
        const [numPages, setNumPages] = useState<number | null>(null);
        const [containerWidth, setContainerWidth] = useState<number>(0);
        const scrollViewRef = useRef<ScrollView>(null);
        const [pageHeights, setPageHeights] = useState<number[]>([]);
        const [tocItems, setTocItems] = useState<any[]>([]);
        const [showTOC, setShowTOC] = useState(true);
        const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

        // 크로스페이지 섹션 누적
        const sectionTextAccumulator = useRef<Map<string, string>>(new Map());
        const currentSectionId = useRef<string | null>(null);
        const currentSectionHeading = useRef<string>('');

        useImperativeHandle(ref, () => ({
            scrollToPage: (page: number) => {
                if (page < 1 || page > (numPages || 1)) return;
                const pageHeight = pageHeights[0] || 850;
                scrollViewRef.current?.scrollTo({ y: (page - 1) * pageHeight, animated: true });
            },
        }));

        function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
            setNumPages(numPages);
            setTocItems([]);

            // ✅ 새 문서 로드 시 전역 상태 초기화
            StructureEngine.resetState();
            sectionTextAccumulator.current.clear();
            currentSectionId.current = null;
            currentSectionHeading.current = '';

            console.log(`📄 Document loaded: ${numPages} pages`);
        }

        const handleTOCClick = (page: number, y: number) => {
            const pageHeight = pageHeights[0] || 850;
            scrollViewRef.current?.scrollTo({ y: (page - 1) * pageHeight + y, animated: true });
        };

        const processPageBlocks = (blocks: Block[], pageNumber: number) => {
            // TOC 업데이트
            const newTOCItems = StructureEngine.buildTOC(blocks, pageNumber);
            if (newTOCItems.length > 0) {
                setTocItems(prev => {
                    const merged = [...prev, ...newTOCItems];
                    const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
                    return unique.sort((a, b) =>
                        a.page !== b.page ? a.page - b.page : a.y - b.y
                    );
                });
            }

            // ✅ block.type === 'heading' 으로 판정 (headingLevel 아님)
            for (const block of blocks) {
                if (block.type === 'heading') {
                    currentSectionId.current = block.id;
                    currentSectionHeading.current = block.text.split('\n')[0].trim();
                    sectionTextAccumulator.current.set(block.id, block.text + '\n');
                } else if (currentSectionId.current) {
                    const prev = sectionTextAccumulator.current.get(currentSectionId.current) || '';
                    sectionTextAccumulator.current.set(
                        currentSectionId.current,
                        prev + block.text + '\n'
                    );
                }
            }
        };

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
                                    if (i === 0) setPageHeights(prev => [data.height, ...prev.slice(1)]);
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
    scrollContent: { paddingVertical: 20, alignItems: 'center' },
    loadingContainer: { flex: 1, height: 200, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ef4444', fontSize: 14 },
});