'use client';

// Text-size + high-contrast controls. Preferences are stored in localStorage
// and applied to <html> data-attributes; the inline pre-paint script in
// layout.tsx applies them before first render to avoid flashing.
import { useEffect, useState } from 'react';

const SIZES = [
  { id: 'normal', label: 'Text: Normal', short: 'A' },
  { id: 'large', label: 'Text: Large', short: 'A+' },
  { id: 'xlarge', label: 'Text: Extra large', short: 'A++' },
] as const;

type SizeId = (typeof SIZES)[number]['id'];

export default function DisplayControls() {
  const [size, setSize] = useState<SizeId>('normal');
  const [contrast, setContrast] = useState<'normal' | 'high'>('normal');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSize((document.documentElement.getAttribute('data-text-size') as SizeId) || 'normal');
    setContrast((document.documentElement.getAttribute('data-contrast') as 'normal' | 'high') || 'normal');
    setReady(true);
  }, []);

  function applySize(next: SizeId) {
    setSize(next);
    document.documentElement.setAttribute('data-text-size', next);
    try { localStorage.setItem('al-text-size', next); } catch { /* ignore */ }
  }

  function applyContrast() {
    const next = contrast === 'high' ? 'normal' : 'high';
    setContrast(next);
    document.documentElement.setAttribute('data-contrast', next);
    try { localStorage.setItem('al-contrast', next); } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Display settings">
      <div className="flex items-center gap-1.5" role="group" aria-label="Text size">
        {SIZES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => applySize(s.id)}
            aria-pressed={ready && size === s.id}
            className={`btn btn-small ${ready && size === s.id ? 'btn-primary' : 'btn-secondary'}`}
            title={s.label}
          >
            <span aria-hidden="true" className="font-bold">{s.short}</span>
            <span className="sr-only">{s.label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={applyContrast}
        aria-pressed={ready && contrast === 'high'}
        className={`btn btn-small ${ready && contrast === 'high' ? 'btn-primary' : 'btn-secondary'}`}
      >
        High contrast
      </button>
    </div>
  );
}
