-- Phase 5: media bucket for guide cover uploads
-- Safe to run multiple times

insert into storage.buckets (id, name, public)
values ('guide-media', 'guide-media', true)
on conflict (id) do nothing;

-- Public read
drop policy if exists "Public can read guide media" on storage.objects;
create policy "Public can read guide media"
on storage.objects
for select
using (bucket_id = 'guide-media');

-- Authenticated uploads
drop policy if exists "Authenticated can upload guide media" on storage.objects;
create policy "Authenticated can upload guide media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'guide-media');

-- Authenticated updates/deletes (optional for replacing assets)
drop policy if exists "Authenticated can update guide media" on storage.objects;
create policy "Authenticated can update guide media"
on storage.objects
for update
to authenticated
using (bucket_id = 'guide-media')
with check (bucket_id = 'guide-media');

drop policy if exists "Authenticated can delete guide media" on storage.objects;
create policy "Authenticated can delete guide media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'guide-media');
