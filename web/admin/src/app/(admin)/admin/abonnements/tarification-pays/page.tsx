import React from 'react';
import CountryPricingContent from '@/components/admin/subscriptions/CountryPricingContent';
import { listCountryPricing } from '@/services/subscriptions';

export default async function CountryPricingPage() {
  const { pricing, regions } = await listCountryPricing();
  return <CountryPricingContent initialPricing={pricing} revenue={regions} />;
}
