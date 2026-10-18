# Connecting real payments (Stripe)

Billing is intentionally stubbed so the entire plan flow works with no
credentials — the **Provider ($8/mo)** and **Sponsored ($15/mo)** buttons in the
provider dashboard switch plans instantly. To charge real cards:

## 1. Create products

In the Stripe dashboard, create two recurring prices:

| Product | Price | Interval |
| --- | --- | --- |
| Provider plan | $8.00 | month |
| Sponsored plan | $15.00 | month |

Note each price ID (`price_…`).

## 2. Add Checkout

```bash
npm install stripe
```

Add `STRIPE_SECRET_KEY` and the two price IDs to your environment, then create a
route handler (e.g. `src/app/api/billing/checkout/route.ts`) that creates a
Checkout Session:

```ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST { priceId }  →  { url } (redirect the browser to Stripe Checkout)
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=1`,
  cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  metadata: { orgId: String(orgId), plan },
});
```

Point `PlanButtons` (`src/components/PlanButtons.tsx`) at this route instead of
`/api/organizations/plan`.

## 3. Confirm with webhooks

Add `STRIPE_WEBHOOK_SECRET` and a webhook route (`/api/billing/webhook`) that
verifies `stripe.webhooks.constructEvent(...)`, then:

- `checkout.session.completed` → read `metadata.orgId` / `metadata.plan` and call `setOrganizationPlan(orgId, plan)`
- `customer.subscription.deleted` → call `setOrganizationPlan(orgId, 'trial')`

That’s the whole integration — the app already has plan states
(`trial` / `provider` / `sponsored`) and enforcement (trial caps at 3 published
events) in place.
