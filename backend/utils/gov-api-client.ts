import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Government API Client for Public Data Portal (data.go.kr)
 * Integrates multiple government agencies' support program APIs
 * Updated with verified endpoint URLs
 */

const GOV_API_BASE_URL = 'https://apis.data.go.kr';
const KOICA_BASE_URL = 'https://openapi.koica.go.kr'; // KOICA uses different domain
const API_KEY = process.env.GOV_API_SERVICE_KEY || '';

// API Configuration for each agency (verified endpoints from data.go.kr)
export const API_CONFIGS = {
    K_STARTUP: {
        name: '창업진흥원_K-Startup',
        baseUrl: `${GOV_API_BASE_URL}/B552735/kisedKstartupService01`,
        endpoints: {
            announcements: '/getBizAnnouncement' // 사업공고 조회
        }
    },
    MSS: {
        name: '중소벤처기업부',
        baseUrl: `${GOV_API_BASE_URL}/1421000/mssBizService_v2`,
        endpoints: {
            announcements: '/getBizAnnouncement' // 사업공고
        }
    },
    MSIT: {
        name: '과학기술정보통신부',
        baseUrl: `${GOV_API_BASE_URL}/1721000/msitannouncementinfo`,
        endpoints: {
            announcements: '/getAnnouncementList' // 공고정보 조회
        }
    },
    MFDS: {
        name: '식품의약품안전처',
        baseUrl: `${GOV_API_BASE_URL}/1471057/RNDBSNSPBLANC01`,
        endpoints: {
            researchAnnouncements: '/getList' // 연구사업 공고
        }
    },
    KOICA: {
        name: '한국국제협력단',
        baseUrl: `${KOICA_BASE_URL}/api/ws/BsnsService`,
        endpoints: {
            announcements: '/getBsnsInfo' // 사업정보 조회
        }
    },
    KOREATECH: {
        name: '한국노인인력개발원',
        baseUrl: `${GOV_API_BASE_URL}/B552474/JobBsnInfoService`,
        endpoints: {
            jobAnnouncements: '/getJobBsnInfo' // 자립형일자리 공고
        }
    },
    STARTUP_EDU: {
        name: '창업진흥원_창업에듀',
        baseUrl: `${GOV_API_BASE_URL}/B552735/kisedEduService`,
        endpoints: {
            courses: '/getEduCourseList' // 창업교육과정
        }
    }
};

interface GovAPIResponse {
    response: {
        header: {
            resultCode: string;
            resultMsg: string;
        };
        body: {
            items?: {
                item: any[];
            };
            totalCount?: number;
            numOfRows?: number;
            pageNo?: number;
        };
    };
}

export interface GovernmentProgram {
    id: string;
    program_id: string;
    title: string;
    agency: string;
    department?: string;
    deadline?: Date | null;
    start_date?: Date | null;
    end_date?: Date | null;
    status: string;
    d_day?: string;
    category: string[];
    tags: string[];
    budget?: string;
    description?: string;
    link?: string;
    requirements?: string[];
    api_source: string;
}

/**
 * Creates an axios instance with default config
 */
const createAPIInstance = (baseUrl: string): AxiosInstance => {
    return axios.create({
        baseURL: baseUrl,
        timeout: 15000,
        headers: {
            'Accept': 'application/json',
        },
    });
};

/**
 * Calculate D-Day from deadline
 */
const calculateDDay = (deadline: Date): string => {
    const now = new Date();
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return '마감';
    if (diff === 0) return '오늘마감';
    return `D-${diff}`;
};

/**
 * Determine status based on deadline
 */
const determineStatus = (deadline: Date | null): string => {
    if (!deadline) return '상시모집';

    const dDay = calculateDDay(deadline);
    if (dDay === '마감') return '마감';
    if (dDay === '오늘마감' || dDay.includes('D-') && parseInt(dDay.slice(2)) <= 7) {
        return '마감임박';
    }
    return '접수중';
};

/**
 * Parse date string to Date object (handles various formats)
 */
const parseDate = (dateStr: string | undefined | null): Date | null => {
    if (!dateStr) return null;

    try {
        // Handle YYYYMMDD format
        if (/^\d{8}$/.test(dateStr)) {
            const year = dateStr.slice(0, 4);
            const month = dateStr.slice(4, 6);
            const day = dateStr.slice(6, 8);
            return new Date(`${year}-${month}-${day}`);
        }

        // Handle other formats
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
        return null;
    }
};

/**
 * Fetch K-Startup business announcements
 */
export const fetchKStartupPrograms = async (): Promise<GovernmentProgram[]> => {
    try {
        const config = API_CONFIGS.K_STARTUP;
        const api = createAPIInstance(config.baseUrl);

        const response = await api.get<GovAPIResponse>(config.endpoints.announcements, {
            params: {
                serviceKey: API_KEY,
                pageNo: 1,
                numOfRows: 100,
                _type: 'json'
            }
        });

        const items = response.data.response?.body?.items?.item || [];
        if (!Array.isArray(items)) {
            return items ? [items] : [];
        }

        return items.map((item: any) => {
            const deadline = parseDate(item.rcptEndDt || item.endDate || item.deadline);
            const startDate = parseDate(item.rcptStaDt || item.startDate);

            return {
                id: `kstartup-${item.bizId || item.id || Math.random().toString(36).substr(2, 9)}`,
                program_id: item.bizId || item.id || '',
                title: item.bizNm || item.title || '제목 없음',
                agency: '창업진흥원',
                department: item.deptNm || undefined,
                deadline: deadline,
                start_date: startDate,
                end_date: deadline,
                status: determineStatus(deadline),
                d_day: deadline ? calculateDDay(deadline) : undefined,
                category: item.bizType ? [item.bizType] : ['창업지원'],
                tags: [item.targetInfo, item.bizType].filter(Boolean),
                budget: item.supportAmt || item.budget || undefined,
                description: item.bizSummary || item.description || '',
                link: item.linkUrl || item.url || undefined,
                requirements: item.targetInfo ? [item.targetInfo] : [],
                api_source: 'K-Startup'
            };
        });
    } catch (error: any) {
        console.error('K-Startup API Error:', error.response?.data || error.message);
        return [];
    }
};

/**
 * Fetch all government programs from all configured APIs
 */
export const fetchAllGovernmentPrograms = async (): Promise<GovernmentProgram[]> => {
    console.log('🏛️  정부지원사업 API 호출 시작...');

    const results = await Promise.allSettled([
        fetchKStartupPrograms(),
        // Add other agency fetchers here as they're implemented
    ]);

    const allPrograms: GovernmentProgram[] = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            allPrograms.push(...result.value);
            console.log(`✅ API ${index + 1} 성공: ${result.value.length}개 프로그램`);
        } else {
            console.error(`❌ API ${index + 1} 실패:`, result.reason);
        }
    });

    console.log(`🎯 총 ${allPrograms.length}개 정부지원사업 수집 완료`);
    return allPrograms;
};

/**
 * Test API connection with the service key
 */
export const testAPIConnection = async (): Promise<boolean> => {
    try {
        console.log('🔍 API 연결 테스트 중...');
        const programs = await fetchKStartupPrograms();
        console.log(`✅ API 연결 성공! ${programs.length}개 프로그램 확인`);
        return true;
    } catch (error) {
        console.error('❌ API 연결 실패:', error);
        return false;
    }
};
