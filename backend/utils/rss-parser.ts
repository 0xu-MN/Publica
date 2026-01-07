import Parser from 'rss-parser';
import { NewsSource } from '../config/news-sources';

interface ParsedNewsItem {
    title: string;
    content: string;
    link: string;
    pubDate: Date;
    source: string;
    category: 'Science' | 'Economy';
}

const parser = new Parser({
    customFields: {
        item: ['media:content', 'media:thumbnail', 'enclosure']
    }
});

/**
 * RSS 피드 파싱
 */
export async function parseRSSFeed(source: NewsSource): Promise<ParsedNewsItem[]> {
    try {
        const feed = await parser.parseURL(source.url);

        const items: ParsedNewsItem[] = feed.items.map(item => ({
            title: item.title || '',
            content: item.contentSnippet || item.content || '',
            link: item.link || '',
            pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            source: source.name,
            category: source.category
        }));

        // 최근 24시간 이내 뉴스만 (신선도 유지)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return items.filter(item => item.pubDate > oneDayAgo);

    } catch (error) {
        console.error(`Error parsing RSS feed from ${source.name}:`, error);
        return [];
    }
}

/**
 * 이미지 URL 추출
 */
export function extractImageUrl(item: any): string | null {
    // RSS에서 이미지 추출 시도
    if (item['media:content']) {
        return item['media:content'].$.url;
    }
    if (item['media:thumbnail']) {
        return item['media:thumbnail'].$.url;
    }
    if (item.enclosure?.url) {
        return item.enclosure.url;
    }

    // 기본 이미지 (카테고리별)
    return null;
}

/**
 * 중복 제거 (URL 기준)
 */
export function deduplicateNews(items: ParsedNewsItem[]): ParsedNewsItem[] {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.link)) {
            return false;
        }
        seen.add(item.link);
        return true;
    });
}

/**
 * 가짜뉴스 의심 패턴 감지
 */
export function detectFakeNewsPatterns(title: string, content: string): boolean {
    const suspiciousPatterns = [
        /충격/,
        /경악/,
        /반전/,
        /뒤집혔다/,
        /확정.*않은.*추측/,
        /출처.*불명/,
        /익명.*소식통/
    ];

    const text = title + ' ' + content;
    return suspiciousPatterns.some(pattern => pattern.test(text));
}

/**
 * 읽기 시간 계산 (한국어: 500자/분, 영어: 200단어/분)
 */
export function calculateReadTime(content: string, language: 'ko' | 'en'): string {
    if (language === 'ko') {
        const minutes = Math.ceil(content.length / 500);
        return `${minutes}분`;
    } else {
        const words = content.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes}min`;
    }
}
