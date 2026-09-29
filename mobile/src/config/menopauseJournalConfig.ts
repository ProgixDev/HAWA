import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {MenopauseSymptom} from '../state/menopausePreferences';
import type {MenopauseJournalCategory} from '../state/menopauseJournalStore';
import type {MoodLevel} from '../types/journal';
import i18n from '../i18n';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// i18n (Phase 3): this is a plain data/config file, not a component, so it
// cannot call `useTranslation()`. Every label below is built with the i18n
// singleton (`i18n.t()`, same pattern as irregularJournalConfig.ts's own
// buildIrregularJournalItems() / conceptionJournalConfig.ts's own
// buildConceptionJournalItems()). Every symptom/status/mood value persisted
// by menopauseJournalStore.ts is a stable enum id (see its own JSDoc) — never
// raw label text — so every label/map here is safe to translate; nothing in
// this file is data-bearing. Arrays keep their reference and are mutated IN
// PLACE on languageChanged (MENOPAUSE_JOURNAL_ITEMS/MENOPAUSE_SYMPTOM_OPTIONS
// are held onto by MenopauseDashboard.tsx, MenopauseCalendarContent.tsx and
// MenopauseJournalEntryScreen.tsx). The plain enum-keyed label maps
// (MENOPAUSE_INTENSITY_LABELS etc.) keep their existing `Record<K, string>`
// shape and are also refreshed IN PLACE (each key's value reassigned) rather
// than converted to `xxxLabels(t)` factories, because MenopauseStatisticsScreen.tsx,
// MenopauseJournalEntryScreen.tsx, MainTabNavigator.tsx and
// medicalExportReaders.ts already index them directly
// (`MENOPAUSE_MOOD_LABELS[mood]`) — changing their shape would force changes
// in files outside this pass's scope.

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

type MenopauseJournalItem = {
  key: MenopauseJournalCategory;
  label: string;
  icon: IconName;
  journalSubtitle: string;
  tint: string;
  iconColor: string;
};

function buildMenopauseJournalItems(): MenopauseJournalItem[] {
  return [
    {
      key: 'symptoms',
      label: i18n.t('menopauseJournalConfig.items.symptoms.label'),
      icon: 'heart-pulse',
      journalSubtitle: i18n.t('menopauseJournalConfig.items.symptoms.journalSubtitle'),
      tint: MENOPAUSE_COLORS.roseSoft,
      iconColor: MENOPAUSE_COLORS.rose,
    },

    {
      key: 'mood',
      label: i18n.t('menopauseJournalConfig.items.mood.label'),
      icon: 'emoticon-outline',
      journalSubtitle: i18n.t('menopauseJournalConfig.items.mood.journalSubtitle'),
      tint: MENOPAUSE_COLORS.purpleSoft,
      iconColor: MENOPAUSE_COLORS.purple,
    },

    {
      key: 'sleep',
      label: i18n.t('menopauseJournalConfig.items.sleep.label'),
      icon: 'weather-night',
      journalSubtitle: i18n.t('menopauseJournalConfig.items.sleep.journalSubtitle'),
      tint: MENOPAUSE_COLORS.blueSoft,
      iconColor: MENOPAUSE_COLORS.blue,
    },

    {
      key: 'energy',
      label: i18n.t('menopauseJournalConfig.items.energy.label'),
      icon: 'lightning-bolt-outline',
      journalSubtitle: i18n.t('menopauseJournalConfig.items.energy.journalSubtitle'),
      tint: MENOPAUSE_COLORS.amberSoft,
      iconColor: MENOPAUSE_COLORS.amber,
    },

    {
      key: 'treatment',
      label: i18n.t('menopauseJournalConfig.items.treatment.label'),
      icon: 'pill',
      journalSubtitle: i18n.t('menopauseJournalConfig.items.treatment.journalSubtitle'),
      tint: MENOPAUSE_COLORS.greenSoft,
      iconColor: MENOPAUSE_COLORS.green,
    },

    {
      key: 'labResults',
      label: i18n.t('menopauseJournalConfig.items.labResults.label'),
      icon: 'flask-outline',
      journalSubtitle: i18n.t('menopauseJournalConfig.items.labResults.journalSubtitle'),
      tint: MENOPAUSE_COLORS.tealSoft,
      iconColor: MENOPAUSE_COLORS.teal,
    },

    {
      key: 'notes',
      label: i18n.t('menopauseJournalConfig.items.notes.label'),
      icon: 'notebook-outline',
      journalSubtitle: i18n.t('menopauseJournalConfig.items.notes.journalSubtitle'),
      tint: MENOPAUSE_COLORS.purpleSoft,
      iconColor: MENOPAUSE_COLORS.purple,
    },
  ];
}

export const MENOPAUSE_JOURNAL_ITEMS: MenopauseJournalItem[] = buildMenopauseJournalItems();

// Keeps MENOPAUSE_JOURNAL_ITEMS's labels in sync with the active language
// WITHOUT ever changing the array's identity — same pattern as
// irregularJournalConfig.ts's IRREGULAR_JOURNAL_ITEMS subscriber.
// MenopauseDashboard.tsx, MenopauseCalendarContent.tsx and
// MenopauseJournalEntryScreen.tsx all hold onto this exact array reference,
// so a language change mutates its elements IN PLACE instead of replacing it.
i18n.on('languageChanged', () => {
  const refreshed = buildMenopauseJournalItems();
  refreshed.forEach((item, index) => {
    MENOPAUSE_JOURNAL_ITEMS[index] = item;
  });
});

/* ============================================================
 * SYMPTÔMES
 * ============================================================
 *
 * Same six canonical product symptoms.
 *
 * Icons are deliberately restrained and visually consistent.
 */

type MenopauseSymptomOption = {
  id: MenopauseSymptom;
  label: string;
  icon: IconName;
  tint: string;
  iconColor: string;
};

function buildMenopauseSymptomOptions(): MenopauseSymptomOption[] {
  return [
    {
      id: 'hot_flashes',
      label: i18n.t('menopauseJournalConfig.symptomOptions.hot_flashes.label'),
      icon: 'weather-sunny',
      tint: MENOPAUSE_COLORS.roseSoft,
      iconColor: MENOPAUSE_COLORS.rose,
    },

    {
      id: 'night_sweats',
      label: i18n.t('menopauseJournalConfig.symptomOptions.night_sweats.label'),
      icon: 'water-outline',
      tint: MENOPAUSE_COLORS.blueSoft,
      iconColor: MENOPAUSE_COLORS.blue,
    },

    {
      id: 'sleep_disturbances',
      label: i18n.t('menopauseJournalConfig.symptomOptions.sleep_disturbances.label'),
      icon: 'moon-waning-crescent',
      tint: MENOPAUSE_COLORS.blueSoft,
      iconColor: MENOPAUSE_COLORS.blue,
    },

    {
      id: 'fatigue',
      label: i18n.t('menopauseJournalConfig.symptomOptions.fatigue.label'),
      icon: 'battery-low',
      tint: MENOPAUSE_COLORS.amberSoft,
      iconColor: MENOPAUSE_COLORS.amber,
    },

    {
      id: 'mood_changes',
      label: i18n.t('menopauseJournalConfig.symptomOptions.mood_changes.label'),
      icon: 'heart-outline',
      tint: MENOPAUSE_COLORS.roseSoft,
      iconColor: MENOPAUSE_COLORS.rose,
    },

    {
      id: 'brain_fog',
      label: i18n.t('menopauseJournalConfig.symptomOptions.brain_fog.label'),
      icon: 'head-outline',
      tint: MENOPAUSE_COLORS.purpleSoft,
      iconColor: MENOPAUSE_COLORS.purple,
    },
  ];
}

export const MENOPAUSE_SYMPTOM_OPTIONS: MenopauseSymptomOption[] = buildMenopauseSymptomOptions();

// Same in-place refresh as MENOPAUSE_JOURNAL_ITEMS above.
i18n.on('languageChanged', () => {
  const refreshed = buildMenopauseSymptomOptions();
  refreshed.forEach((option, index) => {
    MENOPAUSE_SYMPTOM_OPTIONS[index] = option;
  });
});

/** The symptoms the CURRENT symptom-tracking UI offers: the ones the user chose
 * to track (menopausePreferences.trackedSymptoms — the single preference
 * source) plus any already recorded on the day being edited, so an entry saved
 * before a symptom was un-tracked stays visible and editable instead of being
 * silently carried along. Preferences only steer what is offered NOW — they
 * never touch stored history (Calendar / Statistics keep every recorded
 * symptom). An empty result is a legitimate state (the user may track none). */
export function getVisibleMenopauseSymptomOptions(
  trackedSymptoms: readonly MenopauseSymptom[],
  recordedForDay: readonly MenopauseSymptom[] = [],
): typeof MENOPAUSE_SYMPTOM_OPTIONS {
  const visible = new Set<MenopauseSymptom>([...trackedSymptoms, ...recordedForDay]);
  return MENOPAUSE_SYMPTOM_OPTIONS.filter(option => visible.has(option.id));
}

/* ============================================================
 * INTENSITÉ
 * ============================================================ */

function buildMenopauseIntensityLabels(): Record<'mild' | 'moderate' | 'severe', string> {
  return {
    mild: i18n.t('menopauseJournalConfig.intensity.mild'),
    moderate: i18n.t('menopauseJournalConfig.intensity.moderate'),
    severe: i18n.t('menopauseJournalConfig.intensity.severe'),
  };
}

// Kept as a plain Record (not an `xxxLabels(t)` factory) and refreshed IN
// PLACE on languageChanged — see the file-level i18n comment above.
export const MENOPAUSE_INTENSITY_LABELS = buildMenopauseIntensityLabels();

i18n.on('languageChanged', () => {
  Object.assign(MENOPAUSE_INTENSITY_LABELS, buildMenopauseIntensityLabels());
});

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

function buildMenopauseSleepQualityLabels(): Record<'good' | 'average' | 'poor', string> {
  return {
    good: i18n.t('menopauseJournalConfig.sleepQuality.good'),
    average: i18n.t('menopauseJournalConfig.sleepQuality.average'),
    poor: i18n.t('menopauseJournalConfig.sleepQuality.poor'),
  };
}

export const MENOPAUSE_SLEEP_QUALITY_LABELS = buildMenopauseSleepQualityLabels();

i18n.on('languageChanged', () => {
  Object.assign(MENOPAUSE_SLEEP_QUALITY_LABELS, buildMenopauseSleepQualityLabels());
});

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

function buildMenopauseEnergyLabels(): Record<'low' | 'medium' | 'high', string> {
  return {
    low: i18n.t('menopauseJournalConfig.energy.low'),
    medium: i18n.t('menopauseJournalConfig.energy.medium'),
    high: i18n.t('menopauseJournalConfig.energy.high'),
  };
}

export const MENOPAUSE_ENERGY_LABELS = buildMenopauseEnergyLabels();

i18n.on('languageChanged', () => {
  Object.assign(MENOPAUSE_ENERGY_LABELS, buildMenopauseEnergyLabels());
});

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

function buildMenopauseTreatmentStatusLabels(): Record<'taken' | 'not_taken', string> {
  return {
    taken: i18n.t('menopauseJournalConfig.treatmentStatus.taken'),
    not_taken: i18n.t('menopauseJournalConfig.treatmentStatus.not_taken'),
  };
}

export const MENOPAUSE_TREATMENT_STATUS_LABELS = buildMenopauseTreatmentStatusLabels();

i18n.on('languageChanged', () => {
  Object.assign(MENOPAUSE_TREATMENT_STATUS_LABELS, buildMenopauseTreatmentStatusLabels());
});

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

function buildMenopauseLabTypeLabels(): Record<'fsh' | 'estradiol', string> {
  return {
    fsh: i18n.t('menopauseJournalConfig.labType.fsh'),
    estradiol: i18n.t('menopauseJournalConfig.labType.estradiol'),
  };
}

export const MENOPAUSE_LAB_TYPE_LABELS = buildMenopauseLabTypeLabels();

i18n.on('languageChanged', () => {
  Object.assign(MENOPAUSE_LAB_TYPE_LABELS, buildMenopauseLabTypeLabels());
});

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

function buildMenopauseMoodLabels(): Record<MoodLevel, string> {
  return {
    veryGood: i18n.t('menopauseJournalConfig.mood.veryGood'),
    good: i18n.t('menopauseJournalConfig.mood.good'),
    neutral: i18n.t('menopauseJournalConfig.mood.neutral'),
    stressed: i18n.t('menopauseJournalConfig.mood.stressed'),
    irritable: i18n.t('menopauseJournalConfig.mood.irritable'),
    anxious: i18n.t('menopauseJournalConfig.mood.anxious'),
    sad: i18n.t('menopauseJournalConfig.mood.sad'),
    tired: i18n.t('menopauseJournalConfig.mood.tired'),
    motivated: i18n.t('menopauseJournalConfig.mood.motivated'),
  };
}

export const MENOPAUSE_MOOD_LABELS: Record<MoodLevel, string> = buildMenopauseMoodLabels();

i18n.on('languageChanged', () => {
  Object.assign(MENOPAUSE_MOOD_LABELS, buildMenopauseMoodLabels());
});

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