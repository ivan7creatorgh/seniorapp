import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { assertSameOrigin, jsonError, jsonOk } from '@/lib/http';
import { getEventWithOrg, setEventStatus } from '@/lib/repos';
import { firstIssue, moderationSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Invalid request', 403);
  }
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') return jsonError('Admin sign-in required.', 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Please try again.', 400);
  }
  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error));

  const event = getEventWithOrg(parsed.data.event_id);
  if (!event) return jsonError('That event doesn’t exist.', 404);

  const status = parsed.data.action === 'approve' ? 'published' : 'rejected';
  setEventStatus(event.id, status);
  return jsonOk({ id: event.id, status });
}
