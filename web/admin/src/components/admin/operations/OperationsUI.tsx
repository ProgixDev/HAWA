'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Gem,
  Headphones,
  Inbox,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import type {
  MedicalExportStatus,
  MedicalExportType,
  SupportCategory,
  SupportPriority,
  SupportStatus,
} from '@/types/adminOperations';

export const medicalExportTypeLabels: Record<MedicalExportType, string> = {
  cycle: 'Données du cycle',
  complete: 'Données complètes',
  medical_history: 'Historique médical',
  medical_report: 'Rapport médical',
  symptoms: 'Symptômes',
  fertility: 'Fertilité',
  pregnancy: 'Grossesse',
  tracking: 'Données de suivi',
};

export const medicalExportStatusLabels: Record<MedicalExportStatus, string> = {
  pending: 'En attente',
  processing: 'En cours',
  completed: 'Terminé',
  failed: 'Échec',
  expired: 'Expiré',
  cancelled: 'Annulé',
};

export const supportCategoryLabels: Record<SupportCategory, string> = {
  account: 'Compte',
  application: 'Application',
  subscription: 'Abonnement',
  payment: 'Paiement',
  feature: 'Fonctionnalité',
  content: 'Contenu',
  data: 'Données',
  medical_export: 'Export médical',
  notifications: 'Notifications',
  other: 'Autre',
};

export const supportStatusLabels: Record<SupportStatus, string> = {
  new: 'Nouveau',
  waiting: 'En attente',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

export const supportPriorityLabels: Record<SupportPriority, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

const metricIcons = {
  database: Database,
  check: CheckCircle2,
  clock: Clock3,
  alert: AlertTriangle,
  timer: Timer,
  tickets: Headphones,
  resolved: CheckCircle2,
  progress: Activity,
  waiting: Inbox,
  users: Users,
  activity: Activity,
  premium: Gem,
  revenue: TrendingUp,
};

const metricTones = {
  primary: 'bg-primary-pale text-primary',
  success: 'bg-success-bg text-success',
  info: 'bg-info-bg text-info',
  danger: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
};

export function OperationsMetricCard({
  label,
  value,
  trend,
  tone,
  icon,
  index = 0,
}: {
  label: string;
  value: React.ReactNode;
  trend?: number;
  tone: keyof typeof metricTones;
  icon: keyof typeof metricIcons;
  index?: number;
}) {
  const Icon = metricIcons[icon];
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="min-w-0 rounded-[18px] border border-border bg-white p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full ${metricTones[tone]}`}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
        {typeof trend === 'number' && (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              trend >= 0 ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
            }`}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-5 font-display text-[27px] font-bold tracking-[-0.03em] text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[13px] font-medium text-muted-foreground">{label}</p>
    </motion.article>
  );
}

const statusStyles: Record<MedicalExportStatus | SupportStatus, string> = {
  pending: 'border-[#e7d7bd] bg-warning-bg text-warning',
  processing: 'border-[#d6e1f2] bg-info-bg text-info',
  completed: 'border-[#d6e9df] bg-success-bg text-success',
  failed: 'border-[#efd5d5] bg-danger-bg text-danger',
  expired: 'border-border bg-muted text-muted-foreground',
  cancelled: 'border-border bg-muted text-muted-foreground',
  new: 'border-[#dfd4e7] bg-primary-pale text-primary',
  waiting: 'border-[#e7d7bd] bg-warning-bg text-warning',
  in_progress: 'border-[#d6e1f2] bg-info-bg text-info',
  resolved: 'border-[#d6e9df] bg-success-bg text-success',
  closed: 'border-border bg-muted text-muted-foreground',
};

export function OperationsStatusBadge({
  status,
  label,
}: {
  status: MedicalExportStatus | SupportStatus;
  label: string;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}

const priorityStyles: Record<SupportPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning-bg text-warning',
  high: 'bg-danger-bg text-danger',
  urgent: 'bg-[#f7dddd] font-bold text-[#a93434]',
};

export function PriorityBadge({ priority }: { priority: SupportPriority }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityStyles[priority]}`}
    >
      {supportPriorityLabels[priority]}
    </span>
  );
}

export function formatAdminDate(value?: string, withTime = false) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
