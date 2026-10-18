// Email delivery adapter. With RESEND_API_KEY set, sends via the Resend HTTP
// API (using node:https, so no SDK and no Node-18+ fetch requirement).
// Without a key, every email is written to var/outbox/ — the digest stays fully
// demo-able locally, and nothing ever silently disappears.
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { SITE_NAME } from './constants';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  delivered: 'resend' | 'outbox';
  detail: string;
}

const FROM_DEFAULT = 'Active Local <onboarding@resend.dev>';

export function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return Promise.resolve(writeToOutbox(message));
  return sendViaResend(apiKey, message);
}

function writeToOutbox(message: EmailMessage): SendResult {
  const dir = path.join(process.cwd(), 'var', 'outbox');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTo = message.to.replace(/[^a-z0-9@._-]/gi, '_');
  const file = path.join(dir, `${stamp}_${safeTo}.html`);
  const fullHtml = `<!-- Subject: ${message.subject} -->\n<!-- To: ${message.to} -->\n${message.html}`;
  fs.writeFileSync(file, fullHtml, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`[email] No RESEND_API_KEY set — saved to ${file}`);
  return { delivered: 'outbox', detail: file };
}

function sendViaResend(apiKey: string, message: EmailMessage): Promise<SendResult> {
  const payload = JSON.stringify({
    from: process.env.EMAIL_FROM || FROM_DEFAULT,
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 20_000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ delivered: 'resend', detail: body });
          } else {
            reject(new Error(`Resend API error ${res.statusCode}: ${body.slice(0, 300)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Resend API request timed out')));
    req.write(payload);
    req.end();
  });
}

/** Inline-styled, senior-friendly email shell used by every email we send. */
export function emailShell(opts: { heading: string; bodyHtml: string; footerNote?: string }): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f2efe8;font-family:Verdana, Geneva, sans-serif;color:#16213a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2efe8;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:2px solid #16213a;border-radius:14px;">
        <tr><td style="padding:24px 28px 8px 28px;">
          <div style="font-size:22px;font-weight:bold;color:#0f5c8c;">${SITE_NAME}</div>
          <h1 style="margin:12px 0 0 0;font-size:26px;line-height:1.3;">${opts.heading}</h1>
        </td></tr>
        <tr><td style="padding:8px 28px 24px 28px;font-size:17px;line-height:1.6;">
          ${opts.bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 28px 24px 28px;border-top:1px solid #d8d2c4;font-size:14px;color:#4a5568;">
          ${opts.footerNote ?? `You’re receiving this because you asked for a weekly list of activities near you. You can <a href="#" style="color:#0f5c8c;">unsubscribe at any time</a>.`}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
