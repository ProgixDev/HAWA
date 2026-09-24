'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import DashboardHeader from './DashboardHeader';
import KpiCard from '@/components/dashboard/KpiCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import QuickActions from '@/components/dashboard/QuickActions';
import CountryDistribution from '@/components/dashboard/CountryDistribution';
import { Modal } from '@/app/content/components/ContentUI';
import {
  mockRecentActivity,
  mockAlerts,
  getDashboardSnapshot,
  type DashboardRangeId,
} from '@/data/mock/dashboard';

// Recharts components isolated as client-only to prevent SSR mismatch
const UserGrowthChart = dynamic(() => import('@/components/dashboard/UserGrowthChart'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted rounded-xl h-[280px] w-full" />,
});

const ObjectiveChart = dynamic(() => import('@/components/dashboard/ObjectiveChart'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted rounded-xl h-[360px] w-full" />,
});

const PremiumConversionChart = dynamic(
  () => import('@/components/dashboard/PremiumConversionChart'),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted rounded-xl h-[220px] w-full" />,
  }
);

export default function DashboardContent() {
  const [selectedRange, setSelectedRange] = useState<DashboardRangeId>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const snapshot = useMemo(() => getDashboardSnapshot(selectedRange), [selectedRange]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    window.setTimeout(() => {
      setLastUpdatedAt(new Date());
      setRefreshing(false);
    }, 600);
  };

  const activityColumnSize = Math.ceil(snapshot.activity.length / 3) || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        lastUpdatedAt={lastUpdatedAt}
      />

      {/* KPI Bento Grid — 6 cards: row1 hero(2col)+2, row2: 3 */}
      {/* grid-cols-3 md → xl: 6 cols for flexibility */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {/* Hero card — spans 2 cols */}
        <div className="xl:col-span-2">
          <KpiCard metric={snapshot.kpis?.[0]} index={0} />
        </div>
        <div className="xl:col-span-2">
          <KpiCard metric={snapshot.kpis?.[1]} index={1} />
        </div>
        <div className="xl:col-span-2">
          <KpiCard metric={snapshot.kpis?.[2]} index={2} />
        </div>
        <div className="xl:col-span-2">
          <KpiCard metric={snapshot.kpis?.[3]} index={3} />
        </div>
        <div className="xl:col-span-2">
          <KpiCard metric={snapshot.kpis?.[4]} index={4} />
        </div>
        <div className="xl:col-span-2">
          <KpiCard metric={snapshot.kpis?.[5]} index={5} />
        </div>
      </motion.div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* User Growth — large */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="xl:col-span-2 chart-card"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Croissance des utilisatrices
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Utilisatrices totales vs abonnées Premium — {snapshot.rangeLabel}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={refreshing ? 'status-dot-active' : 'h-1.5 w-1.5 rounded-full bg-success'}
              />
              <span className="text-xs text-muted-foreground">
                Mis à jour à{' '}
                {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
                  lastUpdatedAt
                )}
              </span>
            </div>
          </div>
          <UserGrowthChart data={snapshot.userGrowth} />
        </motion.div>

        {/* Objective Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="chart-card"
        >
          <div className="mb-5">
            <h2 className="font-display text-base font-semibold text-foreground">
              Répartition par objectif
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribution des {snapshot.totalUsers.toLocaleString('fr-FR')} utilisatrices —{' '}
              {snapshot.rangeLabel}
            </p>
          </div>
          <ObjectiveChart data={snapshot.objectiveDistribution} />
        </motion.div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Premium Conversion */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="chart-card"
        >
          <div className="mb-5">
            <h2 className="font-display text-base font-semibold text-foreground">
              Conversion FREE → Premium
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Évolution sur 6 mois</p>
          </div>
          <PremiumConversionChart />
        </motion.div>

        {/* Country Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="chart-card"
        >
          <div className="mb-5">
            <h2 className="font-display text-base font-semibold text-foreground">
              Répartition géographique
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Par pays d&apos;inscription</p>
          </div>
          <CountryDistribution />
        </motion.div>

        {/* Right column: Alerts + Quick Actions stacked */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col gap-5"
        >
          {/* À traiter */}
          <div className="card-base p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-foreground">À traiter</h2>
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white"
                style={{ background: 'var(--danger)' }}
              >
                {mockAlerts?.reduce((s, a) => s + a?.count, 0) > 99
                  ? '99+'
                  : mockAlerts?.reduce((s, a) => s + a?.count, 0)}
              </span>
            </div>
            <AlertsPanel alerts={mockAlerts} />
          </div>

          {/* Quick Actions */}
          <div className="card-base p-5">
            <h2 className="font-display text-base font-semibold text-foreground mb-4">
              Actions rapides
            </h2>
            <QuickActions />
          </div>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="card-base p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Activité récente
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Événements plateforme — {snapshot.rangeLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivityDialogOpen(true)}
            className="text-xs font-semibold text-primary hover:text-primary-light transition-colors"
          >
            Voir tout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-8">
          {/* Split into 3 columns on large screens */}
          <div className="lg:col-span-1">
            <ActivityFeed items={snapshot.activity?.slice(0, activityColumnSize)} />
          </div>
          <div className="hidden lg:block">
            <ActivityFeed
              items={snapshot.activity?.slice(activityColumnSize, activityColumnSize * 2)}
            />
          </div>
          <div className="hidden xl:block">
            <ActivityFeed items={snapshot.activity?.slice(activityColumnSize * 2)} />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {activityDialogOpen && (
          <Modal
            title="Toutes les activités récentes"
            subtitle="Journal complet des événements plateforme (données agrégées)"
            onClose={() => setActivityDialogOpen(false)}
            wide
          >
            <div className="max-h-[65vh] overflow-y-auto p-5 sm:p-6">
              <ActivityFeed items={mockRecentActivity} />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.65 }}
        className="flex items-start gap-3 p-4 rounded-xl border border-primary-pale bg-primary-ghost/50"
      >
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-4 h-4 rounded-full bg-primary-pale flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Données agrégées uniquement.</span> Ce
          tableau de bord affiche exclusivement des métriques anonymisées. Aucune donnée de santé
          individuelle n&apos;est exposée conformément à la politique de confidentialité AWA et aux
          exigences RGPD.
        </p>
      </motion.div>
    </div>
  );
}
