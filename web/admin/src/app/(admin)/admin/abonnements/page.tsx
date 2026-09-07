import React from 'react';
import SubscriptionsOverview from '@/components/admin/subscriptions/SubscriptionsOverview';
import { getSubscriptionOverview } from '@/services/subscriptions';

export default async function SubscriptionsPage() {
  const data = await getSubscriptionOverview();
  return <SubscriptionsOverview data={data} />;
}
