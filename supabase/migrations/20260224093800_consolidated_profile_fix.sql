-- Consolidated and Update Profiles Table
-- Description: This script ensures all columns required for AI matching and profile setup exist in the profiles table.
-- Instruction: Run this script in your Supabase SQL Editor if you encounter "column not found" errors.

-- 1. Ensure the user_type ENUM exists
DO $$ BEGIN
    CREATE TYPE public.user_type AS ENUM ('business', 'pre_entrepreneur', 'researcher', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure the profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Safely add missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type public.user_type,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS business_years TEXT,
ADD COLUMN IF NOT EXISTS birth_year INTEGER,
ADD COLUMN IF NOT EXISTS research_keywords TEXT[],
ADD COLUMN IF NOT EXISTS affiliation TEXT,
ADD COLUMN IF NOT EXISTS business_reg_no TEXT,
ADD COLUMN IF NOT EXISTS researcher_id TEXT,
ADD COLUMN IF NOT EXISTS researcher_type TEXT,
ADD COLUMN IF NOT EXISTS student_id TEXT,
ADD COLUMN IF NOT EXISTS has_startup_intent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS major_category TEXT,
ADD COLUMN IF NOT EXISTS sido TEXT,
ADD COLUMN IF NOT EXISTS sigungu TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- 4. Enable RLS and set policies (safely)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 5. Post-migration cleanup/notifications
COMMENT ON TABLE public.profiles IS 'Stores granular user profile information for AI-driven matching.';
NOTIFY pgrst, 'reload schema';
