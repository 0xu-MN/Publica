-- Supabase에서 실행할 SQL
-- cards 테이블에 PUBLIC DELETE 권한 추가 (임시)

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Public delete access cards" ON cards;

-- PUBLIC DELETE 정책 추가
CREATE POLICY "Public delete access cards" 
  ON cards 
  FOR DELETE 
  USING (true);

-- 확인
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'cards';
