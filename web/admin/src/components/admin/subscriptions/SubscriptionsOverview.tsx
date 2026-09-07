'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronDown, CreditCard, Gem, TrendingUp, UserPlus } from 'lucide-react';
import type { SubscriptionOverviewData, SubscriptionPeriod } from '@/types/subscriptions';
import {
  ChartSkeleton,
  SubscriptionDistributionChart,
  SubscriptionEvolutionChart,
} from './SubscriptionCharts';
import { TrendBadge } from './SubscriptionUI';

const periods: Array<{ value: SubscriptionPeriod; label: string }> = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '3m', label: '3 derniers mois' },
  { value: '12m', label: '12 derniers mois' },
];

const iconMap = {
  users: CreditCard,
  sparkles: UserPlus,
  revenue: TrendingUp,
  conversion: Gem,
};

const iconStyles = {
  users: 'bg-[#eee9f7] text-[#765b9b]',
  sparkles: 'bg-[#fff0df] text-[#eb8a29]',
  revenue: 'bg-[#ffeaed] text-[#ef5363]',
  conversion: 'bg-[#e7f1ff] text-[#367df2]',
} as const;

const periodKpiValues: Record<
  SubscriptionPeriod,
  Record<string, { value: number; trend: number }>
> = {
  '7d': {
    'active-subscriptions': { value: 4216, trend: 3.2 },
    'new-subscriptions': { value: 286, trend: 2.8 },
    'monthly-revenue': { value: 17980, trend: 3.6 },
    'conversion-rate': { value: 16.9, trend: 0.6 },
  },
  '30d': {
    'active-subscriptions': { value: 4280, trend: 12.8 },
    'new-subscriptions': { value: 1248, trend: 6.1 },
    'monthly-revenue': { value: 18420, trend: 7.4 },
    'conversion-rate': { value: 17.2, trend: 1.3 },
  },
  '3m': {
    'active-subscriptions': { value: 4280, trend: 18.6 },
    'new-subscriptions': { value: 3564, trend: 14.2 },
    'monthly-revenue': { value: 18420, trend: 11.8 },
    'conversion-rate': { value: 17.2, trend: 2.4 },
  },
  '12m': {
    'active-subscriptions': { value: 4280, trend: 42.7 },
    'new-subscriptions': { value: 12480, trend: 35.4 },
    'monthly-revenue': { value: 18420, trend: 28.9 },
    'conversion-rate': { value: 17.2, trend: 4.8 },
  },
};

export default function SubscriptionsOverview({ data }: { data: SubscriptionOverviewData }) {
  const [period, setPeriod] = useState<SubscriptionPeriod>('30d');
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    setChartLoading(true);
    const timer = window.setTimeout(() => setChartLoading(false), 180);
    return () => window.clearTimeout(timer);
  }, [period]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-w-0 max-w-full space-y-7 overflow-hidden"
    >
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[30px] font-bold tracking-[-0.035em] text-[#171321] sm:text-[34px]">
            Abonnements
          </h1>
          <p className="mt-1 max-w-full text-[15px] font-medium text-[#626079]">
            Vue d’ensemble de la performance des abonnements
          </p>
        </div>
        <label className="relative w-full max-w-full sm:w-auto">
          <span className="sr-only">Période d’analyse</span>
          <CalendarDays
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#596078]"
          />
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as SubscriptionPeriod)}
            className="h-[52px] w-full max-w-full appearance-none rounded-[13px] border border-[#d8d9e3] bg-white pl-12 pr-11 text-[14px] font-semibold text-[#272438] shadow-[0_2px_10px_rgba(49,42,59,0.035)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-[226px]"
          >
            {periods.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#687087]"
          />
        </label>
      </header>

      <section
        className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Indicateurs abonnements"
      >
        {data.kpis.map((kpi, index) => {
          const Icon = iconMap[kpi.icon];
          const snapshot = periodKpiValues[period][kpi.id] ?? {
            value: kpi.value,
            trend: kpi.trend,
          };
          const value =
            kpi.format === 'currency'
              ? `${snapshot.value.toLocaleString('fr-FR')} €`
              : kpi.format === 'percent'
                ? `${snapshot.value.toFixed(1)}%`
                : snapshot.value.toLocaleString('fr-FR');
          return (
            <motion.article
              key={kpi.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="min-w-0 overflow-hidden rounded-[19px] border border-[#dedee8] bg-white p-5 shadow-[0_4px_18px_rgba(64,52,76,0.035)] sm:min-h-[198px] sm:p-6"
              title={`${kpi.comparison} : +${snapshot.trend}%`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${iconStyles[kpi.icon]}`}
                >
                  <Icon size={23} strokeWidth={1.8} />
                </span>
                <TrendBadge value={snapshot.trend} />
              </div>
              <p className="mt-7 font-display text-[28px] font-bold tracking-[-0.035em] text-[#171321] sm:text-[31px]">
                {value}
              </p>
              <p className="mt-1.5 text-[15px] font-medium text-[#65647b]">{kpi.label}</p>
            </motion.article>
          );
        })}
      </section>

      <section className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(340px,0.9fr)]">
        <article className="min-w-0 overflow-hidden rounded-[19px] border border-[#dedee8] bg-white p-5 shadow-[0_4px_18px_rgba(64,52,76,0.035)] sm:p-6">
          <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#171321]">
              Évolution des abonnements
            </h2>
            <label className="relative w-full sm:w-auto">
              <span className="sr-only">Période du graphique</span>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as SubscriptionPeriod)}
                className="h-10 w-full appearance-none rounded-xl border border-[#d8d9e3] bg-white pl-3.5 pr-9 text-[13px] font-semibold text-[#353148] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-[126px]"
              >
                <option value="7d">7 jours</option>
                <option value="30d">30 jours</option>
                <option value="3m">3 mois</option>
                <option value="12m">12 mois</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#687087]"
              />
            </label>
          </div>
          {chartLoading ? (
            <ChartSkeleton />
          ) : (
            <SubscriptionEvolutionChart data={data.evolution[period]} />
          )}
        </article>

        <article className="min-w-0 overflow-hidden rounded-[19px] border border-[#dedee8] bg-white p-5 shadow-[0_4px_18px_rgba(64,52,76,0.035)] sm:p-6">
          <h2 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#171321]">
            Répartition des abonnements
          </h2>
          {chartLoading ? (
            <ChartSkeleton />
          ) : (
            <SubscriptionDistributionChart data={data.distribution} />
          )}
        </article>
      </section>
    </motion.div>
  );
}
