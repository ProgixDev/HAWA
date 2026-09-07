'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, MoonStar, Plus, X } from 'lucide-react';
import type { ArticleStatus } from '@/types';
import type { SpiritualValidationStatus } from '@/types/spiritual';

export function SpiritualPageHeader({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Repères spirituels
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn-primary h-10 shrink-0">
          <Plus size={15} /> {actionLabel}
        </button>
      )}
    </header>
  );
}

export function BackendNotice() {
  return (
    <aside className="flex items-start gap-3 rounded-[16px] border border-[#e6dfd0] bg-[#fbf6eb] px-4 py-3 text-[#806b48]">
      <AlertTriangle size={17} className="mt-0.5 shrink-0" />
      <p className="text-xs leading-5">
        Mode démonstration — aucun backend spirituel, annuaire de validateurs ou journal d’audit
        n’est connecté. Aucune action n’est présentée comme persistée.
      </p>
    </aside>
  );
}

export function PrivacyNotice() {
  return (
    <aside className="flex items-start gap-3 rounded-[16px] border border-[#e2d9e8] bg-[#f5f0f7] px-4 py-3 text-[#665173]">
      <MoonStar size={17} className="mt-0.5 shrink-0" />
      <p className="text-xs leading-5">
        Ces écrans gèrent uniquement la configuration et les contenus. Aucune donnée religieuse,
        menstruelle ou médicale individuelle n’est exposée.
      </p>
    </aside>
  );
}

export function FeatureStatusCard({
  enabled,
  label = 'Statut de la fonctionnalité',
}: {
  enabled?: boolean;
  label?: string;
}) {
  const text = enabled === undefined ? 'Non configuré' : enabled ? 'Activé' : 'Désactivé';
  return (
    <div className="rounded-[18px] border border-border bg-white p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            enabled === undefined ? 'bg-[#aaa4ab]' : enabled ? 'bg-success' : 'bg-danger'
          }`}
        />
        <span className="text-sm font-semibold text-foreground">{text}</span>
      </div>
    </div>
  );
}

export function SpiritualTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (value: T) => void;
  items: Array<{ value: T; label: string }>;
}) {
  return (
    <nav className="overflow-x-auto rounded-[18px] border border-border bg-white shadow-card">
      <div className="flex min-w-max px-2">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`relative px-3.5 py-3.5 text-[13px] font-semibold transition-colors ${
              item.value === value ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
            {item.value === value && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

const VALIDATION_LABELS: Record<SpiritualValidationStatus, string> = {
  unvalidated: 'Non validé',
  pending_review: 'En attente',
  in_review: 'En revue',
  changes_requested: 'Corrections demandées',
  validated: 'Validé',
  rejected: 'Refusé',
};

const VALIDATION_STYLES: Record<SpiritualValidationStatus, string> = {
  unvalidated: 'border-[#e3e1e4] bg-[#f3f2f3] text-[#777178]',
  pending_review: 'border-[#eadfcf] bg-[#faf3e8] text-[#927149]',
  in_review: 'border-[#eadfcf] bg-[#faf3e8] text-[#927149]',
  changes_requested: 'border-[#eedbd8] bg-[#fbefec] text-[#a25f55]',
  validated: 'border-[#d8ebe2] bg-[#edf7f2] text-[#367b60]',
  rejected: 'border-[#efddd8] bg-[#fbefec] text-[#a25f55]',
};

export function ValidationStatusBadge({ status }: { status: SpiritualValidationStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${VALIDATION_STYLES[status]}`}
    >
      {VALIDATION_LABELS[status]}
    </span>
  );
}

const PUBLICATION_LABELS: Partial<Record<ArticleStatus, string>> = {
  draft: 'Brouillon',
  review: 'En revue',
  pending_validation: 'En validation',
  published: 'Publié',
  archived: 'Archivé',
};

export function PublicationStatusBadge({ status }: { status: ArticleStatus }) {
  const published = status === 'published';
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        published
          ? 'border-[#d8ebe2] bg-[#edf7f2] text-[#367b60]'
          : status === 'archived'
            ? 'border-[#e3e1e4] bg-[#f3f2f3] text-[#777178]'
            : 'border-[#eadfcf] bg-[#faf3e8] text-[#927149]'
      }`}
    >
      {PUBLICATION_LABELS[status] ?? status}
    </span>
  );
}

export function SpiritualEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-border bg-[#faf8fa] px-5 py-12 text-center">
      <CheckCircle2 size={24} className="mx-auto text-primary/55" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1.5 max-w-lg text-[13px] leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function SpiritualModal({
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
    closeRef.current?.focus();
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#2b2232]/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        className={`max-h-[92vh] w-full overflow-y-auto rounded-[20px] border border-border bg-[#fcfaf7] shadow-modal ${wide ? 'max-w-[820px]' : 'max-w-[560px]'}`}
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
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Fermer"
          >
            <X size={17} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
