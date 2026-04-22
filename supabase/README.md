# Supabase Backend

This folder now contains the first production-ready backend building blocks:

- `migrations/20260422_0001_init_schema.sql`
  - core tables (`signals`, `signal_events`)
  - indexes
  - row-level security policies
  - update trigger
- `functions/intake/index.ts`
  - HTTP intake endpoint
  - optional Cloudflare Turnstile verification
  - AI moderation call to Groq (Llama)
  - duplicate hinting
  - multipart handling (text + files)
  - insert into `signals`
- `migrations/20260422_0002_signal_attachments.sql`
  - `signal_attachments` table
  - public storage bucket `signal-attachments`
- `migrations/20260422_0003_signal_voting_priority.sql`
  - priority and vote counters on `signals`
  - `signal_votes` table for unique per-user voting
- `functions/vote/index.ts`
  - upsert vote by voter fingerprint
  - recalculate upvotes/downvotes
  - auto-classify signal priority (`Normal`, `High`, `Critical`)

## Local setup

1. Install Supabase CLI.
2. Link your project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
3. Apply migration:
   ```bash
   supabase db push
   ```
4. Set function secrets:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... GROQ_API_KEY=... TURNSTILE_SECRET_KEY=... SUPABASE_STORAGE_BUCKET=signal-attachments
   ```
5. Deploy Edge Functions:
   ```bash
   supabase functions deploy intake
   supabase functions deploy vote
   ```

## Expected frontend env

Set these values in your frontend `.env` file:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_SUPABASE_INTAKE_URL=https://<project-ref>.functions.supabase.co/intake
VITE_SUPABASE_VOTE_URL=https://<project-ref>.functions.supabase.co/vote
VITE_TURNSTILE_SITE_KEY=<turnstile-site-key>
```
