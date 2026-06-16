// ─────────────────────────────────────────────────────────────────────────────
// 권한(Entitlements) 중앙 관리
// - 관리자 이메일 목록 (결제 무관 전체 기능 사용 + 관리 권한)
// - 구독 상태 기반 Pro 접근 판정
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 관리자 이메일 (회사 계정).
 * 여기에 있는 계정만 결제 여부와 상관없이 모든 기능을 사용하고 관리 화면에 접근합니다.
 * ⚠️ 한 곳에서만 관리합니다. AuthContext/AdminScreen/SettingsModal 모두 이 목록을 import 합니다.
 * ⚠️ 회사 계정 1개만 관리자입니다. 다른 계정은 관리자로 들어올 수 없습니다.
 */
export const ADMIN_EMAILS = [
    'haloforge@haloforge.kr',  // 회사 대표 계정 (유일한 관리자)
];

export const isAdminEmail = (email?: string | null): boolean => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    return ADMIN_EMAILS.some(e => e.toLowerCase() === lower);
};

export type SubscriptionRow = {
    plan?: string | null;          // 'free' | 'pro' | 'pro_plus'
    status?: string | null;        // 'active' | 'trial' | 'past_due' | 'canceled' | 'expired'
    current_period_end?: string | null;
    trial_end?: string | null;
} | null;

/**
 * 유료(Pro) 기능 접근 가능 여부.
 * - 관리자 이메일: 항상 true
 * - 구독: status가 active/trial 이고 plan이 pro/pro_plus 이며 기간이 유효할 때 true
 */
export const computeProAccess = (email: string | null | undefined, sub: SubscriptionRow): boolean => {
    if (isAdminEmail(email)) return true;
    if (!sub) return false;

    const planOk = sub.plan === 'pro' || sub.plan === 'pro_plus';
    const statusOk = sub.status === 'active' || sub.status === 'trial';
    if (!planOk || !statusOk) return false;

    // 기간 만료 체크 (trial은 trial_end, 일반은 current_period_end 기준)
    const endStr = sub.status === 'trial' ? (sub.trial_end || sub.current_period_end) : sub.current_period_end;
    if (endStr) {
        const end = new Date(endStr).getTime();
        if (!Number.isNaN(end) && end < Date.now()) return false;
    }
    return true;
};

/**
 * PricingPage 등에 넘길 표시용 플랜.
 */
export const computeDisplayPlan = (
    email: string | null | undefined,
    sub: SubscriptionRow
): 'free' | 'pro' | 'trial' => {
    if (isAdminEmail(email)) return 'pro';
    if (!sub) return 'free';
    if (sub.status === 'trial') return 'trial';
    if ((sub.plan === 'pro' || sub.plan === 'pro_plus') && sub.status === 'active') return 'pro';
    return 'free';
};
