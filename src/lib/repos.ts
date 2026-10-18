// Data access. Every SQL statement in the app lives here (or in db.ts seeds),
// so swapping SQLite for Supabase Postgres means re-implementing this one file.
// See supabase/migrations/0001_init.sql for the identical schema.
import { getDb } from './db';
import { MOBILITY_RANK, type CategoryId, type MobilityId } from './constants';
import type {
  DigestSubscriber, EventFilters, EventRecord, EventWithOrg, Organization, SessionUser, User,
} from './types';

// ---------------------------------------------------------------------------
// Users & organizations
// ---------------------------------------------------------------------------

export function findUserByEmail(email: string): User | undefined {
  return getDb().prepare('SELECT id, email, full_name, role, created_at FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as User | undefined;
}

export interface UserAuth extends User {
  password_hash: string;
}

export function findUserAuthByEmail(email: string): UserAuth | undefined {
  return getDb().prepare('SELECT * FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as UserAuth | undefined;
}

export function createUser(email: string, passwordHash: string, fullName: string, role: User['role']): User {
  const info = getDb()
    .prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)')
    .run(email.trim().toLowerCase(), passwordHash, fullName.trim(), role);
  return findUserById(Number(info.lastInsertRowid))!;
}

export function findUserById(id: number): User | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function getUserPasswordHash(id: number): string | undefined {
  const row = getDb().prepare('SELECT password_hash FROM users WHERE id = ?').get(id) as
    | { password_hash: string } | undefined;
  return row?.password_hash;
}

export function listOrganizations(): Organization[] {
  return getDb().prepare('SELECT * FROM organizations ORDER BY name').all() as Organization[];
}

export function getOrganization(id: number): Organization | undefined {
  return getDb().prepare('SELECT * FROM organizations WHERE id = ?').get(id) as Organization | undefined;
}

export function getOrganizationForUser(userId: number): Organization | undefined {
  return getDb().prepare('SELECT * FROM organizations WHERE owner_user_id = ?').get(userId) as Organization | undefined;
}

export interface OrgInput {
  name: string; org_type: string; description: string; website: string; phone: string;
  address: string; city: string; state: string; zip: string;
}

export function createOrganization(ownerUserId: number, input: OrgInput): Organization {
  const info = getDb()
    .prepare(
      `INSERT INTO organizations (owner_user_id, name, org_type, description, website, phone, address, city, state, zip, plan, trial_ends_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'trial', date('now', '+14 days'))`
    )
    .run(ownerUserId, input.name, input.org_type, input.description, input.website, input.phone,
      input.address, input.city, input.state, input.zip);
  return getOrganization(Number(info.lastInsertRowid))!;
}

export function updateOrganization(id: number, input: OrgInput): void {
  getDb()
    .prepare(
      `UPDATE organizations SET name = ?, org_type = ?, description = ?, website = ?, phone = ?,
       address = ?, city = ?, state = ?, zip = ? WHERE id = ?`
    )
    .run(input.name, input.org_type, input.description, input.website, input.phone,
      input.address, input.city, input.state, input.zip, id);
}

export function setOrganizationPlan(id: number, plan: 'trial' | 'provider' | 'sponsored'): void {
  getDb().prepare('UPDATE organizations SET plan = ?, plan_status = ? WHERE id = ?').run(plan, 'active', id);
}

export function countPublishedEvents(orgId: number): number {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM events WHERE org_id = ? AND status = 'published'").get(orgId) as { n: number };
  return row.n;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const EVENT_SELECT = `
  SELECT e.*, o.name AS org_name, o.org_type AS org_type, o.phone AS org_phone, o.website AS org_website
  FROM events e JOIN organizations o ON o.id = e.org_id
`;

interface EventRow {
  id: number; org_id: number; title: string; description: string; category: string;
  starts_at: string; ends_at: string | null; location_name: string; address: string; city: string;
  state: string; zip: string; cost_type: 'free' | 'paid'; cost_amount: number; mobility: string;
  transportation: number; seating: number; hearing_friendly: number; registration_required: number;
  contact_phone: string; external_url: string; status: string; sponsored: number; created_at: string;
  org_name: string; org_type: string; org_phone: string; org_website: string;
}

function mapEvent(row: EventRow): EventWithOrg {
  return {
    id: row.id, org_id: row.org_id, title: row.title, description: row.description,
    category: row.category as CategoryId, starts_at: row.starts_at, ends_at: row.ends_at,
    location_name: row.location_name, address: row.address, city: row.city, state: row.state, zip: row.zip,
    cost_type: row.cost_type, cost_amount: row.cost_amount, mobility: row.mobility as MobilityId,
    transportation: !!row.transportation, seating: !!row.seating, hearing_friendly: !!row.hearing_friendly,
    registration_required: !!row.registration_required, contact_phone: row.contact_phone,
    external_url: row.external_url, status: row.status as EventRecord['status'],
    sponsored: !!row.sponsored, created_at: row.created_at,
    org_name: row.org_name, org_type: row.org_type as EventWithOrg['org_type'],
    org_phone: row.org_phone, org_website: row.org_website,
  };
}

export function listEvents(filters: EventFilters = {}): EventWithOrg[] {
  const where: string[] = ["e.status = 'published'"];
  const params: unknown[] = [];

  if (filters.zip) {
    where.push('e.zip = ?');
    params.push(filters.zip);
  }
  if (filters.from) {
    where.push('e.starts_at >= ?');
    params.push(`${filters.from}T00:00`);
  }
  if (filters.to) {
    where.push('e.starts_at <= ?');
    params.push(`${filters.to}T23:59`);
  }
  if (filters.categories && filters.categories.length > 0) {
    where.push(`e.category IN (${filters.categories.map(() => '?').join(', ')})`);
    params.push(...filters.categories);
  }
  if (filters.mobility) {
    // An event qualifies if its accessibility level meets or exceeds the need.
    const allowed = (Object.keys(MOBILITY_RANK) as MobilityId[])
      .filter((k) => MOBILITY_RANK[k] >= MOBILITY_RANK[filters.mobility!])
      .sort((a, b) => MOBILITY_RANK[a] - MOBILITY_RANK[b]);
    where.push(`e.mobility IN (${allowed.map(() => '?').join(', ')})`);
    params.push(...allowed);
  }
  if (filters.freeOnly) where.push("e.cost_type = 'free'");
  if (filters.transportOnly) where.push('e.transportation = 1');
  if (filters.seatingOnly) where.push('e.seating = 1');
  if (filters.hearingOnly) where.push('e.hearing_friendly = 1');
  if (filters.q) {
    where.push('(e.title LIKE ? OR e.description LIKE ? OR o.name LIKE ? OR e.location_name LIKE ?)');
    const like = `%${filters.q}%`;
    params.push(like, like, like, like);
  }

  const order = filters.includeSponsoredFirst
    ? 'e.sponsored DESC, e.starts_at ASC'
    : 'e.starts_at ASC';
  const limit = filters.limit ? ' LIMIT ?' : '';
  if (filters.limit) params.push(filters.limit);

  const rows = getDb()
    .prepare(`${EVENT_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order}${limit}`)
    .all(...params) as EventRow[];
  return rows.map(mapEvent);
}

export function getEventWithOrg(id: number): EventWithOrg | undefined {
  const row = getDb().prepare(`${EVENT_SELECT} WHERE e.id = ?`).get(id) as EventRow | undefined;
  return row ? mapEvent(row) : undefined;
}

export function listEventsForOrg(orgId: number): EventWithOrg[] {
  const rows = getDb()
    .prepare(`${EVENT_SELECT} WHERE e.org_id = ? ORDER BY e.starts_at DESC`)
    .all(orgId) as EventRow[];
  return rows.map(mapEvent);
}

export function listPendingEvents(): EventWithOrg[] {
  const rows = getDb()
    .prepare(`${EVENT_SELECT} WHERE e.status = 'pending' ORDER BY e.created_at ASC`)
    .all() as EventRow[];
  return rows.map(mapEvent);
}

export interface EventInput {
  title: string; description: string; category: CategoryId; starts_at: string; ends_at: string | null;
  location_name: string; address: string; city: string; state: string; zip: string;
  cost_type: 'free' | 'paid'; cost_amount: number; mobility: MobilityId;
  transportation: boolean; seating: boolean; hearing_friendly: boolean; registration_required: boolean;
  contact_phone: string; external_url: string; sponsored: boolean;
}

export function createEvent(orgId: number, input: EventInput): EventRecord {
  // Sponsored placement is only possible on the sponsored plan.
  const org = getOrganization(orgId);
  const sponsored = org?.plan === 'sponsored' && input.sponsored ? 1 : 0;
  const info = getDb()
    .prepare(
      `INSERT INTO events (org_id, title, description, category, starts_at, ends_at, location_name, address, city, state, zip,
        cost_type, cost_amount, mobility, transportation, seating, hearing_friendly, registration_required, contact_phone,
        external_url, status, sponsored)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    )
    .run(orgId, input.title, input.description, input.category, input.starts_at, input.ends_at,
      input.location_name, input.address, input.city, input.state, input.zip,
      input.cost_type, input.cost_type === 'paid' ? input.cost_amount : 0, input.mobility,
      input.transportation ? 1 : 0, input.seating ? 1 : 0, input.hearing_friendly ? 1 : 0,
      input.registration_required ? 1 : 0, input.contact_phone, input.external_url, sponsored);
  return getEventWithOrg(Number(info.lastInsertRowid))!;
}

export function updateEvent(id: number, input: EventInput): void {
  const event = getEventWithOrg(id);
  const org = event ? getOrganization(event.org_id) : undefined;
  const sponsored = org?.plan === 'sponsored' && input.sponsored ? 1 : 0;
  getDb()
    .prepare(
      `UPDATE events SET title = ?, description = ?, category = ?, starts_at = ?, ends_at = ?, location_name = ?,
        address = ?, city = ?, state = ?, zip = ?, cost_type = ?, cost_amount = ?, mobility = ?, transportation = ?,
        seating = ?, hearing_friendly = ?, registration_required = ?, contact_phone = ?, external_url = ?, sponsored = ?
       WHERE id = ?`
    )
    .run(input.title, input.description, input.category, input.starts_at, input.ends_at, input.location_name,
      input.address, input.city, input.state, input.zip, input.cost_type,
      input.cost_type === 'paid' ? input.cost_amount : 0, input.mobility,
      input.transportation ? 1 : 0, input.seating ? 1 : 0, input.hearing_friendly ? 1 : 0,
      input.registration_required ? 1 : 0, input.contact_phone, input.external_url, sponsored, id);
}

export function setEventStatus(id: number, status: EventRecord['status']): void {
  getDb().prepare('UPDATE events SET status = ? WHERE id = ?').run(status, id);
}

export function cancelEvent(id: number): void {
  setEventStatus(id, 'cancelled');
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export function isFavorite(userId: number, eventId: number): boolean {
  return !!getDb().prepare('SELECT 1 FROM favorites WHERE user_id = ? AND event_id = ?').get(userId, eventId);
}

export function toggleFavorite(userId: number, eventId: number): boolean {
  const db = getDb();
  if (isFavorite(userId, eventId)) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND event_id = ?').run(userId, eventId);
    return false;
  }
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, event_id) VALUES (?, ?)').run(userId, eventId);
  return true;
}

export function listFavoriteIds(userId: number): number[] {
  const rows = getDb().prepare('SELECT event_id FROM favorites WHERE user_id = ?').all(userId) as { event_id: number }[];
  return rows.map((r) => r.event_id);
}

export function listFavoriteEvents(userId: number): EventWithOrg[] {
  const rows = getDb()
    .prepare(`${EVENT_SELECT} WHERE e.id IN (SELECT event_id FROM favorites WHERE user_id = ?) ORDER BY e.starts_at ASC`)
    .all(userId) as EventRow[];
  return rows.map(mapEvent);
}

// ---------------------------------------------------------------------------
// Digest subscribers
// ---------------------------------------------------------------------------

export function listDigestSubscribers(): DigestSubscriber[] {
  const rows = getDb().prepare('SELECT * FROM digest_subscribers WHERE active = 1 ORDER BY zip, email').all() as Array<
    Omit<DigestSubscriber, 'active'> & { active: number }
  >;
  return rows.map((r) => ({ ...r, active: !!r.active }));
}

export function upsertDigestSubscriber(email: string, zip: string, userId: number | null): void {
  const db = getDb();
  const clean = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id, active FROM digest_subscribers WHERE email = ?').get(clean) as
    | { id: number; active: number } | undefined;
  if (existing) {
    db.prepare('UPDATE digest_subscribers SET zip = ?, active = 1, user_id = COALESCE(user_id, ?) WHERE id = ?')
      .run(zip, userId, existing.id);
  } else {
    db.prepare('INSERT INTO digest_subscribers (email, zip, user_id, active) VALUES (?, ?, ?, 1)')
      .run(clean, zip, userId);
  }
}

export function deactivateDigestSubscriber(email: string): void {
  getDb().prepare('UPDATE digest_subscribers SET active = 0 WHERE email = ?').run(email.trim().toLowerCase());
}

export function markDigestSent(id: number): void {
  getDb().prepare("UPDATE digest_subscribers SET last_sent_at = datetime('now') WHERE id = ?").run(id);
}

export function listEventsForDigest(zip: string, from: string, to: string): EventWithOrg[] {
  const rows = getDb()
    .prepare(`${EVENT_SELECT} WHERE e.status = 'published' AND e.zip = ? AND e.starts_at >= ? AND e.starts_at <= ?
      ORDER BY e.sponsored DESC, e.starts_at ASC LIMIT 20`)
    .all(zip, `${from}T00:00`, `${to}T23:59`) as EventRow[];
  return rows.map(mapEvent);
}

// ---------------------------------------------------------------------------
// Stats (admin dashboard)
// ---------------------------------------------------------------------------

export interface SiteStats {
  publishedEvents: number;
  pendingEvents: number;
  organizations: number;
  subscribers: number;
  seniors: number;
}

export function getSiteStats(): SiteStats {
  const db = getDb();
  const q = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  return {
    publishedEvents: q("SELECT COUNT(*) AS n FROM events WHERE status = 'published'"),
    pendingEvents: q("SELECT COUNT(*) AS n FROM events WHERE status = 'pending'"),
    organizations: q('SELECT COUNT(*) AS n FROM organizations'),
    subscribers: q('SELECT COUNT(*) AS n FROM digest_subscribers WHERE active = 1'),
    seniors: q("SELECT COUNT(*) AS n FROM users WHERE role = 'senior'"),
  };
}

export type { SessionUser };
