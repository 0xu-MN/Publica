-- Migration: Add ID columns to profiles
-- Description: Adds business registration number and researcher ID for better AI matching reliability.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_reg_no TEXT,
ADD COLUMN IF NOT EXISTS researcher_id TEXT;

-- Update RLS if necessary (though existing policies should cover new columns)
COMMENT ON COLUMN public.profiles.business_reg_no IS 'Primary Business Registration Number';
COMMENT ON COLUMN public.profiles.researcher_id IS 'Researcher ID / NTIS Number';
