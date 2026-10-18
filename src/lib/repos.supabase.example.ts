// ---------------------------------------------------------------------------
// REFERENCE IMPLEMENTATION — not wired into the app by default.
//
// A like-for-like Supabase (PostgreSQL) version of src/lib/repos.ts using the
// schema in supabase/migrations/0001_init.sql. To go live on Supabase:
//
//   1. npm install @supabase/supabase-js
//   2. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//   3. Copy this file over src/lib/repos.ts
//
// Every exported function matches the SQLite version's signature, so the rest
// of the app (pages, API routes, digest) keeps working unchanged.
// ---------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js';
import { MOBILITY_RANK, type CategoryId, type MobilityId } from './constants';
import type {
  DigestSubscriber, EventFilters, EventRecord, EventWithOrg, Organization, SessionUser, User,
} from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only; never ship to the browser
  { auth: { persistSession: false } }
);

const EVENT_SELECT = '*, organizations(name, org_type, phone, website)';

function mapEvent(row: Record<string, any>): EventWithOrg {
  const org = row.organizations ?? {};
  return {
    ...row,
    transportation: !!row.transportation,
    seating: !!row.seating,
    hearing_friendly: !!row.hearing_friendly,
    registration_required: !!row.registration_required,
    sponsored: !!row.sponsored,
    org_name: org.name ?? '',
    org_type: org.org_type ?? 'other',
    org_phone: org.phone ?? '',
    org_website: org.website ?? '',
  };
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const { data } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).maybeSingle();
  return (data as User) ?? undefined;
}

export async function findUserAuthByEmail(email: string) {
  const { data } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).maybeSingle();
  return (data as User & { password_hash: string }) ?? undefined;
}

export async function createUser(email: string, passwordHash: string, fullName: string, role: User['role']): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({ email: email.trim().toLowerCase(), password_hash: passwordHash, full_name: fullName.trim(), role })
    .select()
    .single();
  if (error) throw error;
  return data as User;
}

export async function getOrganization(id: number): Promise<Organization | undefined> {
  const { data } = await supabase.from('organizations').select('*').eq('id', id).maybeSingle();
  return (data as Organization) ?? undefined;
}

export async function getOrganizationForUser(userId: number): Promise<Organization | undefined> {
  const { data } = await supabase.from('organizations').select('*').eq('owner_user_id', userId).maybeSingle();
  return (data as Organization) ?? undefined;
}

export async function listOrganizations(): Promise<Organization[]> {
  const { data } = await supabase.from('organizations').select('*').order('name');
  return (data as Organization[]) ?? [];
}

export interface OrgInput {
  name: string; org_type: string; description: string; website: string; phone: string;
  address: string; city: string; state: string; zip: string;
}

export async function createOrganization(ownerUserId: number, input: OrgInput): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .insert({ ...input, owner_user_id: ownerUserId, trial_ends_at: plusDays(14) })
    .select()
    .single();
  if (error) throw error;
  return data as Organization;
}

export async function updateOrganization(id: number, input: OrgInput): Promise<void> {
  const { error } = await supabase.from('organizations').update(input).eq('id', id);
  if (error) throw error;
}

export async function setOrganizationPlan(id: number, plan: 'trial' | 'provider' | 'sponsored'): Promise<void> {
  const { error } = await supabase.from('organizations').update({ plan, plan_status: 'active' }).eq('id', id);
  if (error) throw error;
}

export async function countPublishedEvents(orgId: number): Promise<number> {
  const { count } = await supabase
    .from('events').select('id', { count: 'exact', head: true })
    .eq('org_id', orgId).eq('status', 'published');
  return count ?? 0;
}

export async function listEvents(filters: EventFilters = {}): Promise<EventWithOrg[]> {
  let query = supabase.from('events').select(EVENT_SELECT).eq('status', 'published');
  if (filters.zip) query = query.eq('zip', filters.zip);
  if (filters.from) query = query.gte('starts_at', `${filters.from}T00:00`);
  if (filters.to) query = query.lte('starts_at', `${filters.to}T23:59`);
  if (filters.categories?.length) query = query.in('category', filters.categories);
  if (filters.mobility) {
    const allowed = (Object.keys(MOBILITY_RANK) as MobilityId[])
      .filter((k) => MOBILITY_RANK[k] >= MOBILITY_RANK[filters.mobility!]);
    query = query.in('mobility', allowed);
  }
  if (filters.freeOnly) query = query.eq('cost_type', 'free');
  if (filters.transportOnly) query = query.eq('transportation', true);
  if (filters.seatingOnly) query = query.eq('seating', true);
  if (filters.hearingOnly) query = query.eq('hearing_friendly', true);
  if (filters.q) {
    const like = `%${filters.q}%`;
    query = query.or(`title.ilike.${like},description.ilike.${like},location_name.ilike.${like}`);
  }
  query = query.order(filters.includeSponsoredFirst ? 'sponsored' : 'starts_at', { ascending: false })
    .order('starts_at', { ascending: true });
  if (filters.limit) query = query.limit(filters.limit);
  const { data } = await query;
  return ((data ?? []) as Record<string, any>[]).map(mapEvent);
}

export async function getEventWithOrg(id: number): Promise<EventWithOrg | undefined> {
  const { data } = await supabase.from('events').select(EVENT_SELECT).eq('id', id).maybeSingle();
  return data ? mapEvent(data) : undefined;
}

export async function listEventsForOrg(orgId: number): Promise<EventWithOrg[]> {
  const { data } = await supabase.from('events').select(EVENT_SELECT).eq('org_id', orgId).order('starts_at', { ascending: false });
  return ((data ?? []) as Record<string, any>[]).map(mapEvent);
}

export async function listPendingEvents(): Promise<EventWithOrg[]> {
  const { data } = await supabase.from('events').select(EVENT_SELECT).eq('status', 'pending').order('created_at');
  return ((data ?? []) as Record<string, any>[]).map(mapEvent);
}

export interface EventInput {
  title: string; description: string; category: CategoryId; starts_at: string; ends_at: string | null;
  location_name: string; address: string; city: string; state: string; zip: string;
  cost_type: 'free' | 'paid'; cost_amount: number; mobility: MobilityId;
  transportation: boolean; seating: boolean; hearing_friendly: boolean; registration_required: boolean;
  contact_phone: string; external_url: string; sponsored: boolean;
}

export async function createEvent(orgId: number, input: EventInput): Promise<EventRecord> {
  const org = await getOrganization(orgId);
  const { data, error } = await supabase
    .from('events')
    .insert({ ...input, org_id: orgId, sponsored: org?.plan === 'sponsored' && input.sponsored, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data as EventRecord;
}

export async function updateEvent(id: number, input: EventInput): Promise<void> {
  const existing = await getEventWithOrg(id);
  const org = existing ? await getOrganization(existing.org_id) : undefined;
  const { error } = await supabase
    .from('events')
    .update({ ...input, sponsored: org?.plan === 'sponsored' && input.sponsored })
    .eq('id', id);
  if (error) throw error;
}

export async function setEventStatus(id: number, status: EventRecord['status']): Promise<void> {
  const { error } = await supabase.from('events').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function cancelEvent(id: number): Promise<void> {
  await setEventStatus(id, 'cancelled');
}

export async function isFavorite(userId: number, eventId: number): Promise<boolean> {
  const { data } = await supabase.from('favorites').select('event_id')
    .eq('user_id', userId).eq('event_id', eventId).maybeSingle();
  return !!data;
}

export async function toggleFavorite(userId: number, eventId: number): Promise<boolean> {
  if (await isFavorite(userId, eventId)) {
    await supabase.from('favorites').delete().eq('user_id', userId).eq('event_id', eventId);
    return false;
  }
  await supabase.from('favorites').upsert({ user_id: userId, event_id: eventId });
  return true;
}

export async function listFavoriteIds(userId: number): Promise<number[]> {
  const { data } = await supabase.from('favorites').select('event_id').eq('user_id', userId);
  return ((data ?? []) as { event_id: number }[]).map((r) => r.event_id);
}

export async function listFavoriteEvents(userId: number): Promise<EventWithOrg[]> {
  const ids = await listFavoriteIds(userId);
  if (!ids.length) return [];
  const { data } = await supabase.from('events').select(EVENT_SELECT).in('id', ids).order('starts_at');
  return ((data ?? []) as Record<string, any>[]).map(mapEvent);
}

export async function listDigestSubscribers(): Promise<DigestSubscriber[]> {
  const { data } = await supabase.from('digest_subscribers').select('*').eq('active', true).order('zip');
  return (data as DigestSubscriber[]) ?? [];
}

export async function upsertDigestSubscriber(email: string, zip: string, userId: number | null): Promise<void> {
  const { error } = await supabase
    .from('digest_subscribers')
    .upsert({ email: email.trim().toLowerCase(), zip, user_id: userId, active: true }, { onConflict: 'email' });
  if (error) throw error;
}

export async function deactivateDigestSubscriber(email: string): Promise<void> {
  await supabase.from('digest_subscribers').update({ active: false }).eq('email', email.trim().toLowerCase());
}

export async function markDigestSent(id: number): Promise<void> {
  await supabase.from('digest_subscribers').update({ last_sent_at: new Date().toISOString() }).eq('id', id);
}

export async function listEventsForDigest(zip: string, from: string, to: string): Promise<EventWithOrg[]> {
  const { data } = await supabase.from('events').select(EVENT_SELECT)
    .eq('status', 'published').eq('zip', zip)
    .gte('starts_at', `${from}T00:00`).lte('starts_at', `${to}T23:59`)
    .order('starts_at').limit(20);
  return ((data ?? []) as Record<string, any>[]).map(mapEvent);
}

export interface SiteStats {
  publishedEvents: number; pendingEvents: number; organizations: number; subscribers: number; seniors: number;
}

export async function getSiteStats(): Promise<SiteStats> {
  const head = async (table: string, filter?: { column: string; value: unknown }) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (filter) q = q.eq(filter.column, filter.value);
    const { count } = await q;
    return count ?? 0;
  };
  return {
    publishedEvents: await head('events', { column: 'status', value: 'published' }),
    pendingEvents: await head('events', { column: 'status', value: 'pending' }),
    organizations: await head('organizations'),
    subscribers: await head('digest_subscribers', { column: 'active', value: true }),
    seniors: await head('users', { column: 'role', value: 'senior' }),
  };
}

export type { SessionUser };

function plusDays(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}
