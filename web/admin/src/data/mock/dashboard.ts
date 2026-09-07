// ─────────────────────────────────────────────
// AWA Admin — Dashboard Mock Data
// Backend integration point: replace with API calls to /api/dashboard/*
// ─────────────────────────────────────────────

import type { KpiMetric, ChartDataPoint, ActivityItem, AlertItem } from '@/types';

export const mockKpis: KpiMetric[] = [
  {
    id: 'kpi-total-users',
    label: 'Utilisatrices totales',
    value: 24846,
    change: 12.8,
    changeLabel: 'vs mois dernier',
    trend: 'up',
    format: 'number',
    icon: 'Users',
    color: 'primary',
  },
  {
    id: 'kpi-active-users',
    label: 'Utilisatrices actives',
    value: 15920,
    change: 4.3,
    changeLabel: 'vs semaine dernière',
    trend: 'up',
    format: 'number',
    icon: 'Activity',
    color: 'success',
  },
  {
    id: 'kpi-premium',
    label: 'Abonnements Premium',
    value: 4280,
    change: 8.4,
    changeLabel: 'vs mois dernier',
    trend: 'up',
    format: 'number',
    icon: 'Star',
    color: 'primary',
  },
  {
    id: 'kpi-mrr',
    label: 'Revenu mensuel (MRR)',
    value: 18420,
    change: 6.1,
    changeLabel: 'vs mois dernier',
    trend: 'up',
    format: 'currency',
    icon: 'TrendingUp',
    color: 'success',
  },
  {
    id: 'kpi-new-registrations',
    label: 'Nouvelles inscriptions',
    value: 1248,
    change: -3.2,
    changeLabel: 'vs semaine dernière',
    trend: 'down',
    format: 'number',
    icon: 'UserPlus',
    color: 'warning',
  },
  {
    id: 'kpi-premium-rate',
    label: 'Taux Premium',
    value: 17.2,
    change: 1.4,
    changeLabel: 'vs mois dernier',
    trend: 'up',
    format: 'percent',
    icon: 'Percent',
    color: 'info',
  },
];

export const mockUserGrowthData: ChartDataPoint[] = [
  { date: '04 août', value: 22410, secondary: 3680 },
  { date: '07 août', value: 22780, secondary: 3740 },
  { date: '10 août', value: 23050, secondary: 3810 },
  { date: '13 août', value: 22920, secondary: 3790 },
  { date: '16 août', value: 23380, secondary: 3870 },
  { date: '19 août', value: 23760, secondary: 3940 },
  { date: '22 août', value: 23540, secondary: 3900 },
  { date: '25 août', value: 24010, secondary: 4020 },
  { date: '28 août', value: 24380, secondary: 4110 },
  { date: '31 août', value: 24200, secondary: 4080 },
  { date: '03 sep', value: 24620, secondary: 4190 },
  { date: '03 sep', value: 24846, secondary: 4280 },
];

export const mockObjectiveDistribution = [
  { name: 'Cycle menstruel', value: 8240, color: '#6F5A8A' },
  { name: 'Essayer de concevoir', value: 4180, color: '#8D79A8' },
  { name: 'Contraception', value: 3960, color: '#B8A6CB' },
  { name: 'SOPK', value: 2840, color: '#4A9B7F' },
  { name: 'Grossesse', value: 2420, color: '#C4882A' },
  { name: 'Post-partum', value: 1680, color: '#5A7EC4' },
  { name: 'Après fausse couche', value: 820, color: '#C45A5A' },
  { name: 'Périménopause', value: 706, color: '#6A6270' },
];

export const mockCountryData = [
  { country: 'France', users: 11240, premium: 2140, flag: '🇫🇷' },
  { country: 'Algérie', users: 6820, premium: 980, flag: '🇩🇿' },
  { country: 'Maroc', users: 4180, premium: 740, flag: '🇲🇦' },
  { country: 'Tunisie', users: 1640, premium: 280, flag: '🇹🇳' },
  { country: 'Belgique', users: 620, premium: 110, flag: '🇧🇪' },
  { country: 'Canada', users: 346, premium: 30, flag: '🇨🇦' },
];

export const mockRecentActivity: ActivityItem[] = [
  {
    id: 'act-001',
    type: 'new_user',
    title: 'Nouvelle inscription',
    description: 'Utilisatrice #AWA-24846 depuis France',
    timestamp: '2026-09-03T18:14:00Z',
    icon: 'UserPlus',
    color: 'primary',
  },
  {
    id: 'act-002',
    type: 'premium_sub',
    title: 'Nouvel abonnement Premium',
    description: 'Plan annuel — Apple App Store — France',
    timestamp: '2026-09-03T17:52:00Z',
    icon: 'Star',
    color: 'success',
  },
  {
    id: 'act-003',
    type: 'article_published',
    title: 'Article publié',
    description: '"Comprendre votre cycle après 40 ans" par Dr. Amina Khelil',
    timestamp: '2026-09-03T16:30:00Z',
    icon: 'FileText',
    color: 'info',
  },
  {
    id: 'act-004',
    type: 'religious_validated',
    title: 'Article religieux validé',
    description: '"Istihâda et pratique de la prière" — Validé par Cheikh Mourad',
    timestamp: '2026-09-03T15:18:00Z',
    icon: 'CheckCircle',
    color: 'success',
  },
  {
    id: 'act-005',
    type: 'notification_scheduled',
    title: 'Notification programmée',
    description: '"Nouveau contenu Ramadan disponible" — 12 800 destinataires',
    timestamp: '2026-09-03T14:45:00Z',
    icon: 'Bell',
    color: 'primary',
  },
  {
    id: 'act-006',
    type: 'deletion_request',
    title: 'Demande de suppression',
    description: 'Utilisatrice #AWA-18432 — Délai RGPD : 30 jours',
    timestamp: '2026-09-03T13:22:00Z',
    icon: 'Trash2',
    color: 'danger',
  },
  {
    id: 'act-007',
    type: 'support_ticket',
    title: 'Nouveau ticket support',
    description: 'Problème de synchronisation abonnement — Priorité haute',
    timestamp: '2026-09-03T12:10:00Z',
    icon: 'MessageSquare',
    color: 'warning',
  },
];

export const mockAlerts: AlertItem[] = [
  {
    id: 'alert-001',
    label: 'contenus en attente de validation',
    count: 12,
    href: '/admin/contenus/articles',
    severity: 'warning',
  },
  {
    id: 'alert-002',
    label: 'demandes de suppression (RGPD)',
    count: 4,
    href: '/admin/securite/demandes-donnees',
    severity: 'danger',
  },
  {
    id: 'alert-003',
    label: 'tickets support ouverts',
    count: 7,
    href: '/admin/support',
    severity: 'warning',
  },
  {
    id: 'alert-004',
    label: 'paiements échoués',
    count: 2,
    href: '/admin/abonnements',
    severity: 'danger',
  },
  {
    id: 'alert-005',
    label: 'articles religieux à valider',
    count: 3,
    href: '/admin/reperes-spirituels/validations',
    severity: 'info',
  },
];

export const mockPremiumConversionData = [
  { month: 'Avr', free: 19840, premium: 3410 },
  { month: 'Mai', free: 20360, premium: 3620 },
  { month: 'Juin', free: 20980, premium: 3780 },
  { month: 'Jul', free: 21420, premium: 3940 },
  { month: 'Aoû', free: 20566, premium: 4280 },
  { month: 'Sep', free: 20566, premium: 4280 },
];
