import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { orgTypeLabel } from '@/lib/constants';
import { formatEventDate, formatTimeRange } from '@/lib/format';
import { getSiteStats, listDigestSubscribers, listOrganizations, listPendingEvents } from '@/lib/repos';
import AdminDigestControls from '@/components/AdminDigestControls';
import ModerationActions from '@/components/ModerationActions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin' };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/login?next=/admin');

  const stats = getSiteStats();
  const pending = listPendingEvents();
  const orgs = listOrganizations();
  const subscribers = listDigestSubscribers();

  return (
    <div className="grid gap-10">
      <section aria-labelledby="stats-heading">
        <h1 id="stats-heading" className="text-4xl font-extrabold">Admin</h1>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Published events', value: stats.publishedEvents },
            { label: 'Awaiting review', value: stats.pendingEvents },
            { label: 'Organizations', value: stats.organizations },
            { label: 'Digest subscribers', value: stats.subscribers },
            { label: 'Senior accounts', value: stats.seniors },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <dd className="text-4xl font-extrabold">{s.value}</dd>
              <dt className="mt-1 font-bold text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="moderation-heading" className="card p-6">
        <h2 id="moderation-heading" className="text-2xl font-extrabold">Events awaiting review</h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-lg text-muted">All clear — nothing is waiting.</p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {pending.map((e) => (
              <li key={e.id} className="rounded-xl border-2 border-line p-4">
                <h3 className="text-xl font-extrabold">
                  <Link href={`/events/${e.id}`} className="text-ink hover:text-brand no-underline">{e.title}</Link>
                </h3>
                <p className="mt-1 font-semibold">
                  {formatEventDate(e.starts_at)}, {formatTimeRange(e.starts_at, e.ends_at)} · {e.city} {e.zip}
                </p>
                <p className="text-muted">Submitted by {e.org_name}</p>
                <p className="mt-3"><ModerationActions eventId={e.id} /></p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="digest-heading" className="card p-6">
        <h2 id="digest-heading" className="text-2xl font-extrabold">Weekly digest</h2>
        <p className="mt-2 text-lg">
          {subscribers.length} active {subscribers.length === 1 ? 'subscriber' : 'subscribers'}.
          Vercel Cron sends this every Monday at 13:00 UTC; you can trigger it manually here.
        </p>
        <ul className="mt-3 grid gap-1 text-muted">
          {subscribers.slice(0, 8).map((s) => (
            <li key={s.id}>{s.email} — {s.zip}{s.last_sent_at ? ` · last sent ${s.last_sent_at.slice(0, 10)}` : ' · never sent'}</li>
          ))}
          {subscribers.length > 8 && <li>…and {subscribers.length - 8} more</li>}
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <AdminDigestControls />
          <Link href="/admin/digest?zip=02116" className="btn btn-secondary">Preview an email</Link>
        </div>
        <p className="mt-3 text-muted">
          Without a RESEND_API_KEY, emails are written to <code>var/outbox/</code> so you can open them in a browser.
        </p>
      </section>

      <section aria-labelledby="orgs-heading">
        <h2 id="orgs-heading" className="text-2xl font-extrabold">Organizations</h2>
        <ul className="mt-4 grid gap-3">
          {orgs.map((o) => (
            <li key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <span className="text-lg font-extrabold">{o.name}</span>
                <span className="ml-2 text-muted">{orgTypeLabel(o.org_type)} · {o.zip}</span>
              </div>
              <span className={`badge ${o.plan === 'sponsored' ? 'badge-accent' : o.plan === 'provider' ? 'badge-free' : 'badge'}`}>
                {o.plan}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
