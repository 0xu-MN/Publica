-- Add grant_type column to grants table to distinguish between project and subsidy

ALTER TABLE public.grants
ADD COLUMN IF NOT EXISTS grant_type text DEFAULT 'project';

-- Optionally, we can safely set historical data to 'project' or 'subsidy' based on category, but default is 'project'.
