import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';
import DigestSignup from './DigestSignup';

export default function Footer() {
  return (
    <footer className="site-footer mt-14 border-t-2 border-line bg-paper">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          <section>
            <h2 className="text-2xl font-extrabold">Get a free weekly email</h2>
            <p className="mt-2 text-muted">
              Every Monday we send a simple list of activities near your ZIP code. Free, and you can cancel anytime.
            </p>
            <div className="mt-4">
              <DigestSignup defaultZip="02116" />
            </div>
          </section>
          <nav aria-label="Footer">
            <h2 className="text-2xl font-extrabold">Quick links</h2>
            <ul className="mt-3 grid gap-2 text-lg">
              <li><Link href="/events" className="text-brand font-semibold">Find activities near you</Link></li>
              <li><Link href="/providers" className="text-brand font-semibold">List your organization’s events ($8/mo)</Link></li>
              <li><Link href="/pricing" className="text-brand font-semibold">Pricing</Link></li>
              <li><Link href="/about" className="text-brand font-semibold">About {SITE_NAME}</Link></li>
              <li><Link href="/accessibility" className="text-brand font-semibold">Our accessibility promise</Link></li>
              <li><Link href="/help" className="text-brand font-semibold">Help &amp; contact</Link></li>
            </ul>
          </nav>
        </div>
        <p className="mt-10 border-t-2 border-line pt-6 text-muted">
          © {new Date().getFullYear()} {SITE_NAME}. Free for seniors and families, always. Organizations pay $8/month to
          list events; sponsored placement is $15/month.
        </p>
      </div>
    </footer>
  );
}
