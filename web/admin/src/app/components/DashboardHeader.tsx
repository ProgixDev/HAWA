'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { CURRENT_ADMIN } from '@/config/admin';
import { DASHBOARD_RANGES, type DashboardRangeId } from '@/data/mock/dashboard';

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export default function DashboardHeader({
  selectedRange,
  onRangeChange,
  onRefresh,
  refreshing,
  lastUpdatedAt,
}: {
  selectedRange: DashboardRangeId;
  onRangeChange: (range: DashboardRangeId) => void;
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdatedAt: Date;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
    >
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-[34px]">
          Bonjour, {CURRENT_ADMIN.name} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Voici un aperçu de l&apos;activité AWA aujourd&apos;hui.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-shrink-0 items-center gap-2 rounded-full border border-border bg-card p-1 shadow-card">
          <CalendarDays size={15} className="text-muted-foreground ml-2" />
          {DASHBOARD_RANGES.map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => onRangeChange(range.id)}
              className={`btn-tab relative px-3 py-1.5 ${
                selectedRange === range.id ? 'text-primary-foreground' : ''
              }`}
            >
              {selectedRange === range.id && (
                <motion.div
                  layoutId="date-range-bg"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{range.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title={`Dernière actualisation à ${formatUpdatedAt(lastUpdatedAt)}`}
          className="btn-secondary h-[38px] shrink-0 px-3.5 text-xs disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>
    </motion.div>
  );
}
