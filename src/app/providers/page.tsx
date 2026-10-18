import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For senior centers, libraries & community organizations',
  description: 'Post your events where local seniors and families will actually see them. $8/month, cancel anytime.',
};

export default function ProvidersPage() {
  return (
    <div className="grid gap-10">
      <header className="card p-6 sm:p-10">
        <h1 className="text-4xl font-extrabold leading-tight">
          Your events, in front of the neighbors who need them
        </h1>
        <p className="mt-4 max-w-3xl text-xl">
          Senior centers, libraries, churches, parks departments, and community groups post here in minutes.
          No phone calls, no forms in triplicate — just your events, with the details that matter
          (cost, wheelchair access, rides) front and center.
        </p>
        <p className="mt-6 flex flex-wrap gap-3">
          <Link href="/register" className="btn btn-primary text-xl">Start your free trial</Link>
          <Link href="/events" className="btn btn-secondary text-xl">See the board first</Link>
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="sr-only">How it works for organizations</h2>
        {[
          { n: 1, title: 'Create your organization page', body: 'Name, type, contact info, and a short description. Two minutes, once.' },
          { n: 2, title: 'Post your events yourself', body: 'Title, date, place, cost, and accessibility. Edit or replace them anytime.' },
          { n: 3, title: 'Reach seniors every week', body: 'Your events appear in search and in Monday-morning emails to nearby seniors.' },
        ].map((s) => (
          <div key={s.n} className="card p-6">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-2xl font-extrabold text-white">{s.n}</span>
            <h3 className="mt-3 text-xl font-extrabold">{s.title}</h3>
            <p className="mt-2 text-muted">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="card p-6 sm:p-10">
        <h2 className="text-3xl font-extrabold">What it costs</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-2xl font-extrabold">$8 / month</p>
            <p className="mt-1">Unlimited event listings, your organization profile, and edits anytime.
              Start with a free trial — 3 listings, no card required.</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold">★ $15 / month</p>
            <p className="mt-1">Everything above, plus sponsored placement: your events carry a ★ badge and
              appear first in search. Perfect for local businesses and busy centers.</p>
          </div>
        </div>
        <p className="mt-6">
          <Link href="/register" className="btn btn-primary">Create your organization account</Link>
        </p>
      </section>

      <section className="card p-6 sm:p-10">
        <h2 className="text-2xl font-extrabold">Questions organizations ask</h2>
        <dl className="mt-4 grid gap-5 text-lg">
          <div>
            <dt className="font-extrabold">Who reviews my events?</dt>
            <dd className="mt-1">Our team reviews each listing before it goes live — usually within one business day.
              This keeps the board trustworthy for older adults and families.</dd>
          </div>
          <div>
            <dt className="font-extrabold">Can I fix a mistake after publishing?</dt>
            <dd className="mt-1">Yes. Open the event in your dashboard, edit, and save. It goes back through a quick review.</dd>
          </div>
          <div>
            <dt className="font-extrabold">Do you pull events from our website automatically?</dt>
            <dd className="mt-1">Manual entry today; public library and parks API imports are on the roadmap
              (see the README in this project for the integration point).</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
