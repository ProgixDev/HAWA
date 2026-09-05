import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {IrregularJournalCategory} from '../state/irregularJournalStore';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// One shared array consumed by both the SOPK Dashboard's "Suivi du jour"
// tile grid and IrregularJournalEntryScreen.tsx, so the two can never drift
// apart — same convention as postpartumJournalConfig.ts/
// miscarriageJournalConfig.ts. "Règles" is deliberately NOT one of these
// items — it routes straight to the existing, shared
// the shared daily journal for Calendar and statistics synchronization.
export const IRREGULAR_JOURNAL_ITEMS: Array<{
  key: IrregularJournalCategory;
  label: string;
  dashboardLabel: string;
  dashboardSubtitle: string;
  icon: IconName;
  journalSubtitle: string;
  tint: string;
}> = [
  {
    key: 'acne',
    label: 'Acné',
    dashboardLabel: 'Acné',
    dashboardSubtitle: 'État de ta peau aujourd’hui',
    icon: 'face-woman-outline',
    journalSubtitle: 'Note l’état de ta peau aujourd’hui.',
    tint: '#FBEAF0',
  },
  {
    key: 'hairGrowth',
    label: 'Pilosité',
    dashboardLabel: 'Pilosité',
    dashboardSubtitle: 'Suis les changements liés à la pilosité',
    icon: 'human',
    journalSubtitle: 'Suis les changements liés à la pilosité.',
    tint: '#EEE7FC',
  },
  {
    key: 'weight',
    label: 'Poids',
    dashboardLabel: 'Poids',
    dashboardSubtitle: 'Enregistre ta variation de poids',
    icon: 'scale-bathroom',
    journalSubtitle: 'Enregistre ta variation de poids.',
    tint: '#E7F0F8',
  },
  {
    key: 'pain',
    label: 'Douleurs',
    dashboardLabel: 'Douleurs',
    dashboardSubtitle: 'Douleurs ou inconforts ressentis',
    icon: 'lightning-bolt-outline',
    journalSubtitle: 'Douleurs ou inconforts ressentis aujourd’hui.',
    tint: '#FBEAF0',
  },
  {
    key: 'mood',
    label: 'Humeur',
    dashboardLabel: 'Humeur',
    dashboardSubtitle: 'Comment te sens-tu aujourd’hui ?',
    icon: 'emoticon-outline',
    journalSubtitle: 'Comment te sens-tu aujourd’hui ?',
    tint: '#F1E8F5',
  },
  {
    key: 'fatigue',
    label: 'Fatigue & symptômes',
    dashboardLabel: 'Fatigue & symptômes',
    dashboardSubtitle: 'Fatigue et symptômes associés',
    icon: 'battery-medium',
    journalSubtitle: 'Fatigue et symptômes associés aujourd’hui.',
    tint: '#EEE7FC',
  },
];

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
export const IRREGULAR_INTENSITY_OPTIONS: string[] = ['Aucune', 'Légère', 'Modérée', 'Forte', 'Très forte'];

// Same convention as postpartumJournalConfig.ts's POSTPARTUM_MOOD_OPTIONS.
export const IRREGULAR_MOOD_OPTIONS: string[] = ['Très difficile', 'Difficile', 'Neutre', 'Bien', 'Très bien'];
