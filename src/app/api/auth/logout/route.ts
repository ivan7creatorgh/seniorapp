import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { assertSameOrigin } from '@/lib/http';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 403 });
  }
  destroySession();
  return NextResponse.redirect(new URL('/', request.url), 303);
}
