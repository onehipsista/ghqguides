-- Phase 2 schema for guide library + article content
-- Additive only, same ghq_guides schema

create schema if not exists ghq_guides;

create table if not exists ghq_guides.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists ghq_guides.guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  cover_image text,
  category text,
  featured boolean not null default false,
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists ghq_guides.sections (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references ghq_guides.guides(id) on delete cascade,
  title text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists ghq_guides.articles (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references ghq_guides.guides(id) on delete cascade,
  section_id uuid references ghq_guides.sections(id) on delete set null,
  title text not null,
  slug text not null,
  content text not null default '',
  order_index integer not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (guide_id, slug)
);

create index if not exists guides_published_idx
  on ghq_guides.guides (published);

create index if not exists guides_featured_idx
  on ghq_guides.guides (featured);

create index if not exists sections_guide_order_idx
  on ghq_guides.sections (guide_id, order_index);

create index if not exists articles_guide_order_idx
  on ghq_guides.articles (guide_id, order_index);

create index if not exists articles_section_order_idx
  on ghq_guides.articles (section_id, order_index);

alter table ghq_guides.categories enable row level security;
alter table ghq_guides.guides enable row level security;
alter table ghq_guides.sections enable row level security;
alter table ghq_guides.articles enable row level security;

drop policy if exists "public can read published guides" on ghq_guides.guides;
create policy "public can read published guides"
on ghq_guides.guides
for select
using (published = true);

drop policy if exists "public can read sections for published guides" on ghq_guides.sections;
create policy "public can read sections for published guides"
on ghq_guides.sections
for select
using (
  exists (
    select 1
    from ghq_guides.guides g
    where g.id = sections.guide_id
      and g.published = true
  )
);

drop policy if exists "public can read published articles for published guides" on ghq_guides.articles;
create policy "public can read published articles for published guides"
on ghq_guides.articles
for select
using (
  published = true
  and exists (
    select 1
    from ghq_guides.guides g
    where g.id = articles.guide_id
      and g.published = true
  )
);

drop policy if exists "public can read categories" on ghq_guides.categories;
create policy "public can read categories"
on ghq_guides.categories
for select
using (true);

drop policy if exists "admins can manage categories" on ghq_guides.categories;
create policy "admins can manage categories"
on ghq_guides.categories
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

drop policy if exists "admins can manage guides" on ghq_guides.guides;
create policy "admins can manage guides"
on ghq_guides.guides
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

drop policy if exists "admins can manage sections" on ghq_guides.sections;
create policy "admins can manage sections"
on ghq_guides.sections
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

drop policy if exists "admins can manage articles" on ghq_guides.articles;
create policy "admins can manage articles"
on ghq_guides.articles
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
grant select on ghq_guides.categories to anon, authenticated;
grant select on ghq_guides.guides to anon, authenticated;
grant select on ghq_guides.sections to anon, authenticated;
grant select on ghq_guides.articles to anon, authenticated;

grant insert, update, delete on ghq_guides.categories to authenticated;
grant insert, update, delete on ghq_guides.guides to authenticated;
grant insert, update, delete on ghq_guides.sections to authenticated;
grant insert, update, delete on ghq_guides.articles to authenticated;
