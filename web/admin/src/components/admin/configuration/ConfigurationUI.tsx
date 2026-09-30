'use client';

import React from 'react';
import { Search } from 'lucide-react';

export function ConfigurationPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          Configuration
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

export function ConfigurationSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block w-full sm:max-w-sm">
      <span className="sr-only">{placeholder}</span>
      <Search
        aria-hidden="true"
        size={15}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-border bg-white pl-10 pr-3 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-accent/60 focus:ring-4 focus:ring-accent/10"
      />
    </label>
  );
}

export function SessionNotice({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="rounded-xl border border-[#e6dfd0] bg-[#fbf6eb] px-3.5 py-2.5 text-[10px] leading-relaxed text-[#806b48]">
      {children ??
        'Mode démonstration — les modifications sont conservées uniquement pendant cette session.'}
    </aside>
  );
}

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        active ? 'bg-success-bg text-success' : 'bg-muted text-muted-foreground'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-success' : 'bg-muted-foreground'}`}
      />
      {active ? 'Actif' : 'Inactif'}
    </span>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`btn-switch h-6 w-11 focus:outline-none disabled:opacity-45 ${
        checked ? 'border-primary bg-primary' : 'border-[#cfc8d5] bg-[#dcd7e1]'
      }`}
    >
      <span
        className={`pointer-events-none mt-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[20px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="btn-primary h-10 shrink-0 px-4 text-xs"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn-secondary h-9 px-3 text-[11px]"
    >
      {children}
    </button>
  );
}

export const fieldClassName =
  'h-11 w-full rounded-[14px] border border-border bg-white px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-accent/60 focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground';

export const textAreaClassName =
  'w-full rounded-[14px] border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-accent/60 focus:ring-4 focus:ring-accent/10';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-semibold text-foreground">{children}</span>;
}
