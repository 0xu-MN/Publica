import { Grant } from '../services/grants';

// ─── Region Normalization ───
// ProfileSetupScreen saves '서울특별시', but crawl-grants saves '서울'.
// This function normalizes both to the same short format for matching.
const REGION_MAP: Record<string, string> = {
    '서울특별시': '서울', '서울시': '서울', '서울': '서울',
    '경기도': '경기', '경기': '경기',
    '인천광역시': '인천', '인천시': '인천', '인천': '인천',
    '부산광역시': '부산', '부산시': '부산', '부산': '부산',
    '대구광역시': '대구', '대구시': '대구', '대구': '대구',
    '광주광역시': '광주', '광주시': '광주', '광주': '광주',
    '대전광역시': '대전', '대전시': '대전', '대전': '대전',
    '울산광역시': '울산', '울산시': '울산', '울산': '울산',
    '세종특별자치시': '세종', '세종시': '세종', '세종': '세종',
    '강원특별자치도': '강원', '강원도': '강원', '강원': '강원',
    '충청북도': '충북', '충북': '충북',
    '충청남도': '충남', '충남': '충남',
    '전라북도': '전북', '전북특별자치도': '전북', '전북': '전북',
    '전라남도': '전남', '전남': '전남',
    '경상북도': '경북', '경북': '경북',
    '경상남도': '경남', '경남': '경남',
    '제주특별자치도': '제주', '제주도': '제주', '제주': '제주',
};

// City-to-Province mapping for detecting hidden region info in titles
// e.g. '보령시' → '충남', '포항시' → '경북'
const CITY_TO_PROVINCE: Record<string, string> = {
    // 충남
    '보령': '충남', '천안': '충남', '아산': '충남', '서산': '충남', '논산': '충남', '당진': '충남', '공주': '충남', '계룡': '충남', '홍성': '충남', '예산': '충남', '태안': '충남', '부여': '충남', '서천': '충남', '청양': '충남', '금산': '충남',
    // 충북
    '청주': '충북', '충주': '충북', '제천': '충북', '영동': '충북', '옥천': '충북', '보은': '충북', '단양': '충북', '음성': '충북', '진천': '충북', '괴산': '충북', '증평': '충북',
    // 경북
    '포항': '경북', '경주': '경북', '안동': '경북', '구미': '경북', '김천': '경북', '영주': '경북', '영천': '경북', '상주': '경북', '문경': '경북', '경산': '경북', '의성': '경북', '청송': '경북', '영양': '경북', '영덕': '경북', '울진': '경북', '봉화': '경북', '예천': '경북', '성주': '경북', '고령': '경북', '칠곡': '경북', '울릉': '경북',
    // 경남
    '창원': '경남', '진주': '경남', '통영': '경남', '사천': '경남', '김해': '경남', '밀양': '경남', '거제': '경남', '양산': '경남', '의령': '경남', '함안': '경남', '창녕': '경남', '고성': '경남', '남해': '경남', '하동': '경남', '산청': '경남', '함양': '경남', '거창': '경남', '합천': '경남',
    // 전북
    '전주': '전북', '익산': '전북', '군산': '전북', '정읍': '전북', '남원': '전북', '김제': '전북', '완주': '전북', '진안': '전북', '무주': '전북', '장수': '전북', '임실': '전북', '순창': '전북', '고창': '전북', '부안': '전북',
    // 전남
    '목포': '전남', '여수': '전남', '순천': '전남', '나주': '전남', '광양': '전남', '담양': '전남', '곡성': '전남', '구례': '전남', '장성': '전남', '영광': '전남', '함평': '전남', '무안': '전남', '신안': '전남', '해남': '전남', '영암': '전남', '진도': '전남', '완도': '전남', '강진': '전남', '장흥': '전남', '보성': '전남', '고흥': '전남', '화순': '전남',
    // 강원
    '춘천': '강원', '원주': '강원', '강릉': '강원', '동해': '강원', '태백': '강원', '속초': '강원', '삼척': '강원', '홍천': '강원', '횡성': '강원', '영월': '강원', '평창': '강원', '정선': '강원', '철원': '강원', '화천': '강원', '양구': '강원', '인제': '강원', '양양': '강원',
    // 경기
    '수원': '경기', '성남': '경기', '용인': '경기', '고양': '경기', '부천': '경기', '안산': '경기', '안양': '경기', '남양주': '경기', '화성': '경기', '평택': '경기', '의정부': '경기', '시흥': '경기', '파주': '경기', '광명': '경기', '김포': '경기', '군포': '경기', '이천': '경기', '양주': '경기', '오산': '경기', '구리': '경기', '안성': '경기', '포천': '경기', '하남': '경기', '의왕': '경기', '여주': '경기', '동두천': '경기', '과천': '경기',
};

// Detect the province of a city name mentioned in text
const detectCityProvince = (text: string): string | null => {
    for (const [city, province] of Object.entries(CITY_TO_PROVINCE)) {
        if (text.includes(city)) return province;
    }
    return null;
};

export const normalizeRegion = (raw: string): string => {
    if (!raw) return '';
    // Direct map match
    if (REGION_MAP[raw]) return REGION_MAP[raw];
    // Try matching the first 2 chars (e.g. '서울특별시 강남구' → '서울')
    for (const [key, val] of Object.entries(REGION_MAP)) {
        if (raw.startsWith(key)) return val;
    }
    // Last resort: check if any short region name is contained
    const SHORT_REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    for (const r of SHORT_REGIONS) {
        if (raw.includes(r)) return r;
    }
    return raw;
};

export interface UserProfile {
    user_type: string;
    location?: string; // DB column: profiles.location
    sido?: string; // legacy alias
    expertise?: string;
    major_category?: string;
    industry?: string;
    is_student?: boolean;
    student_id?: string;
    has_startup_intent?: boolean;
    business_reg_no?: string;
    business_years?: string;
    [key: string]: any;
}

export const calculateGrantScore = (grant: Grant, user: UserProfile): number => {
    // Safety check: if grant or user is missing, return 0
    if (!grant || !user) return 0;

    let score = 50; // Start at 50 (neutral), not 100
    const reasons: string[] = [];

    // --- Data Normalization ---
    const rawUserLocation = user.location || user.sido || '';
    const userRegionNorm = normalizeRegion(rawUserLocation);
    const userExpertise = user.expertise || '';
    const userMajor = user.major_category || '';
    const userIndustry = user.industry || '';

    // Grant fields with safe defaults — use `region` (the actual DB field)
    const grantTech = grant.tech_field || '';
    const grantTitle = grant.title || '';
    const grantSummary = grant.summary || '';
    const grantCategory = grant.category || '';
    const grantTarget = grant.target_audience || '';
    const grantDDay = grant.d_day || '';
    const grantRegion = normalizeRegion(grant.region || '');
    const grantText = `${grantTitle} ${grantSummary}`;

    const isStudent = user.user_type === 'researcher' && (user.is_student || !!user.student_id);
    const isResearcher = user.user_type === 'researcher';
    const hasStartupIntent = user.has_startup_intent;

    // --- GATE 1: Hard Filter (Location & Eligibility) ---

    const SHORT_REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

    if (userRegionNorm) {
        // Check 1: Grant has explicit region that doesn't match
        if (grantRegion && grantRegion !== '전국' && grantRegion !== userRegionNorm) {
            return 0;
        }

        // Check 2: Grant title/summary mentions a province-level region that doesn't match
        const mentionedRegion = SHORT_REGIONS.find(r => grantText.includes(r));
        if (mentionedRegion && mentionedRegion !== userRegionNorm) {
            return 0;
        }

        // Check 3: Grant title mentions a city that belongs to a different province
        // e.g. '보령시' → 충남, user is 서울 → filter out
        const cityProvince = detectCityProvince(grantText);
        if (cityProvince && cityProvince !== userRegionNorm) {
            return 0;
        }
    }

    // Biz Registration Filter
    const userHasBiz = !!user.business_reg_no;
    const grantRequiresBiz = grantTarget === '기창업자' || grantTarget === '7년미만';

    if (!userHasBiz && grantRequiresBiz) {
        return 0;
    }

    // --- SCORING: Region Match ---
    if (userRegionNorm) {
        if (grantRegion === userRegionNorm) {
            score += 25; // Exact region match → big boost
        } else if (grantRegion === '전국' || !grantRegion) {
            score += 10; // National grant → moderate boost
        }
    }

    // --- SCORING: Industry / Expertise Matching ---
    if (isResearcher || isStudent) {
        const techMatch = userExpertise && (grantTech.includes(userExpertise) || grantTitle.includes(userExpertise) || grantSummary.includes(userExpertise));

        if (techMatch) {
            score += 30; // Expertise match → big boost
        } else if (userExpertise) {
            score -= 15; // Has expertise but doesn't match → penalty
            reasons.push('Expertise mismatch');
        }
    } else if (userIndustry) {
        // For business/pre_entrepreneur users: industry keyword match
        const industryShort = userIndustry.replace(/업$/, '').replace(/및 /g, '');
        const industryKeywords = industryShort.split(/[,\s]+/).filter(k => k.length >= 2);

        const industryMatch = industryKeywords.some(kw => grantText.includes(kw));
        if (industryMatch) {
            score += 25; // Industry match → big boost
        } else {
            score -= 20; // Industry mismatch → penalty (THIS IS THE KEY FIX for 예술/정보통신 issue)
            reasons.push('Industry mismatch');
        }
    }

    // --- GATE 3: Student Intent Filter ---
    if (isStudent && !hasStartupIntent) {
        if (grantCategory === 'Commercialization' || grantTitle.includes('예비창업패키지') || grantTitle.includes('창업')) {
            score -= 30;
            reasons.push('No startup intent');
        }
    }

    // --- Bonus Scoring ---
    if (userExpertise && grantTech === userExpertise) score += 10;

    if (grantDDay) {
        const days = parseInt(grantDDay.replace('D-', '')) || 999;
        if (days <= 14) score += 5;
        if (days <= 7) score += 5;
    }

    // Business type bonus
    if (user.user_type === 'business' && grantTarget.includes('기업')) score += 5;
    if (user.user_type === 'pre_entrepreneur' && (grantTarget.includes('예비') || grantTitle.includes('예비창업'))) score += 10;

    return Math.max(0, Math.min(100, score));
};

/**
 * 추천 공고 정렬 — 모든 페이지에서 동일한 순서를 보장하기 위한 공유 유틸
 * WorkspaceDashboard / ConnectHomeView / GrantList 모두 이 함수를 사용해야 함
 */
export const getTopRecommendedGrants = (
    allGrants: Grant[],
    profile: UserProfile | null | undefined,
    limit: number = 5
): (Grant & { matching_score: number })[] => {
    const currentYear = new Date().getFullYear();

    const scored = allGrants.map(g => ({
        ...g,
        matching_score: profile ? calculateGrantScore(g, profile) : 0,
    }));

    // 기한 지난 공고 제거 (년도 기준)
    const active = scored.filter(g => {
        if (!g.deadline_date) return true;
        const year = parseInt(g.deadline_date.split('-')[0], 10);
        return isNaN(year) || year >= currentYear;
    });

    // 1차: matching_score 내림차순
    // 2차: score 동점이면 마감 임박(D-day 숫자 작을수록) 우선
    active.sort((a, b) => {
        const scoreDiff = b.matching_score - a.matching_score;
        if (scoreDiff !== 0) return scoreDiff;
        const dA = parseInt((a.d_day || '999').replace('D-', '')) || 999;
        const dB = parseInt((b.d_day || '999').replace('D-', '')) || 999;
        return dA - dB;
    });

    return active.slice(0, limit);
};
