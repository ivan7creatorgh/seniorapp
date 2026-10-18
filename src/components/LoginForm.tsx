'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const DEMO_ACCOUNTS = [
  { role: 'I’m looking for activities', email: 'margaret@example.com', password: 'senior123' },
  { role: 'I represent an organization', email: 'provider@example.com', password: 'provider123' },
  { role: 'Site administrator', email: 'admin@example.com', password: 'admin123' },
];

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/events';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not sign in');
      router.push(data.redirect || next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={submit} className="card grid gap-4 p-6" noValidate>
        <div>
          <label htmlFor="login-email" className="field-label">Email address</label>
          <input id="login-email" type="email" required autoComplete="email" className="field"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="login-password" className="field-label">Password</label>
          <input id="login-password" type="password" required autoComplete="current-password" className="field"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && (
          <p role="alert" className="rounded-lg border-2 border-danger p-3 font-bold text-danger">{error}</p>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-muted">
          New here? <Link href="/register" className="font-bold text-brand">Create a free account</Link> — it takes a minute.
        </p>
      </form>

      <section className="card p-6" aria-labelledby="demo-accounts-heading">
        <h2 id="demo-accounts-heading" className="text-xl font-extrabold">Try the demo accounts</h2>
        <p className="mt-2 text-muted">This is a fully working demo — click any button to sign in instantly.</p>
        <ul className="mt-4 grid gap-3">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                className="btn btn-secondary w-full justify-start"
                onClick={() => { setEmail(a.email); setPassword(a.password); }}
              >
                {a.role}
                <span className="text-sm font-normal text-muted">({a.email})</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
