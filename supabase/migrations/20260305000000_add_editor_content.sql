-- workspace_sessions에 editor_content 컬럼 추가
-- NEXUS-Edit에서 작성한 문서 HTML을 저장
alter table workspace_sessions
  add column if not exists editor_content text;

-- editor_markdown도 추가 (Markdown 내보내기용)
alter table workspace_sessions
  add column if not exists editor_markdown text;
