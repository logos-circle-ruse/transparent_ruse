-- Catalog tables manageable from the admin portal.

create table if not exists public.neighborhoods (
  id text primary key,
  name_bg text not null,
  name_en text not null,
  aliases text[] not null default '{}',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_neighborhoods_active on public.neighborhoods(active, sort_order);

create table if not exists public.ai_prompt_configs (
  key text primary key,
  kind text not null check (kind in ('moderation', 'response_review', 'custom')),
  title text not null,
  description text,
  system_prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.neighborhoods enable row level security;
alter table public.ai_prompt_configs enable row level security;

drop policy if exists "public read neighborhoods" on public.neighborhoods;
create policy "public read neighborhoods"
on public.neighborhoods
for select
to anon, authenticated
using (active = true);

drop policy if exists "admin manage neighborhoods" on public.neighborhoods;
create policy "admin manage neighborhoods"
on public.neighborhoods
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin manage ai prompt configs" on public.ai_prompt_configs;
create policy "admin manage ai prompt configs"
on public.ai_prompt_configs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service role manage neighborhoods" on public.neighborhoods;
create policy "service role manage neighborhoods"
on public.neighborhoods
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manage ai prompt configs" on public.ai_prompt_configs;
create policy "service role manage ai prompt configs"
on public.ai_prompt_configs
for all
to service_role
using (true)
with check (true);

drop trigger if exists trg_neighborhoods_updated_at on public.neighborhoods;
create trigger trg_neighborhoods_updated_at
before update on public.neighborhoods
for each row execute function public.set_updated_at();

drop trigger if exists trg_ai_prompt_configs_updated_at on public.ai_prompt_configs;
create trigger trg_ai_prompt_configs_updated_at
before update on public.ai_prompt_configs
for each row execute function public.set_updated_at();

insert into public.ai_prompt_configs (key, kind, title, description, system_prompt)
values
  (
    'moderation_system',
    'moderation',
    'Signal moderation',
    'Default moderation policy for citizen submissions.',
    'You are the moderation assistant for Transparent Ruse. Return strict JSON: decision, reason, duplicate_hint.'
  ),
  (
    'response_review_system',
    'response_review',
    'Municipality response review',
    'Default AI mediator policy for municipality replies.',
    'You are the AI mediator for Transparent Ruse. Return strict JSON: satisfactory, reason, suggested_follow_up.'
  )
on conflict (key) do nothing;

drop policy if exists "admin read admin profiles" on public.admin_profiles;
create policy "admin read admin profiles"
on public.admin_profiles
for select
to authenticated
using (public.is_admin());
