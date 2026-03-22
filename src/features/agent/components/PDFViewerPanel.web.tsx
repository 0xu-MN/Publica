import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Document, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PDFBookPage } from './PDFBookPage';
import { Block } from '../utils/smartBlockEngine';
import { StructureEngine } from '../utils/StructureEngine';
import { TableOfContents } from './TableOfContents';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

// ✅ FIX: 하이브리드 아키텍처 (Vercel Serverless -> AWS EC2 Fallback)
// 내부 함수에서 두 곳을 순차적으로 찌릅니다.

async function fetchPythonTOC(url: string) {
    try {
        console.log("🚀 [Hybrid] 1단계: 파싱 요청 시작 (URL 가독화 중...)");
        const pdfRes = await fetch(url);
        const pdfBlob = await pdfRes.blob();

        const formData = new FormData();
        formData.append('file', pdfBlob, 'document.pdf');

        // B안: Vercel 프록시 (또는 Vercel Serverless) 먼저 찌르기
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const primaryUrl = isHttps ? '/api/parse-pdf' : 'http://localhost:8001/api/parse-pdf';
        const fallbackUrl = 'https://publica-insightflow.loca.lt/api/parse-pdf'; // A안: EC2 영구 서버 (최후의 보루) -> 임시 로컬터널 우회

        try {
            console.log(`⚡ [Hybrid] 1차 시도 (B안 - 15초 제한 Vercel): ${primaryUrl}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // Vercel 한계치 직전인 12초에서 끊음

            const parseRes = await fetch(primaryUrl, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!parseRes.ok) {
                throw new Error(`1차 시도 실패 상태코드: ${parseRes.status}`);
            }

            const data = await parseRes.json();
            console.log(`✅ [Hybrid] 1차(Vercel) 성공: ${data.toc?.length}개 항목`);
            return data;

        } catch (error) {
            console.warn(`⚠️ [Hybrid] 1차 시도 실패(타임아웃/오류). 즉시 A안(EC2 소화기)으로 전환합니다!`, error);

            // A안: EC2 서버로 재요청 (무제한 대기)
            console.log(`🚒 [Hybrid] 2차 시도 (A안 - EC2 무적 서버): ${fallbackUrl}`);
            const fallbackRes = await fetch(fallbackUrl, {
                method: 'POST',
                body: formData,
            });

            if (!fallbackRes.ok) {
                throw new Error(`2차 시도까지 모두 실패 상태코드: ${fallbackRes.status}`);
            }

            const data = await fallbackRes.json();
            console.log(`🏆 [Hybrid] 2차(EC2) 구조대 성공: ${data.toc?.length}개 항목`);
            return data;
        }
    } catch (error) {
        console.error('❌ [Hybrid] 모든 파이썬 서버 파싱 완전 실패:', error);
        return null;
    }
}

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
        const [showTOC, setShowTOC] = useState(true);
        const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
        const [parserError, setParserError] = useState(false);

        // 페이지별 높이 추적
        const pageHeightsRef = useRef<number[]>([]);

        // 클라이언트 파싱용 섹션 텍스트 누적
        const sectionTextAccumulator = useRef<Map<string, string>>(new Map());
        const currentSectionId = useRef<string | null>(null);
        const currentSectionHeading = useRef<string>('');
        const globalTOCSeen = useRef<Set<string>>(new Set());

        // ✅ FIX: serverMode를 ref로 관리 (클로저 문제 해결)
        // state는 UI 표시용, ref는 callback 내부 판단용
        const serverModeRef = useRef(false);
        const [serverMode, setServerMode] = useState(false);
        const serverSectionsRef = useRef<Record<string, string>>({});
        const serverTOCRef = useRef<any[]>([]);

        // ✅ FIX: 서버 데이터 로드 여부 추적 (onDocumentLoadSuccess가 TOC 지우는 것 방지)
        const serverDataLoadedRef = useRef(false);

        // URL이 바뀌면 초기화
        const prevUrlRef = useRef<string>('');

        useEffect(() => {
            if (!url || url === prevUrlRef.current) return;
            prevUrlRef.current = url;

            // 초기화
            serverModeRef.current = false;
            serverDataLoadedRef.current = false;
            setServerMode(false);
            setParserError(false);
            serverSectionsRef.current = {};
            serverTOCRef.current = [];

            fetchPythonTOC(url).then(res => {
                if (res && res.toc && res.toc.length > 0) {
                    console.log(`✅ 서버 TOC 로드: ${res.toc.length}개`);
                    console.log(`🔍 서버 TOC 첫 15개:`, res.toc.slice(0, 15).map((t: any) => `${t.id}: ${t.title}`));
                    serverModeRef.current = true;
                    serverDataLoadedRef.current = true;
                    setServerMode(true);
                    serverSectionsRef.current = res.sections || {};
                    serverTOCRef.current = res.toc;
                    // ✅ 서버 TOC를 즉시 적용 (onDocumentLoadSuccess보다 나중에 올 수도 있음)
                    setTocItems(res.toc);
                } else {
                    console.log("⚠️ Python 서버 결과 없음 → 클라이언트 파싱으로 전환");
                    if (!res) {
                        setParserError(true); // 통신 실패 또는 에러 시
                    }
                    serverModeRef.current = false;
                    serverDataLoadedRef.current = false;
                    setServerMode(false);
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

            // ✅ FIX: 서버 데이터가 이미 로드된 경우 TOC를 지우지 않음
            if (!serverDataLoadedRef.current) {
                setTocItems([]);
                globalTOCSeen.current.clear();
            } else {
                // 서버 TOC가 이미 있으면 다시 적용 (혹시 race condition으로 비워진 경우 복원)
                setTocItems(serverTOCRef.current);
                console.log(`📋 서버 TOC 복원: ${serverTOCRef.current.length}개`);
            }

            sectionTextAccumulator.current.clear();
            currentSectionId.current = null;
            currentSectionHeading.current = '';
            pageHeightsRef.current = new Array(numPages).fill(0);
            StructureEngine.resetState();
            console.log(`📄 Document loaded: ${numPages}p, serverMode: ${serverModeRef.current}`);
        }

        const handleTOCClick = useCallback((page: number, y: number) => {
            const pageTop = getPageTopOffset(page);
            const pageH = pageHeightsRef.current[page - 1] || 850;
            const safeY = Math.min(y, pageH - 50);
            scrollViewRef.current?.scrollTo({ y: pageTop + safeY, animated: true });
        }, [getPageTopOffset]);

        const processPageBlocks = useCallback((blocks: Block[], pageNumber: number) => {
            // 섹션 텍스트 누적 시, 서버 모드라면 서버 TOC 아이템(거리 기반)으로 ID를 매핑하여 누적
            for (const block of blocks) {
                let targetId = block.id;

                // 만약 서버 모드라면, 현재 block의 y 좌표와 가장 가까운 위쪽 서버 TOC 아이템을 찾음
                if (serverModeRef.current && serverTOCRef.current.length > 0) {
                    const pageTOCs = serverTOCRef.current.filter(t => t.page === pageNumber);
                    if (pageTOCs.length > 0) {
                        // y 좌표 기준 내림차순 정렬 (아래에서 위로 탐색)
                        const sorted = [...pageTOCs].sort((a, b) => b.y - a.y);
                        const closest = sorted.find(t => t.y <= block.y + 10);
                        if (closest) {
                            targetId = closest.id;
                        } else {
                            targetId = sorted[sorted.length - 1].id; // 가장 위에 있는 항목
                        }
                    }
                }

                if (block.type === 'heading') {
                    currentSectionId.current = targetId;
                    currentSectionHeading.current = block.text.split('\n')[0].trim();
                    sectionTextAccumulator.current.set(targetId, block.text + '\n');
                } else if (currentSectionId.current) {
                    const prev = sectionTextAccumulator.current.get(currentSectionId.current) || '';
                    if (prev.length < 8000) {
                        sectionTextAccumulator.current.set(currentSectionId.current, prev + block.text + '\n');
                    }
                }
            }

            // 서버 데이터가 이미 로드완료된 상태라면 클라이언트 TOC 추가 건너뜀
            if (serverDataLoadedRef.current) return;

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
        }, []); // ✅ deps 없음 - ref 기반이라 클로저 문제 없음

        const handlePageLoadSuccess = useCallback(async (data: any, pageIndex: number) => {
            const pageNumber = pageIndex + 1;
            if (data.height) {
                pageHeightsRef.current[pageIndex] = data.height;
            }
            if (data.blocks) {
                processPageBlocks(data.blocks, pageNumber);
            }
        }, [processPageBlocks]);

        // 클라이언트 섹션 텍스트 가져오기
        const getSectionText = (block: Block): string => {
            if (block.sectionId && sectionTextAccumulator.current.has(block.sectionId)) {
                return sectionTextAccumulator.current.get(block.sectionId) || block.text;
            }
            return block.text;
        };

        // 서버 섹션 텍스트 가져오기 (✨ 버튼 클릭 시)
        const findServerSectionText = useCallback((y: number, page: number): string => {
            if (!serverModeRef.current || !serverTOCRef.current.length) return "";
            const sorted = [...serverTOCRef.current].sort((a, b) =>
                a.page !== b.page ? a.page - b.page : a.y - b.y
            );
            let targetId = sorted[0]?.id || "";
            for (const item of sorted) {
                if (item.page < page || (item.page === page && item.y <= y + 20)) {
                    targetId = item.id;
                } else {
                    break;
                }
            }
            return serverSectionsRef.current[targetId] || "";
        }, []);

        return (
            <View
                style={[styles.container, Platform.OS === 'web' && { userSelect: 'text', overflow: 'hidden' } as any]}
                onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
                {parserError && (
                    <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, backgroundColor: 'rgba(239, 68, 68, 0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>⚠️ AI 문서 분석 서버 접속 실패</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginLeft: 8 }}>기본 클라이언트 파싱 모드로 작동 중입니다.</Text>
                    </View>
                )}

                {/* TOC Toggle Button */}
                <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 1001 } as any}>
                    <TouchableOpacity
                        onPress={() => setShowTOC(!showTOC)}
                        style={{ backgroundColor: showTOC ? '#1E293B' : '#0F172A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#334155', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                        <Text style={{ color: showTOC ? '#10B981' : '#64748B', fontSize: 11, fontWeight: '700' }}>
                            {showTOC ? '📑 목차 닫기' : '📑 목차'}
                        </Text>
                    </TouchableOpacity>
                </View>

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
                                serverTOCItems={tocItems.filter(t => t.page === i + 1)}
                                onLoadSuccess={(data: any) => handlePageLoadSuccess(data, i)}
                                onBlockClick={(block: Block, event: any) => {
                                    setSelectedBlockId(block.id);
                                    if (onQuote) {
                                        const cx = event.clientX ?? event.pageX ?? 400;
                                        const cy = event.clientY ?? event.pageY ?? 300;
                                        const sectionText = serverModeRef.current
                                            ? findServerSectionText(block.y, i + 1)
                                            : getSectionText(block);
                                        onQuote(block.text, cx, cy, block.type, {
                                            sectionTitle: block.sectionTitle,
                                            sectionId: block.sectionId,
                                            sectionText,
                                            heading: block.text.split('\n')[0].trim(),
                                        });
                                    }
                                }}
                                onSparkle={(info: { id?: string; y: number; text: string; type: string }, event: any) => {
                                    if (onQuote) {
                                        const cx = event.clientX ?? event.pageX ?? 400;
                                        const cy = event.clientY ?? event.pageY ?? 300;

                                        // 🌟 FIX: 서버에서 넘겨받은 뭉텅이 텍스트(페이지 전체)를 버리고, 프론트엔드 TextBlock 구조를 통해 축적된 "정확한 섹션 본문"만 사용함
                                        // info.id 가 서버 TOC id이므로 이를 기반으로 누적된 텍스트를 찾거나, 없으면 클라이언트 fallback 활용
                                        let sectionText = info.text;
                                        if (info.id && sectionTextAccumulator.current.has(info.id)) {
                                            sectionText = sectionTextAccumulator.current.get(info.id) || info.text;
                                        } else {
                                            // Fallback: y 좌표 기반 가장 가까운 섹션 텍스트 찾기
                                            // StructureEngine.buildTOC 에서 생성된 클라이언트 사이드 id 중 가장 가까운 것
                                            const closestId = currentSectionId.current;
                                            if (closestId && sectionTextAccumulator.current.has(closestId)) {
                                                sectionText = sectionTextAccumulator.current.get(closestId) || info.text;
                                            }
                                        }

                                        onQuote(sectionText, cx, cy, 'heading', {
                                            sectionTitle: info.text,
                                            heading: info.text.trim(),
                                            sectionText,
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