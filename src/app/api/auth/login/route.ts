import { NextResponse } from 'next/server';
import { createSession, verifyPassword } from '@/lib/auth';
import { findUserAuthByEmail } from '@/lib/repos';
import { jsonError, assertSameOrigin } from '@/lib/http';
import { firstIssue, loginSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Something went wrong. Please try again.', 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Please try again.', 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error));

  const user = findUserAuthByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return jsonError('That email and password don’t match. Please try again, or use a demo account.', 401);
  }

  createSession(user.id, { secure: new URL(request.url).protocol === 'https:' });
  const redirect = user.role === 'senior' ? '/events' : user.role === 'admin' ? '/admin' : '/dashboard';
  return NextResponse.json({ ok: true, redirect });
}
