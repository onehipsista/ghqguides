-- Phase 3: Billing webhook support
-- Safe to run multiple times

alter table public.profiles
  add column if not exists guide_access boolean default false;

alter table public.profiles
  add column if not exists role text default null;

create or replace function public.grant_guide_access_by_email(
  p_email text,
  p_source text default 'stripe_webhook'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if p_email is null or btrim(p_email) = '' then
    return null;
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
  values (v_user_id, true, null)
  on conflict (id) do update
    set guide_access = true;

  return v_user_id;
end;
$$;

revoke all on function public.grant_guide_access_by_email(text, text) from public;
grant execute on function public.grant_guide_access_by_email(text, text) to service_role;
