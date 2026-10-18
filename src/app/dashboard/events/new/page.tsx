import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getOrganizationForUser } from '@/lib/repos';
import EventForm from '@/components/EventForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Submit a new event' };

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) redirect('/login?next=/dashboard/events/new');
  const org = getOrganizationForUser(user.id);
  if (!org) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold">Submit a new event</h1>
      <p className="mt-2 mb-6 text-xl text-muted">
        Posting for <strong>{org.name}</strong>. Fill in what you know — you can edit it later.
      </p>
      <EventForm orgId={org.id} orgPlan={org.plan} defaults={{ city: org.city, state: org.state }} />
      <p className="mt-6">
        <Link href="/dashboard" className="btn btn-secondary">← Back to dashboard</Link>
      </p>
    </div>
  );
}
