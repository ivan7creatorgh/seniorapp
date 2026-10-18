import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { SITE_NAME } from '@/lib/constants';
import DisplayControls from './DisplayControls';

export default async function Header() {
  const user = await getCurrentUser();
  const isProviderArea = user?.role === 'provider' || user?.role === 'admin';

  return (
    <header className="site-header bg-paper border-b-2 border-line">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 no-underline text-ink">
            <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white text-2xl font-bold">A</span>
            <span>
              <span className="block text-xl font-extrabold leading-tight">{SITE_NAME}</span>
              <span className="block text-sm text-muted leading-tight">Free activities for seniors</span>
            </span>
          </Link>
          <nav aria-label="Your account">
            <ul className="flex flex-wrap items-center gap-2 text-base">
              {user ? (
                <>
                  <li>
                    <Link href="/favorites" className="chip-link">My favorites</Link>
                  </li>
                  {isProviderArea && (
                    <li><Link href="/dashboard" className="chip-link">Provider dashboard</Link></li>
                  )}
                  {user.role === 'admin' && (
                    <li><Link href="/admin" className="chip-link">Admin</Link></li>
                  )}
                  <li>
                    <form action="/api/auth/logout" method="post">
                      <button type="submit" className="btn btn-small btn-secondary">
                        Sign out ({user.full_name.split(' ')[0]})
                      </button>
                    </form>
                  </li>
                </>
              ) : (
                <>
                  <li><Link href="/login" className="chip-link">Sign in</Link></li>
                  <li><Link href="/register" className="btn btn-small btn-primary">Create free account</Link></li>
                </>
              )}
            </ul>
          </nav>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t-2 border-line pt-3">
          <nav aria-label="Main">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg font-semibold">
              <li><Link href="/events" className="text-ink hover:text-brand no-underline">Find activities</Link></li>
              <li><Link href="/pricing" className="text-ink hover:text-brand no-underline">Pricing</Link></li>
              <li><Link href="/providers" className="text-ink hover:text-brand no-underline">For organizations</Link></li>
              <li><Link href="/help" className="text-ink hover:text-brand no-underline">Help</Link></li>
              <li><Link href="/accessibility" className="text-ink hover:text-brand no-underline">Accessibility</Link></li>
            </ul>
          </nav>
          <DisplayControls />
        </div>
      </div>
    </header>
  );
}
