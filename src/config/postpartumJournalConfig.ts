import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {PostpartumJournalCategory} from '../state/postpartumJournalStore';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Single source of truth for Postpartum's 5 fixed daily-tracking categories —
// shared by PostpartumDashboard's "Suivi du jour" grid AND the Postpartum
// "Journal quotidien" sheet + PostpartumJournalEntryScreen, so the two entry
// points can never drift onto different category sets. Deliberately a
// DIFFERENT shape from Pregnancy's own Journal quotidien (which uses
// Symptômes / Poids / Humeur / Sommeil / Informations médicales) — the two
// objectives track different things by design; same shared-config pattern,
// fully separate content and separate data (postpartumJournalStore, never
// pregnancyJournalStore).
export const POSTPARTUM_JOURNAL_ITEMS: Array<{
  key: PostpartumJournalCategory;
  /** Full label — used in the Journal sheet row and the entry screen title. */
  label: string;
  /** Shorter label for the Dashboard's "Suivi du jour" grid tile, where
   * "Récupération physique" would overflow a small icon+label card.
   * Identical to `label` for the other 4 categories. */
  dashboardLabel: string;
  icon: IconName;
  journalSubtitle: string;
  tint: string;
}> = [
  {key: 'fatigue', label: 'Fatigue', dashboardLabel: 'Fatigue', icon: 'lightning-bolt-outline', journalSubtitle: 'Évalue ton niveau de fatigue aujourd’hui', tint: '#E9DFFF'},
  {key: 'sleep', label: 'Sommeil', dashboardLabel: 'Sommeil', icon: 'weather-night', journalSubtitle: 'Durée et qualité de ton sommeil', tint: '#E8DDF8'},
  {key: 'mood', label: 'Humeur', dashboardLabel: 'Humeur', icon: 'heart-outline', journalSubtitle: 'Comment te sens-tu aujourd’hui ?', tint: '#F9DDE8'},
  {key: 'pain', label: 'Douleurs', dashboardLabel: 'Douleurs', icon: 'heat-wave', journalSubtitle: 'Note les douleurs que tu ressens aujourd’hui', tint: '#FBE3E3'},
  {key: 'physicalRecovery', label: 'Récupération physique', dashboardLabel: 'Récupération', icon: 'heart-pulse', journalSubtitle: 'Comment progresse ta récupération ?', tint: '#DDEEFF'},
];

export const POSTPARTUM_MOOD_OPTIONS: string[] = ['Très difficile', 'Difficile', 'Neutre', 'Bien', 'Très bien'];

export const POSTPARTUM_SLEEP_OPTIONS: string[] = ['Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'];

// Fatigue/Douleurs share the same intensity scale (Aucune → Très forte) —
// neutral, non-diagnostic wording, consistent with Cycle's own symptom
// intensity vocabulary.
export const POSTPARTUM_FATIGUE_OPTIONS: string[] = ['Aucune', 'Légère', 'Modérée', 'Forte', 'Très forte'];
export const POSTPARTUM_PAIN_OPTIONS: string[] = ['Aucune', 'Légère', 'Modérée', 'Forte', 'Très forte'];

// Récupération physique — a subjective progress scale (Difficile → Très
// bonne), tracking-only, never a medical interpretation.
export const POSTPARTUM_RECOVERY_OPTIONS: string[] = ['Difficile', 'Lente', 'Stable', 'Bonne', 'Très bonne'];
