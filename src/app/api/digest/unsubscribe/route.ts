import { NextResponse } from 'next/server';
import { deactivateDigestSubscriber } from '@/lib/repos';
import { SITE_NAME } from '@/lib/constants';

/** One-click unsubscribe link used in digest emails. */
export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email') ?? '';
  if (email) deactivateDigestSubscriber(email);

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unsubscribed — ${SITE_NAME}</title>
<style>body{font-family:Verdana,Geneva,sans-serif;background:#f2efe8;color:#16213a;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;}
main{background:#fff;border:2px solid #16213a;border-radius:14px;max-width:560px;padding:32px;text-align:center;}
h1{font-size:26px;margin:0 0 12px;}p{font-size:18px;line-height:1.6;}a{color:#0f5c8c;font-weight:bold;}</style></head>
<body><main>
<h1>You’ve been unsubscribed</h1>
<p>You won’t receive any more weekly emails from ${SITE_NAME}. We’re sorry to see you go.</p>
<p><a href="/">Back to the activity board</a></p>
</main></body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
