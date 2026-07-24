-- AI preview sessions (one Groq call) + original citizen text retention.

alter table public.signals
add column if not exists original_description text,
add column if not exists description_source text check (description_source in ('formatted', 'original'));

create table if not exists public.intake_preview_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  district text,
  submitter_name text,
  moderation jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_intake_preview_sessions_expires
on public.intake_preview_sessions (expires_at);

alter table public.intake_preview_sessions enable row level security;

drop policy if exists "service role manage intake preview sessions" on public.intake_preview_sessions;
create policy "service role manage intake preview sessions"
on public.intake_preview_sessions
for all
to service_role
using (true)
with check (true);
