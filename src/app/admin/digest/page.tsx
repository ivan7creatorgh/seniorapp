import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { addDaysISO, todayISO } from '@/lib/format';
import { buildDigestEmail } from '@/lib/digest';
import { listDigestSubscribers, listEventsForDigest } from '@/lib/repos';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Digest preview' };

export default async function DigestPreviewPage({ searchParams }: { searchParams: { zip?: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/login?next=/admin/digest');

  const zips = Array.from(new Set(listDigestSubscribers().map((s) => s.zip))).sort();
  const zip = searchParams.zip && zips.includes(searchParams.zip) ? searchParams.zip : zips[0] ?? '02116';
  const from = todayISO();
  const to = addDaysISO(from, 7);
  const events = listEventsForDigest(zip, from, to);
  const email = buildDigestEmail({ zip, events, from, to });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Digest preview — {zip}</h1>
          <p className="mt-1 text-muted">Exactly what subscribers in {zip} would receive. Subject: “{email.subject}”</p>
        </div>
        <form method="get" action="/admin/digest" className="flex items-end gap-3">
          <div>
            <label htmlFor="zip-pick" className="field-label">ZIP code</label>
            <select id="zip-pick" name="zip" className="field" defaultValue={zip}>
              {zips.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary">Preview</button>
        </form>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b-2 border-line bg-canvas p-3 font-mono text-sm">
          Subject: {email.subject}
        </div>
        {/* The rendered email, exactly as it would appear in an inbox. */}
        <div dangerouslySetInnerHTML={{ __html: email.html }} />
      </div>

      <p>
        <Link href="/admin" className="btn btn-secondary">← Back to admin</Link>
      </p>
    </div>
  );
}
