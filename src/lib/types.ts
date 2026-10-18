import type { CategoryId, MobilityId, OrgTypeId, PlanId } from './constants';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'senior' | 'provider' | 'admin';
  created_at: string;
}

export type SessionUser = Pick<User, 'id' | 'email' | 'full_name' | 'role'>;

export interface Organization {
  id: number;
  owner_user_id: number | null;
  name: string;
  org_type: OrgTypeId;
  description: string;
  website: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  plan: PlanId;
  plan_status: 'active' | 'canceled';
  trial_ends_at: string | null;
  created_at: string;
}

export interface EventRecord {
  id: number;
  org_id: number;
  title: string;
  description: string;
  category: CategoryId;
  /** Local wall time, format: YYYY-MM-DDTHH:MM */
  starts_at: string;
  /** Local wall time, format: YYYY-MM-DDTHH:MM (nullable) */
  ends_at: string | null;
  location_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  cost_type: 'free' | 'paid';
  cost_amount: number;
  mobility: MobilityId;
  transportation: boolean;
  seating: boolean;
  hearing_friendly: boolean;
  registration_required: boolean;
  contact_phone: string;
  external_url: string;
  status: 'pending' | 'published' | 'rejected' | 'cancelled';
  sponsored: boolean;
  created_at: string;
}

export interface EventWithOrg extends EventRecord {
  org_name: string;
  org_type: OrgTypeId;
  org_phone: string;
  org_website: string;
}

export interface EventFilters {
  zip?: string;
  /** YYYY-MM-DD */
  from?: string;
  /** YYYY-MM-DD (inclusive, end of day) */
  to?: string;
  categories?: CategoryId[];
  mobility?: MobilityId;
  freeOnly?: boolean;
  transportOnly?: boolean;
  seatingOnly?: boolean;
  hearingOnly?: boolean;
  q?: string;
  includeSponsoredFirst?: boolean;
  limit?: number;
}

export interface DigestSubscriber {
  id: number;
  email: string;
  zip: string;
  user_id: number | null;
  active: boolean;
  created_at: string;
  last_sent_at: string | null;
}
