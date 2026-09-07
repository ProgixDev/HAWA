import React from 'react';
import SubscriptionHistoryContent from '@/components/admin/subscriptions/SubscriptionHistoryContent';
import { listSubscriptionHistory } from '@/services/subscriptions';

export default async function SubscriptionHistoryPage() {
  const events = await listSubscriptionHistory();
  return <SubscriptionHistoryContent events={events} />;
}
