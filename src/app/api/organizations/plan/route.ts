import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { assertSameOrigin, jsonError, jsonOk } from '@/lib/http';
import { getOrganizationForUser, setOrganizationPlan } from '@/lib/repos';
import { firstIssue, planSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return jsonError('Invalid request', 403);
  }
  const user = getCurrentUser();
  if (!user || (user.role !== 'provider' && user.role !== 'admin')) {
    return jsonError('Please sign in.', 401);
  }
  const org = getOrganizationForUser(user.id);
  if (!org) return jsonError('You don’t have an organization yet.', 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Please try again.', 400);
  }
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error));

  setOrganizationPlan(org.id, parsed.data.plan);
  return jsonOk({ plan: parsed.data.plan });
}
