'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ORG_TYPES, type OrgTypeId } from '@/lib/constants';
import type { Organization } from '@/lib/types';

export default function OrgForm({ org }: { org?: Organization }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: org?.name ?? '', org_type: (org?.org_type ?? 'senior_center') as OrgTypeId,
    description: org?.description ?? '', website: org?.website ?? '', phone: org?.phone ?? '',
    address: org?.address ?? '', city: org?.city ?? '', state: org?.state ?? '', zip: org?.zip ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof f>(key: K, value: string) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/organizations', {
        method: org ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      router.push('/dashboard?saved=org');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card grid gap-5 p-6" noValidate>
      <div>
        <label htmlFor="o-name" className="field-label">Organization name</label>
        <input id="o-name" required className="field" value={f.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div>
        <label htmlFor="o-type" className="field-label">Type of organization</label>
        <select id="o-type" className="field" value={f.org_type} onChange={(e) => set('org_type', e.target.value)}>
          {ORG_TYPES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="o-desc" className="field-label">Short description</label>
        <textarea id="o-desc" className="field" value={f.description} onChange={(e) => set('description', e.target.value)} />
        <span className="field-hint">Shown on your events and profile. One or two friendly sentences.</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="o-website" className="field-label">Website</label>
          <input id="o-website" type="url" className="field" value={f.website} onChange={(e) => set('website', e.target.value)}
            placeholder="https://…" />
        </div>
        <div>
          <label htmlFor="o-phone" className="field-label">Public phone number</label>
          <input id="o-phone" type="tel" className="field" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="o-address" className="field-label">Street address</label>
        <input id="o-address" className="field" value={f.address} onChange={(e) => set('address', e.target.value)} />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="o-city" className="field-label">City</label>
          <input id="o-city" className="field" value={f.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div>
          <label htmlFor="o-state" className="field-label">State</label>
          <input id="o-state" maxLength={2} className="field" value={f.state}
            onChange={(e) => set('state', e.target.value.toUpperCase())} />
        </div>
        <div>
          <label htmlFor="o-zip" className="field-label">ZIP code</label>
          <input id="o-zip" inputMode="numeric" maxLength={10} className="field" value={f.zip} onChange={(e) => set('zip', e.target.value)} />
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border-2 border-danger p-3 font-bold text-danger">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save organization'}</button>
        <a href="/dashboard" className="btn btn-secondary">Cancel</a>
      </div>
    </form>
  );
}
