import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { categoryLabel, mobilityLabel, orgTypeLabel } from '@/lib/constants';
import { formatCost, formatEventDate, formatTimeRange } from '@/lib/format';
import { getEventWithOrg, isFavorite } from '@/lib/repos';
import PrintButton from '@/components/PrintButton';
import SaveButton from '@/components/SaveButton';
import { IconBus, IconCheck, IconEar, IconPhone, IconPin, IconSeat, IconStar, IconWheelchair } from '@/components/icons';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const event = getEventWithOrg(Number(params.id));
  return { title: event ? event.title : 'Activity' };
}

export default async function EventDetailPage({ params }: Props) {
  const id = Number(params.id);
  const event = Number.isInteger(id) ? getEventWithOrg(id) : undefined;
  if (!event || event.status !== 'published') notFound();
  // Fall back to the organization's number if this listing didn't give its own.
  const phone = event.contact_phone || event.org_phone;

  const user = await getCurrentUser();
  const saved = user ? isFavorite(user.id, event.id) : false;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [event.address, event.city, event.state, event.zip].filter(Boolean).join(', ')
  )}`;

  const features: Array<{ ok: boolean; label: string; icon: React.ReactNode }> = [
    { ok: event.mobility === 'wheelchair', label: 'Wheelchair accessible — ramps, wide doors, accessible restroom', icon: <IconWheelchair /> },
    { ok: event.mobility === 'walker' || event.mobility === 'wheelchair', label: 'Step-free entrance', icon: <IconCheck /> },
    { ok: event.seating, label: 'Places to sit throughout', icon: <IconSeat /> },
    { ok: event.transportation, label: 'Provides a ride / transportation', icon: <IconBus /> },
    { ok: event.hearing_friendly, label: 'Hearing friendly — amplified, quiet, or subtitled', icon: <IconEar /> },
  ];

  return (
    <article className="grid gap-8">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {event.sponsored && (
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border-2 border-accent px-3 py-1 text-sm font-bold text-accent">
                <IconStar /> Sponsored placement
              </p>
            )}
            <h1 className="text-4xl font-extrabold leading-tight">{event.title}</h1>
            <p className="mt-2 text-xl font-bold">{categoryLabel(event.category)}</p>
          </div>
          <div className="grid gap-2">
            <SaveButton eventId={event.id} initialSaved={saved} loggedIn={!!user} />
            <PrintButton />
          </div>
        </div>

        <dl className="mt-6 grid gap-5 text-lg sm:grid-cols-2">
          <div>
            <dt className="font-bold text-muted">Date</dt>
            <dd className="text-2xl font-extrabold">{formatEventDate(event.starts_at)}</dd>
          </div>
          <div>
            <dt className="font-bold text-muted">Time</dt>
            <dd className="text-2xl font-extrabold">{formatTimeRange(event.starts_at, event.ends_at)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-bold text-muted">Where</dt>
            <dd>
              <p className="text-xl font-extrabold">{event.location_name || event.org_name}</p>
              <p>{event.address}</p>
              <p>{event.city}{event.state ? `, ${event.state}` : ''} {event.zip}</p>
              <p className="mt-3">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small">
                  <IconPin /> Get directions
                </a>
              </p>
            </dd>
          </div>
          <div>
            <dt className="font-bold text-muted">Cost</dt>
            <dd className="text-2xl font-extrabold">
              {formatCost(event.cost_type, event.cost_amount)}
              {event.cost_type === 'paid' && <span className="text-base font-normal text-muted"> per person</span>}
            </dd>
          </div>
          {phone && (
            <div>
              <dt className="font-bold text-muted">Questions?</dt>
              <dd>
                <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="inline-flex items-center gap-2 text-xl font-extrabold text-brand">
                  <IconPhone /> {phone}
                </a>
              </dd>
            </div>
          )}
        </dl>

        {event.registration_required && (
          <p className="mt-6 rounded-xl border-2 border-accent bg-canvas p-4 text-lg font-bold">
            📞 Please call ahead to reserve a spot — this event fills up.
          </p>
        )}

        {event.description && (
          <div className="prose-senior mt-6 border-t-2 border-line pt-6 whitespace-pre-line">{event.description}</div>
        )}

        {event.external_url && (
          <p className="mt-6">
            <a href={event.external_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              More details on the organizer’s website
            </a>
          </p>
        )}
      </div>

      <section className="card p-6 sm:p-8" aria-labelledby="accessibility-heading">
        <h2 id="accessibility-heading" className="text-2xl font-extrabold">Accessibility at a glance</h2>
        <p className="mt-1 text-muted">
          Listed by the organization and reviewed by our team. Call them if you have a specific question.
        </p>
        <ul className="mt-4 grid gap-3">
          {features.map((f) => (
            <li key={f.label} className="flex items-start gap-3 text-lg">
              <span
                className="mt-0.5 shrink-0"
                style={{ color: f.ok ? 'var(--color-success)' : 'var(--color-muted)' }}
                aria-hidden="true"
              >
                {f.ok ? <IconCheck /> : <span className="grid h-5 w-5 place-items-center font-bold">–</span>}
              </span>
              <span className={f.ok ? 'font-bold' : 'text-muted'}>
                {f.label}
                {!f.ok && <span className="ml-1">(not available)</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-lg">
          This venue is described as: <strong>{mobilityLabel(event.mobility)}</strong>.
        </p>
      </section>

      <section className="card p-6 sm:p-8" aria-labelledby="host-heading">
        <h2 id="host-heading" className="text-2xl font-extrabold">About the organizer</h2>
        <p className="mt-2 text-xl font-bold">{event.org_name}</p>
        <p className="text-muted">{orgTypeLabel(event.org_type)}</p>
        {event.org_website && (
          <p className="mt-2">
            <a href={event.org_website} target="_blank" rel="noopener noreferrer" className="font-bold text-brand">
              Visit their website
            </a>
          </p>
        )}
      </section>

      <p>
        <Link href="/events" className="btn btn-secondary">← Back to all activities</Link>
      </p>
    </article>
  );
}
