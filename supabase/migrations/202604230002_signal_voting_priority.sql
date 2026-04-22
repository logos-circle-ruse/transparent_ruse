do $$
begin
  if not exists (select 1 from pg_type where typname = 'signal_priority') then
    create type public.signal_priority as enum ('Critical', 'High', 'Normal');
  end if;
end $$;

alter table public.signals
add column if not exists priority public.signal_priority not null default 'Normal',
add column if not exists upvotes integer not null default 0,
add column if not exists downvotes integer not null default 0;

create table if not exists public.signal_votes (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.signals(id) on delete cascade,
  voter_fingerprint text not null,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (signal_id, voter_fingerprint)
);

create index if not exists idx_signal_votes_signal on public.signal_votes(signal_id);

alter table public.signal_votes enable row level security;

drop policy if exists "service role manage signal votes" on public.signal_votes;
create policy "service role manage signal votes"
on public.signal_votes
for all
to service_role
using (true)
with check (true);

drop policy if exists "public read signal votes" on public.signal_votes;
create policy "public read signal votes"
on public.signal_votes
for select
to anon, authenticated
using (true);
