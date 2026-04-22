create table if not exists public.signal_attachments (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.signals(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_signal_attachments_signal_id
on public.signal_attachments (signal_id, created_at desc);

alter table public.signal_attachments enable row level security;

drop policy if exists "public read signal attachments" on public.signal_attachments;
create policy "public read signal attachments"
on public.signal_attachments
for select
to anon, authenticated
using (true);

drop policy if exists "service role manage signal attachments" on public.signal_attachments;
create policy "service role manage signal attachments"
on public.signal_attachments
for all
to service_role
using (true)
with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'signal-attachments',
  'signal-attachments',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;
