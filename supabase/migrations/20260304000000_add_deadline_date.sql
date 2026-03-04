-- Migration: Add deadline_date and improve grants schema
-- Description: Adds proper DATE column for deadline tracking and source tracking

ALTER TABLE public.grants
ADD COLUMN IF NOT EXISTS deadline_date DATE,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create unique index on external_id for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_grants_external_id ON grants(external_id) WHERE external_id IS NOT NULL;

-- Create index for active grants filtering
CREATE INDEX IF NOT EXISTS idx_grants_active_deadline ON grants(is_active, deadline_date);

-- Update existing grants: mark them as manual source
UPDATE grants SET source = 'seed' WHERE source IS NULL OR source = 'manual';
