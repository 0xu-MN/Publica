-- 작업 세션(프로젝트)을 저장하는 테이블
create table if not exists workspace_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text, -- 프로젝트 이름 (예: 전기차 배터리 분석)
  mode text, -- 마지막 작업 모드 (Hypothesis, Planner 등)
  workspace_data jsonb, -- 맵 데이터 (columns) 통째로 저장
  chat_history jsonb, -- 채팅 내역 통째로 저장
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (보안 정책): 내 것만 볼 수 있게
alter table workspace_sessions enable row level security;
create policy "Users can manage their own sessions" on workspace_sessions
  for all using (auth.uid() = user_id);
