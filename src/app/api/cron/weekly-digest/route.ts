import { NextResponse } from 'next/server';
import { sendWeeklyDigests } from '@/lib/digest';

export const dynamic = 'force-dynamic';

/**
 * Weekly digest sender. Vercel Cron (see vercel.json) calls this every Monday
 * 13:00 UTC with `Authorization: Bearer $CRON_SECRET`. When CRON_SECRET is not
 * configured, it is open in development and locked in production.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') ?? '';
  if (secret) {
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not configured. Set it in your environment.' },
      { status: 503 }
    );
  }

  const run = await sendWeeklyDigests();
  return NextResponse.json({
    ok: true,
    sent: run.results.length,
    errors: run.errors,
    results: run.results.map((r) => ({
      email: r.email,
      zip: r.zip,
      events: r.eventCount,
      via: r.result.delivered,
    })),
  });
}
