-- Migration: Flow (AI 전략 분석) 무료 플랜 월 사용량 제한
-- Purpose: PricingPage에 명시된 "Free: 3회/월" 을 실제로 강제한다.
--   지금까지는 hasProAccess가 Nexus Edit(초안작성)만 막고, Flow 분석 시작 자체는
--   무료 유저도 무제한으로 호출할 수 있었다 (매 호출마다 Gemini 비용 발생).

CREATE TABLE IF NOT EXISTS public.flow_usage (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_key TEXT NOT NULL,          -- 'YYYY-MM' (UTC 기준)
    count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, month_key)
);

ALTER TABLE public.flow_usage ENABLE ROW LEVEL SECURITY;

-- 유저는 자기 사용량만 조회 가능. 증가는 아래 SECURITY DEFINER 함수로만 허용
-- (클라이언트가 직접 UPDATE해서 카운트를 조작하지 못하도록 INSERT/UPDATE 정책은 만들지 않는다)
CREATE POLICY "flow_usage_select_own" ON public.flow_usage
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "flow_usage_service_all" ON public.flow_usage
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- 무료 플랜 월 한도
-- Pro/관리자는 이 함수를 아예 호출하지 않으므로(클라이언트에서 hasProAccess로 분기) 무제한.
CREATE OR REPLACE FUNCTION public.check_and_increment_flow_usage(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 3
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, usage_limit INTEGER) AS $$
DECLARE
    v_month_key TEXT := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
    v_count INTEGER;
BEGIN
    -- 행 잠금으로 동시 요청 시 카운트 경합 방지
    SELECT count INTO v_count
    FROM public.flow_usage
    WHERE user_id = p_user_id AND month_key = v_month_key
    FOR UPDATE;

    IF v_count IS NULL THEN
        v_count := 0;
    END IF;

    IF v_count >= p_limit THEN
        RETURN QUERY SELECT false, v_count, p_limit;
        RETURN;
    END IF;

    INSERT INTO public.flow_usage (user_id, month_key, count, updated_at)
    VALUES (p_user_id, v_month_key, 1, now())
    ON CONFLICT (user_id, month_key)
    DO UPDATE SET count = public.flow_usage.count + 1, updated_at = now();

    RETURN QUERY SELECT true, v_count + 1, p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- authenticated 유저가 RPC로 호출할 수 있도록 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.check_and_increment_flow_usage(UUID, INTEGER) TO authenticated;
