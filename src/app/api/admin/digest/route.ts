import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { assertSameOrigin, jsonError, jsonOk } from '@/lib/http';
import { sendWeeklyDigests } from '@/lib/digest';

/** Admin-only: send the weekly digest immediately (used by the admin dashboard). */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Invalid request', 403);
  }
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') return jsonError('Admin sign-in required.', 401);

  const run = await sendWeeklyDigests();
  return jsonOk({
    sent: run.results.length,
    errors: run.errors,
    files: run.results.map((r) => ({ email: r.email, zip: r.zip, events: r.eventCount, via: r.result.delivered })),
  });
}
