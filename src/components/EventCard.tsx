import Link from 'next/link';
import { categoryLabel, mobilityLabel } from '@/lib/constants';
import { formatCost, formatEventDayBlock, formatEventDate, formatTimeRange, relativeDayLabel } from '@/lib/format';
import type { EventWithOrg } from '@/lib/types';
import SaveButton from './SaveButton';
import { IconBus, IconEar, IconPin, IconSeat, IconStar, IconWheelchair } from './icons';

export default function EventCard({ event, savedIds, loggedIn }: {
  event: EventWithOrg;
  savedIds: Set<number>;
  loggedIn: boolean;
}) {
  const day = formatEventDayBlock(event.starts_at);
  const badges: Array<{ label: string; className: string; icon?: React.ReactNode }> = [];
  badges.push(
    event.cost_type === 'free'
      ? { label: 'Free', className: 'badge-free' }
      : { label: formatCost(event.cost_type, event.cost_amount), className: 'badge' }
  );
  badges.push({ label: categoryLabel(event.category), className: 'badge' });
  if (event.mobility === 'wheelchair') {
    badges.push({ label: 'Wheelchair accessible', className: 'badge-brand', icon: <IconWheelchair /> });
  } else if (event.mobility === 'walker') {
    badges.push({ label: 'Step-free', className: 'badge-brand' });
  }
  if (event.transportation) badges.push({ label: 'Ride available', className: 'badge', icon: <IconBus /> });
  if (event.seating) badges.push({ label: 'Seating available', className: 'badge', icon: <IconSeat /> });
  if (event.hearing_friendly) badges.push({ label: 'Hearing friendly', className: 'badge', icon: <IconEar /> });

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex gap-4">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border-2 border-line bg-canvas text-center"
          aria-hidden="true"
        >
          <div className="leading-none">
            <div className="text-sm font-bold text-muted">{day.weekday}</div>
            <div className="text-3xl font-extrabold">{day.day}</div>
            <div className="text-sm font-bold text-muted">{day.month}</div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-xl font-extrabold leading-snug">
              <Link href={`/events/${event.id}`} className="text-ink hover:text-brand no-underline">
                {event.sponsored && <span className="mr-1.5 inline-block align-middle text-accent" title="Sponsored placement"><IconStar /></span>}
                {event.title}
              </Link>
            </h3>
            <SaveButton eventId={event.id} initialSaved={savedIds.has(event.id)} loggedIn={loggedIn} />
          </div>
          <p className="mt-1 font-semibold text-ink">
            {relativeDayLabel(event.starts_at)}, {formatTimeRange(event.starts_at, event.ends_at)}
          </p>
          <p className="mt-0.5 flex items-start gap-1.5 text-muted">
            <span className="mt-1 shrink-0"><IconPin /></span>
            <span>
              {event.location_name ? `${event.location_name}, ` : ''}
              {event.address}, {event.city} {event.zip}
            </span>
          </p>
          <p className="mt-0.5 text-muted">Hosted by {event.org_name}</p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Event features">
            {badges.map((b) => (
              <li key={b.label} className={`badge ${b.className}`}>
                {b.icon}
                {b.label}
              </li>
            ))}
          </ul>
          <p className="sr-only">{`${formatEventDate(event.starts_at)}, ${formatTimeRange(event.starts_at, event.ends_at)}, accessibility: ${mobilityLabel(event.mobility)}`}</p>
        </div>
      </div>
    </article>
  );
}
