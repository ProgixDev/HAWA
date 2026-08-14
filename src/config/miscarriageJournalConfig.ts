import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {MiscarriageJournalCategory} from '../state/miscarriageJournalStore';
import type {MiscarriageTryingAgainStatus} from '../state/miscarriagePreferences';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Single source of truth for Miscarriage's 4 fixed daily-tracking
// categories — shared by MiscarriageDashboard's "Suivi du jour" grid AND the
// Miscarriage "Journal quotidien" sheet + MiscarriageJournalEntryScreen, so
// the two entry points can never drift onto different category sets.
// Deliberately a DIFFERENT shape from every other objective's Journal
// quotidien (Cycle/Pregnancy/Postpartum) — this objective tracks its own
// things by design; same shared-config pattern, fully separate content and
// separate data (miscarriageJournalStore, never any other journal store).
export const MISCARRIAGE_JOURNAL_ITEMS: Array<{
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
}> = [
  {
    key: 'bleeding',
    label: 'Saignements',
    dashboardLabel: 'Saignements',
    icon: 'water-outline',
    journalSubtitle: 'Note l’intensité de tes saignements aujourd’hui',
    tint: '#FBE8E8',
  },
  {
    key: 'physicalSymptoms',
    label: 'Symptômes physiques',
    dashboardLabel: 'Symptômes\nphysiques',
    icon: 'clipboard-pulse-outline',
    journalSubtitle: 'Note les symptômes que tu ressens aujourd’hui',
    tint: '#E9DFFF',
  },
  {
    key: 'personalNotes',
    label: 'Notes personnelles',
    dashboardLabel: 'Notes\npersonnelles',
    icon: 'notebook-edit-outline',
    journalSubtitle: 'Un espace privé pour ce que tu souhaites noter',
    tint: '#E8DDF8',
  },
  {
    key: 'tryingAgain',
    label: 'Reprise des essais',
    dashboardLabel: 'Reprise\ndes essais',
    icon: 'heart-outline',
    journalSubtitle: 'Comment te sens-tu à ce sujet aujourd’hui ?',
    tint: '#F1E8F5',
  },
];

// Daily bleeding-intensity scale — deliberately separate from the coarser
// onboarding question (MiscarriageBleedingScreen's yes/no/variable), which
// only asks "do you still have bleeding at all". This one supports the
// finer day-to-day tracking spec section 16 asks for.
export const MISCARRIAGE_BLEEDING_OPTIONS: string[] = ['Absent', 'Léger', 'Modéré', 'Important'];

// Neutral, non-diagnostic symptom checklist — tracking only, never a medical
// conclusion. Physical pain is deliberately captured here rather than as a
// separate generic Cycle-style "Douleurs" category (spec section 15).
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
// switches activeObjective (see setMiscarriageTryingAgainStatus).
export const MISCARRIAGE_TRYING_AGAIN_OPTIONS: Array<{
  id: MiscarriageTryingAgainStatus;
  label: string;
  subtitle: string;
  icon: IconName;
}> = [
  {id: 'not_now', label: 'Pas maintenant', subtitle: 'Je préfère prendre du temps pour moi', icon: 'clock-outline'},
  {id: 'soon', label: 'Bientôt', subtitle: 'Je commence à y penser sérieusement', icon: 'sprout-outline'},
  {id: 'ready', label: 'Oui, je me sens prête', subtitle: 'Je souhaite reprendre les essais', icon: 'heart-outline'},
];
