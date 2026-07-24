-- Admin portal: profiles, helper, and write policies for authenticated admins.

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

drop policy if exists "admins read own profile" on public.admin_profiles;
create policy "admins read own profile"
on public.admin_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "service role manage admin profiles" on public.admin_profiles;
create policy "service role manage admin profiles"
on public.admin_profiles
for all
to service_role
using (true)
with check (true);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

drop policy if exists "admin update signals" on public.signals;
create policy "admin update signals"
on public.signals
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin insert signal events" on public.signal_events;
create policy "admin insert signal events"
on public.signal_events
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin update signal events" on public.signal_events;
create policy "admin update signal events"
on public.signal_events
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin delete signal events" on public.signal_events;
create policy "admin delete signal events"
on public.signal_events
for delete
to authenticated
using (public.is_admin());
