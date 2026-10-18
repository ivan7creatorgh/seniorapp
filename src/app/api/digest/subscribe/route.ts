import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { assertSameOrigin, jsonError, jsonOk } from '@/lib/http';
import { upsertDigestSubscriber } from '@/lib/repos';
import { digestSubscribeSchema, firstIssue } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Invalid request', 403);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Please try again.', 400);
  }
  const parsed = digestSubscribeSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error));

  const user = getCurrentUser();
  upsertDigestSubscriber(parsed.data.email, parsed.data.zip, user ? user.id : null);
  return jsonOk();
}
