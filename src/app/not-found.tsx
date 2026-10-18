import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-2xl p-8 text-center">
      <h1 className="text-4xl font-extrabold">We couldn’t find that page</h1>
      <p className="mt-3 text-xl">
        The link may be old, or the activity may have ended. Let’s get you back to something useful.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/events" className="btn btn-primary">Browse activities</Link>
        <Link href="/" className="btn btn-secondary">Go to the home page</Link>
      </div>
    </div>
  );
}
