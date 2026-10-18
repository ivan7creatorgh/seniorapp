import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { CATEGORIES, DEMO_ZIP, PLANS } from '@/lib/constants';
import { addDaysISO, todayISO } from '@/lib/format';
import { listEvents, listFavoriteIds } from '@/lib/repos';
import DigestSignup from '@/components/DigestSignup';
import EventCard from '@/components/EventCard';
import { IconCheck, IconSearch } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const savedIds = new Set(user ? listFavoriteIds(user.id) : []);
  const upcoming = listEvents({ zip: DEMO_ZIP, from: todayISO(), to: addDaysISO(todayISO(), 14), limit: 6 });

  return (
    <div className="grid gap-12">
      {/* Hero */}
      <section className="card p-6 sm:p-10" aria-labelledby="hero-heading">
        <h1 id="hero-heading" className="text-4xl font-extrabold leading-tight sm:text-5xl">
          Find something enjoyable to do this week.
        </h1>
        <p className="mt-4 max-w-2xl text-xl">
          Free and low-cost activities from senior centers, libraries, churches, and community groups —
          gathered in one simple place, with honest details about cost, wheelchair access, and rides.
        </p>

        <form method="get" action="/events" className="mt-7 flex flex-wrap items-end gap-4">
          <div className="grow" style={{ minWidth: 240 }}>
            <label htmlFor="hero-zip" className="field-label text-lg">Enter your ZIP code</label>
            <input
              id="hero-zip" name="zip" className="field" inputMode="numeric" maxLength={10}
              placeholder={`e.g. ${DEMO_ZIP}`} autoComplete="postal-code"
            />
          </div>
          <button type="submit" className="btn btn-primary text-xl">
            <IconSearch /> Find activities
          </button>
        </form>
        <p className="mt-3 text-muted">
          Or <Link href="/events" className="font-bold text-brand">browse everything nearby</Link> — no sign-up needed.
        </p>
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-3xl font-extrabold">Browse by interest</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link
                href={`/events?cats=${c.id}`}
                className="card block h-full p-5 no-underline transition-colors hover:bg-canvas"
              >
                <span className="block text-xl font-extrabold text-ink">{c.label}</span>
                <span className="mt-1 block text-muted">{c.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* This week */}
      <section aria-labelledby="this-week-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="this-week-heading" className="text-3xl font-extrabold">
            Happening soon near {DEMO_ZIP}
          </h2>
          <Link href={`/events?zip=${DEMO_ZIP}&range=week`} className="btn btn-secondary btn-small">
            See all this week
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-xl">No activities listed for this ZIP code right now — try a nearby one.</p>
        ) : (
          <div className="mt-5 grid gap-4">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} savedIds={savedIds} loggedIn={!!user} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="card p-6 sm:p-10" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-3xl font-extrabold">How it works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          <li>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-2xl font-extrabold text-white">1</span>
            <h3 className="mt-3 text-xl font-extrabold">Tell us your ZIP code</h3>
            <p className="mt-1 text-muted">We show activities near you — nothing overwhelming, just what’s close by.</p>
          </li>
          <li>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-2xl font-extrabold text-white">2</span>
            <h3 className="mt-3 text-xl font-extrabold">Filter to fit your day</h3>
            <p className="mt-1 text-muted">Wheelchair accessible, provides a ride, free, has seating — filter by what you actually need.</p>
          </li>
          <li>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-2xl font-extrabold text-white">3</span>
            <h3 className="mt-3 text-xl font-extrabold">Save favorites, get a weekly email</h3>
            <p className="mt-1 text-muted">Keep the ones you like and we’ll send a friendly Monday-morning list.</p>
          </li>
        </ol>
      </section>

      {/* Accessibility promise */}
      <section aria-labelledby="access-heading" className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 id="access-heading" className="text-3xl font-extrabold">Designed for comfort</h2>
          <ul className="mt-4 grid gap-3 text-lg">
            {[
              'Extra-large text and buttons — bigger with one tap',
              'High-contrast mode for low vision',
              'Every event says if it’s wheelchair friendly, has seating, or provides a ride',
              'No pop-ups, no trickery, no ads aimed at you',
              'Free for seniors and families, forever',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 text-success"><IconCheck /></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <Link href="/accessibility" className="font-bold text-brand">Read our full accessibility promise →</Link>
          </p>
        </div>
        <div className="card p-6">
          <h2 className="text-2xl font-extrabold">Helping a parent or grandparent?</h2>
          <p className="mt-2">
            Create an account, save a handful of activities you think they’d enjoy, and send them the weekly
            email. Everything is printable in a large, clear format.
          </p>
          <p className="mt-4">
            <Link href="/register" className="btn btn-secondary">Create a free account</Link>
          </p>
        </div>
      </section>

      {/* Providers + digest */}
      <section className="grid gap-6 md:grid-cols-2" aria-labelledby="providers-heading">
        <div className="card p-6">
          <h2 id="providers-heading" className="text-2xl font-extrabold">Senior centers &amp; organizations</h2>
          <p className="mt-2">
            Post your events where thousands of local seniors and families will see them. Add them yourself in
            minutes — no phone calls, no paperwork.
          </p>
          <p className="mt-4 text-2xl font-extrabold">{PLANS.provider.priceLabel}</p>
          <p className="text-muted">and {PLANS.sponsored.priceLabel} for sponsored placement</p>
          <p className="mt-4">
            <Link href="/providers" className="btn btn-primary">See how it works</Link>
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold">Never miss a thing</h2>
          <p className="mt-2 mb-4 text-muted">
            One email each Monday with the week’s activities near you. Free, and you can cancel with one click.
          </p>
          <DigestSignup defaultZip={DEMO_ZIP} email={user?.email ?? ''} />
        </div>
      </section>

      {/* Testimonials */}
      <section aria-labelledby="stories-heading">
        <h2 id="stories-heading" className="text-3xl font-extrabold">From people like you</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { quote: 'I found a chair yoga class two blocks from my apartment. I go three times a week now.', name: 'Margaret, 74' },
            { quote: 'Mom’s in a wheelchair and I never knew which events would actually work. This site just tells you.', name: 'Diane, daughter' },
            { quote: 'Our Wednesday suppers fill up now. The listing pays for itself many times over.', name: 'Harold, senior center director' },
          ].map((t) => (
            <figure key={t.name} className="card p-5">
              <blockquote className="text-lg">“{t.quote}”</blockquote>
              <figcaption className="mt-3 font-bold text-muted">— {t.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
