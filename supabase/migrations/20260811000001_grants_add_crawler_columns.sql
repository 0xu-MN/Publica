-- Migration: crawl-grants 함수가 쓰는 컬럼을 실제 grants 테이블에 맞춘다.
-- crawl-grants/index.ts는 department/external_id/source/is_active/link를
-- 계속 써왔지만 실제 테이블엔 한 번도 추가된 적이 없어서, upsert가 매번
-- PGRST204(컬럼 없음)로 전량 실패하고 있었다 (inserted:0, updated:0).

ALTER TABLE public.grants
    ADD COLUMN IF NOT EXISTS department TEXT,
    ADD COLUMN IF NOT EXISTS external_id TEXT,
    ADD COLUMN IF NOT EXISTS source TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS link TEXT;

-- external_id 기준으로 upsert(merge-duplicates)가 동작하려면 유니크 인덱스가 필요하다.
-- 기존에 크롤러가 넣은 적 없는 행들은 external_id가 NULL이라 충돌하지 않는다.
CREATE UNIQUE INDEX IF NOT EXISTS idx_grants_external_id ON public.grants(external_id) WHERE external_id IS NOT NULL;
