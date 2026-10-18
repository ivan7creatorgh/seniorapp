// The browse filters. Rendered as a plain GET form — it works with JavaScript
// disabled, and every control is a large, labeled native input.
import { CATEGORIES, DATE_RANGES, MOBILITY_LEVELS, type CategoryId, type DateRangeId, type MobilityId } from '@/lib/constants';

export interface FilterValues {
  zip?: string;
  range?: DateRangeId;
  cats?: CategoryId[];
  mobility?: MobilityId;
  free?: boolean;
  transport?: boolean;
  seating?: boolean;
  hearing?: boolean;
  q?: string;
}

export function filtersToQueryString(f: FilterValues): string {
  const params = new URLSearchParams();
  if (f.zip) params.set('zip', f.zip);
  if (f.range && f.range !== 'any') params.set('range', f.range);
  if (f.cats && f.cats.length) params.set('cats', f.cats.join(','));
  if (f.mobility && f.mobility !== 'fully_mobile') params.set('mobility', f.mobility);
  if (f.free) params.set('free', '1');
  if (f.transport) params.set('transport', '1');
  if (f.seating) params.set('seating', '1');
  if (f.hearing) params.set('hearing', '1');
  if (f.q) params.set('q', f.q);
  const s = params.toString();
  return s ? `?${s}` : '';
}

export default function FilterPanel({ values }: { values: FilterValues }) {
  const v = values;
  return (
    <form method="get" action="/events" className="card p-5" aria-label="Filter activities">
      <h2 className="text-2xl font-extrabold">Narrow it down</h2>

      <div className="mt-5 grid gap-5">
        <div>
          <label htmlFor="f-zip" className="field-label">ZIP code</label>
          <input
            id="f-zip" name="zip" className="field" inputMode="numeric" maxLength={10}
            defaultValue={v.zip ?? ''} placeholder="e.g. 02116"
          />
        </div>

        <div>
          <label htmlFor="f-range" className="field-label">When</label>
          <select id="f-range" name="range" className="field" defaultValue={v.range ?? 'any'}>
            {DATE_RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>

        <fieldset>
          <legend className="field-label">What are you in the mood for? (choose any)</legend>
          <div className="mt-1 grid gap-2">
            {CATEGORIES.map((c) => (
              <label key={c.id} className="flex items-center gap-3 text-lg" style={{ minHeight: 44 }}>
                <input
                  type="checkbox" name="cats" value={c.id} className="h-6 w-6 shrink-0 accent-[var(--color-brand)]"
                  defaultChecked={v.cats?.includes(c.id)}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="f-mobility" className="field-label">Getting around</label>
          <select id="f-mobility" name="mobility" className="field" defaultValue={v.mobility ?? 'fully_mobile'}>
            {MOBILITY_LEVELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <span className="field-hint">We’ll only show events that match how you get around.</span>
        </div>

        <fieldset>
          <legend className="field-label">Must-haves</legend>
          <div className="mt-1 grid gap-2">
            <label className="flex items-center gap-3 text-lg" style={{ minHeight: 44 }}>
              <input type="checkbox" name="free" value="1" className="h-6 w-6 shrink-0 accent-[var(--color-brand)]" defaultChecked={v.free} />
              <span>Free events only</span>
            </label>
            <label className="flex items-center gap-3 text-lg" style={{ minHeight: 44 }}>
              <input type="checkbox" name="transport" value="1" className="h-6 w-6 shrink-0 accent-[var(--color-brand)]" defaultChecked={v.transport} />
              <span>Provides a ride / transportation</span>
            </label>
            <label className="flex items-center gap-3 text-lg" style={{ minHeight: 44 }}>
              <input type="checkbox" name="seating" value="1" className="h-6 w-6 shrink-0 accent-[var(--color-brand)]" defaultChecked={v.seating} />
              <span>Places to sit</span>
            </label>
            <label className="flex items-center gap-3 text-lg" style={{ minHeight: 44 }}>
              <input type="checkbox" name="hearing" value="1" className="h-6 w-6 shrink-0 accent-[var(--color-brand)]" defaultChecked={v.hearing} />
              <span>Hearing friendly (amplified / quiet)</span>
            </label>
          </div>
        </fieldset>

        <div>
          <label htmlFor="f-q" className="field-label">Search by word</label>
          <input id="f-q" name="q" className="field" defaultValue={v.q ?? ''} placeholder="e.g. yoga, bingo, lunch" />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary">Show activities</button>
          <a href="/events" className="btn btn-secondary">Clear all</a>
        </div>
      </div>
    </form>
  );
}
