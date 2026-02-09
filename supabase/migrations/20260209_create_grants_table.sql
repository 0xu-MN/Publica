-- Migration: Create Grants Table
-- Description: Stores government grant information for internal AI matching.

CREATE TABLE IF NOT EXISTS grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    agency TEXT NOT NULL,
    d_day TEXT, -- e.g., 'D-5'
    target_audience TEXT, -- e.g., 'Startup', 'Female', 'AI'
    tech_field TEXT, -- e.g., 'AI/ML', 'SaaS', 'Bio'
    summary TEXT,
    description TEXT,
    category TEXT CHECK (category IN ('R&D', 'Commercialization')), -- '사업화' or 'R&D'
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for scoring optimization
CREATE INDEX IF NOT EXISTS idx_grants_category ON grants(category);

-- Seed Data (MVP Demo)
INSERT INTO grants (title, agency, d_day, target_audience, tech_field, summary, category, description)
VALUES 
('2026 초격차 AI 스타트업 육성사업', '중소벤처기업부', 'D-12', '예비/초기 스타트업', 'AI, Deep Tech', '딥테크 분야 혁신 기업 대상 사업화 자금 지원', 'Commercialization', '글로벌 유니콘으로 성장할 AI 유망 기업을 선발하여 최대 2억원의 사업화 자금을 지원합니다.'),
('글로벌 시장 진출 지원 바우처', 'KOTRA', 'D-5', '수출 희망 중소기업', '전분야', '해외 마케팅 및 판로 개척을 위한 바우처 제공', 'Commercialization', '수출 초기 기업을 대상으로 맞춤형 마케팅 서비스를 제공하는 바우처 사업입니다.'),
('민관협력형 R&D 전략기술 개발사업', '과학기술정보통신부', 'D-20', '3년 이상 업력 기업', 'SaaS, 클라우드', '전략 기술 고도화를 위한 민관 합동 R&D 지원', 'R&D', '국가 전략 기술 분야의 R&D 역량 강화를 위해 기업당 최대 5억원의 연구 개발비를 지원합니다.'),
('경기 AI/BigData 우수기업 인증 지원', '경기도경제과학진흥원', 'D-3', '경기도 내 기업', 'AI, 빅데이터', '경기도 소재 데이터 혁신 기업 인증 및 혜택 부여', 'Commercialization', '경기도 내 AI 및 빅데이터 기술력이 우수한 기업을 발굴하여 브랜드 가치를 제고합니다.'),
('여성 벤처기업 R&D 혁신 성장 지원', '여성벤처협회', 'D-8', '여성 대표자 벤처기업', '전분야', '여성 기업인의 기술 혁신 및 시장 경쟁력 강화', 'R&D', '우수한 기술을 보유한 여성 벤처기업의 기술 고도화 및 R&D 사업화를 지원합니다.');
