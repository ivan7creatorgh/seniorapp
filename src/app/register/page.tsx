import type { Metadata } from 'next';
import RegisterForm from '@/components/RegisterForm';

export const metadata: Metadata = { title: 'Create a free account' };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-4xl font-extrabold">Create your free account</h1>
      <p className="mt-2 mb-6 text-xl text-muted">
        For seniors and families it’s free, forever. Organizations get a free trial, then $8/month.
      </p>
      <RegisterForm />
    </div>
  );
}
