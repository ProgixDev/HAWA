import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {MiscarriageJournalCategory} from '../state/miscarriageJournalStore';
import type {MiscarriageTryingAgainStatus} from '../state/miscarriagePreferences';
import i18n from '../i18n';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// i18n (Phase 3): this is a plain data/config file, not a component, so it
// cannot call `useTranslation()`. Every label below is built with the i18n
// singleton (`i18n.t()`, same pattern as menopauseJournalConfig.ts's own
// buildMenopauseJournalItems() / conceptionJournalConfig.ts's own
// buildConceptionJournalItems()). MISCARRIAGE_JOURNAL_ITEMS and
// MISCARRIAGE_TRYING_AGAIN_OPTIONS's `key`/`id` fields are stable enum
// values, never persisted as raw text, so their label/dashboardLabel/
// journalSubtitle/subtitle strings are safe to translate; both arrays keep
// their reference and are mutated IN PLACE on languageChanged (they are
// held onto by MiscarriageDashboard.tsx, MainTabNavigator.tsx,
// MiscarriageJournalEntryScreen.tsx and MiscarriageStatisticsScreen.tsx).
// MISCARRIAGE_TRYING_AGAIN_OPTIONS's label/subtitle reuse the exact same
// `miscarriageTryingAgain.options.*` keys as the onboarding
// MiscarriageTryingAgainScreen.tsx's own OPTIONS (identical French wording
// there), rather than duplicating the same copy under a second key.
//
// MISCARRIAGE_BLEEDING_OPTIONS and MISCARRIAGE_PHYSICAL_SYMPTOMS are a
// DIFFERENT case: their raw French label strings ARE the values persisted
// directly into miscarriageJournalStore (MiscarriageJournalEntryScreen.tsx
// saves `bleeding`/`physicalSymptoms` as the literal selected label, and
// MiscarriageStatisticsScreen.tsx/MiscarriageCalendarContent.tsx read them
// back and compare against these exact same arrays via `.indexOf()`/lookup).
// DATA-BEARING: bleeding intensity and physical-symptom labels are
// persisted as the raw label string itself — do not translate.

// Single source of truth for Miscarriage's 4 fixed daily-tracking
// categories — shared by MiscarriageDashboard's "Suivi du jour" grid AND the
// Miscarriage "Journal quotidien" sheet + MiscarriageJournalEntryScreen, so
// the two entry points can never drift onto different category sets.
// Deliberately a DIFFERENT shape from every other objective's Journal
// quotidien (Cycle/Pregnancy/Postpartum) — this objective tracks its own
// things by design; same shared-config pattern, fully separate content and
// separate data (miscarriageJournalStore, never any other journal store).
type MiscarriageJournalItem = {
  key: MiscarriageJournalCategory;
  /** Full label — used in the Journal sheet row and the entry screen title. */
  label: string;
  /** Shorter, wrap-friendly label for the Dashboard's "Suivi du jour" grid
   * tile ("Symptômes physiques"/"Notes personnelles"/"Reprise des essais"
   * would overflow a small icon+label card as one line). */
  dashboardLabel: string;
  icon: IconName;
  journalSubtitle: string;
  tint: string;
};

function buildMiscarriageJournalItems(): MiscarriageJournalItem[] {
  return [
    {
      key: 'bleeding',
      label: i18n.t('miscarriageJournalConfig.items.bleeding.label'),
      dashboardLabel: i18n.t('miscarriageJournalConfig.items.bleeding.dashboardLabel'),
      icon: 'water-outline',
      journalSubtitle: i18n.t('miscarriageJournalConfig.items.bleeding.journalSubtitle'),
      tint: '#FBE8E8',
    },
    {
      key: 'physicalSymptoms',
      label: i18n.t('miscarriageJournalConfig.items.physicalSymptoms.label'),
      dashboardLabel: i18n.t('miscarriageJournalConfig.items.physicalSymptoms.dashboardLabel'),
      icon: 'clipboard-pulse-outline',
      journalSubtitle: i18n.t('miscarriageJournalConfig.items.physicalSymptoms.journalSubtitle'),
      tint: '#E9DFFF',
    },
    {
      key: 'personalNotes',
      label: i18n.t('miscarriageJournalConfig.items.personalNotes.label'),
      dashboardLabel: i18n.t('miscarriageJournalConfig.items.personalNotes.dashboardLabel'),
      icon: 'notebook-edit-outline',
      journalSubtitle: i18n.t('miscarriageJournalConfig.items.personalNotes.journalSubtitle'),
      tint: '#E8DDF8',
    },
    {
      key: 'tryingAgain',
      label: i18n.t('miscarriageJournalConfig.items.tryingAgain.label'),
      dashboardLabel: i18n.t('miscarriageJournalConfig.items.tryingAgain.dashboardLabel'),
      icon: 'heart-outline',
      journalSubtitle: i18n.t('miscarriageJournalConfig.items.tryingAgain.journalSubtitle'),
      tint: '#F1E8F5',
    },
  ];
}

export const MISCARRIAGE_JOURNAL_ITEMS: MiscarriageJournalItem[] = buildMiscarriageJournalItems();

// Keeps MISCARRIAGE_JOURNAL_ITEMS's labels in sync with the active language
// WITHOUT ever changing the array's identity — see the file-level i18n
// comment above.
i18n.on('languageChanged', () => {
  const refreshed = buildMiscarriageJournalItems();
  refreshed.forEach((item, index) => {
    MISCARRIAGE_JOURNAL_ITEMS[index] = item;
  });
});

// Daily bleeding-intensity scale — deliberately separate from the coarser
// onboarding question (MiscarriageBleedingScreen's yes/no/variable), which
// only asks "do you still have bleeding at all". This one supports the
// finer day-to-day tracking spec section 16 asks for.
// DATA-BEARING: the bleeding-intensity label itself is persisted as the raw
// string (see the file-level i18n comment above) — do not translate.
export const MISCARRIAGE_BLEEDING_OPTIONS: string[] = ['Absent', 'Léger', 'Modéré', 'Important'];

// Neutral, non-diagnostic symptom checklist — tracking only, never a medical
// conclusion. Physical pain is deliberately captured here rather than as a
// separate generic Cycle-style "Douleurs" category (spec section 15).
// DATA-BEARING: each physical-symptom label itself is persisted as the raw
// string (see the file-level i18n comment above) — do not translate.
export const MISCARRIAGE_PHYSICAL_SYMPTOMS: string[] = [
  'Fatigue',
  'Crampes',
  'Douleurs pelviennes',
  'Maux de tête',
  'Nausées',
  'Vertiges',
  'Sensibilité',
];

// Same 3 states as the onboarding question (MiscarriageTryingAgainScreen) —
// selecting any of these here only updates the current answer, it never
// switches activeObjective (see setMiscarriageTryingAgainStatus). label/
// subtitle reuse the exact same `miscarriageTryingAgain.options.*` keys as
// MiscarriageTryingAgainScreen.tsx's own OPTIONS — see the file-level i18n
// comment above.
type MiscarriageTryingAgainOption = {
  id: MiscarriageTryingAgainStatus;
  label: string;
  subtitle: string;
  icon: IconName;
};

function buildMiscarriageTryingAgainOptions(): MiscarriageTryingAgainOption[] {
  return [
    {
      id: 'not_now',
      label: i18n.t('miscarriageTryingAgain.options.not_now.label'),
      subtitle: i18n.t('miscarriageTryingAgain.options.not_now.subtitle'),
      icon: 'clock-outline',
    },
    {
      id: 'soon',
      label: i18n.t('miscarriageTryingAgain.options.soon.label'),
      subtitle: i18n.t('miscarriageTryingAgain.options.soon.subtitle'),
      icon: 'sprout-outline',
    },
    {
      id: 'ready',
      label: i18n.t('miscarriageTryingAgain.options.ready.label'),
      subtitle: i18n.t('miscarriageTryingAgain.options.ready.subtitle'),
      icon: 'heart-outline',
    },
  ];
}

export const MISCARRIAGE_TRYING_AGAIN_OPTIONS: MiscarriageTryingAgainOption[] =
  buildMiscarriageTryingAgainOptions();

i18n.on('languageChanged', () => {
  const refreshed = buildMiscarriageTryingAgainOptions();
  refreshed.forEach((option, index) => {
    MISCARRIAGE_TRYING_AGAIN_OPTIONS[index] = option;
  });
});
