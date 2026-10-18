import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'How ' + SITE_NAME + ' is designed for older adults and people with visual, motor, or hearing needs.',
};

export default function AccessibilityPage() {
  return (
    <div className="prose-senior mx-auto max-w-3xl grid gap-8 text-lg">
      <h1 className="text-4xl font-extrabold">Our accessibility promise</h1>
      <p className="text-xl">
        {SITE_NAME} is built first for older adults — including people with low vision, arthritis, hearing loss,
        and limited mobility. If something here ever gets in your way, please <Link href="/help" className="font-bold text-brand">tell us</Link>.
      </p>

      <section>
        <h2 className="text-2xl font-extrabold">Designed for comfort</h2>
        <ul className="mt-3 grid list-disc gap-2 pl-6">
          <li><strong>Large text by default</strong> — 20px minimum, and a one-tap control in the header makes it
            Large or Extra large. Your choice is remembered on every page and every visit.</li>
          <li><strong>High-contrast mode</strong> — near-black background with bright text and yellow accents,
            one tap from any page.</li>
          <li><strong>Big buttons and touch targets</strong> — nothing smaller than 48 pixels, no tiny icon-only links.</li>
          <li><strong>Always-visible focus outline</strong> — keyboard users can always see where they are.</li>
          <li><strong>No hover-only menus, no carousels, no pop-ups, no auto-playing media.</strong></li>
          <li><strong>Respects “reduce motion”</strong> system settings.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-extrabold">Plain information about accessibility</h2>
        <ul className="mt-3 grid list-disc gap-2 pl-6">
          <li>Every event lists its access level: steps only, step-free, or fully wheelchair accessible.</li>
          <li>Organizations also tell us about seating, hearing-friendly setups, and whether they provide rides.</li>
          <li>Filter by “Getting around” on the <Link href="/events" className="font-bold text-brand">activities page</Link>,
            and we’ll only show events that fit how you get around.</li>
          <li>Every event page has a <strong>Print this page</strong> button that produces a clean, large-format sheet —
            handy for the refrigerator door or a purse.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-extrabold">Standards &amp; support</h2>
        <p>
          We aim to meet <strong>WCAG 2.1 Level AA</strong>. The site works with screen readers and keyboard-only
          navigation, and includes skip navigation, semantic headings, and labeled form fields.
        </p>
        <p>
          Need help using the site? Call us through the <Link href="/help" className="font-bold text-brand">help page</Link>,
          or ask a family member — the site is the same simple everywhere.
        </p>
      </section>
    </div>
  );
}
