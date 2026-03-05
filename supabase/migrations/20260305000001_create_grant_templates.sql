-- Migration: Create grant_templates table
-- Purpose: Store extracted section structures from grant application forms
-- Used by: parse-grant-template Edge Function, NexusEditView template loader

CREATE TABLE IF NOT EXISTS public.grant_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id UUID REFERENCES public.grants(id) ON DELETE CASCADE,
    sections JSONB NOT NULL DEFAULT '[]',
    -- sections schema: [{ "title": string, "description": string, "required": bool, "max_length": int|null, "order": int, "hints": string|null }]
    source_markdown TEXT,
    raw_form_url TEXT,
    parsed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by grant
CREATE INDEX IF NOT EXISTS idx_grant_templates_grant_id ON public.grant_templates(grant_id);

-- RLS policies
ALTER TABLE public.grant_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read templates (public knowledge)
CREATE POLICY "grant_templates_select" ON public.grant_templates
    FOR SELECT TO authenticated USING (true);

-- Only service role can insert/update (via Edge Functions)
CREATE POLICY "grant_templates_insert" ON public.grant_templates
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "grant_templates_update" ON public.grant_templates
    FOR UPDATE TO service_role USING (true);
