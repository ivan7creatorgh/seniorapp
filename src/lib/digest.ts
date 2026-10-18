// Weekly digest: builds the personalized "what's on near you" email and sends
// it to every active subscriber. Used by /api/cron/weekly-digest (Vercel Cron)
// and the admin dashboard's "send now" button.
import { addDaysISO, escapeHtml, formatEventDate, formatTimeRange, todayISO } from './format';
import { emailShell, sendEmail, type SendResult } from './email';
import { listDigestSubscribers, listEventsForDigest, markDigestSent } from './repos';
import { SITE_NAME } from './constants';
import type { EventWithOrg } from './types';

export interface DigestResult {
  email: string;
  zip: string;
  eventCount: number;
  result: SendResult | { delivered: 'skipped'; detail: string };
}

export interface DigestRun {
  startedAt: string;
  results: DigestResult[];
  errors: string[];
}

function eventRowHtml(e: EventWithOrg): string {
  const badges: string[] = [];
  if (e.cost_type === 'free') badges.push('Free');
  if (e.mobility === 'wheelchair') badges.push('Wheelchair accessible');
  if (e.mobility === 'walker') badges.push('Step-free');
  if (e.transportation) badges.push('Ride available');
  if (e.seating) badges.push('Seating available');
  if (e.sponsored) badges.push('★ Sponsored');
  const badgeHtml = badges
    .map((b) => `<span style="display:inline-block;margin:4px 6px 0 0;padding:3px 10px;border:1px solid #4a5568;border-radius:999px;font-size:13px;color:#16213a;">${escapeHtml(b)}</span>`)
    .join('');
  return `<tr>
    <td style="padding:14px 0;border-top:1px solid #d8d2c4;vertical-align:top;">
      <div style="font-size:18px;font-weight:bold;">
        <a href="${eventUrl(e.id)}" style="color:#0f5c8c;">${escapeHtml(e.title)}</a>
      </div>
      <div style="font-size:16px;margin-top:4px;">
        <strong>${escapeHtml(formatEventDate(e.starts_at))}</strong>, ${escapeHtml(formatTimeRange(e.starts_at, e.ends_at))}
      </div>
      <div style="font-size:15px;color:#4a5568;margin-top:2px;">
        ${escapeHtml(e.location_name)}${e.address ? ` · ${escapeHtml(e.address)}` : ''}, ${escapeHtml(e.city)} ${escapeHtml(e.zip)}
      </div>
      <div>${badgeHtml}</div>
    </td>
  </tr>`;
}

export function eventUrl(id: number): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/events/${id}`;
}

export function buildDigestEmail(opts: {
  zip: string;
  events: EventWithOrg[];
  from: string;
  to: string;
  unsubscribeUrl?: string;
}): { subject: string; html: string; text: string } {
  const { zip, events } = opts;
  const subject =
    events.length > 0
      ? `${events.length} activities near ${zip} this week`
      : `No activities near ${zip} yet this week`;

  const intro =
    events.length > 0
      ? `<p style="margin:0 0 8px 0;">Here’s what’s happening near <strong>${escapeHtml(zip)}</strong> from ${escapeHtml(formatEventDate(opts.from))} to ${escapeHtml(formatEventDate(opts.to))}. Tap any title for full details, accessibility information, and directions.</p>`
      : `<p style="margin:0 0 8px 0;">We don’t have any activities listed near <strong>${escapeHtml(zip)}</strong> in the next seven days yet. New events are added every day — check the board anytime, or widen your search to a nearby ZIP code.</p>`;

  const listHtml =
    events.length > 0
      ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${events.map(eventRowHtml).join('')}</table>`
      : '';

  const cta = `<p style="margin:20px 0 0 0;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/events?zip=${encodeURIComponent(zip)}" style="display:inline-block;padding:14px 22px;background:#0f5c8c;color:#ffffff;text-decoration:none;font-weight:bold;font-size:17px;border-radius:8px;">See all activities near ${escapeHtml(zip)}</a></p>`;

  const footerNote = opts.unsubscribeUrl
    ? `You’re receiving this weekly email because you subscribed at ${SITE_NAME}. To stop, <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#0f5c8c;">unsubscribe here</a>.`
    : undefined;

  const html = emailShell({ heading: `Activities near you — week of ${formatEventDate(opts.from)}`, bodyHtml: intro + listHtml + cta, footerNote });

  const textLines = [
    `Activities near ${zip} — week of ${formatEventDate(opts.from)}`,
    '',
    ...events.map(
      (e) =>
        `• ${e.title}\n  ${formatEventDate(e.starts_at)}, ${formatTimeRange(e.starts_at, e.ends_at)}\n  ${e.location_name}, ${e.city} ${e.zip}\n  ${eventUrl(e.id)}`
    ),
    '',
    `Browse everything: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/events?zip=${zip}`,
  ];
  return { subject, html, text: textLines.join('\n') };
}

/** Send the digest to one subscriber. Returns the number of events found. */
export async function sendDigestToSubscriber(sub: { id: number; email: string; zip: string }): Promise<DigestResult> {
  const from = todayISO();
  const to = addDaysISO(from, 7);
  const events = listEventsForDigest(sub.zip, from, to);
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const { subject, html, text } = buildDigestEmail({
    zip: sub.zip,
    events,
    from,
    to,
    unsubscribeUrl: `${base.replace(/\/$/, '')}/api/digest/unsubscribe?email=${encodeURIComponent(sub.email)}`,
  });
  const result = await sendEmail({ to: sub.email, subject, html, text });
  markDigestSent(sub.id);
  return { email: sub.email, zip: sub.zip, eventCount: events.length, result };
}

/**
 * Run the digest for every active subscriber (or a single email with
 * `onlyEmail`, used for admin test sends). Never throws — failures are
 * collected so one bad address can’t stop the run.
 */
export async function sendWeeklyDigests(opts: { onlyEmail?: string } = {}): Promise<DigestRun> {
  const subs = listDigestSubscribers().filter((s) => (opts.onlyEmail ? s.email === opts.onlyEmail : true));
  const results: DigestResult[] = [];
  const errors: string[] = [];
  for (const sub of subs) {
    try {
      results.push(await sendDigestToSubscriber(sub));
    } catch (err) {
      errors.push(`${sub.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { startedAt: new Date().toISOString(), results, errors };
}
