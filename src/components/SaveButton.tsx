'use client';

// "Save to favorites" heart. Works without a full page reload; if the visitor
// isn't signed in we send them to the sign-in page and back again.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconHeart } from './icons';

export default function SaveButton({ eventId, initialSaved, loggedIn }: {
  eventId: number;
  initialSaved: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSaved(data.saved);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="no-print">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        className={`btn btn-small ${saved ? 'btn-primary' : 'btn-secondary'}`}
      >
        <IconHeart filled={saved} />
        {saved ? 'Saved to favorites' : 'Save to favorites'}
      </button>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}
