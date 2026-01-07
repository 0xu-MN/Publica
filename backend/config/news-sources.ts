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
    updateFrequency: string;
}

/**
 * 과학 뉴스 - 검증된 학술지 및 공식 과학 기관
 */
export const scienceSources: NewsSource[] = [
    // CES 2026 특집 - 1개만 유지 (균형을 위해)
    {
        name: 'The Verge - Tech',
        url: 'https://www.theverge.com/rss/index.xml',
        category: 'Science',
        reliability: 'high',
        language: 'en',
        updateFrequency: 'hourly'
    },
    // 기존 과학 뉴스 소스
    {
        name: 'Nature News',
        url: 'https://www.nature.com/nature.rss',
        category: 'Science',
        reliability: 'verified',
        language: 'en',
        updateFrequency: 'daily'
    },
    {
        name: 'Science Magazine',
        url: 'https://www.science.org/rss/news_current.xml',
        category: 'Science',
        reliability: 'verified',
        language: 'en',
        updateFrequency: 'daily'
    },
    {
        name: 'MIT Technology Review',
        url: 'https://www.technologyreview.com/feed/',
        category: 'Science',
        reliability: 'high',
        language: 'en',
        updateFrequency: 'daily'
    },
    {
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        category: 'Science',
        reliability: 'high',
        language: 'en',
        updateFrequency: 'hourly'
    },
    {
        name: 'NASA News',
        url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
        category: 'Science',
        reliability: 'verified',
        language: 'en',
        updateFrequency: 'daily'
    },
    {
        name: '과학기술정보통신부',
        url: 'https://www.msit.go.kr/rss/news.do',
        category: 'Science',
        reliability: 'verified',
        language: 'ko',
        updateFrequency: 'daily'
    }
];

/**
 * 경제 뉴스 - 검증된 금융 언론사 및 공식 경제 기관
 */
export const economySources: NewsSource[] = [
    {
        name: 'Bloomberg',
        url: 'https://feeds.bloomberg.com/markets/news.rss',
        category: 'Economy',
        reliability: 'verified',
        language: 'en',
        updateFrequency: 'hourly'
    },
    {
        name: 'Financial Times',
        url: 'https://www.ft.com/?format=rss',
        category: 'Economy',
        reliability: 'verified',
        language: 'en',
        updateFrequency: 'hourly'
    },
    {
        name: 'The Wall Street Journal',
        url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
        category: 'Economy',
        reliability: 'verified',
        language: 'en',
        updateFrequency: 'hourly'
    },
    // 한국 경제 뉴스 소스 (강화)
    {
        name: '연합뉴스 경제',
        url: 'https://www.yonhapnewstv.co.kr/category/news/economy/feed/',
        category: 'Economy',
        reliability: 'high',
        language: 'ko',
        updateFrequency: 'hourly'
    },
    {
        name: '네이버 경제뉴스',
        url: 'https://news.naver.com/main/list.naver?mode=LPOD&mid=sec&oid=001&listType=title&isYeonhapFlash=Y',
        category: 'Economy',
        reliability: 'high',
        language: 'ko',
        updateFrequency: 'hourly'
    },
    {
        name: '조선비즈',
        url: 'https://biz.chosun.com/rss/index.xml',
        category: 'Economy',
        reliability: 'high',
        language: 'ko',
        updateFrequency: 'hourly'
    },
    {
        name: '한겨레 경제',
        url: 'https://www.hani.co.kr/rss/',
        category: 'Economy',
        reliability: 'high',
        language: 'ko',
        updateFrequency: 'hourly'
    },
    {
        name: '매일경제',
        url: 'https://www.mk.co.kr/rss/40300001/',
        category: 'Economy',
        reliability: 'high',
        language: 'ko',
        updateFrequency: 'hourly'
    }
];

/**
 * 모든 뉴스 소스
 */
export const allNewsSources: NewsSource[] = [
    ...scienceSources,
    ...economySources
];

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

export default allNewsSources;
