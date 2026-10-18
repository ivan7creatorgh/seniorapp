// Small HTTP helpers for route handlers: JSON errors, CSRF origin check.
import { NextResponse } from 'next/server';

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function jsonOk(body: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json({ ok: true, ...body });
}

/**
 * Basic CSRF protection for cookie-authenticated mutations: browsers always
 * send an Origin header on cross-origin requests; same-origin requests send it
 * too (or none at all, e.g. curl). Reject only when Origin is present and
 * does not match this host.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin) return;
  const host = request.headers.get('host');
  try {
    if (new URL(origin).host !== host) {
      throw new Error('cross-origin');
    }
  } catch {
    throw new Error('Cross-origin requests are not allowed.');
  }
}
