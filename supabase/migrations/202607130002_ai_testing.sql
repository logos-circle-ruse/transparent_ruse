-- AI testing module: reusable prompt experiments + run history

create table if not exists public.ai_test_cases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('moderation', 'response_review')),
  system_prompt text not null,
  user_payload jsonb not null default '{}'::jsonb,
  expected jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_test_cases_kind on public.ai_test_cases(kind, created_at desc);

create table if not exists public.ai_test_runs (
  id uuid primary key default gen_random_uuid(),
  test_case_id uuid references public.ai_test_cases(id) on delete set null,
  kind text not null check (kind in ('moderation', 'response_review')),
  model text not null default 'llama-3.3-70b-versatile',
  temperature numeric not null default 0.1,
  system_prompt text not null,
  user_payload jsonb not null default '{}'::jsonb,
  raw_output text,
  parsed_output jsonb,
  ok boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_test_runs_case on public.ai_test_runs(test_case_id, created_at desc);
create index if not exists idx_ai_test_runs_kind on public.ai_test_runs(kind, created_at desc);

alter table public.ai_test_cases enable row level security;
alter table public.ai_test_runs enable row level security;

-- Admin-only access (authenticated + is_admin()).
drop policy if exists "admin manage ai test cases" on public.ai_test_cases;
create policy "admin manage ai test cases"
on public.ai_test_cases
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin manage ai test runs" on public.ai_test_runs;
create policy "admin manage ai test runs"
on public.ai_test_runs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Update timestamp helper.
drop trigger if exists trg_ai_test_cases_updated_at on public.ai_test_cases;
create trigger trg_ai_test_cases_updated_at
before update on public.ai_test_cases
for each row execute function public.set_updated_at();

