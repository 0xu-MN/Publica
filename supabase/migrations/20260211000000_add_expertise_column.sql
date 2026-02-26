-- Add expertise column to profiles table for storing sub-fields (e.g., Biotechnology)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS expertise TEXT;

COMMENT ON COLUMN public.profiles.expertise IS 'Detailed sub-field of the user (e.g., Biotechnology, AI/Computer Science)';
