// Zod schemas for every mutating endpoint.
import { z } from 'zod';
import { CATEGORY_IDS, MOBILITY_IDS } from './constants';

export const zipRegex = /^\d{5}(-\d{4})?$/;
export const wallTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const boolish = z
  .union([z.boolean(), z.number().int().min(0).max(1), z.enum(['on', '0', '1'])])
  .transform((v) => v === true || v === 1 || v === 'on' || v === '1');

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

export const registerSchema = z
  .object({
    role: z.enum(['senior', 'provider']),
    full_name: z.string().trim().min(2, 'Please enter your full name.').max(100),
    email: z.string().trim().email('Please enter a valid email address.'),
    password: z.string().min(8, 'Please choose a password with at least 8 characters.'),
    zip: z.string().trim().regex(zipRegex, 'Please enter a 5-digit ZIP code.'),
    org_name: z.string().trim().max(120).optional().default(''),
    org_type: z.string().trim().optional().default('senior_center'),
    phone: z.string().trim().max(30).optional().default(''),
  })
  .refine((d) => d.role === 'senior' || d.org_name.length >= 2, {
    message: 'Please enter your organization’s name.',
    path: ['org_name'],
  });

export const eventSchema = z.object({
  org_id: z.number().int().positive(),
  title: z.string().trim().min(4, 'Please give the event a clear title (at least 4 characters).').max(120),
  description: z.string().trim().max(4000).optional().default(''),
  category: z.enum(CATEGORY_IDS),
  starts_at: z.string().regex(wallTimeRegex, 'Please choose a valid date and time.'),
  ends_at: z.string().regex(wallTimeRegex).nullable().optional().default(null),
  location_name: z.string().trim().max(160).optional().default(''),
  address: z.string().trim().max(200, 'Please keep the address under 200 characters.').optional().default(''),
  city: z.string().trim().max(100).optional().default(''),
  state: z.string().trim().max(2).optional().default(''),
  zip: z.string().trim().regex(zipRegex, 'Please enter a 5-digit ZIP code.'),
  cost_type: z.enum(['free', 'paid']).default('free'),
  cost_amount: z.number().min(0).max(1000).default(0),
  mobility: z.enum(MOBILITY_IDS).default('fully_mobile'),
  transportation: boolish.default(false),
  seating: boolish.default(false),
  hearing_friendly: boolish.default(false),
  registration_required: boolish.default(false),
  contact_phone: z.string().trim().max(30).optional().default(''),
  external_url: z.string().trim().url('Please enter a full link starting with http.').or(z.literal('')).optional().default(''),
  sponsored: boolish.default(false),
});

export const orgSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your organization’s name.').max(120),
  org_type: z.enum(['senior_center', 'library', 'church', 'parks_recreation', 'community_org', 'other']),
  description: z.string().trim().max(2000).optional().default(''),
  website: z.string().trim().url('Please enter a full link starting with http.').or(z.literal('')).optional().default(''),
  phone: z.string().trim().max(30).optional().default(''),
  address: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().max(100).optional().default(''),
  state: z.string().trim().max(2).optional().default(''),
  zip: z.string().trim().regex(zipRegex, 'Please enter a 5-digit ZIP code.').or(z.literal('')).optional().default(''),
});

export const planSchema = z.object({
  plan: z.enum(['trial', 'provider', 'sponsored']),
});

export const digestSubscribeSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  zip: z.string().trim().regex(zipRegex, 'Please enter a 5-digit ZIP code.'),
});

export const moderationSchema = z.object({
  event_id: z.number().int().positive(),
  action: z.enum(['approve', 'reject']),
});

/** Pull the first validation issue into a human sentence. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? issue.message : 'Please check the form and try again.';
}
