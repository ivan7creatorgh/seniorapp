'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ORG_TYPES } from '@/lib/constants';

export default function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<'senior' | 'provider'>('senior');
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', zip: '',
    org_name: '', org_type: 'senior_center', phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create account');
      router.push(role === 'provider' ? '/dashboard' : '/events?welcome=1');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card grid gap-5 p-6" noValidate>
      <fieldset>
        <legend className="field-label text-lg">I am…</legend>
        <div className="mt-1 grid gap-2">
          <label className="flex items-center gap-3 text-lg" style={{ minHeight: 48 }}>
            <input type="radio" name="role" className="h-6 w-6 accent-[var(--color-brand)]"
              checked={role === 'senior'} onChange={() => setRole('senior')} />
            <span>Looking for activities for myself or a loved one <span className="text-muted">(always free)</span></span>
          </label>
          <label className="flex items-center gap-3 text-lg" style={{ minHeight: 48 }}>
            <input type="radio" name="role" className="h-6 w-6 accent-[var(--color-brand)]"
              checked={role === 'provider'} onChange={() => setRole('provider')} />
            <span>An organization listing events <span className="text-muted">($8/month after free trial)</span></span>
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="reg-name" className="field-label">Your full name</label>
        <input id="reg-name" required autoComplete="name" className="field" value={form.full_name}
          onChange={(e) => set('full_name', e.target.value)} />
      </div>
      <div>
        <label htmlFor="reg-email" className="field-label">Email address</label>
        <input id="reg-email" type="email" required autoComplete="email" className="field" value={form.email}
          onChange={(e) => set('email', e.target.value)} />
      </div>
      <div>
        <label htmlFor="reg-password" className="field-label">Choose a password</label>
        <input id="reg-password" type="password" required minLength={8} autoComplete="new-password" className="field"
          value={form.password} onChange={(e) => set('password', e.target.value)} />
        <span className="field-hint">At least 8 characters. Longer is better.</span>
      </div>
      <div>
        <label htmlFor="reg-zip" className="field-label">Your ZIP code</label>
        <input id="reg-zip" required inputMode="numeric" maxLength={10} className="field" value={form.zip}
          onChange={(e) => set('zip', e.target.value)} placeholder="e.g. 02116" />
        <span className="field-hint">Used to show activities near you.</span>
      </div>

      {role === 'provider' && (
        <div className="grid gap-4 rounded-xl border-2 border-line p-4">
          <p className="font-bold">About your organization</p>
          <div>
            <label htmlFor="reg-org" className="field-label">Organization name</label>
            <input id="reg-org" required className="field" value={form.org_name}
              onChange={(e) => set('org_name', e.target.value)} placeholder="e.g. Sunrise Senior Center" />
          </div>
          <div>
            <label htmlFor="reg-org-type" className="field-label">Type of organization</label>
            <select id="reg-org-type" className="field" value={form.org_type} onChange={(e) => set('org_type', e.target.value)}>
              {ORG_TYPES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="reg-phone" className="field-label">Public phone number</label>
            <input id="reg-phone" type="tel" className="field" value={form.phone}
              onChange={(e) => set('phone', e.target.value)} placeholder="(555) 555-0100" />
          </div>
        </div>
      )}

      {error && <p role="alert" className="rounded-lg border-2 border-danger p-3 font-bold text-danger">{error}</p>}

      <button type="submit" disabled={busy} className="btn btn-primary">
        {busy ? 'Creating your account…' : 'Create my free account'}
      </button>
      <p className="text-muted">
        Already have an account? <Link href="/login" className="font-bold text-brand">Sign in</Link>.
      </p>
    </form>
  );
}
