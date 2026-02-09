-- Migration: Add student_id to profiles
-- Description: Adds a student ID column specifically for undergraduate and graduate students.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS student_id TEXT;

COMMENT ON COLUMN public.profiles.student_id IS 'Student ID number for university students';
