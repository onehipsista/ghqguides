-- =============================================================================
-- Phase 8 Blog Fix — reapply policies with WITH CHECK
-- Run this once if phase8-blog.sql was already executed.
-- =============================================================================

alter table ghq_guides.blog_categories enable row level security;
alter table ghq_guides.posts enable row level security;

-- Ensure latest blog schema fields exist on already-provisioned tables
alter table ghq_guides.posts add column if not exists tldr text;

-- Required privileges for PostgREST access (RLS still applies)
grant usage on schema ghq_guides to anon, authenticated;
grant select on table ghq_guides.blog_categories to anon, authenticated;
grant select on table ghq_guides.posts to anon, authenticated;
grant insert, update, delete on table ghq_guides.blog_categories to authenticated;
grant insert, update, delete on table ghq_guides.posts to authenticated;

drop policy if exists "Public read blog categories" on ghq_guides.blog_categories;
create policy "Public read blog categories"
  on ghq_guides.blog_categories for select
  using (true);

drop policy if exists "Admin manage blog categories" on ghq_guides.blog_categories;
create policy "Admin manage blog categories"
  on ghq_guides.blog_categories for all
  using (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Public read published posts" on ghq_guides.posts;
create policy "Public read published posts"
  on ghq_guides.posts for select
  using (status = 'published');

drop policy if exists "Admin full access posts" on ghq_guides.posts;
create policy "Admin full access posts"
  on ghq_guides.posts for all
  using (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
