-- Create projects table for workspace integration
create type project_status as enum ('Saved', 'Analysis', 'Drafting', 'Done');

create table public.projects (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    grant_id text not null, -- Can be external ID or internal UUID
    grant_title text not null,
    status project_status not null default 'Saved',
    workspace_data jsonb default '{}'::jsonb, -- Stores mindmap, draft, chat_history
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.projects enable row level security;

create policy "Users can view their own projects"
on public.projects for select
using (auth.uid() = user_id);

create policy "Users can insert their own projects"
on public.projects for insert
with check (auth.uid() = user_id);

create policy "Users can update their own projects"
on public.projects for update
using (auth.uid() = user_id);

create policy "Users can delete their own projects"
on public.projects for delete
using (auth.uid() = user_id);

-- Indexes
create index projects_user_id_idx on public.projects(user_id);
create index projects_status_idx on public.projects(status);
