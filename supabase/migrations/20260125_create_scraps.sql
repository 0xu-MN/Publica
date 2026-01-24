-- Create scraps table for Article Scrap feature
CREATE TABLE IF NOT EXISTS scraps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  ai_insight TEXT,
  bullets TEXT[], -- Store tags/bullets array
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  saved_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scraps ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own scraps" 
  ON scraps FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scraps" 
  ON scraps FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scraps" 
  ON scraps FOR DELETE 
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_scraps_user_id ON scraps(user_id);
CREATE INDEX IF NOT EXISTS idx_scraps_created_at ON scraps(created_at DESC);
