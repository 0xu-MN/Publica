-- Migration: Add URL columns to grants table
ALTER TABLE grants
ADD COLUMN IF NOT EXISTS original_url TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Seed data for testing (optional, helps immediate verification)
UPDATE grants 
SET original_url = 'https://www.mss.go.kr/site/smba/main.do', 
    file_url = 'https://www.mss.go.kr/site/smba/ex/bbs/View.do?cbIdx=86&bcIdx=1034811' 
WHERE original_url IS NULL;
