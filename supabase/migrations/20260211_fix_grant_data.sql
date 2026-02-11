-- 1. Remove generic/duplicate Bio grants to ensure clean slate
DELETE FROM public.grants WHERE title LIKE '%바이오%';

-- 2. Insert precise matches for 'Biotechnology' expertise
-- These records explicitly set tech_field = 'Biotechnology' to match the user's profile.
INSERT INTO public.grants (title, agency, d_day, target_audience, tech_field, summary, category, description, original_url)
VALUES 
('2026 차세대 바이오 혁신 기술개발사업', '보건복지부', 'D-45', '연구자', 'Biotechnology', '바이오 분야 원천 기술 확보를 위한 R&D 지원', 'R&D', '바이오 의약품 및 헬스케어 기술 개발을 지원합니다.', 'https://www.htdream.kr'),
('의료 데이터 기반 AI 융합 연구', '과기부', 'D-30', '대학원생', 'Biotechnology', '바이오 데이터와 인공지능의 융합 연구 지원', 'R&D', '병원 임상 데이터를 활용한 바이오 연구 과제입니다.', 'https://www.nrf.re.kr');

-- 3. Update any existing 'Science' grants that should be 'Biotechnology' (Optional cleanup)
UPDATE public.grants SET tech_field = 'Biotechnology' WHERE title LIKE '%바이오%' AND tech_field = 'Science';
