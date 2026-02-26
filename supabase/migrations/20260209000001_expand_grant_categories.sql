-- Migration: Expand Grant Categories
-- Description: Adds Voucher and Policy Fund categories and seeds new data.

-- 1. Update CHECK constraint (Supabase allows replacing constraints)
ALTER TABLE grants DROP CONSTRAINT IF EXISTS grants_category_check;
ALTER TABLE grants ADD CONSTRAINT grants_category_check CHECK (category IN ('R&D', 'Commercialization', 'Voucher', 'Policy Fund'));

-- 2. Seed Data for new categories
INSERT INTO grants (title, agency, d_day, target_audience, tech_field, summary, category, description)
VALUES 
('2026 데이터 바우처 지원사업', '한국지능정보사회진흥원', 'D-25', '데이터 활용 스타트업', 'Data, AI', '비즈니스 고도화 및 신서비스 개발을 위한 데이터 구매/가공 서비스 지원', 'Voucher', '데이터 구매 및 가공이 필요한 기업을 대상으로 바우처 형식의 예산을 지원합니다.'),
('클라우드 서비스 이용 지원 바우처', '정보통신산업진흥원', 'D-15', '중소기업 및 스타트업', 'Cloud, SaaS', '클라우드 도입을 통한 디지털 전환 가속화 지원', 'Voucher', '국내 클라우드 서비스 이용료의 최대 80%를 지원하는 바우처 사업입니다.'),
('청년 일자리 도약 장려금', '고용노동부', 'D-99', '만 34세 이하 청년 채용 기업', '전분야', '정규직 채용 시 인건비 보조금 지급', 'Voucher', '취업 애로 청년을 정규직으로 채용하고 6개월 이상 유지 시 월 최대 60만원을 지원합니다.'),
('기술금융 공급망 혁신 정책자금', '기술보증기금', 'D-365', '기술력 우수 중소기업', '제조, ICT', '초저금리 운영 자금 대출 및 보증 지원', 'Policy Fund', '유망 기술 기업의 유동성 확보를 위해 저금리 장기 대출 및 특례 보증을 제공합니다.'),
('디지털 격차 해소 범부처 지원사업', '과학기술정보통신부', 'D-10', '개인 연구자 및 취약계층 비즈니스', '전분야', '상생 협력을 위한 범부처 통합 지원금', 'Voucher', '디지털 기술을 활용하여 사회적 가치를 창출하는 개인 및 기업을 지원합니다.');
