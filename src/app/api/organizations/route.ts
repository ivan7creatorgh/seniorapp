import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { assertSameOrigin, jsonError, jsonOk } from '@/lib/http';
import { createOrganization, getOrganizationForUser, updateOrganization } from '@/lib/repos';
import { firstIssue, orgSchema } from '@/lib/validation';

/** Create (POST) or update (PATCH) the signed-in provider's organization. */
export async function POST(request: Request) {
  return handle(request, 'create');
}
export async function PATCH(request: Request) {
  return handle(request, 'update');
}

async function handle(request: Request, mode: 'create' | 'update') {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Invalid request', 403);
  }
  const user = getCurrentUser();
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) {
    return jsonError('Please sign in as an organization.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Please try again.', 400);
  }
  const parsed = orgSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error));
  const data = parsed.data;

  const existing = getOrganizationForUser(user.id);
  if (mode === 'update') {
    if (!existing) return jsonError('You don’t have an organization yet.', 404);
    updateOrganization(existing.id, data);
    return jsonOk({ id: existing.id });
  }
  if (existing) return jsonError('You already have an organization. Use Edit instead.', 409);
  const org = createOrganization(user.id, data);
  return jsonOk({ id: org.id });
}
