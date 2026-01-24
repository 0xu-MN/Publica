-- InsightFlow 뉴스 데이터베이스 스키마
-- Supabase에서 실행

-- 1. news_items 테이블 생성
CREATE TABLE IF NOT EXISTS news_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  ai_insight TEXT,
  image_url TEXT,
  category TEXT CHECK (category IN ('Science', 'Economy')),
  source TEXT NOT NULL,
  source_url TEXT UNIQUE NOT NULL,
  published_at TIMESTAMP NOT NULL,
  tags TEXT[] DEFAULT '{}',
  read_time TEXT,
  priority_score INTEGER DEFAULT 5,
  is_trending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_news_category ON news_items(category);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_trending ON news_items(is_trending) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_news_priority ON news_items(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_tags ON news_items USING GIN(tags);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

-- 4. 읽기 권한 정책 (모든 사용자가 읽을 수 있음)
CREATE POLICY "Public read access" 
  ON news_items 
  FOR SELECT 
  USING (true);

-- 5. 쓰기 권한 정책 (서비스 키만 쓸 수 있음)
CREATE POLICY "Service role write access" 
  ON news_items 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- 6. 자동 updated_at 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_news_items_updated_at
  BEFORE UPDATE ON news_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 오래된 뉴스 자동 삭제 (7일 이상 된 뉴스)
-- Supabase Dashboard에서 Cron Job으로 설정
-- SELECT cron.schedule(
--   'delete-old-news',
--   '0 2 * * *', -- 매일 새벽 2시
--   $$DELETE FROM news_items WHERE published_at < NOW() - INTERVAL '7 days'$$
-- );

-- 8. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE news_items;

-- 9. 샘플 데이터 (테스트용)
INSERT INTO news_items (
  title, 
  summary, 
  ai_summary,
  ai_insight,
  category, 
  source, 
  source_url,
  published_at,
  tags,
  read_time,
  priority_score,
  is_trending
) VALUES 
(
  'CES 2026: Revolutionary AI Chip Unveiled',
  'A groundbreaking AI processor was announced at CES 2026...',
  'Major tech company reveals new AI chip at CES 2026, promising 10x performance boost.',
  'This advancement could significantly accelerate AI adoption in consumer devices.',
  'Science',
  'TechCrunch',
  'https://example.com/ces-2026-ai-chip',
  NOW(),
  ARRAY['#CES2026', '#AI', '#반도체'],
  '3min',
  10,
  TRUE
);

-- 10. Bookmarks 테이블 생성 (유저 관점)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  news_id UUID REFERENCES news_items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, news_id) -- 중복 스크랩 방지
);

-- 11. Bookmarks RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 내 북마크만 보기
CREATE POLICY "Users can view own bookmarks" 
  ON bookmarks FOR SELECT 
  USING (auth.uid() = user_id);

-- 내 북마크 추가
CREATE POLICY "Users can insert own bookmarks" 
  ON bookmarks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 내 북마크 삭제
CREATE POLICY "Users can delete own bookmarks" 
  ON bookmarks FOR DELETE 
  USING (auth.uid() = user_id);

-- 12. Realtime 활성화 (북마크 변경 감지)
-- 12. Realtime 활성화 (북마크 변경 감지)
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;

-- 13. AI Cards 테이블 생성 (AI 뉴스 카드)
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL, -- JSON string or raw text depending on parsing strategy, storing raw LLM output for now or parsed JSON
  created_at TIMESTAMP DEFAULT NOW()
);

-- 14. Cards RLS
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access cards" 
  ON cards FOR SELECT 
  USING (true);

CREATE POLICY "Service role write access cards" 
  ON cards 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- 15. Government Programs 테이블 (정부지원사업)
CREATE TABLE IF NOT EXISTS government_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  agency TEXT,
  period TEXT,
  status TEXT,
  d_day TEXT,
  category TEXT,
  link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 16. Government Programs RLS
ALTER TABLE government_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access programs" 
  ON government_programs FOR SELECT 
  USING (true);

CREATE POLICY "Service role write access programs" 
  ON government_programs 
  FOR ALL 
  USING (auth.role() = 'service_role');
