-- workspace_sessions에 brainstorm_content 컬럼 추가
alter table workspace_sessions
  add column if not exists brainstorm_content text;
