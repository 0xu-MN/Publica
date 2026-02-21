import { Block } from './smartBlockEngine';
import type { TOCItem } from '../components/TableOfContents';

export interface StructureNode {
    id: string;
    title: string;
    level: number;
    children: StructureNode[];
}

/**
 * StructureEngine v3 — Numbered Section Aware
 *
 * Key improvements:
 * 1. Parses section numbers (1., 1.1, 1.2.3 …) to determine exact heading level
 * 2. Running header / footer suppression (repeated text across pages)
 * 3. Font-size–based fallback for documents without explicit numbering
 * 4. Deduplication of identical headings
 * 5. Clean TOC export with proper hierarchy and display titles
 */
export class StructureEngine {

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC
    // ─────────────────────────────────────────────────────────────────────────

    static analyzeStructure(blocks: Block[]): Block[] {
        if (!blocks || blocks.length === 0) return [];

        // Step 0: detect running headers / footers (text repeated 3+ times)
        const runningHeaders = this.detectRunningHeaders(blocks);

        // Step 1: estimate body font size
        const bodyFontSize = this.estimateBodyFont(blocks);

        // Step 2: classify each block as heading (with level) or paragraph
        const seen = new Set<string>(); // deduplication
        const classified = blocks.map(block => {
            const key = block.text.trim().substring(0, 80).toLowerCase();

            // Suppress running headers
            if (runningHeaders.has(key)) {
                return { ...block, headingLevel: 0, type: block.type };
            }

            const level = this.classifyHeading(block, bodyFontSize);

            // Deduplicate: if we've seen this heading text before, demote it
            if (level > 0) {
                if (seen.has(key)) {
                    return { ...block, headingLevel: 0, type: 'paragraph' as const };
                }
                seen.add(key);
            }

            return {
                ...block,
                headingLevel: level,
                type: level > 0 ? ('heading' as const) : block.type
            };
        });

        // Step 3: assign section context (bread-crumb stack)
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

    /**
     * Build a clean, ordered TOC from the structured blocks.
     * Returns items in document order with proper hierarchy levels.
     */
    static buildTOC(blocks: Block[], pageNumber: number = 1): TOCItem[] {
        const items: TOCItem[] = [];
        const seen = new Set<string>();

        for (const block of blocks) {
            if (!block.headingLevel || block.headingLevel === 0) continue;

            const rawTitle = block.text.split('\n')[0].trim();
            const normalized = rawTitle.toLowerCase().substring(0, 80);

            if (seen.has(normalized)) continue;
            seen.add(normalized);

            // Parse out the section number and clean display title
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

    /**
     * Determines if a block is a heading and what level (1/2/3) it is.
     * Returns 0 for non-headings.
     *
     * Priority order:
     *   1. Explicit section number pattern (most reliable for academic papers)
     *   2. Font size significantly larger than body
     *   3. Known section keyword (Abstract, Introduction, etc.)
     */
    private static classifyHeading(block: Block, bodyFontSize: number): number {
        const firstLine = block.text.trim().split('\n')[0].trim();
        const fontSize = block.fontSize || 12;
        const lineCount = block.text.trim().split('\n').length;

        // ── Exclusions ────────────────────────────────────────────────────────

        if (firstLine.length < 2) return 0;
        if (/^\d+$/.test(firstLine)) return 0;                          // page number
        if (/^\([a-zA-Z0-9i]+\)$/.test(firstLine)) return 0;           // (a) (b) (i)
        if (/^\[?\d+\]/.test(firstLine)) return 0;                      // [1] citation
        if (/^(fig(ure)?|table)\s*\.?\s*\d+/i.test(firstLine)) return 0; // Figure 3.
        if (/^[A-Z][a-z]?\.\s+[A-Z][a-z]/.test(firstLine)) return 0;  // author: X. Yang
        if (/@/.test(firstLine)) return 0;                              // email
        if (/^[a-z]/.test(firstLine)) return 0;                         // starts lowercase
        if (firstLine.endsWith(',')) return 0;                          // list continuation
        if (firstLine.length > 120) return 0;                           // too long → body paragraph

        // ── 1. Explicit numbered section ─────────────────────────────────────

        // Level 3: "1.2.3" or "1.2.3." or "1.2.3 Title"
        if (/^\d{1,2}\.\d{1,2}\.\d{1,2}[\s.]/.test(firstLine)) return 3;

        // Level 2: "1.1" or "1.1." or "1.1 Title"
        if (/^\d{1,2}\.\d{1,2}[\s.]/.test(firstLine)) return 2;

        // Level 1: "1." or "1 Title" or "I." or "II."
        // Must be followed by a capitalized word (not author name — already excluded above)
        if (/^(\d{1,2}\.?\s+[A-Z]|[IVX]{1,5}\.\s+[A-Z])/.test(firstLine)) return 1;

        // ── 2. Font size (layout-based) ───────────────────────────────────────
        const fontRatio = fontSize / bodyFontSize;
        if (fontRatio >= 1.5 && lineCount <= 3) return 1;
        if (fontRatio >= 1.25 && lineCount <= 2) return 2;

        // ── 3. Named sections (short, standalone) ────────────────────────────
        const wordCount = firstLine.split(/\s+/).length;
        if (
            wordCount <= 4 &&
            lineCount <= 2 &&
            /^(abstract|introduction|conclusion[s]?|results?|discussion|method[s]?|methodology|background|related\s+work|overview|summary|references?|acknowledgment[s]?)/i.test(firstLine)
        ) {
            return 1;
        }

        return 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TITLE PARSING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Given a raw heading like "3.2. Results of the experiment", extract:
     *   number: "3.2"
     *   displayTitle: "Results of the experiment"
     *
     * Or "Abstract" → number: undefined, displayTitle: "Abstract"
     */
    private static parseHeadingTitle(raw: string): { number?: string; displayTitle: string } {
        // Match section numbers like "1.", "1.1", "1.1.", "3.2.1", "II."
        const m = raw.match(/^((?:\d{1,2}\.){1,3}\d{0,2}|[IVX]{1,5}\.?)\s*(.*)/);
        if (m) {
            const number = m[1].replace(/\.$/, '').trim(); // strip trailing dot
            const rest = m[2].trim();
            return { number, displayTitle: rest || number };
        }
        return { displayTitle: raw };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private static detectRunningHeaders(blocks: Block[]): Set<string> {
        const freq = new Map<string, number>();
        blocks.forEach(b => {
            const k = b.text.trim().substring(0, 80).toLowerCase().replace(/\s+/g, ' ');
            if (k.length > 3) freq.set(k, (freq.get(k) || 0) + 1);
        });
        const headers = new Set<string>();
        freq.forEach((count, key) => { if (count >= 3) headers.add(key); });
        return headers;
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
