'use client';

import React from 'react';
import { ArrowUp, Download, Plus } from 'lucide-react';
import type { ManagedSubscriptionStatus, SubscriptionHistoryStatus } from '@/types/subscriptions';

export function SubscriptionPageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          Abonnements
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {children}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#655276] px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(81,64,95,0.16)] transition-colors hover:bg-[#584767]"
          >
            {actionLabel === 'Exporter' ? <Download size={15} /> : <Plus size={15} />}
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
}

const subscriptionStatusStyles: Record<ManagedSubscriptionStatus, string> = {
  active: 'border-[#d8ebe2] bg-[#edf7f2] text-[#367b60]',
  trial: 'border-[#ded8eb] bg-[#f0ecf7] text-[#695783]',
  payment_pending: 'border-[#eadfcf] bg-[#faf3e8] text-[#927149]',
  expiring_soon: 'border-[#eedbd8] bg-[#fbefec] text-[#a25f55]',
  suspended: 'border-[#e3e1e4] bg-[#f3f2f3] text-[#777178]',
  cancelled: 'border-[#efd6d6] bg-[#fbebeb] text-[#a34f4f]',
};

export const subscriptionStatusLabels: Record<ManagedSubscriptionStatus, string> = {
  active: 'Actif',
  trial: 'Essai',
  payment_pending: 'Paiement en attente',
  expiring_soon: 'Expire bientôt',
  suspended: 'Suspendu',
  cancelled: 'Annulé',
};

export function SubscriptionStatusBadge({ status }: { status: ManagedSubscriptionStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${subscriptionStatusStyles[status]}`}
    >
      {subscriptionStatusLabels[status]}
    </span>
  );
}

const historyStatusStyles: Record<SubscriptionHistoryStatus, string> = {
  success: 'border-[#d8ebe2] bg-[#edf7f2] text-[#367b60]',
  info: 'border-[#dce5ef] bg-[#edf3f8] text-[#59738b]',
  failure: 'border-[#efd6d6] bg-[#fbebeb] text-[#a34f4f]',
  pending: 'border-[#eadfcf] bg-[#faf3e8] text-[#927149]',
  refunded: 'border-[#ded8eb] bg-[#f0ecf7] text-[#695783]',
};

export const historyStatusLabels: Record<SubscriptionHistoryStatus, string> = {
  success: 'Succès',
  info: 'Info',
  failure: 'Échec',
  pending: 'En attente',
  refunded: 'Remboursé',
};

export function HistoryStatusBadge({ status }: { status: SubscriptionHistoryStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${historyStatusStyles[status]}`}
    >
      {historyStatusLabels[status]}
    </span>
  );
}

export function TrendBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-1 text-[11px] font-semibold text-success">
      <ArrowUp size={12} /> {value.toFixed(1)}%
    </span>
  );
}

export function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'DZD' || currency === 'MAD' ? 0 : 2,
  }).format(value);
}

export function formatSubscriptionDate(value?: string, withTime = false) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escape).join(';')).join('\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const tableHeaderClass =
  'whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground';
export const tableCellClass = 'whitespace-nowrap px-4 py-3.5 text-[13px] text-foreground';
