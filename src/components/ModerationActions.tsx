'use client';

// Admin moderation: approve or reject a pending event.
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ModerationActions({ eventId }: { eventId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'approve' | 'reject') {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-small btn-primary" disabled={busy !== null} onClick={() => act('approve')}>
          {busy === 'approve' ? 'Publishing…' : 'Approve & publish'}
        </button>
        <button type="button" className="btn btn-small btn-danger" disabled={busy !== null} onClick={() => act('reject')}>
          {busy === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 font-bold text-danger">{error}</p>}
    </div>
  );
}
