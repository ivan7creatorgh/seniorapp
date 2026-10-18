import { NextResponse } from 'next/server';
import { createSession, hashPassword } from '@/lib/auth';
import { assertSameOrigin, jsonError } from '@/lib/http';
import { createOrganization, createUser, findUserByEmail } from '@/lib/repos';
import { firstIssue, registerSchema } from '@/lib/validation';
import { ORG_TYPES, type OrgTypeId } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Something went wrong. Please try again.', 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Please try again.', 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error));
  const data = parsed.data;

  if (findUserByEmail(data.email)) {
    return jsonError('An account with that email already exists. Try signing in instead.', 409);
  }

  const user = createUser(data.email, hashPassword(data.password), data.full_name, data.role);

  if (data.role === 'provider') {
    const validType = ORG_TYPES.some((o) => o.id === data.org_type) ? data.org_type : 'other';
    createOrganization(user.id, {
      name: data.org_name,
      org_type: validType as OrgTypeId,
      description: '',
      website: '',
      phone: data.phone,
      address: '',
      city: '',
      state: '',
      zip: data.zip,
    });
  }

  createSession(user.id, { secure: new URL(request.url).protocol === 'https:' });
  return NextResponse.json({ ok: true, redirect: data.role === 'provider' ? '/dashboard' : '/events?welcome=1' });
}
