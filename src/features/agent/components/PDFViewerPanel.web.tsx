import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Document, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PDFBookPage } from './PDFBookPage';
import { Block } from '../utils/smartBlockEngine';
import { StructureEngine } from '../utils/StructureEngine';
import { TableOfContents } from './TableOfContents';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

// ─── API 설정 ──────────────────────────────────────────────────────────
const PYTHON_PARSER_URL = 'http://127.0.0.1:8000/api/parse-pdf';

async function fetchPythonTOC(url: string) {
    try {
        console.log("🚀 Python 서버로 PDF 분석 요청 시작:", url);
        // 1. URL에서 PDF 다운로드 (Blob)
        const pdfRes = await fetch(url);
        const pdfBlob = await pdfRes.blob();

        // 2. FormData 생성
        const formData = new FormData();
        formData.append('file', pdfBlob, 'document.pdf');

        // 3. 서버로 전송
        const res = await fetch(PYTHON_PARSER_URL, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        console.log("✅ Python 서버 분석 완료:", data);
        return data; // { numPages, toc, sections }
    } catch (e) {
        console.error("❌ Python 파서 실패:", e);
        return null;
    }
}

// ─── 기존 유틸 ────────────────────────────────────────────────────────────────

export interface PDFViewerRef {
    scrollToPage: (page: number) => void;
}

interface PDFViewerPanelProps {
    url: string;
    onQuote?: (text: string, x: number, y: number, type?: string, context?: any) => void;
    onExplainSection?: (text: string, x: number, y: number, context?: any) => void;
}

const PAGE_GAP = 8;
const PAGE_PADDING = 20;

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

        // ✅ 페이지별 높이 추적
        const pageHeightsRef = useRef<number[]>([]);
        const sectionTextAccumulator = useRef<Map<string, string>>(new Map());
        const currentSectionId = useRef<string | null>(null);
        const currentSectionHeading = useRef<string>('');
        const globalTOCSeen = useRef<Set<string>>(new Set());

        // Server TOC
        const [serverMode, setServerMode] = useState(false);
        const serverSectionsRef = useRef<Record<string, string>>({});

        useEffect(() => {
            if (!url) return;

            // 파일이 바뀌면 파이썬 서버로 파싱 요청
            fetchPythonTOC(url).then(res => {
                if (res && res.toc && res.toc.length > 0) {
                    setServerMode(true);
                    setTocItems(res.toc);
                    if (res.sections) {
                        serverSectionsRef.current = res.sections;
                    }
                } else {
                    setServerMode(false);
                    console.log("⚠️ Python 서버 실패 또는 결과 없음. 기존 클라이언트 텍스트 기반 파싱으로 전환 (Fallback).");
                }
            });
        }, [url]);

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
            StructureEngine.resetState();
            console.log(`📄 Document loaded: ${numPages} pages. Server Mode: ${serverMode}`);
        }

        const handleTOCClick = useCallback((page: number, y: number) => {
            const pageTop = getPageTopOffset(page);
            const pageH = pageHeightsRef.current[page - 1] || 850;
            const safeY = Math.min(y, pageH - 50);
            scrollViewRef.current?.scrollTo({ y: pageTop + safeY, animated: true });
        }, [getPageTopOffset]);

        // ✅ 기존 텍스트 기반 TOC 처리 (서버 파서 실패 시 폴백)
        const processPageBlocks = useCallback((blocks: Block[], pageNumber: number) => {
            // 서버 모드면 클라이언트 파싱 건너뜀
            if (serverMode) return;

            // 서버 미사용 또는 실패 시: 기존 텍스트 기반 TOC
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
        }, [serverMode]);

        // 섹션 텍스트 가져오기 (서버 데이터 우선, 없으면 클라이언트 fallback 데이터)
        const getSectionText = (block: Block): string => {
            // 서버 문서 데이터가 존재한다면 (섹션 ID 매칭은 복잡하므로) 가장 가까운 블록 텍스트라도 반환
            // 현재 block id는 fallback에서만 쓰이므로, 서버 모드 시 block 기반 검색은 제한적일 수 있음
            // ExplanationPopover에서 전체 텍스트를 사용할 수 있도록 보장
            if (block.sectionId && sectionTextAccumulator.current.has(block.sectionId)) {
                return sectionTextAccumulator.current.get(block.sectionId) || block.text;
            }

            // 만약 서버 모드인데 정확한 섹션 매칭이 어렵다면, 가장 가까운 큰 섹션 텍스트를 던져줌 (간단한 구현)
            if (serverMode && Object.keys(serverSectionsRef.current).length > 0) {
                // 그냥 가장 긴 섹션을 주입하거나 전체를 주입 (AI가 맥락 파악하기 위함)
                // 백엔드 toc item.id 값을 찾아서 넘겨주는 처리가 필요하지만 일단 단일 블록 text라도 안전하게 반환
                return block.text;
            }
            return block.text;
        };

        // 전체 컨텍스트를 찾아주는 헬퍼
        const findServerSectionText = (y: number, page: number) => {
            if (!serverMode || !tocItems.length) return "";

            // 클릭한 Y좌표 기준으로 가장 가까운 상단 TOC 항목 찾기
            let targetId = tocItems[0].id;
            for (const item of tocItems) {
                if (item.page < page) continue;
                if (item.page > page) break;
                if (item.y <= y + 20) {
                    targetId = item.id;
                }
            }

            return serverSectionsRef.current[targetId] || "";
        }

        // ✅ 페이지 렌더 완료 시
        const handlePageLoadSuccess = useCallback(async (data: any, pageIndex: number) => {
            const pageNumber = pageIndex + 1;

            if (data.height) {
                pageHeightsRef.current[pageIndex] = data.height;
            }

            if (data.blocks) {
                processPageBlocks(data.blocks, pageNumber);
            }
        }, [processPageBlocks]);

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
                                onLoadSuccess={(data: any) => handlePageLoadSuccess(data, i)}
                                onBlockClick={(block: Block, event: any) => {
                                    setSelectedBlockId(block.id);
                                    if (onQuote) {
                                        const cx = event.pageX ?? event.clientX ?? 400;
                                        const cy = event.pageY ?? event.clientY ?? 300;
                                        onQuote(block.text, cx, cy, block.type, {
                                            sectionTitle: block.sectionTitle,
                                            sectionId: block.sectionId,
                                            sectionText: serverMode ? findServerSectionText(block.y, i + 1) : getSectionText(block),
                                        });
                                    }
                                }}
                                onSparkle={(block: Block, event: any) => {
                                    if (onExplainSection) {
                                        const sectionText = serverMode ? findServerSectionText(block.y, i + 1) : getSectionText(block);
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