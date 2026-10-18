import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { assertSameOrigin, jsonError, jsonOk } from '@/lib/http';
import { countPublishedEvents, createEvent, getOrganization } from '@/lib/repos';
import { applyOrgDefaults } from '@/lib/eventDefaults';
import { eventSchema, firstIssue } from '@/lib/validation';

const TRIAL_EVENT_LIMIT = 3;

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Invalid request', 403);
  }
  const user = getCurrentUser();
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) {
    return jsonError('Please sign in as an organization to submit events.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Please try again.', 400);
  }
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error));
  const data = parsed.data;

  const org = getOrganization(data.org_id);
  if (!org) return jsonError('Organization not found.');
  if (user.role !== 'admin' && org.owner_user_id !== user.id) {
    return jsonError('You can only submit events for your own organization.', 403);
  }

  if (org.plan === 'trial' && countPublishedEvents(org.id) >= TRIAL_EVENT_LIMIT) {
    return jsonError(
      `The free trial includes up to ${TRIAL_EVENT_LIMIT} published events. Upgrade to the Provider plan ($8/month) for unlimited listings.`,
      402
    );
  }

  const event = createEvent(org.id, applyOrgDefaults({
    title: data.title, description: data.description, category: data.category,
    starts_at: data.starts_at, ends_at: data.ends_at,
    location_name: data.location_name, address: data.address, city: data.city, state: data.state, zip: data.zip,
    cost_type: data.cost_type, cost_amount: data.cost_amount, mobility: data.mobility,
    transportation: data.transportation, seating: data.seating, hearing_friendly: data.hearing_friendly,
    registration_required: data.registration_required, contact_phone: data.contact_phone,
    external_url: data.external_url, sponsored: data.sponsored,
  }, org));

  return jsonOk({ id: event.id, status: event.status });
}
