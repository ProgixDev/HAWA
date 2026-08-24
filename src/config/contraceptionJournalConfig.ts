import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

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
// prefer CONTRACEPTION_INTAKE_ACTION_LABEL from contraceptionLabels.ts
// instead, so the wording never assumes every user takes a pill.
export type ContraceptionJournalCategory =
  | 'intake'
  | 'feelings'
  | 'notes';

export const CONTRACEPTION_JOURNAL_ITEMS: Array<{
  key: ContraceptionJournalCategory;
  /** Neutral fallback label — see note above about method-adaptive override. */
  label: string;
  icon: IconName;
  journalSubtitle: string;
  tint: string;
}> = [
  {
    key: 'intake',
    label: 'Prise / utilisation du jour',
    icon: 'check-circle-outline',
    journalSubtitle: 'Enregistre ton suivi d’aujourd’hui',
    tint: '#EDF8F1',
  },
  {
    key: 'feelings',
    label: 'Effets ressentis',
    icon: 'heart-pulse',
    journalSubtitle: 'Note ce que tu as ressenti aujourd’hui',
    tint: '#F1E8F5',
  },
  {
    key: 'notes',
    label: 'Notes du jour',
    icon: 'notebook-edit-outline',
    journalSubtitle: 'Ajoute une information personnelle',
    tint: '#E8DDF8',
  },
];

// Neutral, non-diagnostic checklist — tracking only, never a medical
// conclusion and never a claim that a sensation was caused by contraception.
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
