import { mockUsers } from '@/data/mock/users';
import type { AuditLog, Country, ManagedUser, PrivacyRequest, SubscriptionStatus } from '@/types';

export type UserDataSource = 'mock';
export type UserMutationType = 'suspend' | 'disable' | 'reactivate' | 'delete' | 'update';

export interface UserSubscriptionDetails {
  plan: ManagedUser['plan'];
  status: SubscriptionStatus | 'none';
  startDate?: string;
  renewalOrExpirationDate?: string;
  provider?: ManagedUser['subscriptionProvider'];
  platform?: string;
  cancellationState?: string;
}

export interface UserDeviceSession {
  id: string;
  deviceName: string;
  platform: string;
  appVersion?: string;
  osVersion?: string;
  lastActiveAt?: string;
  status?: string;
  lastSyncedAt?: string;
}

export interface UserObjectiveHistoryItem {
  objective: ManagedUser['objective'];
  startedAt: string;
  endedAt?: string;
}

export interface UserDetailsRecord {
  user: ManagedUser;
  source: UserDataSource;
  subscription: UserSubscriptionDetails;
  objectiveHistory: UserObjectiveHistoryItem[];
  devices: UserDeviceSession[];
  dataRequests: PrivacyRequest[];
  adminActivity: AuditLog[];
}

export interface UserMutationInput {
  type: UserMutationType;
  userId: string;
  reason?: string;
  internalNote?: string;
  suspensionEndsAt?: string;
  changes?: {
    name?: string;
    country?: Country;
  };
}

export class UserMutationUnavailableError extends Error {
  constructor() {
    super(
      'Aucun service de gestion des comptes n’est connecté. Aucune modification n’a été appliquée.'
    );
    this.name = 'UserMutationUnavailableError';
  }
}

function getSubscription(user: ManagedUser): UserSubscriptionDetails {
  if (user.plan === 'FREE') return { plan: 'FREE', status: 'none' };

  const expired = user.premiumExpiresAt
    ? new Date(user.premiumExpiresAt).getTime() < Date.now()
    : false;

  return {
    plan: 'PREMIUM',
    status: expired ? 'expired' : 'active',
    startDate: user.premiumSince,
    renewalOrExpirationDate: user.premiumExpiresAt,
    provider: user.subscriptionProvider,
  };
}

export async function listUsers(): Promise<ManagedUser[]> {
  return mockUsers.map((user) => ({ ...user }));
}

export async function getUserById(id: string): Promise<UserDetailsRecord | null> {
  const user = mockUsers.find((item) => item.id === id);
  if (!user) return null;

  return {
    user: { ...user },
    source: 'mock',
    subscription: getSubscription(user),
    objectiveHistory: [],
    devices: [],
    dataRequests: [],
    adminActivity: [],
  };
}

export async function mutateUser(_input: UserMutationInput): Promise<never> {
  throw new UserMutationUnavailableError();
}

export const userManagementCapabilities = {
  source: 'mock' as const,
  persistentMutations: false,
  deviceSessions: false,
  objectiveHistory: false,
  privacyRequests: false,
  auditActivity: false,
};
