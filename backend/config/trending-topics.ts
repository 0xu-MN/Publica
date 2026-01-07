/**
 * 트렌딩 토픽 및 핫 이슈 관리
 * CES 2026 등 현재 화제인 주제를 우선 수집
 */

export interface TrendingTopic {
    name: string;
    keywords: string[];
    priority: number; // 1-10, 높을수록 우선순위
    category: 'Science' | 'Economy' | 'Both';
    startDate: Date;
    endDate?: Date;
}

/**
 * 현재 트렌딩 토픽
 * 2026년 1월 기준
 */
export const currentTrendingTopics: TrendingTopic[] = [
    // 1. 과학: AI (최우선)
    {
        name: 'AI & LLM',
        keywords: [
            'GPT',
            'Claude',
            'Gemini',
            'LLM',
            'Large Language Model',
            'AI model',
            'generative AI',
            '인공지능',
            '생성형 AI'
        ],
        priority: 10,
        category: 'Science',
        startDate: new Date('2025-01-01')
    },
    // 2. 과학: 바이오
    {
        name: '바이오 & 헬스',
        keywords: [
            'Bio',
            'Biotech',
            'New Drug',
            'Alzheimer',
            'Cancer research',
            'CRISPR',
            '바이오',
            '신약',
            '유전자 가위'
        ],
        priority: 9,
        category: 'Science',
        startDate: new Date('2025-01-01')
    },
    // 3. 과학: 우주
    {
        name: '우주 & 항공',
        keywords: [
            'SpaceX',
            'NASA',
            'Mars',
            'Moon landing',
            'Artemis',
            'Rocket',
            'Starship',
            '우주',
            '화성',
            '누리호'
        ],
        priority: 9,
        category: 'Science',
        startDate: new Date('2025-01-01')
    },
    // 4. 경제: 주식 & 금융
    {
        name: '주식 & 증시',
        keywords: [
            'Stock Market',
            'S&P 500',
            'Nasdaq',
            'IPO',
            'Earnings',
            '증시',
            '코스피',
            '나스닥',
            '주가'
        ],
        priority: 9,
        category: 'Economy',
        startDate: new Date('2025-01-01')
    },
    // 5. 경제: 환율 & 금리
    {
        name: '환율 & 금리',
        keywords: [
            'Exchange Rate',
            'Interest Rate',
            'Fed',
            'FOMC',
            'Dollar',
            '금리',
            '환율',
            '연준',
            '달러'
        ],
        priority: 9,
        category: 'Economy',
        startDate: new Date('2025-01-01')
    },
    // 6. 경제: 글로벌 무역
    {
        name: '글로벌 무역',
        keywords: [
            'Trade war',
            'Tariff',
            'Supply chain',
            'Export',
            'Import',
            '무역',
            '관세',
            '수출'
        ],
        priority: 8,
        category: 'Economy',
        startDate: new Date('2025-01-01')
    },
    // 7. CES 2026 (시즌 이슈)
    {
        name: 'CES 2026',
        keywords: [
            'CES 2026',
            'CES2026',
            'Consumer Electronics Show',
            'Las Vegas tech',
        ],
        priority: 8,
        category: 'Science',
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-15')
    }
];

/**
 * CES 2026 전용 뉴스 소스
 */
export const ces2026Sources = [
    {
        name: 'CES Official',
        url: 'https://www.ces.tech/news.rss',
        category: 'Science' as const,
        reliability: 'verified' as const,
        language: 'en' as const,
        updateFrequency: 'hourly',
        priority: 10
    },
    {
        name: 'The Verge CES',
        url: 'https://www.theverge.com/rss/ces-2026/index.xml',
        category: 'Science' as const,
        reliability: 'high' as const,
        language: 'en' as const,
        updateFrequency: 'hourly',
        priority: 9
    },
    {
        name: 'Engadget CES',
        url: 'https://www.engadget.com/rss.xml',
        category: 'Science' as const,
        reliability: 'high' as const,
        language: 'en' as const,
        updateFrequency: 'hourly',
        priority: 9
    }
];

/**
 * 뉴스 항목이 트렌딩 토픽과 매칭되는지 확인
 */
export function matchTrendingTopics(
    title: string,
    content: string
): TrendingTopic[] {
    const text = (title + ' ' + content).toLowerCase();
    const now = new Date();

    return currentTrendingTopics.filter(topic => {
        // 기간 체크
        if (topic.endDate && now > topic.endDate) {
            return false;
        }
        if (now < topic.startDate) {
            return false;
        }

        // 키워드 매칭
        return topic.keywords.some(keyword =>
            text.includes(keyword.toLowerCase())
        );
    });
}

/**
 * 우선순위 점수 계산
 * 트렌딩 토픽과 매칭되면 높은 점수
 */
export function calculatePriorityScore(
    title: string,
    content: string,
    pubDate: Date
): number {
    let score = 0;

    // 기본 점수: 최신성
    const hoursOld = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 10 - hoursOld); // 최근일수록 높은 점수

    // 트렌딩 토픽 보너스
    const matchedTopics = matchTrendingTopics(title, content);
    if (matchedTopics.length > 0) {
        const maxPriority = Math.max(...matchedTopics.map(t => t.priority));
        score += maxPriority * 5; // 트렌딩 토픽은 최대 50점 보너스
    }

    return score;
}

/**
 * 뉴스를 우선순위로 정렬
 */
export function sortByPriority<T extends { title: string; content: string; pubDate: Date }>(
    newsItems: T[]
): T[] {
    return newsItems.sort((a, b) => {
        const scoreA = calculatePriorityScore(a.title, a.content, a.pubDate);
        const scoreB = calculatePriorityScore(b.title, b.content, b.pubDate);
        return scoreB - scoreA; // 높은 점수가 먼저
    });
}

/**
 * 트렌딩 태그 추출
 */
export function extractTrendingTags(title: string, content: string): string[] {
    const matchedTopics = matchTrendingTopics(title, content);
    return matchedTopics.map(topic => `#${topic.name.replace(/\s+/g, '')}`);
}
