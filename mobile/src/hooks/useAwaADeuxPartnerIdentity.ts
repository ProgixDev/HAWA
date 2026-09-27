import {useAwaADeuxPartnerName} from './useAwaADeuxPartnerName';
import {useAwaADeuxPartnerProfile} from './useAwaADeuxPartnerProfile';

/**
 * THE single resolved partner identity name, shared by every partner-side screen that
 * shows "who I am" (PartnerProfileScreen's "Prénom" row, PartnerHomeScreen's greeting).
 * One rule, computed in exactly one place, so the two screens can never drift apart:
 *
 *  - once the partner has saved their OWN first name (useAwaADeuxPartnerProfile /
 *    awaADeuxPartnerProfileStore, edited from "Informations personnelles" → Prénom),
 *    THAT value always wins;
 *  - until then, the owner's original entry for her partner (useAwaADeuxPartnerName /
 *    awaADeuxPartnerStore, read-only from the partner's side) seeds the display, so a
 *    freshly-connected partner isn't greeted with nothing;
 *  - if neither is set, `hasName` is false — callers must render neutral wording, never
 *    an invented name.
 */
export function useAwaADeuxPartnerIdentity(): {name: string; hasName: boolean} {
  const {partnerName: ownerEnteredPartnerName} = useAwaADeuxPartnerName();
  const {firstName: partnerProfileFirstName} = useAwaADeuxPartnerProfile();
  const trimmedOwnerEnteredPartnerName = ownerEnteredPartnerName.trim();
  const trimmedPartnerProfileFirstName = partnerProfileFirstName.trim();
  const name = trimmedPartnerProfileFirstName || trimmedOwnerEnteredPartnerName;
  return {name, hasName: name.length > 0};
}
