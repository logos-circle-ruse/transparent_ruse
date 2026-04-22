alter table public.signals
add column if not exists neighborhood_id text;

create index if not exists idx_signals_neighborhood_id
on public.signals (neighborhood_id);
