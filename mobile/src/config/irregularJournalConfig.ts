import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {IrregularJournalCategory} from '../state/irregularJournalStore';
import i18n from '../i18n';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// One shared array consumed by both the SOPK Dashboard's "Suivi du jour"
// tile grid and IrregularJournalEntryScreen.tsx, so the two can never drift
// apart — same convention as postpartumJournalConfig.ts/
// miscarriageJournalConfig.ts. "Règles" is deliberately NOT one of these
// items — it routes straight to the existing, shared dailyJournalStore
// flow used everywhere else for Calendar and statistics synchronization.
//
// i18n (Phase 3): this is a plain data/config file, not a component, so it
// cannot call `useTranslation()`. Labels are built with the i18n singleton
// (`i18n.t()`, same pattern as conceptionJournalConfig.ts's own
// buildConceptionJournalItems() / contraceptionJournalConfig.ts's own
// buildContraceptionJournalItems()) inside `buildIrregularJournalItems()`
// below.
type IrregularJournalItem = {
  key: IrregularJournalCategory;
  label: string;
  dashboardLabel: string;
  dashboardSubtitle: string;
  icon: IconName;
  journalSubtitle: string;
  tint: string;
};

function buildIrregularJournalItems(): IrregularJournalItem[] {
  return [
    {
      key: 'acne',
      label: i18n.t('irregularJournalConfig.acne.label'),
      dashboardLabel: i18n.t('irregularJournalConfig.acne.label'),
      dashboardSubtitle: i18n.t('irregularJournalConfig.acne.dashboardSubtitle'),
      icon: 'face-woman-outline',
      journalSubtitle: i18n.t('irregularJournalConfig.acne.journalSubtitle'),
      tint: '#FBEAF0',
    },
    {
      key: 'hairGrowth',
      label: i18n.t('irregularJournalConfig.hairGrowth.label'),
      dashboardLabel: i18n.t('irregularJournalConfig.hairGrowth.label'),
      dashboardSubtitle: i18n.t('irregularJournalConfig.hairGrowth.dashboardSubtitle'),
      icon: 'human',
      journalSubtitle: i18n.t('irregularJournalConfig.hairGrowth.journalSubtitle'),
      tint: '#EEE7FC',
    },
    {
      key: 'weight',
      label: i18n.t('irregularJournalConfig.weight.label'),
      dashboardLabel: i18n.t('irregularJournalConfig.weight.label'),
      dashboardSubtitle: i18n.t('irregularJournalConfig.weight.dashboardSubtitle'),
      icon: 'scale-bathroom',
      journalSubtitle: i18n.t('irregularJournalConfig.weight.journalSubtitle'),
      tint: '#E7F0F8',
    },
    {
      key: 'pain',
      label: i18n.t('irregularJournalConfig.pain.label'),
      dashboardLabel: i18n.t('irregularJournalConfig.pain.label'),
      dashboardSubtitle: i18n.t('irregularJournalConfig.pain.dashboardSubtitle'),
      icon: 'lightning-bolt-outline',
      journalSubtitle: i18n.t('irregularJournalConfig.pain.journalSubtitle'),
      tint: '#FBEAF0',
    },
    {
      key: 'mood',
      label: i18n.t('irregularJournalConfig.mood.label'),
      dashboardLabel: i18n.t('irregularJournalConfig.mood.label'),
      dashboardSubtitle: i18n.t('irregularJournalConfig.mood.dashboardSubtitle'),
      icon: 'emoticon-outline',
      journalSubtitle: i18n.t('irregularJournalConfig.mood.journalSubtitle'),
      tint: '#F1E8F5',
    },
    {
      key: 'fatigue',
      label: i18n.t('irregularJournalConfig.fatigue.label'),
      dashboardLabel: i18n.t('irregularJournalConfig.fatigue.label'),
      dashboardSubtitle: i18n.t('irregularJournalConfig.fatigue.dashboardSubtitle'),
      icon: 'battery-medium',
      journalSubtitle: i18n.t('irregularJournalConfig.fatigue.journalSubtitle'),
      tint: '#EEE7FC',
    },
  ];
}

export const IRREGULAR_JOURNAL_ITEMS: IrregularJournalItem[] = buildIrregularJournalItems();

// Keeps IRREGULAR_JOURNAL_ITEMS's labels in sync with the active language
// WITHOUT ever changing the array's identity — same reasoning/pattern as
// conceptionJournalConfig.ts's CONCEPTION_JOURNAL_ITEMS /
// contraceptionJournalConfig.ts's CONTRACEPTION_JOURNAL_ITEMS subscribers.
// MainTabNavigator's JournalSheetHost 'irregular' branch, IrregularDashboard.tsx
// and IrregularJournalOverviewScreen.tsx all hold onto this exact array
// reference, so a language change mutates its elements IN PLACE instead of
// replacing it.
i18n.on('languageChanged', () => {
  const refreshed = buildIrregularJournalItems();
  refreshed.forEach((item, index) => {
    IRREGULAR_JOURNAL_ITEMS[index] = item;
  });
});

// Multi-selection options for the "Fatigue & symptômes" journal screen's
// "Symptômes associés" section. Reuses the SAME French wording as Cycle's
// own canonical symptom list (src/screens/journal/JournalSymptomsScreen.tsx's
// `SYMPTOMS`) wherever it overlaps (Ballonnements/Maux de tête/Nausées/
// Crampes/Seins sensibles), rather than inventing incompatible terms — that
// list itself isn't imported directly because it's a private, screen-local
// array whose shape (icons + illustration assets) is specific to Cycle's own
// journal design and it writes to dailyJournalStore.ts, not
// irregularJournalStore.ts (objective isolation). Acné, Pilosité, Poids,
// Douleurs and Fatigue itself are deliberately NOT repeated here — they are
// already their own SOPK journal categories.
//
// DATA-BEARING — NOT display-only text. IrregularJournalEntryScreen.tsx
// saves these raw French label strings verbatim as `symptoms: string[]` via
// saveIrregularJournalEntry() — there is no separate enum. Translating these
// options would silently change/corrupt every already-saved entry, so they
// stay French (same rule as JournalSymptomsScreen.tsx's SYMPTOMS,
// JournalTemperatureScreen.tsx's `method` ChoiceChips options, and
// contraceptionJournalConfig.ts's CONTRACEPTION_FEELINGS_OPTIONS).
export const IRREGULAR_SYMPTOM_OPTIONS: string[] = [
  'Ballonnements',
  'Maux de tête',
  'Nausées',
  'Crampes',
  'Seins sensibles',
  'Troubles du sommeil',
  'Autre',
];

// Same 5-point, neutral, non-diagnostic scale convention as
// postpartumJournalConfig.ts's POSTPARTUM_PAIN_OPTIONS/POSTPARTUM_FATIGUE_OPTIONS
// — reused verbatim for every SOPK intensity-style category so the whole app
// stays consistent, never a severity judgment ("léger"/"fort" describes what
// the user reports, not a medical assessment).
//
// DATA-BEARING — NOT display-only text. IrregularJournalEntryScreen.tsx
// saves this raw French label string verbatim (e.g. as the `intensity`
// field) via saveIrregularJournalEntry() — there is no separate enum.
// Translating these options would silently change/corrupt every
// already-saved entry, so they stay French (same rule as
// IRREGULAR_SYMPTOM_OPTIONS above).
export const IRREGULAR_INTENSITY_OPTIONS: string[] = ['Aucune', 'Légère', 'Modérée', 'Forte', 'Très forte'];

// Same convention as postpartumJournalConfig.ts's POSTPARTUM_MOOD_OPTIONS.
//
// DATA-BEARING — NOT display-only text. IrregularJournalEntryScreen.tsx
// saves this raw French label string verbatim (e.g. as the `mood` field) via
// saveIrregularJournalEntry() — there is no separate enum. Translating these
// options would silently change/corrupt every already-saved entry, so they
// stay French (same rule as IRREGULAR_SYMPTOM_OPTIONS above).
export const IRREGULAR_MOOD_OPTIONS: string[] = ['Très difficile', 'Difficile', 'Neutre', 'Bien', 'Très bien'];
