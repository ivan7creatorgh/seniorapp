'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminDigestControls() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendNow() {
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch('/api/admin/digest', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send');
      setReport(
        `Sent ${data.sent} ${data.sent === 1 ? 'email' : 'emails'}: ` +
          data.files.map((f: { email: string; events: number; via: string }) => `${f.email} (${f.events} events, via ${f.via})`).join('; ')+
          (data.errors.length ? ` — errors: ${data.errors.join('; ')}` : '')
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={sendNow}>
        {busy ? 'Sending…' : 'Send the weekly digest now'}
      </button>
      {report && <p role="status" className="mt-3 rounded-lg border-2 border-success p-3 font-semibold">{report}</p>}
      {error && <p role="alert" className="mt-3 font-bold text-danger">{error}</p>}
    </div>
  );
}
