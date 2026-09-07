import {
  analyticsDatasets,
  medicalExportOverview,
  supportOverview,
} from '@/data/mock/adminOperations';
import { mockUsers } from '@/data/mock/users';
import type { ManagedUser } from '@/types';
import type {
  AnalyticsDatasets,
  MedicalExportOverview,
  SupportOverview,
} from '@/types/adminOperations';

function clone<T>(value: T): T {
  return structuredClone(value);
}

export async function getMedicalExportsOverview(): Promise<MedicalExportOverview> {
  return clone(medicalExportOverview);
}

export async function getSupportOverview(): Promise<SupportOverview> {
  return clone(supportOverview);
}

export async function getAnalyticsDatasets(): Promise<AnalyticsDatasets> {
  return clone(analyticsDatasets);
}

export async function listAdminSelectableUsers(): Promise<ManagedUser[]> {
  return clone(mockUsers);
}

export const adminOperationsCapabilities = {
  source: 'mock' as const,
  persistentMutations: false,
  medicalExportDownload: false,
};
