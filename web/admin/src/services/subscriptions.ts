import {
  activeSubscriptions,
  countryPricing,
  regionalRevenue,
  subscriptionHistory,
  subscriptionOverview,
  subscriptionPlans,
} from '@/data/mock/subscriptions';
import type {
  ActiveSubscription,
  CountryPricing,
  RegionRevenue,
  SubscriptionHistoryEvent,
  SubscriptionOverviewData,
  SubscriptionPlan,
} from '@/types/subscriptions';

function clone<T>(value: T): T {
  return structuredClone(value);
}

export async function getSubscriptionOverview(): Promise<SubscriptionOverviewData> {
  return clone(subscriptionOverview);
}

export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return clone(subscriptionPlans).sort((left, right) => left.displayOrder - right.displayOrder);
}

export async function listActiveSubscriptions(): Promise<ActiveSubscription[]> {
  return clone(activeSubscriptions);
}

export async function listSubscriptionHistory(): Promise<SubscriptionHistoryEvent[]> {
  return clone(subscriptionHistory);
}

export async function listCountryPricing(): Promise<{
  pricing: CountryPricing[];
  regions: RegionRevenue[];
}> {
  return {
    pricing: clone(countryPricing),
    regions: clone(regionalRevenue),
  };
}

export const subscriptionManagementCapabilities = {
  source: 'mock' as const,
  persistentMutations: false,
  csvExport: true,
};
