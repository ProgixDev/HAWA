import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import i18n from '../i18n';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Single source of truth for Contraception's 3 fixed daily-tracking
// categories — shared by ContraceptionDashboard's "Suivi du jour" card AND
// the Contraception "Journal quotidien" sheet + ContraceptionJournalEntryScreen,
// so the two entry points can never drift onto different category sets.
// Deliberately a DIFFERENT shape from every other objective's Journal
// quotidien (Cycle/Pregnancy/Postpartum/Miscarriage) — this objective tracks
// its own things by design. 'intake' reads/writes the existing
// contraceptionIntakeHistoryStore (one taken/late/missed record per day —
// never a separate store) for pill/other, or contraceptionEventStore for
// ring/patch; 'feelings' and 'notes' read/write contraceptionJournalStore.
// A former separate 'missedOrLate' category was removed: it read/wrote the
// exact same intake record as 'intake' and rendered the identical 3-way
// status picker (Effectuée/En retard/Oubliée) under a different title — a
// pure UI duplicate, not a distinct concept. `label` for 'intake' is a
// neutral fallback — consumers that know the real persisted method should
// prefer contraceptionIntakeActionLabels(t) from contraceptionLabels.ts
// instead, so the wording never assumes every user takes a pill.
//
// i18n (Phase 3): this is a plain data/config file, not a component, so it
// cannot call useTranslation(). Labels are built with the i18n singleton
// (i18n.t(), same pattern as conceptionJournalConfig.ts's own
// buildConceptionJournalItems()) inside buildContraceptionJournalItems()
// below. 'intake''s label reuses the canonical
// contraceptionLabels.defaultIntakeActionLabel key instead of duplicating
// the same wording under a second key.
export type ContraceptionJournalCategory =
  | 'intake'
  | 'feelings'
  | 'notes';

type ContraceptionJournalItem = {
  key: ContraceptionJournalCategory;
  /** Neutral fallback label — see note above about method-adaptive override. */
  label: string;
  icon: IconName;
  journalSubtitle: string;
  tint: string;
};

function buildContraceptionJournalItems(): ContraceptionJournalItem[] {
  return [
    {
      key: 'intake',
      label: i18n.t('contraceptionLabels.defaultIntakeActionLabel'),
      icon: 'check-circle-outline',
      journalSubtitle: i18n.t('contraceptionJournalConfig.intake.journalSubtitle'),
      tint: '#EDF8F1',
    },
    {
      key: 'feelings',
      label: i18n.t('contraceptionJournalConfig.feelings.label'),
      icon: 'heart-pulse',
      journalSubtitle: i18n.t('contraceptionJournalConfig.feelings.journalSubtitle'),
      tint: '#F1E8F5',
    },
    {
      key: 'notes',
      label: i18n.t('contraceptionJournalConfig.notes.label'),
      icon: 'notebook-edit-outline',
      journalSubtitle: i18n.t('contraceptionJournalConfig.notes.journalSubtitle'),
      tint: '#E8DDF8',
    },
  ];
}

export const CONTRACEPTION_JOURNAL_ITEMS: ContraceptionJournalItem[] = buildContraceptionJournalItems();

// Keeps CONTRACEPTION_JOURNAL_ITEMS's labels in sync with the active language
// WITHOUT ever changing the array's identity — same reasoning/pattern as
// conceptionJournalConfig.ts's own CONCEPTION_JOURNAL_ITEMS subscriber. A
// language change therefore mutates this array's elements IN PLACE instead
// of replacing it.
i18n.on('languageChanged', () => {
  const refreshed = buildContraceptionJournalItems();
  refreshed.forEach((item, index) => {
    CONTRACEPTION_JOURNAL_ITEMS[index] = item;
  });
});

// DATA-BEARING — NOT display-only text. ContraceptionJournalEntryScreen.tsx's
// FeelingsContent saves these raw French label strings verbatim as
// `feelings: string[]` via saveContraceptionJournalField(entryDateKey,
// 'feelings', feelings) — there is no separate enum. Translating these
// options would silently change/corrupt every already-saved entry, so they
// stay French (same rule as JournalSymptomsScreen.tsx's SYMPTOMS and
// JournalTemperatureScreen.tsx's `method` ChoiceChips options). Neutral,
// non-diagnostic checklist — tracking only, never a medical conclusion and
// never a claim that a sensation was caused by contraception.
export const CONTRACEPTION_FEELINGS_OPTIONS: string[] = [
  'Fatigue',
  'Maux de tête',
  'Nausées',
  'Sensibilité (poitrine)',
  'Changement d’humeur',
  'Ballonnements',
  'Baisse de libido',
  'Aucun effet particulier',
];
