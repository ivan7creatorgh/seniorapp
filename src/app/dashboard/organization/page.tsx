import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getOrganizationForUser } from '@/lib/repos';
import OrgForm from '@/components/OrgForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Edit organization' };

export default async function EditOrgPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) redirect('/login?next=/dashboard/organization');
  const org = getOrganizationForUser(user.id);
  if (!org) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold">Your organization</h1>
      <p className="mt-2 mb-6 text-xl text-muted">This information appears on all of your events.</p>
      <OrgForm org={org} />
    </div>
  );
}
