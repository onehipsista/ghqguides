-- Phase 7: products + secure entitlements + guide markdown exports
-- Safe to run multiple times

create schema if not exists ghq_guides;

create table if not exists ghq_guides.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  long_description text,
  category text,
  audience_market text,
  image_url text,
  price_cents integer not null default 0,
  currency text not null default 'usd',
  stripe_payment_link text,
  featured boolean not null default false,
  published boolean not null default false,
  order_index integer not null default 0,
  grants_guide_access boolean not null default false,
  access_scope text not null default 'downloads' check (access_scope in ('downloads', 'guides_plus_mistakes')),
  tags text[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists ghq_guides.product_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references ghq_guides.products(id) on delete cascade,
  title text not null,
  file_path text not null,
  file_ext text,
  file_size_bytes bigint,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, file_path)
);

create table if not exists ghq_guides.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references ghq_guides.products(id) on delete set null,
  scope text not null check (scope in ('downloads', 'guides_plus_mistakes')),
  source text not null default 'manual',
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, product_id, scope)
);

create table if not exists ghq_guides.download_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references ghq_guides.products(id) on delete set null,
  product_asset_id uuid references ghq_guides.product_assets(id) on delete set null,
  source text not null default 'signed_url',
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  user_agent text,
  ip_address inet,
  created_at timestamptz not null default now()
);

create table if not exists ghq_guides.guide_export_snapshots (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references ghq_guides.guides(id) on delete cascade,
  exported_by uuid references auth.users(id) on delete set null,
  format text not null default 'markdown' check (format in ('markdown')),
  version_label text,
  markdown_content text not null,
  created_at timestamptz not null default now()
);

create index if not exists products_published_idx on ghq_guides.products (published);
create index if not exists products_featured_idx on ghq_guides.products (featured);
create index if not exists products_order_idx on ghq_guides.products (order_index);
create index if not exists product_assets_product_idx on ghq_guides.product_assets (product_id, sort_order);
create index if not exists entitlements_user_status_idx on ghq_guides.user_entitlements (user_id, status, scope);
create index if not exists download_events_user_idx on ghq_guides.download_events (user_id, created_at desc);
create index if not exists export_snapshots_guide_idx on ghq_guides.guide_export_snapshots (guide_id, created_at desc);

alter table ghq_guides.products enable row level security;
alter table ghq_guides.product_assets enable row level security;
alter table ghq_guides.user_entitlements enable row level security;
alter table ghq_guides.download_events enable row level security;
alter table ghq_guides.guide_export_snapshots enable row level security;

-- Public can browse published products (shop)
drop policy if exists "public can read published products" on ghq_guides.products;
create policy "public can read published products"
on ghq_guides.products
for select
using (published = true);

-- Public can read active assets metadata for published products (not direct files)
drop policy if exists "public can read active product assets metadata" on ghq_guides.product_assets;
create policy "public can read active product assets metadata"
on ghq_guides.product_assets
for select
using (
  is_active = true
  and exists (
    select 1
    from ghq_guides.products p
    where p.id = product_assets.product_id
      and p.published = true
  )
);

-- User can read own entitlements and own download events
drop policy if exists "users can read own entitlements" on ghq_guides.user_entitlements;
create policy "users can read own entitlements"
on ghq_guides.user_entitlements
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can read own download events" on ghq_guides.download_events;
create policy "users can read own download events"
on ghq_guides.download_events
for select
to authenticated
using (user_id = auth.uid());

-- Admin management

drop policy if exists "admins can manage products" on ghq_guides.products;
create policy "admins can manage products"
on ghq_guides.products
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

drop policy if exists "admins can manage product assets" on ghq_guides.product_assets;
create policy "admins can manage product assets"
on ghq_guides.product_assets
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

drop policy if exists "admins can manage entitlements" on ghq_guides.user_entitlements;
create policy "admins can manage entitlements"
on ghq_guides.user_entitlements
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

drop policy if exists "admins can read download events" on ghq_guides.download_events;
create policy "admins can read download events"
on ghq_guides.download_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "admins can manage guide export snapshots" on ghq_guides.guide_export_snapshots;
create policy "admins can manage guide export snapshots"
on ghq_guides.guide_export_snapshots
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

-- Private bucket for secure product files
insert into storage.buckets (id, name, public)
values ('product-files-private', 'product-files-private', false)
on conflict (id) do nothing;

drop policy if exists "admins can upload private product files" on storage.objects;
create policy "admins can upload private product files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-files-private'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "admins can update private product files" on storage.objects;
create policy "admins can update private product files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-files-private'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  bucket_id = 'product-files-private'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "admins can delete private product files" on storage.objects;
create policy "admins can delete private product files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-files-private'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create or replace function public.upsert_entitlement_by_email(
  p_email text,
  p_scope text default 'downloads',
  p_product_id uuid default null,
  p_source text default 'stripe_webhook',
  p_grants_guide_access boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, ghq_guides
as $$
declare
  v_user_id uuid;
begin
  if p_email is null or btrim(p_email) = '' then
    return null;
  end if;

  if p_scope not in ('downloads', 'guides_plus_mistakes') then
    raise exception 'invalid entitlement scope: %', p_scope;
  end if;

  select u.id
  into v_user_id
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    return null;
  end if;

  insert into public.profiles (id, guide_access, role)
  values (v_user_id, coalesce(p_grants_guide_access, false), null)
  on conflict (id) do update
    set guide_access = case
      when coalesce(p_grants_guide_access, false) then true
      else public.profiles.guide_access
    end;

  insert into ghq_guides.user_entitlements (user_id, product_id, scope, source, status)
  values (v_user_id, p_product_id, p_scope, p_source, 'active')
  on conflict (user_id, product_id, scope) do update
    set status = 'active',
        source = excluded.source,
        granted_at = now(),
        expires_at = null;

  return v_user_id;
end;
$$;

revoke all on function public.upsert_entitlement_by_email(text, text, uuid, text, boolean) from public;
grant execute on function public.upsert_entitlement_by_email(text, text, uuid, text, boolean) to service_role;

grant usage on schema ghq_guides to anon, authenticated;
grant select on ghq_guides.products to anon, authenticated;
grant select on ghq_guides.product_assets to anon, authenticated;
grant select on ghq_guides.user_entitlements to authenticated;
grant select on ghq_guides.download_events to authenticated;
grant select on ghq_guides.guide_export_snapshots to authenticated;

grant insert, update, delete on ghq_guides.products to authenticated;
grant insert, update, delete on ghq_guides.product_assets to authenticated;
grant insert, update, delete on ghq_guides.user_entitlements to authenticated;
grant insert on ghq_guides.download_events to authenticated;
grant insert, update, delete on ghq_guides.guide_export_snapshots to authenticated;
