'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type { ArticleStatus, UserObjective, UserPlan } from '@/types';

export const OBJECTIVE_LABELS: Record<UserObjective, string> = {
  cycle_menstruel: 'Suivi du cycle',
  ttc: 'Essai de conception',
  contraception: 'Contraception',
  sopk: 'SOPK / cycles irréguliers',
  grossesse: 'Grossesse',
  post_partum: 'Post-partum',
  fausse_couche: 'Après fausse couche',
  menopause: 'Périménopause / ménopause',
};

export const STATUS_LABELS: Partial<Record<ArticleStatus, string>> = {
  published: 'Publié',
  draft: 'Brouillon',
  review: 'En revue',
  pending_validation: 'En validation',
  validated: 'Validé',
  archived: 'Archivé',
};

export const CONTENT_TYPE_LABELS = {
  medical: 'Médical',
  educational: 'Éducatif',
  religious: 'Religieux',
} as const;

export type SortDirection = 'asc' | 'desc';

export function formatContentDate(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatCount(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}

export function makeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#655276] px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(81,64,95,0.16)] transition-colors hover:bg-[#584767]"
      >
        <Plus size={15} />
        {actionLabel}
      </button>
    </div>
  );
}

export function DemoNotice() {
  return (
    <div className="rounded-xl border border-[#e6dfd0] bg-[#fbf6eb] px-3.5 py-2.5 text-[10px] leading-relaxed text-[#806b48]">
      Mode démonstration — les modifications sont conservées uniquement pendant cette session.
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  comfortable = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  comfortable?: boolean;
}) {
  return (
    <label className="relative block min-w-[220px] flex-1">
      <Search
        size={15}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-10 w-full rounded-xl border border-border bg-[#f8f6f8] pl-10 pr-3 text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15 ${comfortable ? 'text-sm' : 'text-xs'}`}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  children,
  compact = false,
  comfortable = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  compact?: boolean;
  comfortable?: boolean;
}) {
  return (
    <label className={compact ? 'relative block min-w-[145px]' : 'block min-w-0'}>
      {!compact && (
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
      )}
      <span className="relative block">
        <select
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-10 w-full appearance-none rounded-xl border border-border bg-[#f8f6f8] px-3 pr-8 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 ${comfortable ? 'text-[13px]' : 'text-xs'}`}
        >
          {children}
        </select>
        <ChevronDown
          size={13}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </span>
    </label>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  comfortable = false,
}: {
  value: T;
  onChange: (value: T) => void;
  items: Array<{ value: T; label: string; count?: number }>;
  comfortable?: boolean;
}) {
  return (
    <div className="overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1 px-1">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`relative px-3.5 py-3 font-semibold transition-colors ${
              comfortable ? 'text-[13px] sm:text-sm' : 'text-xs'
            } ${
              value === item.value ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
            {typeof item.count === 'number' && (
              <span className="ml-1.5 text-[9px] opacity-70">{item.count}</span>
            )}
            {value === item.value && (
              <motion.span
                layoutId="content-tab-indicator"
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StatusBadge({
  status,
  comfortable = false,
}: {
  status: ArticleStatus;
  comfortable?: boolean;
}) {
  const styles: Partial<Record<ArticleStatus, string>> = {
    published: 'border-[#d8ebe2] bg-[#edf7f2] text-[#367b60]',
    draft: 'border-[#dce5ef] bg-[#edf3f8] text-[#59738b]',
    review: 'border-[#eedbd8] bg-[#fbefec] text-[#a25f55]',
    pending_validation: 'border-[#eadfcf] bg-[#faf3e8] text-[#927149]',
    validated: 'border-[#d8ebe2] bg-[#edf7f2] text-[#367b60]',
    archived: 'border-[#e3e1e4] bg-[#f3f2f3] text-[#777178]',
  };
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 font-semibold ${comfortable ? 'text-[11px]' : 'text-[10px]'} ${styles[status] ?? styles.draft}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function AccessBadge({ plan }: { plan: UserPlan }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.06em] ${
        plan === 'PREMIUM' ? 'bg-[#eee8f3] text-[#6c587c]' : 'bg-[#f1f0f1] text-[#726d73]'
      }`}
    >
      {plan}
    </span>
  );
}

export function SortButton<T extends string>({
  label,
  field,
  activeField,
  direction,
  onSort,
}: {
  label: string;
  field: T;
  activeField: T;
  direction: SortDirection;
  onSort: (field: T) => void;
}) {
  const active = field === activeField;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-foreground"
    >
      {label}
      {active ? (
        direction === 'asc' ? (
          <ArrowUp size={12} className="text-primary" />
        ) : (
          <ArrowDown size={12} className="text-primary" />
        )
      ) : (
        <ArrowUpDown size={12} className="opacity-50" />
      )}
    </button>
  );
}

export function RowActions({
  children,
  label = 'Actions',
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <details className="group relative">
      <summary
        aria-label={label}
        className="mx-auto flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden"
      >
        <MoreHorizontal size={17} />
      </summary>
      <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-border bg-white p-1.5 shadow-dropdown">
        {children}
      </div>
    </details>
  );
}

export function ActionButton({
  children,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        onClick();
        event.currentTarget.closest('details')?.removeAttribute('open');
      }}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-medium transition-colors ${
        danger
          ? 'text-danger hover:bg-danger-bg'
          : 'text-[#5e5762] hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', close);
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', close);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#2b2232]/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.section
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.99 }}
        role="dialog"
        aria-modal="true"
        className={`max-h-[92vh] w-full overflow-y-auto rounded-[20px] border border-border bg-[#fcfaf7] shadow-modal ${wide ? 'max-w-[860px]' : 'max-w-[560px]'}`}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-[#fcfaf7]/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fermer"
          >
            <X size={17} />
          </button>
        </header>
        {children}
      </motion.section>
    </motion.div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmer',
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-5 p-5 sm:p-6">
        <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-xl border border-border bg-white px-4 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-xl bg-danger px-4 text-xs font-semibold text-white hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 25, 50],
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizes?: number[];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start = total ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(safePage * pageSize, total);
  const pageNumbers = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (number) => pages <= 5 || number === 1 || number === pages || Math.abs(number - safePage) <= 1
  );

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3.5 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Affichage de <strong className="text-foreground">{start}</strong> à{' '}
          <strong className="text-foreground">{end}</strong> sur{' '}
          <strong className="text-foreground">{total}</strong> résultats
        </span>
        <label className="flex items-center gap-2">
          Lignes
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-lg border border-border bg-white px-2 text-[11px] text-foreground outline-none"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage === 1}
          onClick={() => onPageChange(safePage - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white disabled:opacity-40"
          aria-label="Page précédente"
        >
          <ChevronLeft size={14} />
        </button>
        {pageNumbers.map((number, index) => (
          <React.Fragment key={number}>
            {index > 0 && number - pageNumbers[index - 1] > 1 && <span className="px-1">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(number)}
              className={`h-8 min-w-8 rounded-lg px-2 font-semibold ${
                number === safePage
                  ? 'bg-primary text-white'
                  : 'border border-border bg-white text-muted-foreground hover:text-foreground'
              }`}
            >
              {number}
            </button>
          </React.Fragment>
        ))}
        <button
          type="button"
          disabled={safePage === pages}
          onClick={() => onPageChange(safePage + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white disabled:opacity-40"
          aria-label="Page suivante"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-ghost text-xl text-primary">
        ◇
      </div>
      <p className="font-display text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

export const inputClassName =
  'h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15';

export const textareaClassName =
  'w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-semibold text-foreground">{children}</span>;
}
