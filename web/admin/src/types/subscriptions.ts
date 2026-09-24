import type { Country } from '@/types';

export type BillingPeriod = 'monthly' | 'yearly';
export type SubscriptionPlanType = 'free' | 'premium';
export type SubscriptionPeriod = '7d' | '30d' | '3m' | '12m';
export type ManagedSubscriptionStatus =
  | 'active'
  | 'trial'
  | 'payment_pending'
  | 'expiring_soon'
  | 'suspended'
  | 'cancelled';
export type SubscriptionHistoryType =
  | 'new_subscription'
  | 'renewal'
  | 'plan_change'
  | 'cancellation'
  | 'payment_failure'
  | 'refund'
  | 'reactivation';
export type SubscriptionHistoryStatus = 'success' | 'info' | 'failure' | 'pending' | 'refunded';

// Structured entitlement mapping — kept separate from the free-text marketing
// `features` bullets above. These four keys are the real gates that exist in
// the mobile app today (mobile/src/state/premiumStore.ts consumers): advanced
// Statistics screens (all 8 objectives), medical CSV/PDF export, the 30-day
// free history window, and Premium-only visual themes. Article-level gating
// ("Contenus éducatifs approfondis") is intentionally NOT listed here because
// it is not yet enforced client-side — it stays marketing copy only until it is.
export type PremiumEntitlementKey =
  | 'advancedStatistics'
  | 'medicalExport'
  | 'unlimitedHistory'
  | 'premiumThemes';

export const PREMIUM_ENTITLEMENT_LABELS: Record<PremiumEntitlementKey, string> = {
  advancedStatistics: 'Statistiques avancées',
  medicalExport: 'Exports santé',
  unlimitedHistory: 'Historique illimité',
  premiumThemes: 'Thèmes Premium',
};

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string;
  type: SubscriptionPlanType;
  price: number;
  currency: string;
  billingPeriod: BillingPeriod;
  discountPercent?: number;
  originalPrice?: number;
  features: string[];
  entitlements: PremiumEntitlementKey[];
  active: boolean;
  badge?: string;
  displayOrder: number;
  subscriberCount: number;
}

export interface SubscriptionKpi {
  id: string;
  label: string;
  value: number;
  format: 'number' | 'currency' | 'percent';
  trend: number;
  comparison: string;
  icon: 'users' | 'sparkles' | 'revenue' | 'conversion';
}

export interface SubscriptionEvolutionPoint {
  label: string;
  total: number;
  newSubscriptions: number;
  cancelled: number;
}

export interface SubscriptionDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface SubscriptionOverviewData {
  kpis: SubscriptionKpi[];
  evolution: Record<SubscriptionPeriod, SubscriptionEvolutionPoint[]>;
  distribution: SubscriptionDistributionItem[];
}

export interface ActiveSubscription {
  id: string;
  userId: string;
  userName: string;
  email: string;
  country: Country;
  planId: string;
  planName: 'Premium Mensuel' | 'Premium Annuel';
  billingPeriod: BillingPeriod;
  status: ManagedSubscriptionStatus;
  startDate: string;
  nextBillingDate?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  lastPayment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionHistoryEvent {
  id: string;
  occurredAt: string;
  userId: string;
  userName: string;
  email: string;
  subscriptionId: string;
  type: SubscriptionHistoryType;
  planName: 'Gratuit' | 'Premium Mensuel' | 'Premium Annuel';
  previousPlan?: 'Gratuit' | 'Premium Mensuel' | 'Premium Annuel';
  amount?: number;
  currency: string;
  status: SubscriptionHistoryStatus;
  paymentReference?: string;
  failureReason?: string;
  actor: string;
  country: Country;
}

export interface CountryPricing {
  id: string;
  countryCode: Exclude<Country, 'other'>;
  countryName: string;
  currency: string;
  currencySymbol: string;
  monthlyPrice: number;
  yearlyPrice: number;
  active: boolean;
  region: 'Europe' | 'Afrique' | 'Amérique du Nord' | 'Moyen-Orient' | 'Asie';
  taxNote?: string;
  hasBillingData: boolean;
}

export interface RegionRevenue {
  region: CountryPricing['region'];
  revenue: number;
  percentage: number;
}
