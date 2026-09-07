import { mockUsers } from '@/data/mock/users';
import type {
  AdminSupportTicket,
  AnalyticsDataset,
  AnalyticsDatasets,
  AnalyticsPeriod,
  MedicalExportFormat,
  MedicalExportOverview,
  MedicalExportStatus,
  MedicalExportType,
  SupportCategory,
  SupportOverview,
  SupportPriority,
  SupportStatus,
} from '@/types/adminOperations';

const exportTypes: MedicalExportType[] = [
  'cycle',
  'complete',
  'medical_history',
  'medical_report',
  'symptoms',
  'fertility',
  'pregnancy',
  'tracking',
];
const exportStatuses: MedicalExportStatus[] = [
  'completed',
  'processing',
  'pending',
  'failed',
  'completed',
  'expired',
  'completed',
  'cancelled',
];
const exportFormats: MedicalExportFormat[] = ['PDF', 'CSV', 'ZIP'];
const exportPeriods = [
  '01 août – 31 août 2026',
  '3 derniers mois',
  'Année 2026',
  'Historique complet',
];

export const medicalExportOverview: MedicalExportOverview = {
  kpis: [
    {
      id: 'exports-total',
      label: 'Exportations totales',
      value: 256,
      trend: 12.5,
      tone: 'primary',
      icon: 'database',
    },
    {
      id: 'exports-success',
      label: 'Exports réussis',
      value: 187,
      trend: 8.3,
      tone: 'success',
      icon: 'check',
    },
    {
      id: 'exports-processing',
      label: 'Exports en cours',
      value: 48,
      trend: 2.1,
      tone: 'info',
      icon: 'clock',
    },
    {
      id: 'exports-failed',
      label: 'Exports échoués',
      value: 21,
      trend: -6.7,
      tone: 'danger',
      icon: 'alert',
    },
    {
      id: 'exports-time',
      label: 'Temps moyen de traitement',
      value: '2 min 14 s',
      trend: -18.2,
      tone: 'warning',
      icon: 'timer',
    },
  ],
  distribution: [
    { name: 'Données cycle', value: 102, color: '#6f5a8a' },
    { name: 'Données complètes', value: 64, color: '#8d79a8' },
    { name: 'Historique médical', value: 51, color: '#5a7ec4' },
    { name: 'Rapports', value: 39, color: '#c4882a' },
  ],
  requests: Array.from({ length: 18 }, (_, index) => {
    const user = mockUsers[index % mockUsers.length];
    const status = exportStatuses[index % exportStatuses.length];
    const requestedAt = new Date(Date.UTC(2026, 8, 5 - index, 9 + (index % 7), 12));
    const startedAt = new Date(requestedAt.getTime() + 45_000);
    const completedAt = new Date(requestedAt.getTime() + (90 + index * 6) * 1_000);

    return {
      id: `EXP-2026-${String(89 - index).padStart(4, '0')}`,
      userId: user.id,
      userDisplayId: user.displayId,
      userName: user.name,
      userEmail: user.email ?? '—',
      type: exportTypes[index % exportTypes.length],
      period: exportPeriods[index % exportPeriods.length],
      format: exportFormats[index % exportFormats.length],
      requestedAt: requestedAt.toISOString(),
      startedAt:
        status !== 'pending' && status !== 'cancelled' ? startedAt.toISOString() : undefined,
      completedAt: status === 'completed' ? completedAt.toISOString() : undefined,
      expiresAt:
        status === 'completed'
          ? new Date(completedAt.getTime() + 7 * 86_400_000).toISOString()
          : undefined,
      status,
      sizeBytes:
        status === 'completed' || status === 'expired' ? 820_000 + index * 174_000 : undefined,
      requestedBy: index % 4 === 0 ? user.name : 'Admin',
      errorMessage:
        status === 'failed'
          ? 'La génération du fichier a été interrompue. Aucun fichier médical n’a été conservé.'
          : undefined,
    };
  }),
};

const supportSubjects = [
  'Impossible de restaurer mon abonnement',
  'Synchronisation du calendrier',
  'Question sur mon paiement annuel',
  'Notification reçue en double',
  'Accès à un contenu Premium',
  'Modifier mon adresse e-mail',
  'Demande concernant un export médical',
  'Affichage du calendrier Hijri',
  'Problème de connexion à l’application',
  'Comprendre une fonctionnalité de suivi',
];
const supportCategories: SupportCategory[] = [
  'subscription',
  'application',
  'payment',
  'notifications',
  'content',
  'account',
  'medical_export',
  'feature',
  'application',
  'data',
];
const supportPriorities: SupportPriority[] = ['high', 'medium', 'urgent', 'low'];
const supportStatuses: SupportStatus[] = [
  'new',
  'in_progress',
  'waiting',
  'resolved',
  'in_progress',
  'closed',
];

const supportTickets: AdminSupportTicket[] = Array.from({ length: 18 }, (_, index) => {
  const user = mockUsers[(index + 3) % mockUsers.length];
  const createdAt = new Date(Date.UTC(2026, 8, 5 - index, 8 + (index % 8), 20));
  const updatedAt = new Date(createdAt.getTime() + (index + 1) * 3_600_000);
  const status = supportStatuses[index % supportStatuses.length];
  const assigned = status !== 'new' && index % 3 !== 0;

  return {
    id: `SUP-${String(1248 - index).padStart(6, '0')}`,
    userId: user.id,
    userDisplayId: user.displayId,
    userName: user.name,
    userEmail: user.email ?? '—',
    subject: supportSubjects[index % supportSubjects.length],
    category: supportCategories[index % supportCategories.length],
    priority: supportPriorities[index % supportPriorities.length],
    status,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    assignedTo: assigned ? 'Admin' : undefined,
    messages: [
      {
        id: `MSG-${index + 1}-1`,
        senderName: user.name,
        senderRole: 'user',
        content:
          'Bonjour, je rencontre cette difficulté depuis aujourd’hui. Pouvez-vous vérifier mon compte et m’indiquer la marche à suivre ?',
        createdAt: createdAt.toISOString(),
        internal: false,
      },
      ...(assigned
        ? [
            {
              id: `MSG-${index + 1}-2`,
              senderName: 'Admin',
              senderRole: 'admin' as const,
              content:
                'Bonjour, merci pour votre message. Nous avons bien pris en charge votre demande et vérifions les éléments disponibles.',
              createdAt: new Date(createdAt.getTime() + 2_700_000).toISOString(),
              internal: false,
            },
          ]
        : []),
    ],
  };
});

export const supportOverview: SupportOverview = {
  kpis: [
    {
      id: 'tickets-total',
      label: 'Tickets totaux',
      value: 124,
      trend: 9.2,
      tone: 'primary',
      icon: 'tickets',
    },
    {
      id: 'tickets-resolved',
      label: 'Résolus',
      value: 98,
      trend: 12.4,
      tone: 'success',
      icon: 'resolved',
    },
    {
      id: 'tickets-progress',
      label: 'En cours',
      value: 18,
      trend: -3.1,
      tone: 'info',
      icon: 'progress',
    },
    {
      id: 'tickets-waiting',
      label: 'En attente',
      value: 8,
      trend: -5.6,
      tone: 'warning',
      icon: 'waiting',
    },
    {
      id: 'response-time',
      label: 'Temps moyen de réponse',
      value: '38 min',
      trend: -14.2,
      tone: 'success',
      icon: 'timer',
    },
  ],
  tickets: supportTickets,
};

const baseContent = [
  ['Comprendre les phases du cycle menstruel', 'Cycle menstruel', 18420, 14218, 77],
  ['Le calendrier Hijri au quotidien', 'Article religieux', 15980, 13264, 83],
  ['SOPK : mieux comprendre ses symptômes', 'Contenu Premium', 13740, 10580, 77],
  ['Préparer une consultation médicale', 'Santé', 11960, 9688, 81],
  ['Ramadan et suivi du cycle', 'Article religieux', 10820, 8981, 83],
] as const;

const periodConfig: Record<
  AnalyticsPeriod,
  { label: string; factor: number; trend: number; labels: string[] }
> = {
  '7d': {
    label: '7 derniers jours',
    factor: 0.94,
    trend: 0.62,
    labels: ['31 août', '1 sept.', '2 sept.', '3 sept.', '4 sept.', '5 sept.', '6 sept.'],
  },
  '30d': {
    label: '30 derniers jours',
    factor: 1,
    trend: 1,
    labels: ['8 août', '13 août', '18 août', '23 août', '28 août', '2 sept.', '6 sept.'],
  },
  '3m': {
    label: '3 derniers mois',
    factor: 0.88,
    trend: 1.32,
    labels: ['Juin', 'Mi-juin', 'Juillet', 'Mi-juil.', 'Août', 'Mi-août', 'Sept.'],
  },
  '6m': {
    label: '6 derniers mois',
    factor: 0.76,
    trend: 1.58,
    labels: ['Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.'],
  },
  '12m': {
    label: '12 derniers mois',
    factor: 0.61,
    trend: 2.15,
    labels: ['Oct.', 'Déc.', 'Févr.', 'Avr.', 'Juin', 'Août', 'Sept.'],
  },
  custom: {
    label: 'Période personnalisée',
    factor: 0.83,
    trend: 1.2,
    labels: ['Début', 'S1', 'S2', 'S3', 'S4', 'S5', 'Fin'],
  },
};

function scale(value: number, factor: number) {
  return Math.round(value * factor);
}

function buildAnalyticsDataset(period: AnalyticsPeriod): AnalyticsDataset {
  const config = periodConfig[period];
  const total = scale(24846, config.factor);
  const active = scale(15920, config.factor);
  const premium = scale(4280, config.factor);
  const monthly = scale(3438, config.factor);
  const annual = scale(842, config.factor);
  const free = Math.max(0, total - monthly - annual);
  const acquisitionValues = [0.42, 0.28, 0.15, 0.1];
  const acquisitionCounts = acquisitionValues.map((share) => Math.round(total * share));
  const acquisitionOther = total - acquisitionCounts.reduce((sum, value) => sum + value, 0);
  const countryBases = [
    ['France', 'FR', 11240, 2140, 19],
    ['Algérie', 'DZ', 6820, 980, 14.4],
    ['Maroc', 'MA', 4180, 740, 17.7],
    ['Tunisie', 'TN', 1640, 280, 17.1],
    ['Belgique', 'BE', 620, 110, 17.7],
    ['Canada', 'CA', 346, 30, 8.7],
  ] as const;

  return {
    period,
    periodLabel: config.label,
    kpis: [
      {
        id: 'analytics-total',
        label: 'Utilisatrices totales',
        value: total,
        trend: 12.8 * config.trend,
        format: 'number',
        icon: 'users',
      },
      {
        id: 'analytics-active',
        label: 'Utilisatrices actives',
        value: active,
        trend: 4.3 * config.trend,
        format: 'number',
        icon: 'activity',
      },
      {
        id: 'analytics-premium',
        label: 'Abonnements Premium',
        value: premium,
        trend: 8.4 * config.trend,
        format: 'number',
        icon: 'premium',
      },
      {
        id: 'analytics-mrr',
        label: 'Revenu mensuel (MRR)',
        value: scale(18420, config.factor),
        trend: 7.4 * config.trend,
        format: 'currency',
        icon: 'revenue',
      },
    ],
    userGrowth: config.labels.map((label, index) => ({
      label,
      total: Math.round(total * (0.9 + index * (0.1 / Math.max(config.labels.length - 1, 1)))),
      active: Math.round(active * (0.88 + index * (0.12 / Math.max(config.labels.length - 1, 1)))),
    })),
    acquisition: [
      { name: 'App Store', value: acquisitionCounts[0], color: '#654474' },
      { name: 'Google Play', value: acquisitionCounts[1], color: '#8d79a8' },
      { name: 'Réseaux sociaux', value: acquisitionCounts[2], color: '#5a7ec4' },
      { name: 'Recommandations', value: acquisitionCounts[3], color: '#4a9b7f' },
      { name: 'Autres', value: acquisitionOther, color: '#c4882a' },
    ],
    engagement: [
      {
        label: 'DAU',
        value: scale(6240, config.factor).toLocaleString('fr-FR'),
        change: 5.8 * config.trend,
      },
      {
        label: 'WAU',
        value: scale(11860, config.factor).toLocaleString('fr-FR'),
        change: 7.1 * config.trend,
      },
      { label: 'MAU', value: active.toLocaleString('fr-FR'), change: 4.3 * config.trend },
      {
        label: 'Session moyenne',
        value: `${Math.round(7 * config.factor)} min 42 s`,
        change: 3.6 * config.trend,
      },
      {
        label: 'Taux de retour',
        value: `${(64.8 * Math.min(config.factor + 0.06, 1)).toFixed(1)}%`,
        change: 2.4 * config.trend,
      },
    ],
    retention: [
      { label: 'J1', value: Math.round(74 * Math.min(config.factor + 0.08, 1)) },
      { label: 'J7', value: Math.round(58 * Math.min(config.factor + 0.08, 1)) },
      { label: 'J30', value: Math.round(41 * Math.min(config.factor + 0.08, 1)) },
    ],
    subscriptions: [
      { plan: 'Gratuit', users: free, share: 83, color: '#b8a6cb' },
      { plan: 'Premium Mensuel', users: monthly, share: 14, color: '#654474' },
      { plan: 'Premium Annuel', users: annual, share: 3, color: '#c4882a' },
    ],
    conversion: [
      { label: 'Utilisatrices', value: total },
      { label: 'Consultation Premium', value: Math.round(total * 0.31) },
      { label: 'Début abonnement', value: Math.round(total * 0.19) },
      { label: 'Abonnement confirmé', value: premium },
    ],
    content: baseContent.map(([title, category, views, reads, completionRate], index) => ({
      id: `content-${index + 1}`,
      title,
      category,
      views: scale(views, config.factor),
      completedReads: scale(reads, config.factor),
      completionRate,
    })),
    spiritualUsage: [
      {
        label: 'Calendrier Hijri',
        users: scale(8420, config.factor),
        sessions: scale(18240, config.factor),
      },
      {
        label: 'Ramadan / Qadaa',
        users: scale(5180, config.factor),
        sessions: scale(9860, config.factor),
      },
      { label: 'Nifas', users: scale(2840, config.factor), sessions: scale(4920, config.factor) },
      {
        label: 'Articles religieux',
        users: scale(7260, config.factor),
        sessions: scale(14580, config.factor),
      },
    ],
    countries: countryBases.map(([country, code, users, countryPremium, conversion]) => ({
      country,
      code,
      users: scale(users, config.factor),
      premium: scale(countryPremium, config.factor),
      conversion,
    })),
  };
}

export const analyticsDatasets = Object.fromEntries(
  (Object.keys(periodConfig) as AnalyticsPeriod[]).map((period) => [
    period,
    buildAnalyticsDataset(period),
  ])
) as AnalyticsDatasets;
