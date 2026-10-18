// SQLite database: connection, idempotent migrations, and first-run seed data.
// The schema mirrors supabase/migrations/0001_init.sql — keep them in sync.
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { addDaysISO, todayISO } from './format';

const globalForDb = globalThis as unknown as { __activeLocalDb?: Database.Database };

const MIGRATIONS: string[] = [
  // v1 — initial schema
  `
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'senior' CHECK (role IN ('senior','provider','admin')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE INDEX idx_sessions_user ON sessions(user_id);

  CREATE TABLE organizations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name          TEXT NOT NULL,
    org_type      TEXT NOT NULL CHECK (org_type IN ('senior_center','library','church','parks_recreation','community_org','other')),
    description   TEXT NOT NULL DEFAULT '',
    website       TEXT NOT NULL DEFAULT '',
    phone         TEXT NOT NULL DEFAULT '',
    address       TEXT NOT NULL DEFAULT '',
    city          TEXT NOT NULL DEFAULT '',
    state         TEXT NOT NULL DEFAULT '',
    zip           TEXT NOT NULL DEFAULT '',
    plan          TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial','provider','sponsored')),
    plan_status   TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active','canceled')),
    trial_ends_at TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE events (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id               INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title                TEXT NOT NULL,
    description          TEXT NOT NULL DEFAULT '',
    category             TEXT NOT NULL CHECK (category IN ('exercise','social','educational','meals','arts','outdoor','support')),
    starts_at            TEXT NOT NULL,
    ends_at              TEXT,
    location_name        TEXT NOT NULL DEFAULT '',
    address              TEXT NOT NULL DEFAULT '',
    city                 TEXT NOT NULL DEFAULT '',
    state                TEXT NOT NULL DEFAULT '',
    zip                  TEXT NOT NULL,
    cost_type            TEXT NOT NULL DEFAULT 'free' CHECK (cost_type IN ('free','paid')),
    cost_amount          REAL NOT NULL DEFAULT 0,
    mobility             TEXT NOT NULL DEFAULT 'fully_mobile' CHECK (mobility IN ('fully_mobile','walker','wheelchair')),
    transportation       INTEGER NOT NULL DEFAULT 0,
    seating              INTEGER NOT NULL DEFAULT 0,
    hearing_friendly     INTEGER NOT NULL DEFAULT 0,
    registration_required INTEGER NOT NULL DEFAULT 0,
    contact_phone        TEXT NOT NULL DEFAULT '',
    external_url         TEXT NOT NULL DEFAULT '',
    status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected','cancelled')),
    sponsored            INTEGER NOT NULL DEFAULT 0,
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_events_starts_at ON events(starts_at);
  CREATE INDEX idx_events_status ON events(status);
  CREATE INDEX idx_events_zip ON events(zip);
  CREATE INDEX idx_events_org ON events(org_id);

  CREATE TABLE favorites (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, event_id)
  );

  CREATE TABLE digest_subscribers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT NOT NULL UNIQUE,
    zip          TEXT NOT NULL,
    user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    active       INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    last_sent_at TEXT
  );
  `,
];

function migrate(db: Database.Database): void {
  const current: number = db.pragma('user_version', { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

// ---------------------------------------------------------------------------
// Seed data — realistic demo content so the app is useful on first run.
// Times are local wall time. Dates are relative to first-run day.
// ---------------------------------------------------------------------------

interface SeedUser { email: string; password: string; full_name: string; role: 'senior' | 'provider' | 'admin' }
interface SeedOrg {
  key: string; owner_email: string | null; name: string; org_type: string; description: string;
  website: string; phone: string; address: string; city: string; state: string; zip: string; plan: string;
}
interface SeedEvent {
  org: string; title: string; description: string; category: string; day_offset: number; time: string; end_time?: string;
  location_name: string; address: string; city: string; state: string; zip: string;
  cost_type?: 'free' | 'paid'; cost_amount?: number;
  mobility?: 'fully_mobile' | 'walker' | 'wheelchair';
  transportation?: boolean; seating?: boolean; hearing_friendly?: boolean; registration_required?: boolean;
  contact_phone?: string; status?: 'pending' | 'published'; sponsored?: boolean;
}

const SEED_USERS: SeedUser[] = [
  { email: 'margaret@example.com', password: 'senior123', full_name: 'Margaret Ellis', role: 'senior' },
  { email: 'provider@example.com', password: 'provider123', full_name: 'Harold Nguyen', role: 'provider' },
  { email: 'admin@example.com', password: 'admin123', full_name: 'Site Administrator', role: 'admin' },
];

const SEED_ORGS: SeedOrg[] = [
  {
    key: 'sunrise', owner_email: 'provider@example.com', name: 'Sunrise Senior Center', org_type: 'senior_center',
    description: 'A neighborhood gathering place for adults 60+. Free classes, hot lunches, games, and day trips — everyone is welcome.',
    website: 'https://example.com/sunrise', phone: '(617) 555-0140',
    address: '715 Tremont Street', city: 'Boston', state: 'MA', zip: '02118', plan: 'provider',
  },
  {
    key: 'maplewood', owner_email: null, name: 'Maplewood Public Library', org_type: 'library',
    description: 'Your free community living room — books, classes, tax help, and friendly staff who love to help.',
    website: 'https://example.com/maplewood', phone: '(617) 555-0177',
    address: '1200 Beacon Street', city: 'Brookline', state: 'MA', zip: '02446', plan: 'sponsored',
  },
  {
    key: 'stmarks', owner_email: null, name: 'St. Mark’s Community Church', org_type: 'church',
    description: 'Open to all faiths and backgrounds. Community suppers, choir, and a warm welcome every week.',
    website: 'https://example.com/stmarks', phone: '(617) 555-0122',
    address: '1400 Commonwealth Avenue', city: 'Boston', state: 'MA', zip: '02135', plan: 'provider',
  },
  {
    key: 'parks', owner_email: null, name: 'City Parks & Recreation', org_type: 'parks_recreation',
    description: 'Parks, gardens, and free recreation programs for residents of all ages.',
    website: 'https://example.com/parksrec', phone: '(617) 555-0100',
    address: '1 City Hall Square', city: 'Boston', state: 'MA', zip: '02115', plan: 'provider',
  },
  {
    key: 'meals', owner_email: null, name: 'Neighborhood Meals Collective', org_type: 'community_org',
    description: 'Volunteers cook and deliver comforting meals. Dine-in community meals are always pay-what-you-can.',
    website: 'https://example.com/meals', phone: '(617) 555-0188',
    address: '88 West Cedar Street', city: 'Boston', state: 'MA', zip: '02116', plan: 'trial',
  },
];

const SEED_EVENTS: SeedEvent[] = [
  {
    org: 'sunrise', title: 'Chair Yoga for Beginners', category: 'exercise', day_offset: 1, time: '10:00', end_time: '11:00',
    description: 'Gentle stretching and breathing you can do entirely from a chair. No experience needed — our instructor has taught seniors for 15 years and adapts every move.',
    location_name: 'Sunrise Senior Center — Activity Room', address: '715 Tremont Street', city: 'Boston', state: 'MA', zip: '02118',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, transportation: true, contact_phone: '(617) 555-0140', sponsored: true,
  },
  {
    org: 'sunrise', title: 'Morning Coffee & Cards', category: 'social', day_offset: 2, time: '09:30', end_time: '11:30',
    description: 'Start the day with fresh coffee, friendly faces, and a rotating cast of card games — bridge, rummy, canasta. Partners found for everyone.',
    location_name: 'Sunrise Senior Center — Lounge', address: '715 Tremont Street', city: 'Boston', state: 'MA', zip: '02118',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, contact_phone: '(617) 555-0140',
  },
  {
    org: 'sunrise', title: 'Tai Chi in the Garden', category: 'exercise', day_offset: 4, time: '08:30', end_time: '09:15',
    description: 'Slow, flowing movements that improve balance and confidence. Held on the flat, paved garden path with benches nearby.',
    location_name: 'Sunrise Senior Center — Garden', address: '715 Tremont Street', city: 'Boston', state: 'MA', zip: '02118',
    mobility: 'walker', seating: true, contact_phone: '(617) 555-0140',
  },
  {
    org: 'sunrise', title: 'Phone & Tablet Help Desk', category: 'educational', day_offset: 6, time: '13:00', end_time: '15:00',
    description: 'Bring your phone or tablet and a patient volunteer will help — photos, video calls with family, avoiding scams, enlarging text. Free, drop in any time.',
    location_name: 'Sunrise Senior Center — Computer Nook', address: '715 Tremont Street', city: 'Boston', state: 'MA', zip: '02118',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, registration_required: true, contact_phone: '(617) 555-0140',
  },
  {
    org: 'sunrise', title: 'Beginner Watercolor Class', category: 'arts', day_offset: 9, time: '14:00', end_time: '16:00',
    description: 'Paint a seasonal landscape step by step. All supplies provided — bring nothing but curiosity. Beginners truly welcome.',
    location_name: 'Sunrise Senior Center — Art Studio', address: '715 Tremont Street', city: 'Boston', state: 'MA', zip: '02118',
    cost_type: 'paid', cost_amount: 5, mobility: 'walker', seating: true, transportation: true, contact_phone: '(617) 555-0140',
  },
  {
    org: 'sunrise', title: 'Benefits & Medicare Q&A', category: 'support', day_offset: 12, time: '10:30', end_time: '12:00',
    description: 'A certified counselor explains Medicare options, prescription help, and heating assistance. Confidential and free — bring your questions.',
    location_name: 'Sunrise Senior Center — Meeting Room B', address: '715 Tremont Street', city: 'Boston', state: 'MA', zip: '02118',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, registration_required: true, contact_phone: '(617) 555-0140',
  },
  {
    org: 'maplewood', title: 'Community Lunch: Shepherd’s Pie Day', category: 'meals', day_offset: 1, time: '12:00', end_time: '13:30',
    description: 'A hot homemade lunch served restaurant-style by volunteers. Suggested $3 donation, but nobody is ever turned away. Vegetarian option available.',
    location_name: 'Maplewood Library — Community Hall', address: '1200 Beacon Street', city: 'Brookline', state: 'MA', zip: '02446',
    cost_type: 'paid', cost_amount: 3, mobility: 'wheelchair', seating: true, hearing_friendly: true, transportation: true, contact_phone: '(617) 555-0177', sponsored: true,
  },
  {
    org: 'maplewood', title: 'Large-Print Book Club', category: 'social', day_offset: 3, time: '11:00', end_time: '12:00',
    description: 'This month we’re reading “A Man Called Ove.” Copies in large print are free to borrow — tea and biscuits provided. New members welcome.',
    location_name: 'Maplewood Library — Reading Room', address: '1200 Beacon Street', city: 'Brookline', state: 'MA', zip: '02446',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, contact_phone: '(617) 555-0177',
  },
  {
    org: 'maplewood', title: 'Free Tax Preparation Help', category: 'support', day_offset: 5, time: '10:00', end_time: '14:00',
    description: 'IRS-certified volunteers prepare federal and state returns for low- and middle-income households, free of charge. Bring last year’s return and ID.',
    location_name: 'Maplewood Library — Study Room 2', address: '1200 Beacon Street', city: 'Brookline', state: 'MA', zip: '02446',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, registration_required: true, contact_phone: '(617) 555-0177',
  },
  {
    org: 'maplewood', title: 'Staying Safe from Phone Scams', category: 'educational', day_offset: 8, time: '14:00', end_time: '15:30',
    description: 'A local detective explains the newest phone and email scams, and exactly what to do if you get one. Lots of time for questions.',
    location_name: 'Maplewood Library — Auditorium', address: '1200 Beacon Street', city: 'Brookline', state: 'MA', zip: '02446',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, contact_phone: '(617) 555-0177',
  },
  {
    org: 'maplewood', title: 'Gentle Stretching at the Library', category: 'exercise', day_offset: 11, time: '09:30', end_time: '10:15',
    description: 'A certified instructor leads slow stretches you can do in regular clothes, seated or standing. Perfect for anyone getting back into movement.',
    location_name: 'Maplewood Library — Community Hall', address: '1200 Beacon Street', city: 'Brookline', state: 'MA', zip: '02446',
    mobility: 'wheelchair', seating: true, contact_phone: '(617) 555-0177',
  },
  {
    org: 'stmarks', title: 'Wednesday Community Supper', category: 'meals', day_offset: 2, time: '17:00', end_time: '18:30',
    description: 'Every Wednesday: a full hot meal, live piano, and neighbors to share it with. Wheelchair accessible via the side ramp on Lane Street.',
    location_name: 'St. Mark’s Parish Hall', address: '1400 Commonwealth Avenue', city: 'Boston', state: 'MA', zip: '02135',
    mobility: 'wheelchair', seating: true, contact_phone: '(617) 555-0122',
  },
  {
    org: 'stmarks', title: 'Community Choir — All Voices Welcome', category: 'arts', day_offset: 4, time: '18:30', end_time: '20:00',
    description: 'No auditions, no sheet music required. We rehearse for six weeks and perform a short winter concert. Sit-down rehearsal throughout.',
    location_name: 'St. Mark’s Music Room', address: '1400 Commonwealth Avenue', city: 'Boston', state: 'MA', zip: '02135',
    mobility: 'walker', seating: true, contact_phone: '(617) 555-0122',
  },
  {
    org: 'stmarks', title: 'Caregivers’ Coffee Hour', category: 'support', day_offset: 7, time: '10:00', end_time: '11:30',
    description: 'A gentle, confidential morning for people caring for a spouse or parent. Share what’s hard, hear what’s helped. Respite info available.',
    location_name: 'St. Mark’s Library Room', address: '1400 Commonwealth Avenue', city: 'Boston', state: 'MA', zip: '02135',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, contact_phone: '(617) 555-0122',
  },
  {
    org: 'stmarks', title: 'Bingo & Potluck Night', category: 'social', day_offset: 10, time: '16:30', end_time: '19:00',
    description: 'Classic bingo with silly prizes, followed by a potluck. Bring a dish if you can — plenty to share either way.',
    location_name: 'St. Mark’s Parish Hall', address: '1400 Commonwealth Avenue', city: 'Boston', state: 'MA', zip: '02135',
    mobility: 'wheelchair', seating: true, transportation: true, contact_phone: '(617) 555-0122',
  },
  {
    org: 'parks', title: 'Fall Bird Walk at the Fens', category: 'outdoor', day_offset: 3, time: '08:00', end_time: '09:30',
    description: 'A relaxed walk on paved, flat paths spotting migrating birds. Loaner binoculars provided; the group moves slowly and often.',
    location_name: 'The Fens — Kelleher Rose Garden gate', address: '50 Park Drive', city: 'Boston', state: 'MA', zip: '02115',
    mobility: 'walker', seating: true, contact_phone: '(617) 555-0100',
  },
  {
    org: 'parks', title: 'Community Garden Volunteer Morning', category: 'outdoor', day_offset: 6, time: '09:00', end_time: '11:00',
    description: 'Plant, weed, and harvest with friendly company. Raised beds mean no bending or kneeling required. Tools and gloves provided.',
    location_name: 'West Cedar Community Garden', address: '88 West Cedar Street', city: 'Boston', state: 'MA', zip: '02116',
    mobility: 'walker', seating: true, contact_phone: '(617) 555-0100',
  },
  {
    org: 'parks', title: 'Sit & Fit: Chair Exercise in the Park', category: 'exercise', day_offset: 5, time: '10:00', end_time: '10:45',
    description: 'Seated strength and balance exercises on the covered pavilion. Rain or shine, always free, led by a certified trainer.',
    location_name: 'Ramsey Park Pavilion', address: '100 Walter Street', city: 'Roxbury', state: 'MA', zip: '02115',
    mobility: 'wheelchair', seating: true, transportation: true, contact_phone: '(617) 555-0100',
  },
  {
    org: 'parks', title: 'Sunset Picnic & Live Folk Music', category: 'social', day_offset: 13, time: '17:30', end_time: '19:30',
    description: 'Bring a blanket or chair for an easy evening of local folk musicians. Flat grassy lawn, accessible restrooms nearby.',
    location_name: 'Ramsey Park Great Lawn', address: '100 Walter Street', city: 'Roxbury', state: 'MA', zip: '02115',
    mobility: 'walker', seating: true, contact_phone: '(617) 555-0100',
  },
  {
    org: 'meals', title: 'Monday Night Community Dinner', category: 'meals', day_offset: 1, time: '17:30', end_time: '19:00',
    description: 'Restaurant-style table service, always free. This week: roast chicken or lentil loaf, mashed potatoes, and apple crisp.',
    location_name: 'West Cedar Community Kitchen', address: '88 West Cedar Street', city: 'Boston', state: 'MA', zip: '02116',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, transportation: true, contact_phone: '(617) 555-0188',
  },
  {
    org: 'meals', title: 'Senior Grocery Delivery Sign-Up', category: 'support', day_offset: 9, time: '11:00', end_time: '12:00',
    description: 'Volunteers deliver a free bag of groceries to your door every two weeks. Come sign up in person — takes about 15 minutes.',
    location_name: 'West Cedar Community Kitchen', address: '88 West Cedar Street', city: 'Boston', state: 'MA', zip: '02116',
    mobility: 'wheelchair', seating: true, contact_phone: '(617) 555-0188',
  },
  {
    org: 'meals', title: 'Cooking for One: Easy & Affordable', category: 'educational', day_offset: 15, time: '13:00', end_time: '14:30',
    description: 'A friendly cooking demo with take-home recipes for tasty meals that don’t require a crowd. Tasting included, naturally.',
    location_name: 'West Cedar Community Kitchen', address: '88 West Cedar Street', city: 'Boston', state: 'MA', zip: '02116',
    cost_type: 'paid', cost_amount: 2, mobility: 'walker', seating: true, registration_required: true, contact_phone: '(617) 555-0188',
  },
  {
    org: 'sunrise', title: 'Line Dancing for Everyone', category: 'exercise', day_offset: 8, time: '15:00', end_time: '16:00',
    description: 'No partner, no special shoes, no experience needed. Low-impact line dancing with plenty of breaks and water.',
    location_name: 'Sunrise Senior Center — Activity Room', address: '715 Tremont Street', city: 'Boston', state: 'MA', zip: '02118',
    mobility: 'walker', seating: true, contact_phone: '(617) 555-0140',
  },
  {
    org: 'maplewood', title: 'Knitting Circle: Hats for Newborns', category: 'arts', day_offset: 14, time: '13:30', end_time: '15:00',
    description: 'We knit tiny hats for the hospital’s newborn unit. Yarn and needles provided; knitters of every level welcome.',
    location_name: 'Maplewood Library — Reading Room', address: '1200 Beacon Street', city: 'Brookline', state: 'MA', zip: '02446',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, contact_phone: '(617) 555-0177',
  },
  // A pending event, so the admin moderation queue has something to show on first run.
  {
    org: 'stmarks', title: 'New: Movie Morning — “Singin’ in the Rain”', category: 'social', day_offset: 7, time: '10:30', end_time: '12:30',
    description: 'A classic film on the big screen with coffee and pastries. Subtitled for the hearing impaired.',
    location_name: 'St. Mark’s Parish Hall', address: '1400 Commonwealth Avenue', city: 'Boston', state: 'MA', zip: '02135',
    mobility: 'wheelchair', seating: true, hearing_friendly: true, status: 'pending', contact_phone: '(617) 555-0122',
  },
];

function seedIfEmpty(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
  if (userCount.n > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
  );
  const userIds = new Map<string, number>();
  for (const u of SEED_USERS) {
    const info = insertUser.run(u.email, bcrypt.hashSync(u.password, 10), u.full_name, u.role);
    userIds.set(u.email, Number(info.lastInsertRowid));
  }

  const insertOrg = db.prepare(
    `INSERT INTO organizations (owner_user_id, name, org_type, description, website, phone, address, city, state, zip, plan, trial_ends_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const orgIds = new Map<string, number>();
  const today = todayISO();
  for (const o of SEED_ORGS) {
    const info = insertOrg.run(
      o.owner_email ? (userIds.get(o.owner_email) ?? null) : null,
      o.name, o.org_type, o.description, o.website, o.phone, o.address, o.city, o.state, o.zip, o.plan,
      o.plan === 'trial' ? addDaysISO(today, 14) : null
    );
    orgIds.set(o.key, Number(info.lastInsertRowid));
  }

  const insertEvent = db.prepare(
    `INSERT INTO events (org_id, title, description, category, starts_at, ends_at, location_name, address, city, state, zip,
       cost_type, cost_amount, mobility, transportation, seating, hearing_friendly, registration_required, contact_phone,
       external_url, status, sponsored)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)`
  );
  for (const e of SEED_EVENTS) {
    const day = addDaysISO(today, e.day_offset);
    insertEvent.run(
      orgIds.get(e.org) ?? orgIds.values().next().value,
      e.title, e.description, e.category, `${day}T${e.time}`, e.end_time ? `${day}T${e.end_time}` : null,
      e.location_name, e.address, e.city, e.state, e.zip,
      e.cost_type ?? 'free', e.cost_amount ?? 0, e.mobility ?? 'fully_mobile',
      e.transportation ? 1 : 0, e.seating ? 1 : 0, e.hearing_friendly ? 1 : 0, e.registration_required ? 1 : 0,
      e.contact_phone ?? '', e.status ?? 'published', e.sponsored ? 1 : 0
    );
  }

  // Give the demo senior a couple of favorites + a digest subscription.
  const seniorId = userIds.get('margaret@example.com');
  if (seniorId) {
    const favoriteTitles = ['Chair Yoga for Beginners', 'Community Lunch: Shepherd’s Pie Day'];
    const insertFav = db.prepare('INSERT OR IGNORE INTO favorites (user_id, event_id) VALUES (?, ?)');
    for (const title of favoriteTitles) {
      const row = db.prepare('SELECT id FROM events WHERE title = ?').get(title) as { id: number } | undefined;
      if (row) insertFav.run(seniorId, row.id);
    }
    db.prepare('INSERT INTO digest_subscribers (email, zip, user_id, active) VALUES (?, ?, ?, 1)')
      .run('margaret@example.com', '02116', seniorId);
  }
  // One anonymous subscriber so digest demos have variety.
  db.prepare('INSERT INTO digest_subscribers (email, zip, active) VALUES (?, ?, 1)')
    .run('neighbor@example.com', '02118');
}

export function getDb(): Database.Database {
  if (globalForDb.__activeLocalDb) return globalForDb.__activeLocalDb;
  const dir = path.join(process.cwd(), 'var');
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, 'active-local.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  seedIfEmpty(db);
  globalForDb.__activeLocalDb = db;
  return db;
}
