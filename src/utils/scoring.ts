import { Grant } from '../services/grants';

export interface UserProfile {
    user_type: string;
    location?: string; // sido
    sido?: string; // alias for location
    expertise?: string;
    major_category?: string;
    is_student?: boolean;
    student_id?: string;
    has_startup_intent?: boolean;
    business_reg_no?: string;
    business_years?: number;
    [key: string]: any;
}

export const calculateGrantScore = (grant: Grant, user: UserProfile): number => {
    // Safety check: if grant or user is missing, return 0
    if (!grant || !user) return 0;

    let score = 100;
    const reasons: string[] = [];

    // --- Data Normalization ---
    const userLocation = user.location || user.sido || '';
    const userExpertise = user.expertise || '';
    const userMajor = user.major_category || '';

    // Grant fields with safe defaults
    const grantTech = grant.tech_field || '';
    const grantTitle = grant.title || '';
    const grantSummary = grant.summary || '';
    const grantCategory = grant.category || '';
    const grantTarget = grant.target_audience || '';
    const grantDDay = grant.d_day || '';
    const grantLocation = (grant as any).location || '';

    const isStudent = user.user_type === 'researcher' && (user.is_student || !!user.student_id);
    const isResearcher = user.user_type === 'researcher';
    const hasStartupIntent = user.has_startup_intent;

    // --- GATE 1: Hard Filter (Location & Eligibility) ---

    const regions = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

    // Strict Location Check
    if (grantLocation && grantLocation !== '전국') {
        if (userLocation && !grantLocation.includes(userLocation)) {
            return 0;
        }
    } else {
        // Fallback: Check title
        if (userLocation) {
            const mentionedRegion = regions.find(r => grantTitle.includes(r));
            if (mentionedRegion && mentionedRegion !== userLocation) {
                return 0;
            }
        }
    }

    // Biz Registration Filter
    const userHasBiz = !!user.business_reg_no;
    const grantRequiresBiz = grantTarget === '기창업자' || grantTarget === '7년미만';

    if (!userHasBiz && grantRequiresBiz) {
        return 0;
    }

    // --- GATE 2: The Expertise Barrier ---
    if (isResearcher || isStudent) {
        const techMatch = grantTech.includes(userExpertise) || (userExpertise && grantTech.includes(userExpertise));

        if (!techMatch && userExpertise) {
            const grantKeywords = [grantTech, grantTitle, grantSummary].join(' ');
            if (!grantKeywords.includes(userExpertise)) {
                score = Math.min(score, 40);
                reasons.push('Expertise mismatch');
            }
        }
    }

    // --- GATE 3: Student Intent Filter ---
    if (isStudent && !hasStartupIntent) {
        if (grantCategory === 'Commercialization' || grantTitle.includes('예비창업패키지') || grantTitle.includes('창업')) {
            score -= 50;
            reasons.push('No startup intent');
        }
    }

    // --- Bonus Scoring ---
    if (score > 40) {
        if (userExpertise && grantTech === userExpertise) score += 10;
        if (userExpertise && grantTitle.includes(userExpertise)) score += 10;

        if (grantDDay) {
            const days = parseInt(grantDDay.replace('D-', '')) || 999;
            if (days <= 14) score += 5;
        }
    }

    return Math.max(0, Math.min(100, score));
};
