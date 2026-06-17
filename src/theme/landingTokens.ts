// ─────────────────────────────────────────────────────────────────────────────
// Figma DESIGN.md 기반 디자인 토큰 (서비스 소개 랜딩페이지)
// source: Figma "Untitled" / Page 1 — 2026-06-17
// 코드에서 hex/px를 직접 박지 말고 이 토큰을 참조하세요.
// ─────────────────────────────────────────────────────────────────────────────

export const COLORS = {
    background: '#FFFFFF',
    backgroundAlt: '#F2ECFE',   // 연보라 (히어로 워시 / 배지 배경)
    backgroundSoft: '#F8F8F8',
    accent: '#7C3AED',          // 포인트 컬러
    accentSoft: '#BE9DF6',
    surface: '#D9D9D9',
    textPrimary: '#000000',
    textPrimaryAlt: '#27272A',
    textSecondary: '#505050',
    textTertiary: '#767676',
    border: '#999999',
    amber: '#F59E0B',
    blue: '#3CA5E9',
    green: '#38B780',
    danger: '#E21518',
} as const;

// Pretendard, line-height 140%, letter-spacing -0.025em
export const TYPE = {
    letterSpacing: -0.4,        // ≈ -0.025em (대략치, RN은 px 단위)
    lineHeightRatio: 1.4,
    display: 48,
    h1: 38,
    h2: 30,
    h3: 28,
    h6: 24,
    h7: 22,
    h8: 20,
    bodyLg: 18,
    body: 16,
    bodySm: 14,
    caption: 12,
} as const;

export const LAYOUT = {
    frameWidth: 1920,
    contentWidth: 1420,
    headerHeight: 80,
    headerLogoLeft: 160,
    headerRight: 78,
} as const;

export const RADII = {
    sm: 12,
    md: 14,
    lg: 25,
    xl: 50,
} as const;
