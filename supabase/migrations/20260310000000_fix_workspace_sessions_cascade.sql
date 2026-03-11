-- Fix missing ON DELETE CASCADE on workspace_sessions
ALTER TABLE workspace_sessions DROP CONSTRAINT IF EXISTS workspace_sessions_user_id_fkey;

ALTER TABLE workspace_sessions 
    ADD CONSTRAINT workspace_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) 
    ON DELETE CASCADE;
