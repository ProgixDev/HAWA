/** True once a real purchase provider (Google Play Billing / StoreKit /
 * RevenueCat) is wired into src/services/purchaseService.ts. It is the ONE
 * flag both the purchase service (real vs 'unavailable' outcomes) and the
 * Premium UI (actionable purchase CTA vs truthful "bientôt disponible" state)
 * read, so the two can never disagree. No provider exists today, so it is
 * `false`; flipping it to `true` (together with implementing the service's
 * TODO branches) is the entire integration surface — the subscription plan
 * data in premiumPricing.ts is preserved for that day. */
export const PURCHASE_PROVIDER_AVAILABLE = false;
