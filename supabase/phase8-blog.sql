-- =============================================================================
-- Phase 8 — Blog (posts + blog_categories)
-- Run this in the Supabase SQL Editor for project otaohyabqvpfwbmomzlx
-- =============================================================================

-- ── blog_categories ──────────────────────────────────────────────────────────
create table if not exists ghq_guides.blog_categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

alter table ghq_guides.blog_categories enable row level security;

-- Required privileges for PostgREST access (RLS still applies)
grant usage on schema ghq_guides to anon, authenticated;
grant select on table ghq_guides.blog_categories to anon, authenticated;

-- Public read
drop policy if exists "Public read blog categories" on ghq_guides.blog_categories;
create policy "Public read blog categories"
  on ghq_guides.blog_categories for select
  using (true);

-- Admin write (service_role bypasses; user sessions need profile.role check)
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

-- ── posts ─────────────────────────────────────────────────────────────────────
create table if not exists ghq_guides.posts (
  id                    uuid        primary key default gen_random_uuid(),
  title                 text        not null,
  slug                  text        not null unique,
  excerpt               text        not null default '',
  tldr                  text,
  content               text        not null default '',
  cover_image           text,
  author                text,
  category              text,
  tags                  text[]      not null default '{}',
  status                text        not null default 'draft'
                          check (status in ('draft', 'published')),
  reading_time_minutes  integer     not null default 1,
  published_at          timestamptz,
  order_index           integer     not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table ghq_guides.posts enable row level security;

grant select on table ghq_guides.posts to anon, authenticated;
grant insert, update, delete on table ghq_guides.blog_categories to authenticated;
grant insert, update, delete on table ghq_guides.posts to authenticated;

-- Public can read published posts
drop policy if exists "Public read published posts" on ghq_guides.posts;
create policy "Public read published posts"
  on ghq_guides.posts for select
  using (status = 'published');

-- Admin full access
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

-- Seed a default "Uncategorised" category so the dropdown is never empty
insert into ghq_guides.blog_categories (name, slug)
values ('Uncategorised', 'uncategorised')
on conflict do nothing;
