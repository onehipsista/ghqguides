-- Phase 1 kickoff schema for guides.gethipquick.com
-- Safe approach: additive only in a separate schema

create schema if not exists ghq_guides;

create table if not exists ghq_guides.design_issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  severity text not null check (severity in ('minor', 'moderate', 'major')),
  body text not null,
  how_to_fix text not null,
  published boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists design_issues_published_order_idx
  on ghq_guides.design_issues (published, order_index);

create index if not exists design_issues_category_idx
  on ghq_guides.design_issues (category);

create index if not exists design_issues_severity_idx
  on ghq_guides.design_issues (severity);

alter table ghq_guides.design_issues enable row level security;

-- Public can read published issues only
drop policy if exists "public can read published design issues"
on ghq_guides.design_issues;

create policy "public can read published design issues"
on ghq_guides.design_issues
for select
using (published = true);

-- Authenticated admins can manage issues
drop policy if exists "admins can manage design issues"
on ghq_guides.design_issues;

create policy "admins can manage design issues"
on ghq_guides.design_issues
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

grant usage on schema ghq_guides to anon, authenticated;
grant select on ghq_guides.design_issues to anon, authenticated;
grant insert, update, delete on ghq_guides.design_issues to authenticated;

-- Optional (run only if you explicitly want to expose blurbs via this app):
-- create or replace view ghq_guides.blurbs_readonly
-- with (security_invoker = true) as
-- select *
-- from public.blurbs;
--
-- grant select on ghq_guides.blurbs_readonly to anon, authenticated;
