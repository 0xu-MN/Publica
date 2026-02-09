-- Migration: Create Profiles Table
-- Description: Stores extended user profile data for AI matching.

CREATE TYPE public.user_type AS ENUM ('business', 'pre_entrepreneur', 'researcher', 'other');

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type public.user_type,
    location TEXT, -- Business or Residence area
    business_years TEXT, -- '<3yr', '3-7yr', '>7yr'
    industry TEXT, -- For Business/Pre-Entrepreneur
    birth_year INTEGER, -- For Pre-Entrepreneur eligibility
    research_keywords TEXT[], -- For Researchers/Others
    affiliation TEXT, -- University/Institute for Researchers
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to create profile record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
