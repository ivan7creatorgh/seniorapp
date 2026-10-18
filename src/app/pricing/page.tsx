import type { Metadata } from 'next';
import Link from 'next/link';
import { PLANS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Free for seniors and families. Organizations list events for $8/month; sponsored placement is $15/month.',
};

export default function PricingPage() {
  return (
    <div className="grid gap-10">
      <header>
        <h1 className="text-4xl font-extrabold">Simple, honest pricing</h1>
        <p className="mt-3 max-w-3xl text-xl">
          The activity board is and always will be free for seniors and families. Organizations pay a small
          monthly fee to keep their listings accurate and visible.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Seniors */}
        <section className="card p-6" aria-labelledby="plan-senior">
          <h2 id="plan-senior" className="text-2xl font-extrabold">{PLANS.senior.name}</h2>
          <p className="mt-2 text-3xl font-extrabold">{PLANS.senior.priceLabel}</p>
          <ul className="mt-4 grid gap-2 text-lg">
            {PLANS.senior.features.map((f) => <li key={f}>✓ {f}</li>)}
          </ul>
          <p className="mt-6">
            <Link href="/events" className="btn btn-primary w-full">Find activities</Link>
          </p>
        </section>

        {/* Provider */}
        <section className="card border-brand p-6" aria-labelledby="plan-provider">
          <p className="inline-block rounded-full border-2 border-brand px-3 py-1 text-sm font-bold text-brand">Most popular</p>
          <h2 id="plan-provider" className="mt-2 text-2xl font-extrabold">{PLANS.provider.name} — for organizations</h2>
          <p className="mt-2 text-3xl font-extrabold">$8 <span className="text-lg font-normal text-muted">/ month</span></p>
          <ul className="mt-4 grid gap-2 text-lg">
            {PLANS.provider.features.map((f) => <li key={f}>✓ {f}</li>)}
          </ul>
          <p className="mt-6">
            <Link href="/register" className="btn btn-primary w-full">Start your free trial</Link>
          </p>
          <p className="mt-2 text-center text-muted">First 3 listings free, no card needed.</p>
        </section>

        {/* Sponsored */}
        <section className="card p-6" aria-labelledby="plan-sponsored">
          <h2 id="plan-sponsored" className="text-2xl font-extrabold">★ {PLANS.sponsored.name}</h2>
          <p className="mt-2 text-3xl font-extrabold">$15 <span className="text-lg font-normal text-muted">/ month</span></p>
          <ul className="mt-4 grid gap-2 text-lg">
            {PLANS.sponsored.features.map((f) => <li key={f}>✓ {f}</li>)}
          </ul>
          <p className="mt-6">
            <Link href="/register" className="btn btn-secondary w-full">Get sponsored placement</Link>
          </p>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="text-2xl font-extrabold">Common questions</h2>
        <dl className="mt-4 grid gap-5 text-lg">
          <div>
            <dt className="font-extrabold">Why do organizations pay when seniors don’t?</dt>
            <dd className="mt-1">
              Because keeping isolated older adults connected shouldn’t come with a paywall. Organizations have
              small budgets and real costs; $8/month covers hosting, emails, and keeping the service ad-free.
            </dd>
          </div>
          <div>
            <dt className="font-extrabold">Can I cancel anytime?</dt>
            <dd className="mt-1">Yes — one click in your dashboard. Your listings stay up until the end of the paid period.</dd>
          </div>
          <div>
            <dt className="font-extrabold">Are the sponsored listings ads?</dt>
            <dd className="mt-1">
              They’re regular community events like everything else — just marked with a ★ and shown first,
              so the organization reaches more neighbors.
            </dd>
          </div>
          <div>
            <dt className="font-extrabold">Is my information sold or shared?</dt>
            <dd className="mt-1">Never. We don’t run ads, and we don’t sell or share personal information.</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
