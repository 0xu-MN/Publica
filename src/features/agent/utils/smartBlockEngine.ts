import { StructureEngine } from './StructureEngine';

export interface Block {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    type: 'paragraph' | 'heading' | 'list-item' | 'figure' | 'formula' | 'table-cell';
    citations?: string[];
    sectionId?: string;
    sectionTitle?: string;
    headingLevel?: number;
    readingOrder?: number;
    isTableCell?: boolean;
}

/**
 * SmartBlockEngine v9
 * 핵심 수정:
 * "1 사업 개요" 같은 박스형 제목에서 "1" (박스)과 "사업 개요" (텍스트)가
 * 별도 텍스트 아이템으로 분리되어 있을 때 올바르게 합쳐지도록 수정
 *
 * 수정사항:
 * 1. createLineSegments: Y 비교 threshold를 더 관대하게 (max height 기준)
 * 2. boxed number stitching: 단독 숫자 뒤에 같은 라인 텍스트 후처리 합치기
 * 3. isHeadingSegment: "사업 개요" 단독 (2-3 한국어 단어) + 폰트 크면 heading
 */
export class SmartBlockEngine {

    static processPage(textItems: any[], viewport: any): Block[] {
        if (!textItems || textItems.length === 0) return [];

        const rects = textItems
            .filter(item => item.str && item.str.trim().length > 0)
            .map(item => this.normalizeItem(item, viewport));

        if (rects.length === 0) return [];

        // Y로 정렬, 동일 Y면 X로 정렬
        const sorted = [...rects].sort((a, b) => {
            const dy = a.y - b.y;
            if (Math.abs(dy) < 3) return a.x - b.x;
            return dy;
        });

        const pageWidth = viewport.width;
        const columnBoundaries = this.detectColumnBoundaries(sorted, pageWidth);

        const rectsWithCol = sorted.map(r => ({
            ...r,
            col: this.getColumnIndex(r.x, columnBoundaries)
        }));

        const segments = this.createLineSegments(rectsWithCol);
        // ✅ 단독 숫자 세그먼트를 다음 세그먼트와 합치기
        const stitchedSegments = this.stitchBoxedNumbers(segments);
        const stats = this.calcPageStats(stitchedSegments);
        const tableYLines = this.detectTableRows(stitchedSegments);
        const blocks = this.clusterToBlocks(stitchedSegments, stats, columnBoundaries, pageWidth, tableYLines);
        const finalBlocks = this.splitOverWideBlocks(blocks, columnBoundaries, pageWidth);
        const enriched = finalBlocks.map(b => this.enrich(b));
        const structured = StructureEngine.analyzeStructure(enriched);

        const byCol = new Map<number, Block[]>();
        structured.forEach(b => {
            const col = this.getColumnIndex(b.x, columnBoundaries);
            if (!byCol.has(col)) byCol.set(col, []);
            byCol.get(col)!.push(b);
        });

        let order = 0;
        const orderedBlocks: Block[] = [];
        for (const col of [...byCol.keys()].sort()) {
            byCol.get(col)!.sort((a, b) => a.y - b.y).forEach(b => {
                orderedBlocks.push({ ...b, readingOrder: order++ });
            });
        }

        return orderedBlocks;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BOXED NUMBER STITCHING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * PDF에서 박스형 제목 "1 사업 개요"는 두 별도 텍스트 아이템:
     *   seg[i]   = "1"         (박스 안 숫자, 큰 폰트)
     *   seg[i+1] = "사업 개요" (제목 텍스트, 조금 다른 Y일 수 있음)
     *
     * 조건:
     * - seg[i].text가 단독 1-2자리 숫자
     * - seg[i+1]이 가까운 Y (20px 이내) + 바로 오른쪽 X
     * - seg[i+1].text가 한국어 또는 영어 단어
     */
    private static stitchBoxedNumbers(segments: any[]): any[] {
        const result: any[] = [];
        let i = 0;

        while (i < segments.length) {
            const seg = segments[i];
            const isStandaloneNumber = /^\d{1,2}$/.test(seg.text.trim());

            if (isStandaloneNumber && i + 1 < segments.length) {
                const next = segments[i + 1];
                const yDiff = Math.abs(next.y - seg.y);
                const xGap = next.x - (seg.x + seg.width);
                const nextIsTitle = /^[가-힣A-Z]/.test(next.text.trim());
                const sameCol = next.col === seg.col;

                // 같은 컬럼, 수직 20px 이내, 오른쪽에 있고, 한국어/영어로 시작
                if (sameCol && yDiff < 20 && xGap >= -5 && xGap < 100 && nextIsTitle) {
                    // 합치기
                    const merged = {
                        ...seg,
                        text: `${seg.text.trim()} ${next.text.trim()}`,
                        width: (next.x + next.width) - seg.x,
                        height: Math.max(seg.height, next.height),
                        avgFontSize: Math.max(seg.avgFontSize || seg.height, next.avgFontSize || next.height),
                        items: [...(seg.items || []), ...(next.items || [])]
                    };
                    result.push(merged);
                    console.log(`🔗 Stitched: "${seg.text}" + "${next.text}" → "${merged.text}"`);
                    i += 2;
                    continue;
                }
            }

            result.push(seg);
            i++;
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TABLE ROW DETECTION
    // ─────────────────────────────────────────────────────────────────────────

    private static detectTableRows(segments: any[]): Set<number> {
        const tableYLines = new Set<number>();
        const YBUCKET = 4;
        const yGroups = new Map<number, any[]>();

        for (const seg of segments) {
            const bucket = Math.round(seg.y / YBUCKET);
            if (!yGroups.has(bucket)) yGroups.set(bucket, []);
            yGroups.get(bucket)!.push(seg);
        }

        const tableLikeBuckets = new Set<number>();

        for (const [bucket, segs] of yGroups) {
            if (segs.length < 3) continue;

            const xs = segs.map((s: any) => s.x).sort((a: number, b: number) => a - b);
            const xSpread = xs[xs.length - 1] - xs[0];
            const avgTextLen = segs.reduce((s: number, seg: any) => s + seg.text.length, 0) / segs.length;

            // heading 후보 있으면 table 판단 스킵
            const hasHeadingCandidate = segs.some((seg: any) => {
                const t = seg.text.trim();
                return /^\d{1,2}\s+[가-힣]{2,}/.test(t) ||
                    /^□\s+[가-힣]/.test(t);
            });
            if (hasHeadingCandidate) continue;

            if (xSpread > 50 && avgTextLen < 30) {
                tableLikeBuckets.add(bucket);
            }
        }

        // 인접 버킷 최소 2개 이상일 때만 table
        const arr = [...tableLikeBuckets].sort((a, b) => a - b);
        for (let i = 0; i < arr.length; i++) {
            const curr = arr[i];
            const hasNeighbor = arr.includes(curr - 1) || arr.includes(curr + 1) ||
                arr.includes(curr - 2) || arr.includes(curr + 2);
            if (hasNeighbor) tableYLines.add(curr);
        }

        return tableYLines;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COLUMN DETECTION
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
            const rightPeakX = peaks[1] * BUCKET;
            const minRightPx = Math.max(pageWidth * 0.20, 40);
            const maxRightPx = pageWidth * 0.80;
            if (rightPeakX < minRightPx || rightPeakX > maxRightPx) return [0];

            const valleyVal = Math.min(...smooth.slice(peaks[0], peaks[1] + 1));
            if (valleyVal > maxVal * 0.35) return [0];

            const splitX = Math.round((peaks[0] + peaks[1]) / 2) * BUCKET;
            return [0, splitX];
        }

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
            // ✅ max height 기준으로 threshold 계산 (박스 숫자가 크더라도 합쳐짐)
            const lineH = Math.max(rect.height, last.height);
            const isSameLine = Math.abs(rect.y - last.y) < lineH * 0.55;
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
        const sortedSegs = [...segments].sort((a: any, b: any) => a.y - b.y);
        const gaps: number[] = [];

        for (let i = 1; i < sortedSegs.length; i++) {
            const curr = sortedSegs[i], prev = sortedSegs[i - 1];
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
        const freq = new Map<number, number>();
        heights.forEach((h: number) => {
            const k = Math.round(h);
            freq.set(k, (freq.get(k) || 0) + 1);
        });
        const bodyFontSize = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || medianHeight;

        return { medianHeight, medianGap, bodyFontSize };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HEADING CHECK
    // ─────────────────────────────────────────────────────────────────────────

    private static isHeadingSegment(text: string): boolean {
        const firstLine = text.trim().split('\n')[0].trim();
        if (firstLine.length < 1) return false;
        if (firstLine.startsWith('[') || firstLine.startsWith('(')) return false;
        if (/[±μ%°<>~*;{}!=@]/.test(firstLine.substring(0, 30))) return false;
        if (/^[A-Z][a-z]?\.\s+[A-Z][a-z]/.test(firstLine)) return false;

        // 중첩 번호 섹션
        if (/^\d{1,2}(\.\d{1,2}){1,3}/.test(firstLine)) {
            const match = firstLine.match(/^(\d{1,2}(\.\d{1,2}){1,3})\.?\s*(.*)/);
            if (match) {
                const rest = match[3].trim();
                if (rest.length === 0) return firstLine.length <= 5;
                return /^[a-zA-Z가-힣]/.test(rest);
            }
        }

        // 레벨1: "1 사업 개요" / "3 신청자격 및 요건"
        if (/^\d{1,2}\.?\s+/.test(firstLine)) {
            const match = firstLine.match(/^(\d{1,2})\.?\s+(.*)/);
            if (match) {
                const rest = match[2].trim();
                if (/^[인명팀개월일주년분기]/.test(rest)) return false;
                if (/^[A-Z가-힣]/.test(rest) && rest.split(/\s+/).length >= 1) return true;
            }
        }

        if (/^[IVX]{1,5}\.\s+[A-Z가-힣]/.test(firstLine)) return true;
        if (/^(Abstract|Introduction|Conclusion|Results|Discussion|Methods?|Materials?|References?|Acknowledgment)\b/i.test(firstLine)
            && firstLine.split(/\s+/).length <= 4) return true;

        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VERTICAL CLUSTERING
    // ─────────────────────────────────────────────────────────────────────────

    private static clusterToBlocks(
        segments: any[],
        stats: { medianHeight: number; medianGap: number; bodyFontSize: number },
        columnBoundaries: number[],
        pageWidth: number,
        tableYLines: Set<number>
    ): Block[] {
        const { medianHeight, medianGap } = stats;
        const maxParaGap = Math.max((medianHeight + medianGap) * 1.3, medianHeight * 1.6, 8);
        const YBUCKET = 4;

        const openBlocks: { items: any[]; lastSeg: any; isTable: boolean }[] = [];

        for (const seg of segments) {
            const segIsHeading = this.isHeadingSegment(seg.text);
            const segIsTable = tableYLines.has(Math.round(seg.y / YBUCKET));

            let matched = -1;

            if (!segIsHeading) {
                for (let i = openBlocks.length - 1; i >= 0; i--) {
                    const blk = openBlocks[i];
                    const last = blk.lastSeg;

                    if (segIsTable !== blk.isTable) continue;
                    if (seg.col !== last.col) continue;

                    const vGap = seg.y - (last.y + last.height);
                    if (vGap < -2 || vGap > maxParaGap) continue;

                    const segFont = seg.avgFontSize || seg.height;
                    const lastFont = last.avgFontSize || last.height;
                    if (segFont / lastFont < 0.85 || segFont / lastFont > 1.15) continue;

                    const leftDiff = Math.abs(seg.x - last.x);
                    const rightDiff = Math.abs((seg.x + seg.width) - (last.x + last.width));
                    const centDiff = Math.abs((seg.x + seg.width / 2) - (last.x + last.width / 2));
                    if (leftDiff > 50 && rightDiff > 50 && centDiff > 30) continue;

                    if (this.isHeadingSegment(blk.items[0]?.text || '')) continue;

                    matched = i;
                    break;
                }
            }

            if (matched !== -1) {
                openBlocks[matched].items.push(seg);
                openBlocks[matched].lastSeg = seg;
            } else {
                openBlocks.push({ items: [seg], lastSeg: seg, isTable: segIsTable });
            }
        }

        return openBlocks
            .map(blk => {
                const colIdx = blk.items[0]?.col ?? 0;
                const colStart = columnBoundaries[colIdx] ?? 0;
                const colEnd = columnBoundaries[colIdx + 1]
                    ? columnBoundaries[colIdx + 1] - 2
                    : pageWidth;
                return this.blockFromSegments(blk.items, colStart, colEnd, stats.bodyFontSize, blk.isTable);
            })
            .sort((a, b) => {
                const colA = this.getColumnIndex(a.x, columnBoundaries);
                const colB = this.getColumnIndex(b.x, columnBoundaries);
                if (colA !== colB) return colA - colB;
                return a.y - b.y;
            });
    }

    private static splitOverWideBlocks(blocks: Block[], columnBoundaries: number[], pageWidth: number): Block[] {
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
                const left: Block = { ...block, id: `${block.id}-L`, width: splitX - block.x - 4, text: lines.slice(0, mid).join('\n') || block.text };
                const right: Block = { ...block, id: `${block.id}-R`, x: splitX + 4, width: (block.x + block.width) - splitX - 4, text: lines.slice(mid).join('\n') || block.text };
                if (left.width > 20) result.push(left);
                if (right.width > 20) result.push(right);
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
        return { text: item.str, x, y: y - h, width: w, height: h, fontName: item.fontName, col: 0 };
    }

    private static makeSegment(items: any[]): any {
        const xs = items.map((i: any) => i.x);
        const xe = items.map((i: any) => i.x + i.width);
        const y = Math.min(...items.map((i: any) => i.y));
        const height = Math.max(...items.map((i: any) => i.height));
        const text = items.map((i: any) => i.text).join(' ');
        const avgFontSize = items.reduce((s: number, i: any) => s + i.height, 0) / items.length;
        return {
            x: Math.min(...xs), y, width: Math.max(...xe) - Math.min(...xs),
            height, text, items, avgFontSize, col: items[0].col
        };
    }

    private static blockFromSegments(segs: any[], colStart = 0, colEnd = 9999, bodyFontSize = 12, isTableCell = false): Block {
        const minX = Math.max(Math.min(...segs.map((s: any) => s.x)), colStart);
        const minY = Math.min(...segs.map((s: any) => s.y));
        const maxX = Math.min(Math.max(...segs.map((s: any) => s.x + s.width)), colEnd);
        const maxY = Math.max(...segs.map((s: any) => s.y + s.height));
        const fullText = segs.map((s: any) => s.text).join('\n');
        const avgFont = segs.reduce((s: number, seg: any) => s + (seg.avgFontSize || seg.height), 0) / segs.length;

        if (isTableCell) {
            return {
                id: `blk-${Math.random().toString(36).substr(2, 8)}`,
                text: fullText, x: minX, y: minY,
                width: Math.max(maxX - minX, 1), height: maxY - minY,
                fontSize: avgFont, type: 'table-cell', citations: [], isTableCell: true
            };
        }

        const hasBold = segs.some((s: any) => s.items?.some((i: any) => /bold|heavy|black/i.test(i.fontName || '')));
        const isNumbered = this.isHeadingSegment(fullText.split('\n')[0]);
        const isLargerFont = avgFont > bodyFontSize * 1.10;
        const isHeading = hasBold || isNumbered || isLargerFont;

        return {
            id: `blk-${Math.random().toString(36).substr(2, 8)}`,
            text: fullText, x: minX, y: minY,
            width: Math.max(maxX - minX, 1), height: maxY - minY,
            fontSize: avgFont, type: isHeading ? 'heading' : 'paragraph', citations: []
        };
    }

    private static enrich(block: Block): Block {
        if (block.type === 'table-cell') return block;
        const t = block.text.trim();

        if (/^(fig(ure)?\.?\s*\d+|그림\s*\d+|표\s*\d+|table\s*\d+)/i.test(t)) {
            return { ...block, type: 'figure' };
        }
        if (t.includes('$') || t.includes('\\(') || t.includes('\\begin{')) {
            return { ...block, type: 'formula' };
        }
        // 리스트/체크박스 마커 — □는 정부문서 서브제목일 수 있으므로 제외
        if (/^[■○●◎◆◇▶▷→※①②③④⑤⑥⑦⑧⑨⑩\-·•]/.test(t)) {
            return { ...block, type: 'list-item' };
        }
        const citationRx = /\[\d+(?:-\d+)?(?:,\s*\d+)*\]|\[\w+\s*\d+\]/g;
        return { ...block, citations: t.match(citationRx) || [] };
    }

    static extractHeadings(blocks: Block[]) {
        return blocks
            .filter(b => b.type === 'heading')
            .map(b => ({ id: b.id, title: b.text.trim(), y: b.y }));
    }
}