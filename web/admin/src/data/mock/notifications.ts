// Admin-side notification CAMPAIGN drafts/schedule/history — this is entirely
// distinct from mobile's existing LOCAL reminder scheduling (cycle, Nifas,
// Qadaa reminders scheduled on-device via @notifee/react-native). No push
// backend exists yet: every action here is session-only and never claims a
// real push notification was delivered. Audience segments and estimated
// counts reuse the same sources as the rest of the admin (subscription plan
// subscriber counts, dashboard objective distribution) rather than inventing
// new numbers.
import { mockObjectiveDistribution } from './dashboard';
import { subscriptionPlans } from './subscriptions';

export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';

export interface NotificationCampaign {
  id: string;
  name: string;
  title: string;
  message: string;
  audienceKey: string;
  deepLink?: string;
  status: NotificationStatus;
  scheduledAt?: string;
  sentAt?: string;
  createdBy: string;
  createdAt: string;
  deliveredCount?: number;
  openedCount?: number;
}

const freeCount = subscriptionPlans.find((plan) => plan.code === 'FREE')?.subscriberCount ?? 0;
const premiumCount = subscriptionPlans
  .filter((plan) => plan.type === 'premium')
  .reduce((sum, plan) => sum + plan.subscriberCount, 0);

export const AUDIENCE_OPTIONS: Array<{ key: string; label: string; estimatedCount: number }> = [
  { key: 'all', label: 'Toutes les utilisatrices', estimatedCount: freeCount + premiumCount },
  { key: 'free', label: 'Gratuit', estimatedCount: freeCount },
  { key: 'premium', label: 'Premium', estimatedCount: premiumCount },
  ...mockObjectiveDistribution.map((item) => ({
    key: `objective:${item.name}`,
    label: `Objectif — ${item.name}`,
    estimatedCount: item.value,
  })),
];

export function audienceLabel(key: string) {
  return AUDIENCE_OPTIONS.find((option) => option.key === key)?.label ?? key;
}

export function audienceEstimatedCount(key: string) {
  return AUDIENCE_OPTIONS.find((option) => option.key === key)?.estimatedCount ?? 0;
}

export const initialNotificationCampaigns: NotificationCampaign[] = [
  {
    id: 'notif-001',
    name: 'Ramadan — nouveau contenu',
    title: 'Nouveau contenu Ramadan disponible',
    message: 'Découvre nos repères spirituels et articles dédiés au mois de Ramadan.',
    audienceKey: 'all',
    deepLink: '/admin/reperes-spirituels/ramadan-qadaa',
    status: 'sent',
    sentAt: '2026-09-03T14:45:00+01:00',
    createdBy: 'Sarah',
    createdAt: '2026-09-03T09:00:00+01:00',
    deliveredCount: 24846,
    openedCount: 10435,
  },
  {
    id: 'notif-002',
    name: 'Relance Premium — statistiques',
    title: 'Débloque tes statistiques avancées',
    message: 'Passe en Premium pour suivre tes tendances sur 3, 6 ou 12 mois.',
    audienceKey: 'free',
    deepLink: '/admin/abonnements/plans',
    status: 'sent',
    sentAt: '2026-08-28T10:00:00+01:00',
    createdBy: 'Admin',
    createdAt: '2026-08-27T16:20:00+01:00',
    deliveredCount: freeCount,
    openedCount: Math.round(freeCount * 0.18),
  },
  {
    id: 'notif-003',
    name: 'SOPK — nouvel article',
    title: 'Un nouvel article sur le SOPK',
    message: 'Mieux comprendre les cycles irréguliers : notre nouveau guide est disponible.',
    audienceKey: 'objective:SOPK',
    status: 'scheduled',
    scheduledAt: '2026-09-12T09:00:00+01:00',
    createdBy: 'Sarah',
    createdAt: '2026-09-08T11:30:00+01:00',
  },
  {
    id: 'notif-004',
    name: 'Rappel export santé',
    title: 'Ton export santé est prêt',
    message: 'Rappel : exporte ton suivi avant ton prochain rendez-vous médical.',
    audienceKey: 'premium',
    status: 'scheduled',
    scheduledAt: '2026-09-15T08:00:00+01:00',
    createdBy: 'Admin',
    createdAt: '2026-09-08T15:10:00+01:00',
  },
  {
    id: 'notif-005',
    name: 'Message de bienvenue — brouillon',
    title: 'Bienvenue sur AWA',
    message: '',
    audienceKey: 'all',
    status: 'draft',
    createdBy: 'Sarah',
    createdAt: '2026-09-06T12:00:00+01:00',
  },
  {
    id: 'notif-006',
    name: 'Campagne Périménopause — annulée',
    title: 'Ressources périménopause mises à jour',
    message: 'De nouveaux repères pour mieux vivre cette période.',
    audienceKey: 'objective:Périménopause',
    status: 'cancelled',
    createdBy: 'Admin',
    createdAt: '2026-08-20T09:00:00+01:00',
  },
];
