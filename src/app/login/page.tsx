import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-4xl font-extrabold">Sign in</h1>
      <p className="mt-2 mb-6 text-xl text-muted">
        Sign in to save favorites and manage your weekly email.
      </p>
      <Suspense fallback={<p className="text-xl">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
