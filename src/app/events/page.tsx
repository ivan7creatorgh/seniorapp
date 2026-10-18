import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { CATEGORY_IDS, type CategoryId, type DateRangeId, type MobilityId } from '@/lib/constants';
import { addDaysISO, parseWallTime, todayISO } from '@/lib/format';
import { listEvents, listFavoriteIds } from '@/lib/repos';
import EventCard from '@/components/EventCard';
import FilterPanel, { type FilterValues } from '@/components/FilterPanel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Find activities near you',
  description: 'Free and low-cost activities for seniors, filterable by ZIP code, date, cost, mobility, and transportation.',
};

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Resolve the "when" dropdown into an inclusive YYYY-MM-DD from/to window. */
function resolveRange(range: DateRangeId): { from?: string; to?: string } {
  const today = todayISO();
  switch (range) {
    case 'today':
      return { from: today, to: today };
    case 'week':
      return { from: today, to: addDaysISO(today, 7) };
    case 'month':
      return { from: today, to: addDaysISO(today, 30) };
    case 'weekend': {
      const weekday = parseWallTime(`${today}T12:00`).getDay(); // 0=Sun … 6=Sat
      if (weekday === 6) return { from: today, to: addDaysISO(today, 1) };
      if (weekday === 0) return { from: today, to: today };
      const untilSat = 6 - weekday;
      return { from: addDaysISO(today, untilSat), to: addDaysISO(today, untilSat + 1) };
    }
    default:
      return {};
  }
}

export default async function EventsPage({ searchParams }: Props) {
  const catsRaw = (one(searchParams.cats) ?? '').split(',').filter(Boolean);
  const values: FilterValues = {
    zip: one(searchParams.zip)?.trim() || undefined,
    range: (one(searchParams.range) as DateRangeId | undefined) ?? 'any',
    cats: catsRaw.filter((c): c is CategoryId => CATEGORY_IDS.includes(c as CategoryId)),
    mobility: (one(searchParams.mobility) as MobilityId | undefined) ?? undefined,
    free: one(searchParams.free) === '1',
    transport: one(searchParams.transport) === '1',
    seating: one(searchParams.seating) === '1',
    hearing: one(searchParams.hearing) === '1',
    q: one(searchParams.q)?.trim() || undefined,
  };

  const { from, to } = resolveRange(values.range ?? 'any');
  const events = listEvents({
    zip: values.zip,
    from,
    to,
    categories: values.cats,
    mobility: values.mobility,
    freeOnly: values.free,
    transportOnly: values.transport,
    seatingOnly: values.seating,
    hearingOnly: values.hearing,
    q: values.q,
    includeSponsoredFirst: true,
  });

  const user = await getCurrentUser();
  const savedIds = new Set(user ? listFavoriteIds(user.id) : []);

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:items-start">
      <div className="lg:sticky lg:top-4">
        <FilterPanel values={values} />
      </div>

      <section aria-labelledby="results-heading" aria-live="polite">
        <h1 id="results-heading" className="text-3xl font-extrabold">
          {values.zip ? `Activities near ${values.zip}` : 'All activities'}
        </h1>
        <p className="mt-1 text-lg text-muted">
          {events.length === 0
            ? 'No matching activities right now.'
            : `${events.length} ${events.length === 1 ? 'activity' : 'activities'} found.`}
        </p>

        {events.length === 0 ? (
          <div className="card mt-5 p-6">
            <p className="text-xl font-bold">Nothing matched — but that’s easy to fix.</p>
            <ul className="mt-3 grid list-disc gap-2 pl-6 text-lg">
              <li>Try a nearby ZIP code.</li>
              <li>Choose “Any date” to see everything coming up.</li>
              <li>Uncheck a must-have filter, like “Provides a ride”.</li>
            </ul>
            <p className="mt-5">
              <Link href="/events" className="btn btn-secondary">Clear all filters</Link>
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {events.map((e) => (
              <EventCard key={e.id} event={e} savedIds={savedIds} loggedIn={!!user} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
