export type PremiumPlan = 'annual' | 'monthly';
// Requested display prices — intentionally identical for both plans
// (£99.99), never "corrected" to a different value because they happen to
// match. Replace with real Play Billing / StoreKit product prices once a
// purchase provider is connected (see purchaseService.ts) — this UI copy
// must then reflect the SDK's own localized price, not this hardcoded value.
//
// i18n (Phase 7D): `price` is deliberately NOT translated — it is a single
// opaque amount+currency+unit string with no existing separation between the
// number and the "/ an"/"/ mois" suffix, and it is commercial/numeric data
// (plus a placeholder for a real provider price), so it stays identical in
// both languages. `label`/`detail` are pure display text and are translated
// via premiumPlanLabels(t) below — the object keys ('annual'/'monthly')
// remain the only stable technical identifiers and are never translated.
export const PREMIUM_PRICING = {
  annual: {label: 'Abonnement annuel', detail: '12 mois', price: '99,99 £ / an'},
  monthly: {label: 'Abonnement mensuel', detail: 'Accès complet sans engagement', price: '99,99 £ / mois'},
} as const;

type TranslateFn = (key: string) => string;

export function premiumPlanLabels(t: TranslateFn): Record<PremiumPlan, {label: string; detail: string}> {
  return {
    annual: {label: t('premium.plans.annualLabel'), detail: t('premium.plans.annualDetail')},
    monthly: {label: t('premium.plans.monthlyLabel'), detail: t('premium.plans.monthlyDetail')},
  };
}
