-- Migration: Add granular profile columns
-- Description: Adds researcher_type, sido, and sigungu for better matching.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS researcher_type TEXT,
ADD COLUMN IF NOT EXISTS sido TEXT,
ADD COLUMN IF NOT EXISTS sigungu TEXT;

COMMENT ON COLUMN public.profiles.researcher_type IS 'Sub-category for researchers (e.g., Undergraduate, Graduate, etc.)';
COMMENT ON COLUMN public.profiles.sido IS 'Metropolitan City / Province';
COMMENT ON COLUMN public.profiles.sigungu IS 'District / County';
