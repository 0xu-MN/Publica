/**
 * 신뢰할 수 있는 뉴스 소스 설정
 * 가짜뉴스 방지를 위해 검증된 주요 언론사 및 공식 기관만 사용
 */

export interface NewsSource {
    name: string;
    url: string;
    category: 'Science' | 'Economy';
    reliability: 'high' | 'verified'; // 신뢰도
    language: 'ko' | 'en';
}

/**
 * 과학 뉴스 - 검증된 학술지 및 공식 과학 기관
 */
export const newsSources = [
    // 1. Science Sources (Safe RSS)
    {
        name: 'ScienceDaily',
        url: 'https://www.sciencedaily.com/rss/all.xml',
        category: 'Science',
        reliability: 'verified',
        language: 'en'
    },
    {
        name: 'Phys.org',
        url: 'https://phys.org/rss-feed/',
        category: 'Science',
        reliability: 'verified',
        language: 'en'
    },
    {
        name: 'Nature News',
        url: 'https://www.nature.com/subjects/latest/rss',
        category: 'Science',
        reliability: 'verified',
        language: 'en'
    },
    {
        name: 'NASA Breaking News',
        url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
        category: 'Science',
        reliability: 'verified',
        language: 'en'
    },
    {
        name: 'Scientific American',
        url: 'https://www.scientificamerican.com/xml/rss/',
        category: 'Science',
        reliability: 'verified',
        language: 'en'
    },
    {
        name: 'New Scientist',
        url: 'https://www.newscientist.com/feed/home',
        category: 'Science',
        reliability: 'verified',
        language: 'en'
    },

    // 2. Economy Sources (Safe RSS)
    {
        name: 'Reuters Business',
        url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', // Alternative stable feed
        category: 'Economy',
        reliability: 'verified',
        language: 'en'
    },
    {
        name: 'Bloomberg',
        url: 'https://feeds.bloomberg.com/markets/news.rss',
        category: 'Economy',
        reliability: 'verified',
        language: 'en'
    },
    {
        name: '한국경제',
        url: 'https://www.hankyung.com/feed/rss',
        category: 'Economy',
        reliability: 'verified',
        language: 'ko'
    },
    {
        name: '매일경제',
        url: 'https://www.mk.co.kr/rss/30000001/', // Main Economy Feed
        category: 'Economy',
        reliability: 'verified',
        language: 'ko'
    },
    {
        name: 'Financial Times',
        url: 'https://www.ft.com/?format=rss',
        category: 'Economy',
        reliability: 'verified',
        language: 'en'
    }
];

/**
 * 모든 뉴스 소스
 */
export const getAllSources = () => {
    return newsSources;
};

/**
 * 가짜뉴스 필터링 키워드
 * AI가 이런 패턴을 감지하면 경고
 */
export const fakeNewsIndicators = [
    '충격', '경악', '반전', '뒤집혔다',
    '확정적이지 않은 추측성 단정',
    '출처 불명',
    '익명의 소식통에 따르면'
];

/**
 * 신뢰도 검증 기준
 */
export const reliabilityCriteria = {
    // 필수: 출처가 명확해야 함
    hasSource: true,
    // 필수: 날짜가 최근이어야 함 (1주일 이내)
    isRecent: true,
    // 필수: 검증된 언론사여야 함
    isFromVerifiedSource: true,
    // 선호: 복수의 소스에서 보도
    hasMultipleSources: false
};


