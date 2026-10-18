# Running Active Local against Supabase (production)

The app ships **local-first**: SQLite + cookie auth out of the box, so
`npm install && npm run dev` works with zero configuration. This guide explains
how to move the same app to Supabase for production on Vercel.

## Why local-first?

A demo that needs three API keys before it renders a page isn’t a demo. Here you
can click through everything — including the digest emails (they’re written to
`var/outbox/` instead of being sent) — before committing to any vendor.

## Step 1 — Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of
   [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) → Run.
   The schema is identical to the local SQLite one; nothing else is required.

## Step 2 — Install the client

```bash
npm install @supabase/supabase-js
```

## Step 3 — Swap the data layer

All SQL lives in **one file**: [`src/lib/repos.ts`](../src/lib/repos.ts).
A like-for-like Supabase implementation is provided as a reference in
[`src/lib/repos.supabase.example.ts`](../src/lib/repos.supabase.example.ts) —
copy it over `repos.ts` and set these env vars:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, never expose
```

Auth (`src/lib/auth.ts`) currently uses cookie sessions + bcrypt. To move to
Supabase Auth:

1. Replace `createSession`/`getCurrentUser` with `supabase.auth.signInWithPassword`
   and `supabase.auth.getSession`, storing the Supabase JWT in an httpOnly cookie.
2. Keep the same `SessionUser` return shape (`{ id, email, full_name, role }`) and
   the rest of the app won’t notice.

## Step 4 — Vercel deployment

1. Push the repo to GitHub and import it into Vercel.
2. Add the environment variables above (plus `RESEND_API_KEY`, `EMAIL_FROM`,
   `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`) in **Project → Settings → Environment
   Variables**.
3. Deploy. `vercel.json` already schedules the weekly digest (Mondays 13:00 UTC);
   Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.

## Keep SQLite for local dev

`repos.ts` picks the database by process, not by env var — the same codebase can
use SQLite locally and Supabase in production (e.g. via a git branch that swaps
the file, or a runtime check in `repos.ts` on `process.env.SUPABASE_URL`).
