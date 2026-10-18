// Fills organization-level details into any event field an organizer left blank,
// so a listing stays useful and contactable even when only the essentials were
// entered. Shared by creation and editing so the two paths never drift apart.
import type { EventInput } from './repos';
import type { Organization } from './types';

export function applyOrgDefaults(input: EventInput, org: Organization): EventInput {
  return {
    ...input,
    location_name: input.location_name || org.name,
    address: input.address || org.address,
    city: input.city || org.city,
    state: input.state || org.state,
    contact_phone: input.contact_phone || org.phone,
  };
}
