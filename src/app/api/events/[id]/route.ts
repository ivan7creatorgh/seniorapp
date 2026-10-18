import { getCurrentUser } from '@/lib/auth';
import { applyOrgDefaults } from '@/lib/eventDefaults';
import { assertSameOrigin, jsonError, jsonOk } from '@/lib/http';
import { cancelEvent, getEventWithOrg, getOrganization, setEventStatus, updateEvent } from '@/lib/repos';
import { eventSchema, firstIssue } from '@/lib/validation';

function canManage(user: { id: number; role: string }, orgId: number): boolean {
  if (user.role === 'admin') return true;
  const org = getOrganization(orgId);
  return !!org && org.owner_user_id === user.id;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Invalid request', 403);
  }
  const user = getCurrentUser();
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) {
    return jsonError('Please sign in to edit events.', 401);
  }
  const existing = getEventWithOrg(Number(params.id));
  if (!existing) return jsonError('That event doesn’t exist.', 404);
  if (!canManage(user, existing.org_id)) return jsonError('You can only edit your own organization’s events.', 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Please try again.', 400);
  }
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error));
  const data = parsed.data;

  const org = getOrganization(existing.org_id)!;
  updateEvent(existing.id, applyOrgDefaults({
    title: data.title, description: data.description, category: data.category,
    starts_at: data.starts_at, ends_at: data.ends_at,
    location_name: data.location_name, address: data.address, city: data.city, state: data.state, zip: data.zip,
    cost_type: data.cost_type, cost_amount: data.cost_amount, mobility: data.mobility,
    transportation: data.transportation, seating: data.seating,
    hearing_friendly: data.hearing_friendly, registration_required: data.registration_required,
    contact_phone: data.contact_phone, external_url: data.external_url, sponsored: data.sponsored,
  }, org));
  // Edited events go back through review so the board stays accurate.
  setEventStatus(existing.id, 'pending');

  return jsonOk({ id: existing.id, status: 'pending' });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Invalid request', 403);
  }
  const user = getCurrentUser();
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) {
    return jsonError('Please sign in.', 401);
  }
  const existing = getEventWithOrg(Number(params.id));
  if (!existing) return jsonError('That event doesn’t exist.', 404);
  if (!canManage(user, existing.org_id)) return jsonError('You can only manage your own organization’s events.', 403);

  cancelEvent(existing.id);
  return jsonOk({ id: existing.id, status: 'cancelled' });
}
