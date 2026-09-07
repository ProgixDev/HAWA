import React from 'react';
import AnalyticsContent from '@/components/admin/operations/AnalyticsContent';
import { getAnalyticsDatasets } from '@/services/adminOperations';

export default async function AnalyticsPage() {
  const datasets = await getAnalyticsDatasets();
  return <AnalyticsContent datasets={datasets} />;
}
