-- used_articles 테이블 생성
-- 이미 사용된 기사 추적하여 중복 방지

CREATE TABLE IF NOT EXISTS used_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id TEXT UNIQUE NOT NULL,
  article_url TEXT NOT NULL,
  article_title TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  category TEXT
);

-- 인덱스 생성 (빠른 검색)
CREATE INDEX IF NOT EXISTS idx_article_id ON used_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_used_at ON used_articles(used_at);

-- 코멘트
COMMENT ON TABLE used_articles IS '사용된 기사 추적 테이블 - 중복 방지용';
COMMENT ON COLUMN used_articles.article_id IS 'MD5 해시 기반 고유 ID';
COMMENT ON COLUMN used_articles.article_url IS '원본 기사 URL';
