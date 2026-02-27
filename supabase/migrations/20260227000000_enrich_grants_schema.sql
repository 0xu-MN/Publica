-- Migration: Enrich Grants Schema
-- Description: Adds detailed fields for grant information to support rich detail pages.

ALTER TABLE public.grants
ADD COLUMN IF NOT EXISTS budget TEXT,
ADD COLUMN IF NOT EXISTS eligibility TEXT,
ADD COLUMN IF NOT EXISTS exclusions TEXT,
ADD COLUMN IF NOT EXISTS support_details TEXT,
ADD COLUMN IF NOT EXISTS application_period TEXT,
ADD COLUMN IF NOT EXISTS application_method TEXT,
ADD COLUMN IF NOT EXISTS region TEXT DEFAULT '전국',
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS contact_info TEXT,
ADD COLUMN IF NOT EXISTS application_url TEXT;
