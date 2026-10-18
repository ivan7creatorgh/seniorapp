import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Help & contact' };

export default function HelpPage() {
  return (
    <div className="grid gap-10">
      <header>
        <h1 className="text-4xl font-extrabold">Help &amp; contact</h1>
        <p className="mt-3 max-w-3xl text-xl">
          We keep this site simple on purpose. Here are the questions we hear most — if yours isn’t here,
          write to us and a person will answer.
        </p>
      </header>

      <section className="card p-6" aria-labelledby="help-browse">
        <h2 id="help-browse" className="text-2xl font-extrabold">Finding activities</h2>
        <dl className="mt-4 grid gap-5 text-lg">
          <div>
            <dt className="font-extrabold">How do I find activities near me?</dt>
            <dd className="mt-1">
              Type your ZIP code on the <Link href="/" className="font-bold text-brand">home page</Link> or the
              <Link href="/events" className="font-bold text-brand"> activities page</Link>. You can then filter by date,
              cost, category, and how you get around.
            </dd>
          </div>
          <div>
            <dt className="font-extrabold">What do “step-free” and “wheelchair accessible” mean?</dt>
            <dd className="mt-1">
              “Step-free” means no stairs at the entrance and places to sit nearby.
              “Wheelchair accessible” means a person can enter and move around in a wheelchair, including an
              accessible restroom.
            </dd>
          </div>
          <div>
            <dt className="font-extrabold">An event is wrong or canceled. What should I do?</dt>
            <dd className="mt-1">
              Call the contact number on the event — organizations keep their listings updated.
              You can also tell us using the contact details below.
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-6" aria-labelledby="help-account">
        <h2 id="help-account" className="text-2xl font-extrabold">Accounts &amp; the weekly email</h2>
        <dl className="mt-4 grid gap-5 text-lg">
          <div>
            <dt className="font-extrabold">Do I need an account?</dt>
            <dd className="mt-1">No. Browsing, filtering, and reading are open to everyone. An account (free) lets you
              save favorites and choose your weekly email ZIP code.</dd>
          </div>
          <div>
            <dt className="font-extrabold">How do I stop the weekly email?</dt>
            <dd className="mt-1">Click the “unsubscribe” link at the bottom of any digest, or
              <Link href="/favorites" className="font-bold text-brand"> update your preferences</Link>.</dd>
          </div>
          <div>
            <dt className="font-extrabold">I forgot my password.</dt>
            <dd className="mt-1">Password resets are coming soon. For now, email us and we’ll help you get back in.</dd>
          </div>
        </dl>
      </section>

      <section className="card p-6" aria-labelledby="help-providers">
        <h2 id="help-providers" className="text-2xl font-extrabold">For organizations</h2>
        <dl className="mt-4 grid gap-5 text-lg">
          <div>
            <dt className="font-extrabold">How do I list my organization’s events?</dt>
            <dd className="mt-1">
              <Link href="/register" className="font-bold text-brand">Create an organization account</Link>,
              then post events from your dashboard. The first 3 listings are free; the full plan is $8/month.
            </dd>
          </div>
          <div>
            <dt className="font-extrabold">When do my events go live?</dt>
            <dd className="mt-1">Our team reviews new listings, usually within one business day.</dd>
          </div>
        </dl>
      </section>

      <section className="card p-6">
        <h2 className="text-2xl font-extrabold">Contact us</h2>
        <p className="mt-3 text-lg">
          Email <a href="mailto:hello@activelocal.example" className="font-bold text-brand">hello@activelocal.example</a>{' '}
          or call <a href="tel:+16175550150" className="font-bold text-brand">(617) 555-0150</a>, weekdays 9–5.
          We read every message and answer within two business days.
        </p>
      </section>
    </div>
  );
}
