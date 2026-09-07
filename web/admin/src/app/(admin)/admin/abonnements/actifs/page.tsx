import React from 'react';
import ActiveSubscriptionsContent from '@/components/admin/subscriptions/ActiveSubscriptionsContent';
import { listActiveSubscriptions, listSubscriptionPlans } from '@/services/subscriptions';

export default async function ActiveSubscriptionsPage() {
  const [subscriptions, plans] = await Promise.all([
    listActiveSubscriptions(),
    listSubscriptionPlans(),
  ]);
  return <ActiveSubscriptionsContent initialSubscriptions={subscriptions} plans={plans} />;
}
