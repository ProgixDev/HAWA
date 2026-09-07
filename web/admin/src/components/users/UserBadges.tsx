import React from 'react';
import type { ManagedUser, UserStatus } from '@/types';
import { USER_STATUS_LABELS, getAccountTypeLabel } from './userPresentation';

const STATUS_STYLES: Record<UserStatus, string> = {
  active: 'border-[#d8ebe2] bg-[#edf7f2] text-[#367b60]',
  suspended: 'border-[#f0ddd9] bg-[#fbefec] text-[#a25f55]',
  inactive: 'border-[#e5e3e5] bg-[#f5f4f5] text-[#777178]',
  disabled: 'border-[#e5e3e5] bg-[#f5f4f5] text-[#777178]',
  pending_verification: 'border-[#e3dfea] bg-[#f3f0f5] text-[#73677c]',
  deletion_pending: 'border-[#eadfcf] bg-[#faf3e8] text-[#927149]',
  deleted: 'border-[#efddd8] bg-[#fbefec] text-[#a25f55]',
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {USER_STATUS_LABELS[status]}
    </span>
  );
}

export function UserAccountBadge({ user }: { user: ManagedUser }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-[#f1f0f1] px-3 py-1 text-xs font-semibold text-[#686168]">
      {getAccountTypeLabel(user)}
    </span>
  );
}

export function UserPlanBadge({ user }: { user: ManagedUser }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        user.plan === 'PREMIUM' ? 'bg-[#eee8f3] text-[#6c587c]' : 'bg-[#f1f0f1] text-[#726d73]'
      }`}
    >
      {user.plan === 'PREMIUM' ? 'Premium' : 'Gratuit'}
    </span>
  );
}
