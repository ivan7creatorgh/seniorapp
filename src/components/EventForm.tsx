'use client';

// Submit / edit an event. Plain form state — no framework ceremony, big
// labeled fields, inline error messages.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CATEGORIES, MOBILITY_LEVELS, type CategoryId, type MobilityId } from '@/lib/constants';
import type { EventWithOrg } from '@/lib/types';

interface EventFormProps {
  orgId: number;
  orgPlan: string;
  /** Present when editing an existing event. */
  event?: EventWithOrg;
  defaults?: { city: string; state: string };
}

const EMPTY = {
  title: '', description: '', category: 'social' as CategoryId,
  starts_at: '', ends_at: '', location_name: '', address: '', city: '', state: '', zip: '',
  cost_type: 'free' as 'free' | 'paid', cost_amount: '', mobility: 'fully_mobile' as MobilityId,
  transportation: false, seating: true, hearing_friendly: false, registration_required: false,
  contact_phone: '', external_url: '', sponsored: false,
};

export default function EventForm({ orgId, orgPlan, event, defaults }: EventFormProps) {
  const router = useRouter();
  const [f, setF] = useState(() =>
    event
      ? {
          ...EMPTY,
          title: event.title, description: event.description, category: event.category,
          starts_at: event.starts_at, ends_at: event.ends_at ?? '', location_name: event.location_name,
          address: event.address, city: event.city, state: event.state, zip: event.zip,
          cost_type: event.cost_type, cost_amount: event.cost_amount ? String(event.cost_amount) : '',
          mobility: event.mobility, transportation: event.transportation, seating: event.seating,
          hearing_friendly: event.hearing_friendly, registration_required: event.registration_required,
          contact_phone: event.contact_phone, external_url: event.external_url, sponsored: event.sponsored,
        }
      : { ...EMPTY, city: defaults?.city ?? '', state: defaults?.state ?? '' }
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof f>(key: K, value: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...f,
      org_id: orgId,
      cost_amount: f.cost_type === 'paid' ? Number(f.cost_amount) || 0 : 0,
      ends_at: f.ends_at || null,
    };
    try {
      const res = await fetch(event ? `/api/events/${event.id}` : '/api/events', {
        method: event ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the event');
      router.push('/dashboard?saved=1');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the event');
      setBusy(false);
    }
  }

  const checkRow = (key: 'transportation' | 'seating' | 'hearing_friendly' | 'registration_required', label: string, hint?: string) => (
    <label className="flex items-start gap-3 text-lg" style={{ minHeight: 48 }}>
      <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-[var(--color-brand)]"
        checked={f[key]} onChange={(e) => set(key, e.target.checked)} />
      <span>
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </span>
    </label>
  );

  return (
    <form onSubmit={submit} className="card grid gap-5 p-6" noValidate>
      <div>
        <label htmlFor="e-title" className="field-label">Event title</label>
        <input id="e-title" required maxLength={120} className="field" value={f.title}
          onChange={(e) => set('title', e.target.value)} placeholder="e.g. Chair Yoga for Beginners" />
      </div>

      <div>
        <label htmlFor="e-description" className="field-label">Description</label>
        <textarea id="e-description" className="field" value={f.description} onChange={(e) => set('description', e.target.value)}
          placeholder="What happens? What should someone expect or bring?" />
        <span className="field-hint">Plain, friendly language works best.</span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="e-category" className="field-label">Category</label>
          <select id="e-category" className="field" value={f.category} onChange={(e) => set('category', e.target.value as CategoryId)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="e-mobility" className="field-label">Accessibility of the venue</label>
          <select id="e-mobility" className="field" value={f.mobility} onChange={(e) => set('mobility', e.target.value as MobilityId)}>
            {MOBILITY_LEVELS.map((m) => <option key={m.id} value={m.id}>{m.eventLabel}</option>)}
          </select>
          <span className="field-hint">Pick the highest level that honestly describes the space.</span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="e-start" className="field-label">Date and start time</label>
          <input id="e-start" type="datetime-local" required className="field" value={f.starts_at}
            onChange={(e) => set('starts_at', e.target.value)} />
        </div>
        <div>
          <label htmlFor="e-end" className="field-label">End time <span className="font-normal text-muted">(optional)</span></label>
          <input id="e-end" type="datetime-local" className="field" value={f.ends_at}
            onChange={(e) => set('ends_at', e.target.value)} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="e-location" className="field-label">Place name</label>
          <input id="e-location" className="field" value={f.location_name} onChange={(e) => set('location_name', e.target.value)}
            placeholder="e.g. Community Hall" />
        </div>
        <div>
          <label htmlFor="e-address" className="field-label">Street address</label>
          <input id="e-address" required className="field" value={f.address} onChange={(e) => set('address', e.target.value)}
            placeholder="e.g. 715 Tremont Street" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="e-city" className="field-label">City</label>
          <input id="e-city" required className="field" value={f.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div>
          <label htmlFor="e-state" className="field-label">State</label>
          <input id="e-state" required maxLength={2} className="field" value={f.state}
            onChange={(e) => set('state', e.target.value.toUpperCase())} placeholder="MA" />
        </div>
        <div>
          <label htmlFor="e-zip" className="field-label">ZIP code</label>
          <input id="e-zip" required inputMode="numeric" maxLength={10} className="field" value={f.zip}
            onChange={(e) => set('zip', e.target.value)} placeholder="02118" />
        </div>
      </div>

      <fieldset className="grid gap-3">
        <legend className="field-label">Cost</legend>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-lg" style={{ minHeight: 48 }}>
            <input type="radio" name="cost-type" className="h-6 w-6 accent-[var(--color-brand)]"
              checked={f.cost_type === 'free'} onChange={() => set('cost_type', 'free')} />
            Free
          </label>
          <label className="flex items-center gap-3 text-lg" style={{ minHeight: 48 }}>
            <input type="radio" name="cost-type" className="h-6 w-6 accent-[var(--color-brand)]"
              checked={f.cost_type === 'paid'} onChange={() => set('cost_type', 'paid')} />
            Costs money
          </label>
        </div>
        {f.cost_type === 'paid' && (
          <div className="max-w-xs">
            <label htmlFor="e-cost" className="field-label">Amount per person (USD)</label>
            <input id="e-cost" type="number" min="0" step="0.5" className="field" value={f.cost_amount}
              onChange={(e) => set('cost_amount', e.target.value)} placeholder="e.g. 3" />
          </div>
        )}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="field-label">Good to know</legend>
        {checkRow('transportation', 'We provide a ride or transportation', 'Include pickup details in the description.')}
        {checkRow('seating', 'There are places to sit throughout')}
        {checkRow('hearing_friendly', 'Hearing friendly (amplified, quiet, or subtitled)')}
        {checkRow('registration_required', 'People need to register ahead of time')}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="e-phone" className="field-label">Contact phone <span className="font-normal text-muted">(optional)</span></label>
          <input id="e-phone" type="tel" className="field" value={f.contact_phone}
            onChange={(e) => set('contact_phone', e.target.value)} placeholder="(617) 555-0140" />
        </div>
        <div>
          <label htmlFor="e-url" className="field-label">Link to more info <span className="font-normal text-muted">(optional)</span></label>
          <input id="e-url" type="url" className="field" value={f.external_url}
            onChange={(e) => set('external_url', e.target.value)} placeholder="https://…" />
        </div>
      </div>

      {orgPlan === 'sponsored' && (
        <label className="flex items-start gap-3 rounded-xl border-2 border-accent p-4 text-lg" style={{ minHeight: 48 }}>
          <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-[var(--color-brand)]"
            checked={f.sponsored} onChange={(e) => set('sponsored', e.target.checked)} />
          <span>
            Feature this event as a <strong>★ Sponsored placement</strong> — listed first in search results.
            <span className="field-hint">Included in your $15/month sponsored plan.</span>
          </span>
        </label>
      )}

      {error && <p role="alert" className="rounded-lg border-2 border-danger p-3 font-bold text-danger">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? 'Saving…' : event ? 'Save changes' : 'Submit for review'}
        </button>
        <a href="/dashboard" className="btn btn-secondary">Cancel</a>
      </div>
      <p className="text-muted">
        New and edited events are reviewed by our team before appearing — usually within one business day.
      </p>
    </form>
  );
}
