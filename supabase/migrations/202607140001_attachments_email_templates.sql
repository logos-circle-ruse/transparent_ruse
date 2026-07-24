-- Admin attachment management + municipality email templates.

drop policy if exists "admin manage signal attachments" on public.signal_attachments;
create policy "admin manage signal attachments"
on public.signal_attachments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.email_templates (
  key text primary key,
  name text not null,
  recipient_email text,
  subject_template text not null,
  body_template text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;

drop policy if exists "admin manage email templates" on public.email_templates;
create policy "admin manage email templates"
on public.email_templates
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service role manage email templates" on public.email_templates;
create policy "service role manage email templates"
on public.email_templates
for all
to service_role
using (true)
with check (true);

drop trigger if exists trg_email_templates_updated_at on public.email_templates;
create trigger trg_email_templates_updated_at
before update on public.email_templates
for each row execute function public.set_updated_at();

insert into public.email_templates (key, name, recipient_email, subject_template, body_template, description)
values
  (
    'municipality_new_signal',
    'New signal to municipality',
    'signals@ruse.bg',
    'Граждански сигнал: {{signal_title}} ({{district}})',
    E'Здравейте,\n\nПодаден е нов граждански сигнал в платформата Transparent Ruse.\n\nЗаглавие: {{signal_title}}\nОписание: {{signal_description}}\nКвартал: {{district}}\nID: {{signal_id}}\n\nМоля, потвърдете получаването и посочете срок за действие.\n\nПоздрави,\nTransparent Ruse',
    'Outbound email when a signal is submitted to the municipality.'
  ),
  (
    'municipality_follow_up',
    'Follow-up for unsatisfactory response',
    'signals@ruse.bg',
    'Необходимо уточнение по сигнал: {{signal_title}}',
    E'Здравейте,\n\nОтговорът по сигнал {{signal_id}} не е достатъчно конкретен.\n\nОригинален сигнал: {{signal_description}}\nВашият отговор: {{municipality_response}}\n\nМоля, посочете конкретни действия, отговорна институция и срок.\n\nПоздрави,\nTransparent Ruse',
    'Follow-up email when AI marks a municipality response as unsatisfactory.'
  )
on conflict (key) do nothing;
