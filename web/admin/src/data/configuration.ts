/**
 * Admin-side mirrors of the mobile configuration registries.
 *
 * The admin bundle cannot import React Native modules safely. Keep identifiers,
 * names and palette values aligned with the documented mobile sources below;
 * the UI deliberately labels mutations as session-only until an API exists.
 */

export type ObjectiveIconName =
  | 'cycle'
  | 'conceive'
  | 'contraception'
  | 'irregular'
  | 'pregnancy'
  | 'postpartum'
  | 'loss'
  | 'menopause';

export type AdminObjective = {
  id: string;
  name: string;
  description: string;
  icon: ObjectiveIconName;
  color: string;
  active: boolean;
  onboardingVisible: boolean;
  experimental: boolean;
  order: number;
};

// Sources: mobile/src/state/onboardingPreferences.ts,
// mobile/src/data/libraryObjectiveConfig.ts and objectiveConfirmationContent.ts.
export const INITIAL_OBJECTIVES: AdminObjective[] = [
  {
    id: 'cycle',
    name: 'Suivre mon cycle',
    description: 'Suivi classique du cycle',
    icon: 'cycle',
    color: '#8e6ccf',
    active: true,
    onboardingVisible: true,
    experimental: false,
    order: 1,
  },
  {
    id: 'conceive',
    name: 'Essayer de concevoir',
    description: 'Suivi de la fertilité et de l’ovulation',
    icon: 'conceive',
    color: '#c36c86',
    active: true,
    onboardingVisible: true,
    experimental: false,
    order: 2,
  },
  {
    id: 'contraception',
    name: 'Contraception',
    description: 'Suivi adapté à la contraception',
    icon: 'contraception',
    color: '#c66879',
    active: true,
    onboardingVisible: true,
    experimental: false,
    order: 3,
  },
  {
    id: 'irregular',
    // Verbatim label from mobile/src/screens/ObjectiveScreen.tsx's real onboarding picker.
    name: 'Cycles irréguliers (SOPK)',
    description: 'Observation des cycles, symptômes et tendances',
    icon: 'irregular',
    color: '#8664bb',
    active: true,
    onboardingVisible: true,
    experimental: false,
    order: 4,
  },
  {
    id: 'menopause',
    // Verbatim label (incl. casing) from mobile's real onboarding picker.
    name: 'périménopause / Ménopause',
    description: 'Suivi du bien-être et des symptômes au quotidien',
    icon: 'menopause',
    color: '#8d6fc2',
    active: true,
    onboardingVisible: true,
    experimental: false,
    order: 5,
  },
  {
    id: 'pregnancy',
    // Verbatim label from mobile's real onboarding picker.
    name: 'Suivi de grossesse',
    description: 'Suivi de la grossesse semaine après semaine',
    icon: 'pregnancy',
    color: '#4797a8',
    active: true,
    onboardingVisible: true,
    experimental: false,
    order: 6,
  },
  {
    id: 'postpartum',
    name: 'Post-partum',
    description: 'Récupération, lochies et bien-être quotidien',
    icon: 'postpartum',
    color: '#d39a42',
    active: true,
    onboardingVisible: true,
    experimental: false,
    order: 7,
  },
  {
    id: 'loss',
    name: 'Après une fausse couche',
    description: 'Suivi adapté à la récupération et au bien-être',
    icon: 'loss',
    color: '#c97989',
    active: true,
    onboardingVisible: true,
    experimental: false,
    order: 8,
  },
];

export type FeatureFlagCategory = 'Fonctionnalités' | 'Contenu' | 'Premium';

export type AdminFeatureFlag = {
  id: string;
  name: string;
  description: string;
  category: FeatureFlagCategory;
  enabled: boolean;
  icon: 'library' | 'moon' | 'export' | 'chart' | 'palette' | 'anonymous' | 'bell' | 'reminder';
};

// Each item maps to a shipped mobile capability. This is not a remote flag
// service; the switches are an explicit admin-session preview.
export const INITIAL_FEATURE_FLAGS: AdminFeatureFlag[] = [
  {
    id: 'library-articles',
    name: 'Bibliothèque d’articles',
    description: 'Accès à la bibliothèque éducative',
    category: 'Contenu',
    enabled: true,
    icon: 'library',
  },
  {
    id: 'religious-content',
    name: 'Contenu religieux',
    description: 'Articles et repères spirituels',
    category: 'Contenu',
    enabled: true,
    icon: 'moon',
  },
  {
    id: 'medical-export',
    name: 'Export des données',
    description: 'Export médical PDF et CSV',
    category: 'Fonctionnalités',
    enabled: true,
    icon: 'export',
  },
  {
    id: 'advanced-statistics',
    name: 'Statistiques avancées',
    description: 'Analyses détaillées réservées au plan Premium',
    category: 'Premium',
    enabled: true,
    icon: 'chart',
  },
  {
    id: 'custom-themes',
    name: 'Thèmes personnalisés',
    description: 'Palettes AWA réservées au plan Premium',
    category: 'Premium',
    enabled: true,
    icon: 'palette',
  },
  {
    id: 'anonymous-mode',
    name: 'Mode anonyme',
    description: 'Compte et profil anonymes',
    category: 'Fonctionnalités',
    enabled: true,
    icon: 'anonymous',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Notifications locales discrètes',
    category: 'Fonctionnalités',
    enabled: true,
    icon: 'bell',
  },
  {
    id: 'tracking-reminders',
    name: 'Rappels de suivi',
    description: 'Rappels de cycle, contraception et objectifs',
    category: 'Fonctionnalités',
    enabled: true,
    icon: 'reminder',
  },
];

export type AdminTheme = {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  enabled: boolean;
  isDefault: boolean;
  order: number;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
  };
};

// Exact visible registry from mobile/src/config/awaThemes.ts. The internal,
// disabled Midnight token set is intentionally excluded from this page.
export const INITIAL_THEMES: AdminTheme[] = [
  {
    id: 'awa-original',
    name: 'AWA Original',
    description: 'Doux et harmonieux',
    isPremium: false,
    enabled: true,
    isDefault: true,
    order: 0,
    colors: {
      background: '#FCFAFF',
      surface: '#FFFFFF',
      primary: '#6D4AE8',
      secondary: '#DC7B82',
      text: '#2F2258',
    },
  },
  {
    id: 'lavender-night',
    name: 'Lavender Night',
    description: 'Élégant et apaisant',
    isPremium: true,
    enabled: true,
    isDefault: false,
    order: 1,
    colors: {
      background: '#1C1730',
      surface: '#2A2145',
      primary: '#B79CF2',
      secondary: '#8C74D6',
      text: '#F5F1FF',
    },
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    description: 'Doux et féminin',
    isPremium: true,
    enabled: true,
    isDefault: false,
    order: 2,
    colors: {
      background: '#FBF3F1',
      surface: '#FFFFFF',
      primary: '#C08B93',
      secondary: '#D9AFAE',
      text: '#4A2E37',
    },
  },
  {
    id: 'sage-serenity',
    name: 'Sage Serenity',
    description: 'Naturel et équilibré',
    isPremium: true,
    enabled: true,
    isDefault: false,
    order: 3,
    colors: {
      background: '#F6F5EE',
      surface: '#FFFFFF',
      primary: '#7C9473',
      secondary: '#A9B98F',
      text: '#3B3A2E',
    },
  },
  {
    id: 'ocean-calm',
    name: 'Ocean Calm',
    description: 'Calme et rafraîchissant',
    isPremium: true,
    enabled: true,
    isDefault: false,
    order: 4,
    colors: {
      background: '#F2F7F9',
      surface: '#FFFFFF',
      primary: '#5C8CA6',
      secondary: '#8FB4C4',
      text: '#233238',
    },
  },
  {
    id: 'warm-sand',
    name: 'Warm Sand',
    description: 'Chaleureux et naturel',
    isPremium: true,
    enabled: true,
    isDefault: false,
    order: 5,
    colors: {
      background: '#FAF5EC',
      surface: '#FFFFFF',
      primary: '#B08A5C',
      secondary: '#CBA97C',
      text: '#4A3A28',
    },
  },
];

export const DEFAULT_GLOBAL_SETTINGS = {
  appName: 'AWA',
  version: '1.0',
  description: 'Pour des femmes plus sereines',
  language: 'Français',
  timezone: 'Selon l’appareil',
  dateFormat: 'JJ/MM/AAAA',
} as const;

export function normalizeConfigurationSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('fr-FR');
}
