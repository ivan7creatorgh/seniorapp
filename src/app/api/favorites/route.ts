import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { assertSameOrigin, jsonError, jsonOk } from '@/lib/http';
import { getEventWithOrg, toggleFavorite } from '@/lib/repos';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Invalid request', 403);
  }
  const user = getCurrentUser();
  if (!user) return jsonError('Please sign in to save favorites.', 401);

  let body: { event_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('Please try again.', 400);
  }
  const eventId = Number(body.event_id);
  if (!Number.isInteger(eventId) || eventId <= 0) return jsonError('That event doesn’t exist.');
  if (!getEventWithOrg(eventId)) return jsonError('That event doesn’t exist.');

  const saved = toggleFavorite(user.id, eventId);
  return jsonOk({ saved });
}
