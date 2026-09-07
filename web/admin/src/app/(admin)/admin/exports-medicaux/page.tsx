import React from 'react';
import MedicalExportsContent from '@/components/admin/operations/MedicalExportsContent';
import { getMedicalExportsOverview, listAdminSelectableUsers } from '@/services/adminOperations';

export default async function MedicalExportsPage() {
  const [initialData, users] = await Promise.all([
    getMedicalExportsOverview(),
    listAdminSelectableUsers(),
  ]);
  return <MedicalExportsContent initialData={initialData} users={users} />;
}
