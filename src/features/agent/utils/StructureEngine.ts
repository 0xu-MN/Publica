import type { Block } from './smartBlockEngine';
import type { TOCItem } from '../components/TableOfContents';

export interface StructureNode {
    id: string;
    title: string;
    level: number;
    children: StructureNode[];
}

export class StructureEngine {

    static resetState() {
        console.log('🔄 StructureEngine: ready');
    }

    static analyzeStructure(blocks: Block[]): Block[] {
        if (!blocks || blocks.length === 0) return [];

        const bodyFontSize = this.estimateBodyFont(blocks);
        const pageHeight = this.estimatePageHeight(blocks);

        // 반복 텍스트 감지 (페이지 헤더/푸터)
        const textFreq = new Map<string, number>();
        blocks.forEach(b => {
            const k = b.text.trim().toLowerCase().substring(0, 60).replace(/\s+/g, ' ');
            if (k.length > 3) textFreq.set(k, (textFreq.get(k) || 0) + 1);
        });
        const repeatedTexts = new Set<string>();
        textFreq.forEach((count, key) => { if (count >= 2) repeatedTexts.add(key); });

        // 밀집 번호 구간 — "1인", "5월" 같은 단위 붙은 것 제외하고 순수 짧은 번호만
        const shortNumberedYs = blocks
            .filter(b => {
                const t = b.text.trim();
                if (!/^\d{1,2}[\s.]/.test(t)) return false;
                if (t.length >= 18) return false;
                const match = t.match(/^\d{1,2}\.?\s+(.*)/);
                if (match) {
                    const rest = match[1].trim();
                    // 2단어 이상이면 섹션 제목 → 밀집 감지 대상 제외
                    if (rest.split(/\s+/).length >= 2) return false;
                }
                return true;
            })
            .map(b => b.y);
        const denseZones = this.detectDenseZones(shortNumberedYs);

        const classified = blocks.map(block => {
            if (block.type === 'table-cell' || block.type === 'list-item' || block.type === 'figure') {
                return { ...block, headingLevel: 0 };
            }

            const firstLine = block.text.trim().split('\n')[0].trim();
            const textKey = block.text.trim().toLowerCase().substring(0, 60).replace(/\s+/g, ' ');

            if (repeatedTexts.has(textKey)) return { ...block, headingLevel: 0, type: block.type };

            const isTopArea = block.y < pageHeight * 0.08;
            const isBottomArea = block.y > pageHeight * 0.92;
            if ((isTopArea || isBottomArea) && firstLine.split(/\s+/).length <= 10
                && !/^\d+[\.\s]\s*[가-힣A-Z]{2}/.test(firstLine)) {
                return { ...block, headingLevel: 0, type: block.type };
            }

            if (denseZones.some(([min, max]) => block.y >= min && block.y <= max)) {
                if (/^\d{1,2}[\s.]/.test(firstLine) && firstLine.length < 20) {
                    return { ...block, headingLevel: 0, type: 'list-item' as const };
                }
            }

            const level = this.classifyHeading(block, bodyFontSize);
            return {
                ...block,
                headingLevel: level,
                type: level > 0 ? ('heading' as const) : block.type
            };
        });

        const stack: { level: number; id: string; title: string }[] = [];
        return classified.map(block => {
            if (block.headingLevel && block.headingLevel > 0) {
                while (stack.length > 0 && stack[stack.length - 1].level >= block.headingLevel) {
                    stack.pop();
                }
                stack.push({ level: block.headingLevel, id: block.id, title: block.text.split('\n')[0].trim().substring(0, 80) });
            }
            const ctx = stack.length > 0 ? stack[stack.length - 1] : null;
            return { ...block, sectionId: ctx?.id, sectionTitle: ctx?.title };
        });
    }

    private static classifyHeading(block: Block, bodyFontSize: number): number {
        const text = block.text.trim();
        const firstLine = text.split('\n')[0].trim();
        const fontSize = block.fontSize || 12;
        const lineCount = text.split('\n').length;

        if (firstLine.length < 2 || firstLine.length > 150) return 0;

        // ✅ □ 서브제목 허용: □ 신청자격, □ 평가 방법 등
        if (/^□\s+/.test(firstLine)) {
            const rest = firstLine.replace(/^□\s+/, '').trim();
            const words = rest.split(/\s+/);
            if (words.length >= 1 && words.length <= 5 && rest.length <= 30
                && !/않|가능$|불가$|있음$|없음$|됨$|경우$|이내$|한다$|합니다$|이행$/.test(rest)) {
                return 2;
            }
            return 0;
        }

        // ✅ Level 2: 특수 기호 시작 (■, ○ 등 한국어 공고문에서 널리 쓰이는 헤딩)
        if (/^[■○●◎◆◇▶▷※]/.test(firstLine)) {
            const rest = firstLine.substring(1).trim();
            if (rest.length >= 2 && rest.length <= 40 && !/않|가능$|불가$|있음$|없음$|됨$|경우$|이내$|한다$|합니다$|이행$/.test(rest)) {
                return 2;
            }
        }

        // ── 제외 조건 (기호 시작이나 불필요한 것들) ──
        if (/^[→←↑↓ㄱ-ㅎ]/.test(firstLine)) return 0;
        if (/^[\[\(《「『<]/.test(firstLine)) return 0;
        if (/@/.test(firstLine) || /https?:\/\//.test(firstLine)) return 0;
        if (/[±μ%°~*;{}!=]/.test(firstLine.substring(0, 30))) return 0;
        if (/^[A-Z][a-z]?\.\s+[A-Z][a-z]/.test(firstLine)) return 0;
        if (/^[：:·]/.test(firstLine)) return 0;
        if (/^(및|의|에|을|를|이|가|과|와|도|는|은|로|으로|에서|에게|부터|까지)\s/.test(firstLine)) return 0;

        const lastWord = firstLine.replace(/[.,!?]$/, '');
        if (/않[은을]?\s*자$|가능$|불가$|이행$|해당$|아래$|따름$|있음$|없음$|됨$|함$|한다$|된다$|경우$|이내$/.test(lastWord)) return 0;
        if (/하지\s*(않|못)/.test(firstLine) && firstLine.length < 30) return 0;
        if (/^\d{2}\.\d{1,2}\.\d{1,2}/.test(firstLine)) return 0;
        if (/^\d+[명팀개억만원]$/.test(firstLine)) return 0;

        // ✅ 중첩 번호: 2.7 / 2.11 / 1.2.3
        if (/^\d{1,2}(\.\d{1,2}){1,3}/.test(firstLine)) {
            const match = firstLine.match(/^(\d{1,2}(\.\d{1,2}){1,3})\.?\s*(.*)/);
            if (match) {
                const rest = match[3].trim();
                if (rest.length > 0 && !/^[a-zA-Z가-힣]/.test(rest)) return 0;
                if (rest.length === 0 && firstLine.length > 6) return 0;
                const dots = (match[1].match(/\./g) || []).length;
                return Math.min(dots + 1, 3);
            }
        }

        // ✅ 레벨1: "1 사업 개요" / "4 접수방법" / "6 유의 사항"
        if (/^\d{1,2}\.?\s+/.test(firstLine)) {
            const match = firstLine.match(/^(\d{1,2})\.?\s+(.*)/);
            if (match) {
                const rest = match[2].trim();
                // 단위/조사로 시작하는 경우 제외
                if (/^[인명팀개월일주년분기단계]/.test(rest)) return 0;
                if (/^(붙임|별첨|부\s|Chapter|Section|Annex)/i.test(rest)) return 0;
                if (/^\d/.test(rest)) return 0;
                if (/^[A-Z가-힣]/.test(rest)) {
                    const specialChars = (rest.match(/[^a-zA-Z가-힣0-9\s\-·]/g) || []).length;
                    if (specialChars / (rest.length || 1) > 0.3) return 0;
                    if (rest.split(/\s+/).length >= 1) return 1;
                }
            }
        }

        if (/^[a-z]/.test(firstLine)) return 0;

        const fontRatio = fontSize / bodyFontSize;
        const lastChar = firstLine.slice(-1);
        if (!/[.,;:?!]/.test(lastChar)) {
            if (fontRatio >= 1.5 && lineCount <= 3) return 1;
            if (fontRatio >= 1.25 && lineCount <= 2) return 1;
        }

        if (firstLine.split(/\s+/).length <= 5 && lineCount <= 2
            && /^(Abstract|Introduction|Conclusion[s]?|Results?|Discussion|Material[s]?|Method[s]?|Background|References?|Acknowledgment[s]?)/i.test(firstLine)
        ) return 1;

        return 0;
    }

    static buildTOC(blocks: Block[], pageNumber: number = 1): TOCItem[] {
        const items: TOCItem[] = [];
        const pageSeen = new Set<string>();

        for (const block of blocks) {
            if (block.type === 'table-cell' || block.type === 'list-item' || block.type === 'figure') continue;
            if (!block.headingLevel || block.headingLevel === 0) continue;

            const rawTitle = block.text.split('\n')[0].trim();
            if (/^(REVIEW|ARTICLE|RESEARCH|ORIGINAL)\s+\d+/i.test(rawTitle)) continue;
            if (/^\S+\s+\S+$/.test(rawTitle) && rawTitle.length < 8) continue;
            if (/^(붙임|별첨)\s*\d/i.test(rawTitle)) continue;

            const normalized = rawTitle.toLowerCase().substring(0, 80);
            if (pageSeen.has(normalized)) continue;
            pageSeen.add(normalized);

            const { number, displayTitle } = this.parseHeadingTitle(rawTitle);
            if (displayTitle.length < 2) continue;

            items.push({
                id: block.id,
                title: displayTitle,
                rawTitle,
                page: pageNumber,
                y: block.y,
                x: block.x ?? 0,
                readingOrder: block.readingOrder ?? 0,
                level: block.headingLevel,
                number
            });
        }

        return items;
    }

    static parseHeadingTitle(raw: string): { number?: string; displayTitle: string } {
        const firstLine = raw.split('\n')[0].trim();

        if (/^□\s+/.test(firstLine)) {
            const rest = firstLine.replace(/^□\s+/, '').trim();
            const words = rest.split(/\s+/);
            return { number: undefined, displayTitle: words.length > 4 ? words.slice(0, 4).join(' ') : rest };
        }

        const numMatch = firstLine.match(/^((\d{1,2}\.){1,3}\d{0,2}|\d{1,2})([.\s]+)(.*)/);
        let number: string | undefined;
        let titlePart: string;

        if (numMatch) {
            number = numMatch[1].replace(/\.$/, '').trim();
            titlePart = numMatch[4].trim();
        } else {
            titlePart = firstLine;
        }

        titlePart = titlePart.split('\n')[0].trim();
        const sentenceBreak = titlePart.search(/\.\s+[A-Z가-힣]/);
        if (sentenceBreak > 0) titlePart = titlePart.substring(0, sentenceBreak).trim();
        titlePart = titlePart.replace(/\s+(and|or|the|of|in|by|with|for|from|to|및|또는|그리고)$/i, '').trim();

        const words = titlePart.split(/\s+/);
        const maxWords = number ? 4 : 5;
        if (words.length > maxWords) titlePart = words.slice(0, maxWords).join(' ');
        titlePart = titlePart.replace(/[,;:\-–—]$/, '').trim();

        return { number, displayTitle: titlePart || number || firstLine.substring(0, 40) };
    }

    static compareSectionNumbers(a: string | undefined, b: string | undefined): number {
        if (!a && !b) return 0;
        if (!a) return -1;
        if (!b) return 1;
        const partsA = a.split('.').map(s => parseInt(s) || 0);
        const partsB = b.split('.').map(s => parseInt(s) || 0);
        const len = Math.max(partsA.length, partsB.length);
        for (let i = 0; i < len; i++) {
            const pa = partsA[i] ?? 0;
            const pb = partsB[i] ?? 0;
            if (pa !== pb) return pa - pb;
        }
        return partsA.length - partsB.length;
    }

    private static detectDenseZones(ys: number[]): [number, number][] {
        if (ys.length < 3) return [];
        const sorted = [...ys].sort((a, b) => a - b);
        const zones: [number, number][] = [];
        let start = sorted[0], prev = sorted[0], count = 1;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] - prev < 25) { count++; prev = sorted[i]; }
            else {
                if (count >= 3) zones.push([start - 5, prev + 20]);
                start = sorted[i]; prev = sorted[i]; count = 1;
            }
        }
        if (count >= 3) zones.push([start - 5, prev + 20]);
        return zones;
    }

    private static estimatePageHeight(blocks: Block[]): number {
        if (!blocks.length) return 800;
        const maxY = Math.max(...blocks.map(b => b.y + b.height));
        return maxY > 100 ? maxY : 800;
    }

    private static estimateBodyFont(blocks: Block[]): number {
        const freq = new Map<number, number>();
        blocks.forEach(b => {
            if (b.type === 'table-cell') return;
            const k = Math.round((b.fontSize || 12) * 2) / 2;
            freq.set(k, (freq.get(k) || 0) + 1);
        });
        return [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 12;
    }
}