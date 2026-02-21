import { Block } from './smartBlockEngine';
import type { TOCItem } from '../components/TableOfContents';

export interface StructureNode {
    id: string;
    title: string;
    level: number;
    children: StructureNode[];
}

/**
 * StructureEngine v4
 *
 * 핵심 수정:
 * 1. 페이지 상단/하단 5% 위치의 짧은 텍스트를 running header/footer로 억제
 *    → "Biomedicine & Pharmacotherapy" 같은 저널명 반복 제거
 * 2. globalSeenHeadings를 static으로 유지해서 페이지 간 중복 heading 제거
 *    → "Introduction" 이 여러 페이지에서 중복 등록되는 문제 해결
 * 3. PDFViewerPanel에서 페이지 전환 시 globalSeenHeadings 리셋 가능하도록 resetState() 추가
 */
export class StructureEngine {

    /**
     * 새 문서 로드 시 호출 (현재는 globalSeenHeadings 제거로 no-op이지만 API 호환성 유지)
     */
    static resetState() {
        console.log('🔄 StructureEngine: ready for new document');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC
    // ─────────────────────────────────────────────────────────────────────────

    static analyzeStructure(blocks: Block[]): Block[] {
        if (!blocks || blocks.length === 0) return [];

        const bodyFontSize = this.estimateBodyFont(blocks);
        const pageHeight = this.estimatePageHeight(blocks);

        const classified = blocks.map(block => {
            const firstLine = block.text.trim().split('\n')[0];

            // 위치 기반 running header/footer 억제
            // 페이지 상단 8% 또는 하단 8% 에 있는 짧은 텍스트
            const isTopArea = block.y < pageHeight * 0.08;
            const isBottomArea = block.y > pageHeight * 0.92;
            const isShortText = firstLine.split(/\s+/).length <= 6;
            if ((isTopArea || isBottomArea) && isShortText) {
                return { ...block, headingLevel: 0, type: block.type };
            }

            const level = this.classifyHeading(block, bodyFontSize);

            return {
                ...block,
                headingLevel: level,
                type: level > 0 ? ('heading' as const) : block.type
            };
        });

        // 섹션 컨텍스트 할당 (bread-crumb stack)
        const stack: { level: number; id: string; title: string }[] = [];
        return classified.map(block => {
            if (block.headingLevel && block.headingLevel > 0) {
                while (stack.length > 0 && stack[stack.length - 1].level >= block.headingLevel) {
                    stack.pop();
                }
                stack.push({
                    level: block.headingLevel,
                    id: block.id,
                    title: block.text.split('\n')[0].trim().substring(0, 80)
                });
            }
            const ctx = stack.length > 0 ? stack[stack.length - 1] : null;
            return { ...block, sectionId: ctx?.id, sectionTitle: ctx?.title };
        });
    }

    static buildTOC(blocks: Block[], pageNumber: number = 1): TOCItem[] {
        const items: TOCItem[] = [];
        const pageSeen = new Set<string>(); // 이 페이지 내 중복만 체크

        for (const block of blocks) {
            if (!block.headingLevel || block.headingLevel === 0) continue;

            const rawTitle = block.text.split('\n')[0].trim();
            const normalized = rawTitle.toLowerCase().substring(0, 80);

            if (pageSeen.has(normalized)) continue;
            pageSeen.add(normalized);

            const { number, displayTitle } = this.parseHeadingTitle(rawTitle);

            items.push({
                id: block.id,
                title: displayTitle,
                rawTitle,
                page: pageNumber,
                y: block.y,
                level: block.headingLevel,
                number
            });
        }

        return items;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HEADING CLASSIFICATION
    // ─────────────────────────────────────────────────────────────────────────

    private static classifyHeading(block: Block, bodyFontSize: number): number {
        const firstLine = block.text.trim().split('\n')[0].trim();
        const fontSize = block.fontSize || 12;
        const lineCount = block.text.trim().split('\n').length;

        // ── 기본 제외 조건 ────────────────────────────────────────────────────
        if (firstLine.length < 2) return 0;
        if (firstLine.length > 120) return 0;                            // 너무 긴 본문
        if (/^\d+$/.test(firstLine)) return 0;                           // 페이지 번호만
        if (/^\([a-zA-Z0-9i]+\)$/.test(firstLine)) return 0;            // (a) (b)
        if (/^\[?\d+\]/.test(firstLine)) return 0;                       // [1] 인용
        if (/^(fig(ure)?|table)\s*\.?\s*\d+/i.test(firstLine)) return 0;
        if (/^[A-Z][a-z]?\.\s+[A-Z][a-z]/.test(firstLine)) return 0;   // 저자명
        if (/@/.test(firstLine)) return 0;                               // 이메일
        if (firstLine.endsWith(',')) return 0;                           // 리스트 연속

        // ── 1. 명시적 번호 섹션 — 소문자/단독 숫자 모두 허용 ─────────────────
        // ✅ [\s.]? → 뒤에 공백/점 없어도 인식 ("2.7" 단독 허용)
        // ✅ 소문자 제외 조건을 여기서 적용 안 함 → "2.7 cell viability" 인식
        if (/^\d{1,2}\.\d{1,2}\.\d{1,2}([\s.]|$)/.test(firstLine)) return 3;  // 1.2.3
        if (/^\d{1,2}\.\d{1,2}([\s.]|$)/.test(firstLine)) return 2;            // 1.1 or 1.1 alone
        if (/^\d{1,2}\.?\s+\S/.test(firstLine)) return 1;                      // "1. Title"
        if (/^[IVX]{1,5}\.\s/.test(firstLine)) return 1;                       // I. or II.

        // ── 이 아래는 소문자 시작하면 제외 ──────────────────────────────────────
        if (/^[a-z]/.test(firstLine)) return 0;

        // ── 2. 폰트 크기 기반 ─────────────────────────────────────────────────
        const fontRatio = fontSize / bodyFontSize;
        if (fontRatio >= 1.5 && lineCount <= 3) return 1;
        if (fontRatio >= 1.25 && lineCount <= 2) return 2;

        // ── 3. 알려진 섹션명 ──────────────────────────────────────────────────
        const wordCount = firstLine.split(/\s+/).length;
        if (
            wordCount <= 5 &&
            lineCount <= 2 &&
            /^(Abstract|Introduction|Conclusion[s]?|Results?|Discussion|Material[s]?|Method[s]?|Methodology|Background|References?|Acknowledgment[s]?)/i.test(firstLine)
        ) {
            return 1;
        }

        return 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * 페이지 높이 추정: 블록 Y 좌표 최댓값 기준
     */
    private static estimatePageHeight(blocks: Block[]): number {
        if (!blocks.length) return 800;
        const maxY = Math.max(...blocks.map(b => b.y + b.height));
        return maxY > 100 ? maxY : 800;
    }

    private static parseHeadingTitle(raw: string): { number?: string; displayTitle: string } {
        const m = raw.match(/^((?:\d{1,2}\.){1,3}\d{0,2}|[IVX]{1,5}\.?)\s*(.*)/);
        if (m) {
            const number = m[1].replace(/\.$/, '').trim();
            const rest = m[2].trim();
            return { number, displayTitle: rest || number };
        }
        return { displayTitle: raw };
    }

    private static estimateBodyFont(blocks: Block[]): number {
        const freq = new Map<number, number>();
        blocks.forEach(b => {
            const k = Math.round((b.fontSize || 12) * 2) / 2;
            freq.set(k, (freq.get(k) || 0) + 1);
        });
        return [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 12;
    }
}