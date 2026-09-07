import React from 'react';
import SupportContent from '@/components/admin/operations/SupportContent';
import { getSupportOverview, listAdminSelectableUsers } from '@/services/adminOperations';

export default async function SupportPage() {
  const [initialData, users] = await Promise.all([
    getSupportOverview(),
    listAdminSelectableUsers(),
  ]);
  return <SupportContent initialData={initialData} users={users} />;
}
