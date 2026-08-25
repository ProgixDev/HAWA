export type PremiumPlan = 'annual' | 'monthly';
// Requested display prices — intentionally identical for both plans
// (£99.99), never "corrected" to a different value because they happen to
// match. Replace with real Play Billing / StoreKit product prices once a
// purchase provider is connected (see purchaseService.ts) — this UI copy
// must then reflect the SDK's own localized price, not this hardcoded value.
export const PREMIUM_PRICING = {
  annual: {label: 'Abonnement annuel', detail: '12 mois', price: '99,99 £ / an'},
  monthly: {label: 'Abonnement mensuel', detail: 'Accès complet sans engagement', price: '99,99 £ / mois'},
} as const;
