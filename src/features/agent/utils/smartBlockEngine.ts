import { StructureEngine } from './StructureEngine';

export interface Block {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    type: 'paragraph' | 'heading' | 'list-item' | 'figure' | 'formula';
    citations?: string[];
    sectionId?: string;
    sectionTitle?: string;
    headingLevel?: number;
}

/**
 * SmartBlockEngine v7.4
 * 핵심 수정:
 * 1. heading 감지를 폰트 크기 기반으로 변경
 *    - 기존: bold 폰트명 || 숫자로 시작 → PDF에서 폰트명이 인코딩돼서 bold 감지 실패
 *    - 수정: 본문 평균 폰트보다 10% 이상 크면 heading으로 판정
 * 2. bodyFontSize를 clusterToBlocks → blockFromSegments로 전달
 */
export class SmartBlockEngine {
    constructor() {
        console.log('🚀 SmartBlockEngine v7.4 initialized');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC
    // ─────────────────────────────────────────────────────────────────────────

    static processPage(textItems: any[], viewport: any): Block[] {
        if (!textItems || textItems.length === 0) return [];

        const rects = textItems
            .filter(item => item.str && item.str.trim().length > 0)
            .map(item => this.normalizeItem(item, viewport));

        if (rects.length === 0) return [];

        const sorted = [...rects].sort((a, b) => {
            const dy = a.y - b.y;
            if (Math.abs(dy) < 2) return a.x - b.x;
            return dy;
        });

        const pageWidth = viewport.width;
        const columnBoundaries = this.detectColumnBoundaries(sorted, pageWidth);
        console.log('📐 Column boundaries:', columnBoundaries, 'pageWidth:', pageWidth.toFixed(0));

        const rectsWithCol = sorted.map(r => ({
            ...r,
            col: this.getColumnIndex(r.x, columnBoundaries)
        }));

        const segments = this.createLineSegments(rectsWithCol);
        const stats = this.calcPageStats(segments);

        // ✅ stats를 clusterToBlocks로 전달 (bodyFontSize 기반 heading 감지에 필요)
        const blocks = this.clusterToBlocks(segments, stats, columnBoundaries, pageWidth);
        const finalBlocks = this.splitOverWideBlocks(blocks, columnBoundaries, pageWidth);
        const enriched = finalBlocks.map(b => this.enrich(b));
        return StructureEngine.analyzeStructure(enriched);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COLUMN DETECTION v7.4 (임계값 완화 유지)
    // ─────────────────────────────────────────────────────────────────────────
    private static detectColumnBoundaries(rects: any[], pageWidth: number): number[] {
        const BUCKET = 6;
        const bucketCount = Math.ceil(pageWidth / BUCKET);
        const hist = new Array(bucketCount).fill(0);

        for (const r of rects) {
            const b = Math.min(Math.floor(r.x / BUCKET), bucketCount - 1);
            hist[b]++;
        }

        const smooth = hist.map((_, i) => {
            let sum = 0, cnt = 0;
            for (let j = Math.max(0, i - 2); j <= Math.min(bucketCount - 1, i + 2); j++) {
                sum += hist[j]; cnt++;
            }
            return sum / cnt;
        });

        const maxVal = Math.max(...smooth);
        if (maxVal === 0) return [0];

        const peakThreshold = maxVal * 0.12;
        const minSepBuckets = Math.floor(pageWidth * 0.15 / BUCKET);
        const peaks: number[] = [];

        for (let i = 1; i < bucketCount - 1; i++) {
            if (smooth[i] < peakThreshold) continue;
            if (smooth[i] < smooth[i - 1] || smooth[i] < smooth[i + 1]) continue;
            if (peaks.length > 0 && i - peaks[peaks.length - 1] < minSepBuckets) continue;
            peaks.push(i);
        }

        if (peaks.length >= 2) {
            const leftPeakX = peaks[0] * BUCKET;
            const rightPeakX = peaks[1] * BUCKET;

            const minRightPx = Math.max(pageWidth * 0.20, 40);
            const maxRightPx = pageWidth * 0.80;

            if (rightPeakX < minRightPx || rightPeakX > maxRightPx) {
                console.log(`📊 Single-col: right peak ${rightPeakX.toFixed(0)}px out of range [${minRightPx.toFixed(0)}, ${maxRightPx.toFixed(0)}]`);
                return [0];
            }

            const valleyVal = Math.min(...smooth.slice(peaks[0], peaks[1] + 1));
            if (valleyVal > maxVal * 0.35) {
                console.log(`📊 Single-col: valley too high (${valleyVal.toFixed(1)} vs max ${maxVal.toFixed(1)})`);
                return [0];
            }

            const splitX = Math.round((peaks[0] + peaks[1]) / 2) * BUCKET;
            console.log(`📊 2-col detected: L=${leftPeakX.toFixed(0)}px R=${rightPeakX.toFixed(0)}px split=${splitX.toFixed(0)}px`);
            return [0, splitX];
        }

        console.log('📊 Single-col page');
        return [0];
    }

    private static getColumnIndex(x: number, boundaries: number[]): number {
        for (let i = boundaries.length - 1; i >= 0; i--) {
            if (x >= boundaries[i]) return i;
        }
        return 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LINE SEGMENTATION
    // ─────────────────────────────────────────────────────────────────────────
    private static createLineSegments(rects: any[]): any[] {
        const segments: any[] = [];
        let current: any[] = [];

        for (const rect of rects) {
            if (current.length === 0) { current.push(rect); continue; }

            const last = current[current.length - 1];
            const lineH = Math.min(rect.height, last.height);
            const isSameLine = Math.abs(rect.y - last.y) < lineH * 0.4;
            const isSameCol = rect.col === last.col;
            const notOverlap = rect.x >= last.x - 2;

            if (isSameLine && isSameCol && notOverlap) {
                current.push(rect);
            } else {
                segments.push(this.makeSegment(current));
                current = [rect];
            }
        }
        if (current.length > 0) segments.push(this.makeSegment(current));
        return segments;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE STATISTICS
    // ─────────────────────────────────────────────────────────────────────────
    private static calcPageStats(segments: any[]) {
        if (segments.length < 2) return { medianHeight: 12, medianGap: 3, bodyFontSize: 12 };

        const heights = segments.map((s: any) => s.height);
        const sorted = [...segments].sort((a: any, b: any) => a.y - b.y);
        const gaps: number[] = [];

        for (let i = 1; i < sorted.length; i++) {
            const curr = sorted[i], prev = sorted[i - 1];
            if (curr.col !== prev.col) continue;
            const xOverlap =
                Math.min(curr.x + curr.width, prev.x + prev.width) -
                Math.max(curr.x, prev.x);
            if (xOverlap > 10) {
                const g = curr.y - (prev.y + prev.height);
                if (g > 0 && g < 60) gaps.push(g);
            }
        }

        const median = (arr: number[]) => {
            if (!arr.length) return 0;
            const s = [...arr].sort((a, b) => a - b);
            return s[Math.floor(s.length / 2)];
        };

        const medianHeight = median(heights) || 12;
        const medianGap = median(gaps) || 3;

        // bodyFontSize: 가장 많이 등장하는 폰트 크기 = 본문 기준
        const freq = new Map<number, number>();
        heights.forEach((h: number) => {
            const k = Math.round(h);
            freq.set(k, (freq.get(k) || 0) + 1);
        });
        const bodyFontSize = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || medianHeight;

        console.log(`📝 Page stats: bodyFontSize=${bodyFontSize}, medianHeight=${medianHeight.toFixed(1)}, medianGap=${medianGap.toFixed(1)}`);

        return { medianHeight, medianGap, bodyFontSize };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VERTICAL CLUSTERING
    // ─────────────────────────────────────────────────────────────────────────
    private static clusterToBlocks(
        segments: any[],
        stats: { medianHeight: number; medianGap: number; bodyFontSize: number },
        columnBoundaries: number[] = [0],
        pageWidth: number = 9999
    ): Block[] {
        const { medianHeight, medianGap } = stats;
        const maxParaGap = Math.max((medianHeight + medianGap) * 1.3, medianHeight * 1.6, 8);

        const openBlocks: { items: any[]; lastSeg: any }[] = [];

        for (const seg of segments) {
            let matched = -1;

            for (let i = openBlocks.length - 1; i >= 0; i--) {
                const blk = openBlocks[i];
                const last = blk.lastSeg;

                if (seg.col !== last.col) continue;

                const vGap = seg.y - (last.y + last.height);
                if (vGap < -2 || vGap > maxParaGap) continue;

                const segFont = seg.avgFontSize || seg.height;
                const lastFont = last.avgFontSize || last.height;
                const ratio = segFont / lastFont;
                if (ratio < 0.85 || ratio > 1.15) continue;

                const leftDiff = Math.abs(seg.x - last.x);
                const rightDiff = Math.abs((seg.x + seg.width) - (last.x + last.width));
                const centDiff = Math.abs((seg.x + seg.width / 2) - (last.x + last.width / 2));
                if (leftDiff > 50 && rightDiff > 50 && centDiff > 30) continue;

                matched = i;
                break;
            }

            if (matched !== -1) {
                openBlocks[matched].items.push(seg);
                openBlocks[matched].lastSeg = seg;
            } else {
                openBlocks.push({ items: [seg], lastSeg: seg });
            }
        }

        return openBlocks
            .map(blk => {
                const colIdx = blk.items[0]?.col ?? 0;
                const colStart = columnBoundaries[colIdx] ?? 0;
                const colEnd = columnBoundaries[colIdx + 1]
                    ? columnBoundaries[colIdx + 1] - 2
                    : pageWidth;
                // ✅ bodyFontSize를 전달해서 폰트 크기 기반 heading 감지
                return this.blockFromSegments(blk.items, colStart, colEnd, stats.bodyFontSize);
            })
            .sort((a, b) => {
                if (a.x < b.x - 20 && b.x > pageWidth * 0.4) return -1;
                if (b.x < a.x - 20 && a.x > pageWidth * 0.4) return 1;
                return a.y - b.y;
            });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST-PROCESS: split blocks that span both columns
    // ─────────────────────────────────────────────────────────────────────────
    private static splitOverWideBlocks(
        blocks: Block[], columnBoundaries: number[], pageWidth: number
    ): Block[] {
        if (columnBoundaries.length < 2) return blocks;

        const splitX = columnBoundaries[1];
        const result: Block[] = [];

        for (const block of blocks) {
            const isTooWide = block.width > pageWidth * 0.55;
            const isHeading = block.type === 'heading';
            const startsLeft = block.x < splitX - 10;
            const endsRight = block.x + block.width > splitX + 10;

            if (isTooWide && !isHeading && startsLeft && endsRight) {
                const lines = block.text.split('\n');
                const mid = Math.ceil(lines.length / 2);

                const leftBlock: Block = {
                    ...block,
                    id: `${block.id}-L`,
                    width: splitX - block.x - 4,
                    text: lines.slice(0, mid).join('\n') || block.text,
                };
                const rightBlock: Block = {
                    ...block,
                    id: `${block.id}-R`,
                    x: splitX + 4,
                    width: (block.x + block.width) - splitX - 4,
                    text: lines.slice(mid).join('\n') || block.text,
                };

                if (leftBlock.width > 20) result.push(leftBlock);
                if (rightBlock.width > 20) result.push(rightBlock);
                console.log(`✂️ Split over-wide at X=${splitX}: "${block.text.substring(0, 40)}"`);
            } else {
                result.push(block);
            }
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private static normalizeItem(item: any, viewport: any) {
        const tx = item.transform;
        const [x, y] = viewport.convertToViewportPoint(tx[4], tx[5]);
        const w = item.width * viewport.scale;
        const h = item.height * viewport.scale;
        return {
            text: item.str,
            x,
            y: y - h,
            width: w,
            height: h,
            fontName: item.fontName,
            col: 0
        };
    }

    private static makeSegment(items: any[]): any {
        const xs = items.map((i: any) => i.x);
        const xe = items.map((i: any) => i.x + i.width);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xe);
        const y = Math.min(...items.map((i: any) => i.y));
        const height = Math.max(...items.map((i: any) => i.height));
        const text = items.map((i: any) => i.text).join(' ');
        const avgFontSize = items.reduce((s: number, i: any) => s + i.height, 0) / items.length;
        const col = items[0].col;
        return { x: minX, y, width: maxX - minX, height, text, items, avgFontSize, col };
    }

    // ✅ 핵심 수정: bodyFontSize 파라미터 추가, 폰트 크기 기반 heading 감지
    private static blockFromSegments(
        segs: any[],
        colStart: number = 0,
        colEnd: number = 9999,
        bodyFontSize: number = 12
    ): Block {
        const minX = Math.max(Math.min(...segs.map((s: any) => s.x)), colStart);
        const minY = Math.min(...segs.map((s: any) => s.y));
        const rawMaxX = Math.max(...segs.map((s: any) => s.x + s.width));
        const maxX = Math.min(rawMaxX, colEnd);
        const maxY = Math.max(...segs.map((s: any) => s.y + s.height));
        const fullText = segs.map((s: any) => s.text).join('\n');
        const avgFont = segs.reduce((s: number, seg: any) => s + (seg.avgFontSize || seg.height), 0) / segs.length;

        // ✅ heading 판정 기준 (3가지 중 하나라도 해당하면 heading)
        // 1. bold/heavy 폰트명 (인코딩 안 된 경우)
        const hasBold = segs.some((s: any) => s.items?.some((i: any) => /bold|heavy|black/i.test(i.fontName || '')));
        // 2. 숫자/로마자로 시작하는 섹션 번호 (예: "2.3 Cell culture")
        const isNumbered = /^(?:\d+(?:\.\d+)*\.?\s|[IVX]{1,5}\.\s)/.test(fullText.trim());
        // 3. ✅ 신규: 본문 폰트보다 10% 이상 크면 heading (폰트 인코딩 무관)
        const isLargerFont = avgFont > bodyFontSize * 1.10;

        const isHeading = hasBold || isNumbered || isLargerFont;

        if (isHeading) {
            console.log(`🏷️ Heading detected: "${fullText.trim().substring(0, 40)}" (font: ${avgFont.toFixed(1)} vs body: ${bodyFontSize})`);
        }

        return {
            id: `blk-${Math.random().toString(36).substr(2, 8)}`,
            text: fullText,
            x: minX,
            y: minY,
            width: Math.max(maxX - minX, 1),
            height: maxY - minY,
            fontSize: avgFont,
            type: isHeading ? 'heading' : 'paragraph',
            citations: []
        };
    }

    private static enrich(block: Block): Block {
        const t = block.text.trim();
        if (/^(?:fig(?:ure)?|table)\.?\s*\d+/i.test(t)) return { ...block, type: 'figure' };
        const isMath = t.includes('$') || t.includes('\\(') || t.includes('\\[') || t.includes('\\begin{equation}');
        if (isMath) return { ...block, type: 'formula' };

        const citationRx = /\[\d+(?:-\d+)?(?:,\s*\d+)*\]|\[\w+\s*\d+\]/g;
        return { ...block, citations: t.match(citationRx) || [] };
    }

    static extractHeadings(blocks: Block[]) {
        return blocks
            .filter(b => b.type === 'heading')
            .map(b => ({ id: b.id, title: b.text.trim(), y: b.y }));
    }
}