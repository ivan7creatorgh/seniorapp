import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { listFavoriteEvents } from '@/lib/repos';
import DigestSignup from '@/components/DigestSignup';
import EventCard from '@/components/EventCard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'My favorites' };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/favorites');

  const events = listFavoriteEvents(user.id);
  const savedIds = new Set(events.map((e) => e.id));

  return (
    <div className="grid gap-10">
      <section aria-labelledby="favorites-heading">
        <h1 id="favorites-heading" className="text-4xl font-extrabold">My saved activities</h1>
        <p className="mt-2 text-xl text-muted">
          {events.length === 0
            ? 'Nothing saved yet — tap “Save to favorites” on any activity.'
            : `${events.length} saved ${events.length === 1 ? 'activity' : 'activities'}. They’ll be included in your weekly email.`}
        </p>
        {events.length === 0 ? (
          <p className="mt-6">
            <Link href="/events" className="btn btn-primary">Find activities near me</Link>
          </p>
        ) : (
          <div className="mt-6 grid gap-4">
            {events.map((e) => (
              <EventCard key={e.id} event={e} savedIds={savedIds} loggedIn />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="digest-heading" className="card p-6">
        <h2 id="digest-heading" className="text-2xl font-extrabold">Your weekly email</h2>
        <p className="mt-2 text-muted">
          We’ll email you every Monday with activities near your ZIP code — including everything you’ve saved here.
        </p>
        <div className="mt-4 max-w-md">
          <DigestSignup defaultZip="02116" email={user.email} />
        </div>
      </section>
    </div>
  );
}
