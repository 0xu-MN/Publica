-- =============================================
-- follows 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS public.follows (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "follows_insert" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- profiles 테이블에 followers_count 컬럼이 없으면 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'profiles'
          AND column_name  = 'followers_count'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN followers_count INTEGER DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- =============================================
-- messages 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,
    read_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_insert" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update_read" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- =============================================
-- 팔로워 수 증감 RPC (stale closure 없이 안전하게 업데이트)
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_followers(target_user_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
    UPDATE public.profiles
    SET followers_count = COALESCE(followers_count, 0) + 1
    WHERE id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_followers(target_user_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
    UPDATE public.profiles
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
    WHERE id = target_user_id;
$$;

-- Realtime 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;

-- 인덱스 (대화 조회 성능)
CREATE INDEX IF NOT EXISTS messages_sender_receiver_idx
    ON public.messages (sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_receiver_idx
    ON public.messages (receiver_id, created_at DESC);
