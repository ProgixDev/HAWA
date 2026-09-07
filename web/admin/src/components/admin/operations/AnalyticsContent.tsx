'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, ChevronDown, TrendingUp } from 'lucide-react';
import type { AnalyticsDatasets, AnalyticsPeriod } from '@/types/adminOperations';
import CountryFlag from '@/components/users/CountryFlag';
import { SortButton } from '@/app/content/components/ContentUI';
import {
  AcquisitionChart,
  AnalyticsUserGrowthChart,
  RetentionChart,
  SubscriptionPerformanceChart,
} from './AnalyticsCharts';
import { OperationsMetricCard, SectionHeading } from './OperationsUI';

const periodOptions: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '3m', label: '3 derniers mois' },
  { value: '6m', label: '6 derniers mois' },
  { value: '12m', label: '12 derniers mois' },
  { value: 'custom', label: 'Personnalisé' },
];

function formatMetric(value: number, format: 'number' | 'currency' | 'percent') {
  if (format === 'currency') return `${value.toLocaleString('fr-FR')} €`;
  if (format === 'percent') return `${value.toFixed(1)}%`;
  return value.toLocaleString('fr-FR');
}

export default function AnalyticsContent({ datasets }: { datasets: AnalyticsDatasets }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [customStart, setCustomStart] = useState('2026-08-01');
  const [customEnd, setCustomEnd] = useState('2026-09-06');
  const [contentSort, setContentSort] = useState<'views' | 'completion'>('views');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const data = datasets[period];
  const sortedContent = useMemo(
    () =>
      [...data.content].sort((left, right) => {
        const result =
          contentSort === 'views'
            ? left.views - right.views
            : left.completionRate - right.completionRate;
        return sortDirection === 'asc' ? result : -result;
      }),
    [contentSort, data.content, sortDirection]
  );

  const sortContent = (field: 'views' | 'completion') => {
    if (field === contentSort) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setContentSort(field);
      setSortDirection('desc');
    }
  };

  return (
    <motion.div
      key={period}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-w-0 space-y-7"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Performance
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[28px]">
            Analytics
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Analysez la performance et l’engagement de votre plateforme
          </p>
        </div>
        <label className="relative w-full sm:w-[220px]">
          <span className="sr-only">Période d’analyse</span>
          <CalendarRange
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}
            className="h-11 w-full appearance-none rounded-xl border border-border bg-white pl-10 pr-9 text-[13px] font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            {periodOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </label>
      </header>

      {period === 'custom' && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Date de début
            </span>
            <input
              type="date"
              value={customStart}
              max={customEnd}
              onChange={(event) => setCustomStart(event.target.value)}
              className="h-10 rounded-xl border border-border bg-white px-3 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Date de fin
            </span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="h-10 rounded-xl border border-border bg-white px-3 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <p className="pb-2 text-xs text-muted-foreground">
            Analyse agrégée du {new Date(`${customStart}T12:00:00`).toLocaleDateString('fr-FR')} au{' '}
            {new Date(`${customEnd}T12:00:00`).toLocaleDateString('fr-FR')}
          </p>
        </div>
      )}

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Indicateurs analytics"
      >
        {data.kpis.map((kpi, index) => (
          <OperationsMetricCard
            key={kpi.id}
            label={kpi.label}
            value={formatMetric(kpi.value, kpi.format)}
            trend={kpi.trend}
            tone={kpi.icon === 'activity' || kpi.icon === 'revenue' ? 'success' : 'primary'}
            icon={kpi.icon}
            index={index}
          />
        ))}
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.8fr)]">
        <article className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white p-5 shadow-card">
          <SectionHeading
            title="Croissance des utilisatrices"
            subtitle={`Utilisatrices totales et actives — ${data.periodLabel}`}
          />
          <AnalyticsUserGrowthChart data={data.userGrowth} />
        </article>
        <article className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white p-5 shadow-card">
          <SectionHeading title="Sources d’acquisition" />
          <AcquisitionChart data={data.acquisition} />
        </article>
      </section>

      <section>
        <SectionHeading
          title="Engagement des utilisatrices"
          subtitle="Mesures agrégées, sans données médicales individuelles"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {data.engagement.map((metric) => (
            <article
              key={metric.label}
              className="rounded-[16px] border border-border bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <strong className="font-display text-xl text-foreground">{metric.value}</strong>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                  <TrendingUp size={12} /> {metric.change.toFixed(1)}%
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid min-w-0 gap-5 lg:grid-cols-2">
        <article className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white p-5 shadow-card">
          <SectionHeading
            title="Rétention des utilisatrices"
            subtitle="Rétention agrégée à J1, J7 et J30"
          />
          <RetentionChart data={data.retention} />
        </article>
        <article className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white p-5 shadow-card">
          <SectionHeading
            title="Performance des abonnements"
            subtitle="Répartition entre les trois plans AWA"
          />
          <SubscriptionPerformanceChart data={data.subscriptions} />
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {data.subscriptions.map((item) => (
              <div key={item.plan} className="rounded-xl bg-[#f8f6f9] px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">{item.plan}</p>
                <strong className="mt-1 block text-sm text-foreground">{item.share}%</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[18px] border border-border bg-white p-5 shadow-card">
          <SectionHeading
            title="Taux de conversion Premium"
            subtitle="Parcours agrégé vers un abonnement confirmé"
          />
          <div className="mt-5 space-y-3">
            {data.conversion.map((step, index) => {
              const maximum = data.conversion[0]?.value || 1;
              const width = Math.max(18, (step.value / maximum) * 100);
              return (
                <div key={step.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {index + 1}. {step.label}
                    </span>
                    <strong className="text-foreground">
                      {step.value.toLocaleString('fr-FR')}
                    </strong>
                  </div>
                  <div className="h-8 overflow-hidden rounded-lg bg-muted">
                    <div
                      className="flex h-full items-center rounded-lg bg-gradient-to-r from-[#8d79a8] to-[#654474] px-3 text-[10px] font-semibold text-white"
                      style={{ width: `${width}%` }}
                    >
                      {Math.round((step.value / maximum) * 100)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white shadow-card">
          <div className="border-b border-border px-5 py-4">
            <SectionHeading title="Contenus les plus consultés" subtitle={data.periodLabel} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-[#f8f6f9] text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Contenu</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">
                    <SortButton
                      label="Vues"
                      field="views"
                      activeField={contentSort}
                      direction={sortDirection}
                      onSort={sortContent}
                    />
                  </th>
                  <th className="px-4 py-3">Lectures complètes</th>
                  <th className="px-4 py-3">
                    <SortButton
                      label="Taux de complétion"
                      field="completion"
                      activeField={contentSort}
                      direction={sortDirection}
                      onSort={sortContent}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedContent.map((item) => (
                  <tr key={item.id} className="text-xs hover:bg-primary-ghost/50">
                    <td className="max-w-[260px] px-4 py-3.5 font-semibold text-foreground">
                      {item.title}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-3.5 tabular-nums text-foreground">
                      {item.views.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-muted-foreground">
                      {item.completedReads.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-success-bg px-2.5 py-1 font-semibold text-success">
                        {item.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="grid min-w-0 gap-5 lg:grid-cols-2">
        <article className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white shadow-card">
          <div className="border-b border-border px-5 py-4">
            <SectionHeading
              title="Usage des repères spirituels"
              subtitle="Mesures d’utilisation agrégées"
            />
          </div>
          <div className="divide-y divide-border">
            {data.spiritualUsage.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5 text-xs"
              >
                <strong className="text-foreground">{item.label}</strong>
                <span className="text-muted-foreground">
                  {item.users.toLocaleString('fr-FR')} utilisatrices
                </span>
                <span className="min-w-24 text-right font-semibold text-primary">
                  {item.sessions.toLocaleString('fr-FR')} sessions
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white shadow-card">
          <div className="border-b border-border px-5 py-4">
            <SectionHeading title="Répartition géographique" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left">
              <thead className="bg-[#f8f6f9] text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Pays</th>
                  <th className="px-4 py-3">Utilisatrices</th>
                  <th className="px-4 py-3">Premium</th>
                  <th className="px-4 py-3">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.countries.map((item) => (
                  <tr key={item.code} className="text-xs">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                        <CountryFlag code={item.code} label={item.country} />
                        {item.country}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{item.users.toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 tabular-nums text-primary">
                      {item.premium.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-success">
                      {item.conversion.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </motion.div>
  );
}
