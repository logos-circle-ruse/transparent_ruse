create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'signal_status') then
    create type public.signal_status as enum ('Resolved', 'Pending', 'No Response');
  end if;
end $$;

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) >= 5),
  description text not null check (char_length(description) >= 20),
  district text,
  submitter_name text,
  status public.signal_status not null default 'Pending',
  ai_moderation_status text not null default 'approved',
  ai_moderation_reason text,
  duplicate_of_signal_id uuid references public.signals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_signals_created_at on public.signals (created_at desc);
create index if not exists idx_signals_status on public.signals (status);

create table if not exists public.signal_events (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.signals(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.signals enable row level security;
alter table public.signal_events enable row level security;

drop policy if exists "public read signals" on public.signals;
create policy "public read signals"
on public.signals
for select
to anon, authenticated
using (true);

drop policy if exists "service role manage signals" on public.signals;
create policy "service role manage signals"
on public.signals
for all
to service_role
using (true)
with check (true);

drop policy if exists "public read signal events" on public.signal_events;
create policy "public read signal events"
on public.signal_events
for select
to anon, authenticated
using (true);

drop policy if exists "service role manage signal events" on public.signal_events;
create policy "service role manage signal events"
on public.signal_events
for all
to service_role
using (true)
with check (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_signals_updated_at on public.signals;
create trigger trg_signals_updated_at
before update on public.signals
for each row execute function public.set_updated_at();
