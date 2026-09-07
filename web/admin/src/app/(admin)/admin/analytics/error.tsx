'use client';

import React from 'react';
import OperationsError from '@/components/admin/operations/OperationsError';

export default function AnalyticsError({ reset }: { reset: () => void }) {
  return <OperationsError reset={reset} />;
}
