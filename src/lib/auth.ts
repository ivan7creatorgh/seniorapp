// Cookie sessions + password hashing. Sessions are random tokens; only their
// SHA-256 digest is stored. Cookies are httpOnly + SameSite=Lax.
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { getDb } from './db';
import type { SessionUser } from './types';

export const SESSION_COOKIE = 'active_local_session';
const SESSION_DAYS = 30;

interface SessionRow {
  user_id: number;
  email: string;
  full_name: string;
  role: SessionUser['role'];
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function createSession(userId: number, opts: { secure?: boolean } = {}): void {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const db = getDb();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256(token), userId, expires.toISOString());
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Only mark Secure on actual HTTPS — a production deploy behind plain HTTP
    // (or local testing with `next start`) would otherwise silently drop the cookie.
    secure: opts.secure ?? process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  });
}

export function destroySession(): void {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  }
  cookies().delete(SESSION_COOKIE);
}

export function getCurrentUser(): SessionUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT s.user_id, u.email, u.full_name, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       -- datetime() normalizes the stored ISO-8601 expiry so it compares
       -- correctly against SQLite's own "YYYY-MM-DD HH:MM:SS" UTC format.
       WHERE s.token_hash = ? AND datetime(s.expires_at) > datetime('now')`
    )
    .get(sha256(token)) as SessionRow | undefined;
  if (!row) return null;
  return { id: row.user_id, email: row.email, full_name: row.full_name, role: row.role };
}
