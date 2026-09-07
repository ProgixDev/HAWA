import React from 'react';
import PlansContent from '@/components/admin/subscriptions/PlansContent';
import { listSubscriptionPlans } from '@/services/subscriptions';

export default async function SubscriptionPlansPage() {
  const plans = await listSubscriptionPlans();
  return <PlansContent initialPlans={plans} />;
}
