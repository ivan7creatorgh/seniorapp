'use client';

import { useState } from 'react';

export default function DigestSignup({ defaultZip = '', email = '' }: { defaultZip?: string; email?: string }) {
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('busy');
    setMessage('');
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/digest/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), zip: form.get('zip') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'done') {
    return (
      <p role="status" className="card p-4 font-semibold text-ink">
        ✓ You’re signed up! Every Monday you’ll get a friendly list of activities near your ZIP code.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 p-4" noValidate>
      <div>
        <label htmlFor="digest-email" className="field-label">Email address</label>
        <input id="digest-email" name="email" type="email" required className="field" defaultValue={email}
          placeholder="you@example.com" autoComplete="email" />
      </div>
      <div>
        <label htmlFor="digest-zip" className="field-label">ZIP code</label>
        <input id="digest-zip" name="zip" required className="field" defaultValue={defaultZip} inputMode="numeric"
          maxLength={10} placeholder="e.g. 02116" />
      </div>
      <button type="submit" disabled={status === 'busy'} className="btn btn-primary">
        {status === 'busy' ? 'Signing you up…' : 'Send me the weekly list'}
      </button>
      {status === 'error' && <p role="alert" className="font-semibold text-danger">{message}</p>}
    </form>
  );
}
