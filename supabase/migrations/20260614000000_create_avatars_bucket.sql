-- Create the public "avatars" storage bucket used by ProfileEditPage avatar uploads.
-- Idempotent: safe to run even if the bucket / policies already exist.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Public read of avatar files
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users may upload avatar files
drop policy if exists "avatars_auth_insert" on storage.objects;
create policy "avatars_auth_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

-- Authenticated users may overwrite (upsert) avatar files
drop policy if exists "avatars_auth_update" on storage.objects;
create policy "avatars_auth_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars');
