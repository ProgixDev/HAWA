import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {MenopauseSymptom} from '../state/menopausePreferences';
import type {MenopauseJournalCategory} from '../state/menopauseJournalStore';
import type {MoodLevel} from '../types/journal';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

/* ============================================================
 * PREMIUM AWA MENOPAUSE PALETTE
 * ============================================================
 *
 * Keep the visual language calm and consistent:
 *
 * - Purple = primary / general tracking
 * - Rose = symptoms / mood
 * - Blue = sleep / cognition
 * - Amber = energy
 * - Green = treatment
 * - Teal = analyses
 *
 * Tints remain intentionally very soft.
 */

const MENOPAUSE_COLORS = {
  purple: '#6949BE',
  purpleSoft: '#F1ECFA',

  rose: '#B85C7A',
  roseSoft: '#F9EDF1',

  blue: '#667DB4',
  blueSoft: '#EDF1F8',

  amber: '#B9823D',
  amberSoft: '#F8F1E7',

  green: '#56866B',
  greenSoft: '#EDF4EF',

  teal: '#4D8791',
  tealSoft: '#EAF3F4',

  neutral: '#776C92',
  neutralSoft: '#F3F0F7',
} as const;

/* ============================================================
 * JOURNAL QUOTIDIEN
 * ============================================================ */

export const MENOPAUSE_JOURNAL_ITEMS: Array<{
  key: MenopauseJournalCategory;
  label: string;
  icon: IconName;
  journalSubtitle: string;
  tint: string;
  iconColor: string;
}> = [
  {
    key: 'symptoms',
    label: 'Symptômes',
    icon: 'heart-pulse',
    journalSubtitle: 'Note les sensations et changements ressentis aujourd’hui',
    tint: MENOPAUSE_COLORS.roseSoft,
    iconColor: MENOPAUSE_COLORS.rose,
  },

  {
    key: 'mood',
    label: 'Humeur',
    icon: 'emoticon-outline',
    journalSubtitle: 'Prends un instant pour noter comment tu te sens',
    tint: MENOPAUSE_COLORS.purpleSoft,
    iconColor: MENOPAUSE_COLORS.purple,
  },

  {
    key: 'sleep',
    label: 'Sommeil',
    icon: 'weather-night',
    journalSubtitle: 'Note la durée et la qualité de ta nuit',
    tint: MENOPAUSE_COLORS.blueSoft,
    iconColor: MENOPAUSE_COLORS.blue,
  },

  {
    key: 'energy',
    label: 'Énergie / Fatigue',
    icon: 'lightning-bolt-outline',
    journalSubtitle: 'Indique ton niveau d’énergie ressenti aujourd’hui',
    tint: MENOPAUSE_COLORS.amberSoft,
    iconColor: MENOPAUSE_COLORS.amber,
  },

  {
    key: 'treatment',
    label: 'Traitement hormonal',
    icon: 'pill',
    journalSubtitle: 'Garde une trace de ton traitement aujourd’hui',
    tint: MENOPAUSE_COLORS.greenSoft,
    iconColor: MENOPAUSE_COLORS.green,
  },

  {
    key: 'labResults',
    label: 'Résultats d’analyses',
    icon: 'flask-outline',
    journalSubtitle: 'Ajoute un résultat FSH ou Estradiol',
    tint: MENOPAUSE_COLORS.tealSoft,
    iconColor: MENOPAUSE_COLORS.teal,
  },

  {
    key: 'notes',
    label: 'Notes du jour',
    icon: 'notebook-outline',
    journalSubtitle: 'Ajoute une information personnelle à ton suivi',
    tint: MENOPAUSE_COLORS.purpleSoft,
    iconColor: MENOPAUSE_COLORS.purple,
  },
];

/* ============================================================
 * SYMPTÔMES
 * ============================================================
 *
 * Same six canonical product symptoms.
 *
 * Icons are deliberately restrained and visually consistent.
 */

export const MENOPAUSE_SYMPTOM_OPTIONS: Array<{
  id: MenopauseSymptom;
  label: string;
  icon: IconName;
  tint: string;
  iconColor: string;
}> = [
  {
    id: 'hot_flashes',
    label: 'Bouffées de chaleur',
    icon: 'weather-sunny',
    tint: MENOPAUSE_COLORS.roseSoft,
    iconColor: MENOPAUSE_COLORS.rose,
  },

  {
    id: 'night_sweats',
    label: 'Sueurs nocturnes',
    icon: 'water-outline',
    tint: MENOPAUSE_COLORS.blueSoft,
    iconColor: MENOPAUSE_COLORS.blue,
  },

  {
    id: 'sleep_disturbances',
    label: 'Troubles du sommeil',
    icon: 'moon-waning-crescent',
    tint: MENOPAUSE_COLORS.blueSoft,
    iconColor: MENOPAUSE_COLORS.blue,
  },

  {
    id: 'fatigue',
    label: 'Fatigue',
    icon: 'battery-low',
    tint: MENOPAUSE_COLORS.amberSoft,
    iconColor: MENOPAUSE_COLORS.amber,
  },

  {
    id: 'mood_changes',
    label: 'Variations d’humeur',
    icon: 'heart-outline',
    tint: MENOPAUSE_COLORS.roseSoft,
    iconColor: MENOPAUSE_COLORS.rose,
  },

  {
    id: 'brain_fog',
    label: 'Brouillard mental',
    icon: 'head-outline',
    tint: MENOPAUSE_COLORS.purpleSoft,
    iconColor: MENOPAUSE_COLORS.purple,
  },
];

/* ============================================================
 * INTENSITÉ
 * ============================================================ */

export const MENOPAUSE_INTENSITY_LABELS = {
  mild: 'Léger',
  moderate: 'Modéré',
  severe: 'Sévère',
} as const;

export const MENOPAUSE_INTENSITY_COLORS = {
  mild: '#7DAB91',
  moderate: '#C4924D',
  severe: '#B96672',
} as const;

export const MENOPAUSE_INTENSITY_TINTS = {
  mild: '#EDF5F0',
  moderate: '#F8F1E6',
  severe: '#F8EAEC',
} as const;

/* ============================================================
 * SOMMEIL
 * ============================================================ */

export const MENOPAUSE_SLEEP_QUALITY_LABELS = {
  good: 'Bonne',
  average: 'Moyenne',
  poor: 'Mauvaise',
} as const;

export const MENOPAUSE_SLEEP_QUALITY_ICONS = {
  good: 'weather-night',
  average: 'moon-waning-crescent',
  poor: 'sleep-off',
} satisfies Record<
  keyof typeof MENOPAUSE_SLEEP_QUALITY_LABELS,
  IconName
>;

/* ============================================================
 * ÉNERGIE
 * ============================================================ */

export const MENOPAUSE_ENERGY_LABELS = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
} as const;

export const MENOPAUSE_ENERGY_ICONS = {
  low: 'battery-low',
  medium: 'battery-medium',
  high: 'battery-high',
} satisfies Record<
  keyof typeof MENOPAUSE_ENERGY_LABELS,
  IconName
>;

/* ============================================================
 * TRAITEMENT HORMONAL
 * ============================================================ */

export const MENOPAUSE_TREATMENT_STATUS_LABELS = {
  taken: 'Pris aujourd’hui',
  not_taken: 'Non pris aujourd’hui',
} as const;

export const MENOPAUSE_TREATMENT_STATUS_ICONS = {
  taken: 'check-circle-outline',
  not_taken: 'minus-circle-outline',
} satisfies Record<
  keyof typeof MENOPAUSE_TREATMENT_STATUS_LABELS,
  IconName
>;

/* ============================================================
 * ANALYSES
 * ============================================================ */

export const MENOPAUSE_LAB_TYPE_LABELS = {
  fsh: 'FSH',
  estradiol: 'Estradiol',
} as const;

export const MENOPAUSE_LAB_TYPE_ICONS = {
  fsh: 'flask-outline',
  estradiol: 'test-tube',
} satisfies Record<
  keyof typeof MENOPAUSE_LAB_TYPE_LABELS,
  IconName
>;

/* ============================================================
 * HUMEUR
 * ============================================================
 *
 * Reuses the project's existing MoodLevel taxonomy.
 *
 * The vocabulary remains the same.
 * Only the presentation is refined.
 */

export const MENOPAUSE_MOOD_LABELS: Record<MoodLevel, string> = {
  veryGood: 'Très bien',
  good: 'Bien',
  neutral: 'Neutre',
  stressed: 'Stressée',
  irritable: 'Irritable',
  anxious: 'Anxieuse',
  sad: 'Triste',
  tired: 'Fatiguée',
  motivated: 'Motivée',
};

export const MENOPAUSE_MOOD_ICONS: Record<MoodLevel, IconName> = {
  veryGood: 'emoticon-happy-outline',
  good: 'emoticon-outline',
  neutral: 'emoticon-neutral-outline',

  stressed: 'head-alert-outline',
  irritable: 'emoticon-angry-outline',
  anxious: 'head-question-outline',

  sad: 'emoticon-sad-outline',
  tired: 'weather-night',
  motivated: 'star-four-points-outline',
};

/* ============================================================
 * HUMEUR — PREMIUM VISUAL GROUPING
 * ============================================================
 *
 * Keep only a few semantic families instead of one random
 * color for every single mood.
 */

export const MENOPAUSE_MOOD_COLORS: Record<MoodLevel, string> = {
  veryGood: '#5C9774',
  good: '#6B9A7A',

  neutral: '#7767B5',

  stressed: '#B88847',
  irritable: '#AF616B',
  anxious: '#A8755C',

  sad: '#667DA9',
  tired: '#807A9A',

  motivated: '#8060B7',
};

export const MENOPAUSE_MOOD_TINTS: Record<MoodLevel, string> = {
  veryGood: '#ECF4EF',
  good: '#EDF4EF',

  neutral: '#F0ECF8',

  stressed: '#F8F1E7',
  irritable: '#F8EBED',
  anxious: '#F6EEE9',

  sad: '#EDF1F7',
  tired: '#F0EFF4',

  motivated: '#F1ECFA',
};

/* ============================================================
 * CATEGORY LOOKUP
 * ============================================================
 *
 * Useful when Dashboard / Journal / Calendar need the same
 * visual presentation without recreating color logic locally.
 */

export const MENOPAUSE_CATEGORY_VISUALS: Record<
  MenopauseJournalCategory,
  {
    icon: IconName;
    iconColor: string;
    tint: string;
  }
> = MENOPAUSE_JOURNAL_ITEMS.reduce(
  (accumulator, item) => {
    accumulator[item.key] = {
      icon: item.icon,
      iconColor: item.iconColor,
      tint: item.tint,
    };

    return accumulator;
  },
  {} as Record<
    MenopauseJournalCategory,
    {
      icon: IconName;
      iconColor: string;
      tint: string;
    }
  >,
);