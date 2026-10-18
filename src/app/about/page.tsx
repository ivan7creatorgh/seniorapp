import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = { title: 'About us' };

export default function AboutPage() {
  return (
    <div className="prose-senior mx-auto max-w-3xl grid gap-8 text-lg">
      <h1 className="text-4xl font-extrabold">About {SITE_NAME}</h1>
      <p className="text-xl">
        {SITE_NAME} exists for a simple reason: too many older adults spend too many days at home, not because
        they want to, but because nobody told them what was happening three blocks away.
      </p>
      <p>
        The activities already exist — the chair yoga class, the Wednesday supper, the library’s large-print book
        club, the free tax help. But they’re scattered across half a dozen websites, Facebook pages, and paper
        flyers taped to community-center doors. Adult children spend hours searching on their parents’ behalf,
        and still can’t answer basic questions: Is it free? Is there a wheelchair ramp? Will someone give my
        mother a ride?
      </p>
      <p>
        {SITE_NAME} gathers everything onto one calm, large-text board — and every listing answers those
        questions before you pick up the phone.
      </p>
      <h2 className="text-2xl font-extrabold">Our promises</h2>
      <ul className="grid list-disc gap-2 pl-6">
        <li><strong>Free for seniors and families. Always.</strong> No premium tier, no upsells aimed at you.</li>
        <li><strong>Honest accessibility information.</strong> Every event says if it’s step-free, wheelchair
          accessible, has seating, or provides a ride.</li>
        <li><strong>No ads, no data selling.</strong> Your email is for your weekly list and nothing else.</li>
        <li><strong>Human-reviewed listings.</strong> A person reads every event before it appears.</li>
        <li><strong>Designed for older eyes.</strong> Large text, high contrast, and a one-tap text-size control.</li>
      </ul>
      <p>
        Questions or suggestions? Visit the <Link href="/help" className="font-bold text-brand">help page</Link> —
        we read every message.
      </p>
    </div>
  );
}
