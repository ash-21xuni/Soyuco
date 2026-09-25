-- Run this once in the Supabase SQL editor to enable images in journal entries.
-- Creates a PRIVATE storage bucket. Each user's images live in a folder named
-- after their user id, and only that user can read, add or remove them. The
-- app shows images through short-lived signed links, so old links stop working.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'journal-images',
  'journal-images',
  false,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users read own journal images" on storage.objects;
create policy "Users read own journal images"
  on storage.objects for select to authenticated
  using (bucket_id = 'journal-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users add own journal images" on storage.objects;
create policy "Users add own journal images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'journal-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own journal images" on storage.objects;
create policy "Users update own journal images"
  on storage.objects for update to authenticated
  using (bucket_id = 'journal-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own journal images" on storage.objects;
create policy "Users delete own journal images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'journal-images' and (storage.foldername(name))[1] = auth.uid()::text);
