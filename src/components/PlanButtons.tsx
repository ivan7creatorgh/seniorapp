'use client';

// Plan upgrade/downgrade. Billing is intentionally stubbed — switching plans
// takes effect immediately so the whole flow is demoable without Stripe.
// See README → "Connecting Stripe" to charge real cards.
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PlanButtons({ currentPlan }: { currentPlan: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(plan: 'trial' | 'provider' | 'sponsored') {
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch('/api/organizations/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not change plan');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change plan');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {currentPlan !== 'provider' && (
          <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => choose('provider')}>
            {busy === 'provider' ? 'Switching…' : 'Choose Provider — $8/mo'}
          </button>
        )}
        {currentPlan !== 'sponsored' && (
          <button type="button" className={`btn ${currentPlan === 'provider' ? 'btn-primary' : 'btn-secondary'}`}
            disabled={busy !== null} onClick={() => choose('sponsored')}>
            {busy === 'sponsored' ? 'Switching…' : '★ Sponsored — $15/mo'}
          </button>
        )}
        {currentPlan !== 'trial' && (
          <button type="button" className="btn btn-secondary" disabled={busy !== null} onClick={() => choose('trial')}>
            {busy === 'trial' ? 'Switching…' : 'Back to free trial'}
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-3 font-bold text-danger">{error}</p>}
      <p className="mt-3 text-muted">
        Demo billing: plans switch instantly with no card required. Connect Stripe to take real payments
        (instructions in the README).
      </p>
    </div>
  );
}
