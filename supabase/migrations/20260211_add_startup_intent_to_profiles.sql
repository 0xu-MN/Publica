-- Migration: Add startup intent and major category to profiles
-- Description: Adds columns for better identification of student founders and academic specialization.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_startup_intent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS major_category TEXT;

COMMENT ON COLUMN public.profiles.has_startup_intent IS 'Flag for students/researchers interested in startup founding';
COMMENT ON COLUMN public.profiles.major_category IS 'Specialized major or research field';
