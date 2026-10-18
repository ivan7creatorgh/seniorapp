// Shared constants: categories, accessibility levels, plans, demo zips.

export const SITE_NAME = 'Active Local';
export const SITE_TAGLINE = 'Free local activities for seniors — all in one place.';

export const CATEGORIES = [
  { id: 'exercise', label: 'Exercise & Fitness', blurb: 'Chair yoga, walking clubs, gentle stretching' },
  { id: 'social', label: 'Social & Community', blurb: 'Coffee hours, card games, dances, meetups' },
  { id: 'meals', label: 'Meals & Nutrition', blurb: 'Community lunches, potlucks, cooking classes' },
  { id: 'arts', label: 'Arts & Crafts', blurb: 'Painting, knitting, music, writing groups' },
  { id: 'educational', label: 'Learning & Tech Help', blurb: 'Library talks, phone & computer classes' },
  { id: 'outdoor', label: 'Outdoors & Gardens', blurb: 'Garden clubs, bird walks, park events' },
  { id: 'support', label: 'Support & Wellness', blurb: 'Health screenings, caregiver support, benefits help' },
] as const;

export const CATEGORY_IDS = [
  'exercise', 'social', 'meals', 'arts', 'educational', 'outdoor', 'support',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

// Mobility: describes the highest level of venue accessibility an event supports.
//   fully_mobile — steps only, no special access needed
//   walker       — step-free access, wide aisles, nearby seating
//   wheelchair   — fully wheelchair accessible (also fine for walker/steady walkers)
export const MOBILITY_LEVELS = [
  {
    id: 'fully_mobile',
    label: 'I walk fully on my own',
    eventLabel: 'Steps only',
    blurb: 'I can handle stairs and don’t need special access.',
  },
  {
    id: 'walker',
    label: 'I use a walker or cane',
    eventLabel: 'Step-free',
    blurb: 'I need step-free entry and places to sit nearby.',
  },
  {
    id: 'wheelchair',
    label: 'I use a wheelchair',
    eventLabel: 'Wheelchair accessible',
    blurb: 'I need a fully wheelchair-accessible venue.',
  },
] as const;

export type MobilityId = (typeof MOBILITY_LEVELS)[number]['id'];

export const MOBILITY_IDS = ['fully_mobile', 'walker', 'wheelchair'] as const;

// An event with accessibility level X can be enjoyed by a person whose need is <= X.
export const MOBILITY_RANK: Record<MobilityId, number> = {
  fully_mobile: 0,
  walker: 1,
  wheelchair: 2,
};

export function mobilityLabel(id: string): string {
  return MOBILITY_LEVELS.find((m) => m.id === id)?.eventLabel ?? id;
}

export const ORG_TYPES = [
  { id: 'senior_center', label: 'Senior center' },
  { id: 'library', label: 'Public library' },
  { id: 'church', label: 'Church or faith community' },
  { id: 'parks_recreation', label: 'Parks & recreation department' },
  { id: 'community_org', label: 'Community nonprofit' },
  { id: 'other', label: 'Other organization' },
] as const;

export type OrgTypeId = (typeof ORG_TYPES)[number]['id'];

export function orgTypeLabel(id: string): string {
  return ORG_TYPES.find((o) => o.id === id)?.label ?? id;
}

// Billing plans. Payments are stubbed — see README "Connecting Stripe".
export const PLANS = {
  senior: {
    id: 'senior',
    name: 'For seniors & families',
    price: 0,
    priceLabel: 'Free, forever',
    features: [
      'Browse every activity near you',
      'Filter by mobility, cost & transportation',
      'Save favorites',
      'Weekly “what’s on” email',
      'No ads, ever',
    ],
  },
  trial: {
    id: 'trial',
    name: 'Free trial listing',
    price: 0,
    priceLabel: 'Free trial',
    features: ['Up to 3 published events', 'Organization profile page', 'Upgrade anytime'],
  },
  provider: {
    id: 'provider',
    name: 'Provider plan',
    price: 8,
    priceLabel: '$8 / month',
    features: [
      'Unlimited event listings',
      'Organization profile page',
      'Edit or replace events anytime',
      'Appears in search & weekly digests',
      'Cancel anytime',
    ],
  },
  sponsored: {
    id: 'sponsored',
    name: 'Sponsored plan',
    price: 15,
    priceLabel: '$15 / month',
    features: [
      'Everything in the Provider plan',
      '★ Sponsored badge on your events',
      'Your events listed first in search',
      'Local business & organization welcome',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const DATE_RANGES = [
  { id: 'any', label: 'Any date' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week (7 days)' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'month', label: 'This month (30 days)' },
] as const;

export type DateRangeId = (typeof DATE_RANGES)[number]['id'];

// Zip codes used by the demo seed data.
export const DEMO_ZIP = '02116';
export const DEMO_ZIPS = ['02116', '02118', '02115', '02135', '02446'];
