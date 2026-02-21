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
    /** Called when a block is clicked or a ✨ sparkle button triggers explain/translate */
    onQuote?: (text: string, x: number, y: number, type?: string, context?: any) => void;
    /** Called when the ✨ sparkle on a section heading is clicked → triggers Explain panel */
    onExplainSection?: (text: string, x: number, y: number, context?: any) => void;
}

/**
 * Cross-page section accumulation:
 * We maintain a ref (currentSectionRef) that persists across page renders.
 * When a page loads, we process its blocks and:
 *   - If a block is a heading → flush the previous section, start a new one
 *   - Otherwise → accumulate paragraphs into the current open section
 *
 * The onSparkle callback in PDFBookPage delivers the FULL accumulated text
 * for that section (which may span multiple pages) to the Explain panel.
 */
export const PDFViewerPanel = forwardRef<PDFViewerRef, PDFViewerPanelProps>(
    ({ url, onQuote, onExplainSection }, ref) => {
        const [numPages, setNumPages] = useState<number | null>(null);
        const [containerWidth, setContainerWidth] = useState<number>(0);
        const scrollViewRef = useRef<ScrollView>(null);
        const [pageHeights, setPageHeights] = useState<number[]>([]);
        const [tocItems, setTocItems] = useState<any[]>([]);
        const [showTOC, setShowTOC] = useState(true);
        const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

        // Cross-page section accumulator
        // Maps section heading id → accumulated text across all pages
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
            // Reset cross-page state on new document
            sectionTextAccumulator.current.clear();
            currentSectionId.current = null;
            currentSectionHeading.current = '';
        }

        const handleTOCClick = (page: number, y: number) => {
            const pageHeight = pageHeights[0] || 850;
            scrollViewRef.current?.scrollTo({ y: (page - 1) * pageHeight + y, animated: true });
        };

        /**
         * Processes blocks from a newly loaded page.
         * Accumulates paragraph text into the current open section,
         * and starts a new section whenever a heading block is encountered.
         */
        const processPageBlocks = (blocks: Block[], pageNumber: number) => {
            // Update TOC
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

            // Accumulate section text cross-page
            for (const block of blocks) {
                if (block.headingLevel && block.headingLevel > 0) {
                    // New heading → start a new section
                    currentSectionId.current = block.id;
                    currentSectionHeading.current = block.text.split('\n')[0].trim();
                    // Initialize with heading text
                    sectionTextAccumulator.current.set(block.id, block.text + '\n');
                } else if (currentSectionId.current) {
                    // Paragraph → append to current section
                    const prev = sectionTextAccumulator.current.get(currentSectionId.current) || '';
                    sectionTextAccumulator.current.set(
                        currentSectionId.current,
                        prev + block.text + '\n'
                    );
                }
            }
        };

        /** Returns accumulated text for the section that owns the given block */
        const getSectionText = (block: Block): string => {
            if (!block.sectionId) return block.text;
            return sectionTextAccumulator.current.get(block.sectionId) || block.text;
        };

        return (
            <View
                style={[styles.container, Platform.OS === 'web' && { userSelect: 'text', overflow: 'hidden' } as any]}
                onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
                {/* TOC Sidebar */}
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
                                <Text style={styles.errorText}>Failed to load PDF.</Text>
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
                                            // Include accumulated section text as AI context
                                            sectionText: getSectionText(block),
                                        });
                                    }
                                }}
                                onSparkle={(block: Block, event: any) => {
                                    // ✨ Sparkle on heading → explain the FULL section
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
