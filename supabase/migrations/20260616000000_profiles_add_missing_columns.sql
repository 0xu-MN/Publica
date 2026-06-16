-- Migration: 신규 Supabase 프로젝트의 profiles 테이블에 누락된 컬럼 보강
-- 원인: 이전 마이그레이션들이 실제 실행 대신 repair(적용됨 표시)만 되어 컬럼 누락 발생.
-- 증상: ProfileSetupScreen 저장 시 "column ... does not exist" 에러 → 프로필 저장 불가.
-- 이 스크립트는 ProfileSetupScreen이 upsert 하는 모든 컬럼을 idempotent 하게 보장합니다.

-- 1. user_type ENUM 보장
DO $$ BEGIN
    CREATE TYPE public.user_type AS ENUM ('business', 'pre_entrepreneur', 'researcher', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. 누락 컬럼 보강 (이미 있으면 무시)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS user_type            public.user_type,
    ADD COLUMN IF NOT EXISTS location             TEXT,
    ADD COLUMN IF NOT EXISTS industry             TEXT,
    ADD COLUMN IF NOT EXISTS research_keywords    TEXT[],
    ADD COLUMN IF NOT EXISTS business_years       TEXT,
    ADD COLUMN IF NOT EXISTS business_reg_no      TEXT,
    ADD COLUMN IF NOT EXISTS birth_year           INTEGER,
    ADD COLUMN IF NOT EXISTS affiliation          TEXT,
    ADD COLUMN IF NOT EXISTS company_name         TEXT,
    ADD COLUMN IF NOT EXISTS item_one_liner       TEXT,
    ADD COLUMN IF NOT EXISTS item_description     TEXT,
    ADD COLUMN IF NOT EXISTS core_technology      TEXT,
    ADD COLUMN IF NOT EXISTS current_achievements TEXT,
    ADD COLUMN IF NOT EXISTS team_background      TEXT,
    ADD COLUMN IF NOT EXISTS target_market        TEXT,
    ADD COLUMN IF NOT EXISTS major_category       TEXT,
    ADD COLUMN IF NOT EXISTS researcher_type      TEXT,
    ADD COLUMN IF NOT EXISTS researcher_id        TEXT,
    ADD COLUMN IF NOT EXISTS student_id           TEXT,
    ADD COLUMN IF NOT EXISTS has_startup_intent   BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS sido                 TEXT,
    ADD COLUMN IF NOT EXISTS sigungu              TEXT;

-- 3. PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
