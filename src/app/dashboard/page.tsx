import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { PLANS, orgTypeLabel } from '@/lib/constants';
import { formatEventDate, formatTimeRange } from '@/lib/format';
import { countPublishedEvents, getOrganizationForUser, listEventsForOrg } from '@/lib/repos';
import OrgForm from '@/components/OrgForm';
import PlanButtons from '@/components/PlanButtons';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Provider dashboard' };

const STATUS_STYLES: Record<string, string> = {
  published: 'badge-free',
  pending: 'badge-accent',
  rejected: 'badge',
  cancelled: 'badge',
};

export default async function DashboardPage({ searchParams }: { searchParams: { saved?: string } }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) redirect('/login?next=/dashboard');

  const org = getOrganizationForUser(user.id);
  if (!org) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold">Welcome! Tell us about your organization</h1>
        <p className="mt-2 mb-6 text-xl text-muted">
          Once your organization is set up, you can post events in a couple of minutes.
        </p>
        <OrgForm />
      </div>
    );
  }

  const events = listEventsForOrg(org.id);
  const publishedCount = countPublishedEvents(org.id);
  const planInfo = PLANS[org.plan];
  const trialFull = org.plan === 'trial' && publishedCount >= 3;

  return (
    <div className="grid gap-10">
      {searchParams.saved && (
        <p role="status" className="card border-success p-4 text-lg font-bold text-success">
          ✓ Saved. New events are reviewed by our team before appearing — usually within one business day.
        </p>
      )}

      <section aria-labelledby="dash-heading" className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="dash-heading" className="text-4xl font-extrabold">{org.name}</h1>
          <p className="mt-1 text-xl text-muted">{orgTypeLabel(org.org_type)} · {org.zip || 'no ZIP set'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/organization" className="btn btn-secondary">Edit organization</Link>
          <Link href="/dashboard/events/new" className="btn btn-primary">＋ Submit a new event</Link>
        </div>
      </section>

      {trialFull && (
        <div className="card border-accent p-5">
          <p className="text-lg font-bold">
            Your free trial includes up to 3 published events (you have {publishedCount}). Upgrade to keep them
            listed and post unlimited events.
          </p>
        </div>
      )}

      {/* Plan */}
      <section className="card p-6" aria-labelledby="plan-heading">
        <h2 id="plan-heading" className="text-2xl font-extrabold">Your plan</h2>
        <p className="mt-1 text-xl font-bold">
          {planInfo.name} — {planInfo.priceLabel}
          {org.plan === 'trial' && org.trial_ends_at && (
            <span className="font-normal text-muted"> · trial ends {org.trial_ends_at.slice(0, 10)}</span>
          )}
        </p>
        <ul className="mt-3 grid gap-1.5 text-lg">
          {planInfo.features.map((f) => <li key={f}>✓ {f}</li>)}
        </ul>
        <div className="mt-5">
          <PlanButtons currentPlan={org.plan} />
        </div>
      </section>

      {/* Events */}
      <section aria-labelledby="events-heading">
        <h2 id="events-heading" className="text-2xl font-extrabold">Your events</h2>
        {events.length === 0 ? (
          <div className="card mt-4 p-6">
            <p className="text-xl font-bold">No events yet — your first one takes about three minutes.</p>
            <p className="mt-4">
              <Link href="/dashboard/events/new" className="btn btn-primary">Submit your first event</Link>
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4">
            {events.map((e) => (
              <li key={e.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold">
                      <Link href={`/events/${e.id}`} className="text-ink hover:text-brand no-underline">{e.title}</Link>
                    </h3>
                    <p className="mt-1 font-semibold">
                      {formatEventDate(e.starts_at)}, {formatTimeRange(e.starts_at, e.ends_at)}
                    </p>
                    <p className="text-muted">{e.city} {e.zip}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`badge ${STATUS_STYLES[e.status] ?? 'badge'}`}>{e.status}</span>
                    <Link href={`/dashboard/events/${e.id}/edit`} className="btn btn-small btn-secondary">Edit</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
