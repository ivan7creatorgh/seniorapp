# Active Local — a curated community activity board for seniors

Free and low-cost activities from senior centers, libraries, churches, parks
departments, and community groups — gathered onto one calm, large-text board
that answers the questions older adults actually ask: *Is it free? Is there a
ramp? Will someone give me a ride?*

Built with **Next.js (App Router) + SQLite + TypeScript + Tailwind**, deployable
to **Vercel**, with **Resend** weekly digest emails and a **Supabase** migration
included. Runs fully offline-of-the-cloud: `npm install && npm run dev` and
you're clicking through a working, seeded application.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. The database (`var/active-local.db`) is created and
seeded automatically on first run.

### Demo accounts (click-to-fill on the sign-in page)

| Role | Email | Password | You can… |
| --- | --- | --- | --- |
| Senior | `margaret@example.com` | `senior123` | Browse, save favorites, weekly digest |
| Provider | `provider@example.com` | `provider123` | Post/manage events for Sunrise Senior Center, change plans |
| Admin | `admin@example.com` | `admin123` | Moderate submissions, send/preview digests, view stats |

### Handy commands

```bash
npm run dev        # development server
npm run build      # production build (type-checks everything)
npm run start      # serve the production build
npm run db:reset   # wipe the local database — regenerates fresh demo data
npm run smoke      # end-to-end checks against a running server (see below)
```

### End-to-end smoke test

With a server already running (`npm run dev` or `npm run start`), verify the
whole app over real HTTP — pages, sign-in, favorites, event submission and
moderation, org-level defaults, plan changes, digest sending, unsubscribe, and
registration:

```bash
npm run build && npm run start   # terminal 1
npm run smoke                    # terminal 2  → "N/N checks passed"
```

The smoke test writes to the local database; run `npm run db:reset` afterwards
for pristine demo data. Point it elsewhere with `SMOKE_BASE=https://…`.

---

## What's inside

**For seniors & families (always free)**
- Browse by ZIP code, date range, and 7 interest categories
- Filters that actually matter: mobility level (fully mobile / walker /
  wheelchair), free-only, transportation provided, seating, hearing friendly,
  keyword search — all as a plain GET form, so it works without JavaScript
- Event pages with an **accessibility checklist** (ramps, seating, rides,
  hearing), directions, a tap-to-call phone number, and a **Print this page**
  button that renders a clean large-format sheet
- Favorites + a personalized **weekly email digest** every Monday
- Senior-first UI: 20px+ base text, one-tap **text size** (Normal / Large /
  Extra large) and **high-contrast** mode (persisted, applied before first
  paint), 48px+ touch targets, always-visible focus outlines, no hover-only
  UI, no carousels, no pop-ups, reduced-motion support

**For organizations ($8/mo, free trial with 3 listings)**
- Self-serve sign-up → organization profile → submit events in ~3 minutes
- Full edit/cancel workflow; edited events re-enter moderation
- Plan flow: Free trial → Provider ($8) → Sponsored ($15, ★ badge + first in
  search). Billing is stubbed — plans switch instantly (see
  [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) to charge real cards)

**For you (the operator)**
- Admin dashboard: moderation queue, org roster, digest subscribers, stats
- Digest preview per ZIP + “send now” button; Vercel Cron sends weekly
  (`vercel.json`, Mondays 13:00 UTC, guarded by `CRON_SECRET`)
- Email adapter: sends via **Resend** when `RESEND_API_KEY` is set; otherwise
  writes full HTML emails to `var/outbox/` so nothing is ever silently dropped

---

## Project layout

```
src/
  app/                 # pages (App Router) + API route handlers
    events/            # browse + detail
    dashboard/         # provider console (org, submit, edit)
    admin/             # moderation, digest controls & preview
  components/          # UI (EventCard, FilterPanel, forms, display controls…)
  lib/
    db.ts              # SQLite connection, migrations, demo seed
    repos.ts           # ALL SQL lives here — the Supabase swap point
    auth.ts            # cookie sessions + bcrypt
    digest.ts/email.ts # weekly digest builder + Resend/outbox delivery
    validation.ts      # zod schemas for every mutation
    eventDefaults.ts   # organization-level fallbacks used by create + edit
supabase/migrations/   # identical PostgreSQL schema + RLS
docs/                  # Supabase & Stripe guides
scripts/reset-db.mjs   # wipe + reseed
scripts/smoke.mjs      # end-to-end HTTP smoke test (npm run smoke)
```

Timestamps for events are stored as **local wall time** (`YYYY-MM-DDTHH:MM`)
on purpose — a hyperlocal board must never shift event times via timezone
conversion.

---

## Going to production

### Vercel

1. Push to GitHub → import in Vercel (framework: Next.js, zero config).
2. Environment variables (all optional, see [.env.example](.env.example)):
   `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`.
3. Deploy — the cron job in `vercel.json` is picked up automatically.

> **Note:** Vercel's serverless filesystem is read-only/ephemeral, so the SQLite
> file belongs on a persistent host (a VPS, Railway, Fly.io) *or* you move the
> data layer to Supabase (below). This is exactly why `repos.ts` isolates all SQL.

### Supabase (recommended for Vercel)

The included migration ([supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql))
mirrors the SQLite schema exactly, and
[`src/lib/repos.supabase.example.ts`](src/lib/repos.supabase.example.ts) is a
drop-in Postgres implementation of `repos.ts`. Step-by-step:
[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

### Email

Create a Resend API key (free tier: 3,000 emails/month, plenty for a city),
set `RESEND_API_KEY` + `EMAIL_FROM`, and digests start flowing for real. Test
anytime from **Admin → Weekly digest → Send the weekly digest now**.

---

## Accessibility statement

Designed to meet **WCAG 2.1 AA**: semantic landmarks and headings, skip link,
labeled fields, keyboard-operable everything, visible focus, 4.5:1+ contrast,
text up to 28px, and honest per-event accessibility data. See
[/accessibility](src/app/accessibility/page.tsx) for the public-facing promise.

## Roadmap ideas

- Import pipelines for public library / parks APIs (CalendarCal, Distill, etc.)
  — hook point: a scheduled route that normalizes API events into `events` rows
- Password reset emails (Resend is already wired)
- Per-provider “repeat weekly” events
- Spanish language toggle
