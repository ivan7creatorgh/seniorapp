import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getEventWithOrg, getOrganization } from '@/lib/repos';
import EventForm from '@/components/EventForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Edit event' };

interface Props {
  params: { id: string };
}

export default async function EditEventPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) redirect(`/login?next=/dashboard/events/${params.id}/edit`);

  const id = Number(params.id);
  const event = Number.isInteger(id) ? getEventWithOrg(id) : undefined;
  if (!event) notFound();
  const org = getOrganization(event.org_id);
  if (!org) notFound();
  if (user.role !== 'admin' && org.owner_user_id !== user.id) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold">Edit event</h1>
      <p className="mt-2 mb-6 text-xl text-muted">
        Edits are reviewed by our team before going live again.
      </p>
      <EventForm orgId={org.id} orgPlan={org.plan} event={event} />
      <p className="mt-6">
        <Link href="/dashboard" className="btn btn-secondary">← Back to dashboard</Link>
      </p>
    </div>
  );
}
