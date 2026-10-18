-- ---------------------------------------------------------------------------
-- Active Local — initial Supabase (PostgreSQL) schema
--
-- This mirrors the local SQLite schema in src/lib/db.ts exactly, so switching
-- from local dev to Supabase requires no data-model changes.
-- Run this in the Supabase SQL editor, or with:
--   supabase db push
-- ---------------------------------------------------------------------------

create table if not exists users (
  id            bigint generated always as identity primary key,
  email         text not null unique,
  password_hash text not null,
  full_name     text not null,
  role          text not null default 'senior' check (role in ('senior','provider','admin')),
  created_at    timestamptz not null default now()
);

-- If you use Supabase Auth instead of local password auth, drop password_hash
-- and map auth.users.id -> this table. See docs/SUPABASE_SETUP.md.

create table if not exists organizations (
  id            bigint generated always as identity primary key,
  owner_user_id bigint references users(id) on delete set null,
  name          text not null,
  org_type      text not null check (org_type in ('senior_center','library','church','parks_recreation','community_org','other')),
  description   text not null default '',
  website       text not null default '',
  phone         text not null default '',
  address       text not null default '',
  city          text not null default '',
  state         text not null default '',
  zip           text not null default '',
  plan          text not null default 'trial' check (plan in ('trial','provider','sponsored')),
  plan_status   text not null default 'active' check (plan_status in ('active','canceled')),
  trial_ends_at date,
  created_at    timestamptz not null default now()
);

create table if not exists events (
  id                    bigint generated always as identity primary key,
  org_id                bigint not null references organizations(id) on delete cascade,
  title                 text not null,
  description           text not null default '',
  category              text not null check (category in ('exercise','social','educational','meals','arts','outdoor','support')),
  -- Local wall time, format "YYYY-MM-DDTHH:MM" (never UTC — see src/lib/format.ts)
  starts_at             text not null,
  ends_at               text,
  location_name         text not null default '',
  address               text not null default '',
  city                  text not null default '',
  state                 text not null default '',
  zip                   text not null,
  cost_type             text not null default 'free' check (cost_type in ('free','paid')),
  cost_amount           numeric(8,2) not null default 0,
  mobility              text not null default 'fully_mobile' check (mobility in ('fully_mobile','walker','wheelchair')),
  transportation        boolean not null default false,
  seating               boolean not null default false,
  hearing_friendly      boolean not null default false,
  registration_required boolean not null default false,
  contact_phone         text not null default '',
  external_url          text not null default '',
  status                text not null default 'pending' check (status in ('pending','published','rejected','cancelled')),
  sponsored             boolean not null default false,
  created_at            timestamptz not null default now()
);

create index if not exists idx_events_starts_at on events (starts_at);
create index if not exists idx_events_status on events (status);
create index if not exists idx_events_zip on events (zip);
create index if not exists idx_events_org on events (org_id);

create table if not exists favorites (
  user_id    bigint not null references users(id) on delete cascade,
  event_id   bigint not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table if not exists digest_subscribers (
  id           bigint generated always as identity primary key,
  email        text not null unique,
  zip          text not null,
  user_id      bigint references users(id) on delete set null,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  last_sent_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- The Next.js server uses the service-role key (which bypasses RLS). These
-- policies keep direct/anon client access safe if you ever expose the anon key.
-- ---------------------------------------------------------------------------

alter table users enable row level security;
alter table organizations enable row level security;
alter table events enable row level security;
alter table favorites enable row level security;
alter table digest_subscribers enable row level security;

-- Anyone (including signed-out visitors) may read published events + orgs.
create policy "published events are public"
  on events for select
  using (status = 'published');

create policy "organizations are public"
  on organizations for select
  using (true);

-- No anon writes: everything else requires the service role (server-only).
