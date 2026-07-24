-- Configurable platform flow diagrams for the admin portal.

create table if not exists public.flow_definitions (
  key text primary key,
  name_bg text not null,
  name_en text not null,
  description_bg text not null,
  description_en text not null,
  steps jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flow_definitions enable row level security;

drop policy if exists "admin manage flow definitions" on public.flow_definitions;
create policy "admin manage flow definitions"
on public.flow_definitions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service role manage flow definitions" on public.flow_definitions;
create policy "service role manage flow definitions"
on public.flow_definitions
for all
to service_role
using (true)
with check (true);

drop trigger if exists trg_flow_definitions_updated_at on public.flow_definitions;
create trigger trg_flow_definitions_updated_at
before update on public.flow_definitions
for each row execute function public.set_updated_at();

insert into public.flow_definitions (key, name_bg, name_en, description_bg, description_en, steps)
values
  (
    'citizen_submission',
    'Подаване на сигнал',
    'Citizen submission',
    'Какво се случва, когато гражданин подаде нов сигнал през публичната форма.',
    'What happens when a citizen submits a new signal through the public form.',
    '[
      {"id":"submit_form","sort_order":0,"title_bg":"Гражданинът подава сигнал","title_en":"Citizen submits signal","description_bg":"Заглавие, описание, квартал и по желание снимки/файлове.","description_en":"Title, description, district, and optional photos/files.","actor":"citizen","technical_key":"original_signal"},
      {"id":"bot_check","sort_order":1,"title_bg":"Проверка срещу ботове","title_en":"Bot protection check","description_bg":"Cloudflare Turnstile (ако е конфигуриран) преди обработка.","description_en":"Cloudflare Turnstile (when configured) before processing.","actor":"system"},
      {"id":"ai_moderation","sort_order":2,"title_bg":"AI модерация","title_en":"AI moderation","description_bg":"Groq/Llama проверява за spam, тролене и дублиране.","description_en":"Groq/Llama checks for spam, trolling, and duplicates.","actor":"ai","technical_key":"ai_summary"},
      {"id":"store_signal","sort_order":3,"title_bg":"Запис в базата","title_en":"Store in database","description_bg":"Сигналът и прикачените файлове се записват в Supabase.","description_en":"Signal and attachments are stored in Supabase.","actor":"system"},
      {"id":"email_municipality","sort_order":4,"title_bg":"Имейл към общината","title_en":"Email to municipality","description_bg":"Шаблон municipality_new_signal (Resend) — планирана автоматизация.","description_en":"municipality_new_signal template (Resend) — planned automation.","actor":"system","technical_key":"submitted_to_municipality"},
      {"id":"public_dashboard","sort_order":5,"title_bg":"Публично табло","title_en":"Public dashboard","description_bg":"Сигналът се вижда на таблото със статус Pending.","description_en":"Signal appears on the dashboard with Pending status.","actor":"system"}
    ]'::jsonb
  ),
  (
    'municipality_reply',
    'Отговор от общината',
    'Municipality reply',
    'Какво се случва, когато общината отговори (имейл или ръчна симулация в админа).',
    'What happens when the municipality replies (email or manual simulation in admin).',
    '[
      {"id":"receive_reply","sort_order":0,"title_bg":"Получен отговор","title_en":"Reply received","description_bg":"Имейл от общината или ръчно въведен текст в админ портала.","description_en":"Email from municipality or manually entered text in admin portal.","actor":"municipality","technical_key":"municipality_response"},
      {"id":"ai_review","sort_order":1,"title_bg":"AI медиатор оценява","title_en":"AI mediator reviews","description_bg":"Проверява дали отговорът е конкретен и задоволителен.","description_en":"Checks whether the reply is specific and satisfactory.","actor":"ai","technical_key":"ai_response_review"},
      {"id":"update_status","sort_order":2,"title_bg":"Обновяване на статус","title_en":"Status update","description_bg":"Resolved ако е ОК, No Response ако не е достатъчен.","description_en":"Resolved if OK, No Response if insufficient.","actor":"system"},
      {"id":"follow_up_email","sort_order":3,"title_bg":"Follow-up имейл (по избор)","title_en":"Follow-up email (optional)","description_bg":"Шаблон municipality_follow_up при незадоволителен отговор.","description_en":"municipality_follow_up template when reply is unsatisfactory.","actor":"system"},
      {"id":"public_timeline","sort_order":4,"title_bg":"Публична линия на комуникация","title_en":"Public communication timeline","description_bg":"Отговорът и AI оценката се виждат в модала на сигнала.","description_en":"Reply and AI review appear in the signal detail modal.","actor":"system"}
    ]'::jsonb
  ),
  (
    'public_engagement',
    'Гражданско участие',
    'Public engagement',
    'Как гражданите взаимодействат след публикуване на сигнал.',
    'How citizens interact after a signal is published.',
    '[
      {"id":"view_signal","sort_order":0,"title_bg":"Преглед на сигнал","title_en":"View signal","description_bg":"Гражданинът отваря детайлите от публичното табло.","description_en":"Citizen opens details from the public dashboard.","actor":"citizen"},
      {"id":"vote","sort_order":1,"title_bg":"Гласуване","title_en":"Voting","description_bg":"Upvote/downvote променя score и автоматично priority.","description_en":"Upvote/downvote changes score and automatic priority.","actor":"citizen"},
      {"id":"track_timeline","sort_order":2,"title_bg":"Проследяване на комуникация","title_en":"Track communication","description_bg":"Линията показва оригинал, AI обобщение, общински отговор.","description_en":"Timeline shows original, AI summary, municipality reply.","actor":"citizen"}
    ]'::jsonb
  )
on conflict (key) do nothing;
