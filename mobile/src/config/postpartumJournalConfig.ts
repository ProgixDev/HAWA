import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {PostpartumJournalCategory} from '../state/postpartumJournalStore';
import i18n from '../i18n';

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
//
// i18n (Phase 3): this is a plain data/config file, not a component, so it
// cannot call `useTranslation()`. Every label/dashboardLabel/journalSubtitle
// below is built with the i18n singleton (`i18n.t()`, same pattern as
// menopauseJournalConfig.ts's own buildMenopauseJournalItems() /
// irregularJournalConfig.ts's own buildIrregularJournalItems()). `.key` (a
// PostpartumJournalCategory enum) is the only value ever persisted/compared
// elsewhere — never `.label` — so every label here is safe to translate.
// POSTPARTUM_JOURNAL_ITEMS keeps its reference and is mutated IN PLACE on
// languageChanged (PostpartumDashboard.tsx and PostpartumCalendarContent.tsx
// hold onto this exact array object).
type PostpartumJournalItem = {
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
};

function buildPostpartumJournalItems(): PostpartumJournalItem[] {
  return [
    {
      key: 'fatigue',
      label: i18n.t('postpartumJournalConfig.items.fatigue.label'),
      dashboardLabel: i18n.t('postpartumJournalConfig.items.fatigue.label'),
      icon: 'lightning-bolt-outline',
      journalSubtitle: i18n.t('postpartumJournalConfig.items.fatigue.journalSubtitle'),
      tint: '#E9DFFF',
    },
    {
      key: 'sleep',
      label: i18n.t('postpartumJournalConfig.items.sleep.label'),
      dashboardLabel: i18n.t('postpartumJournalConfig.items.sleep.label'),
      icon: 'weather-night',
      journalSubtitle: i18n.t('postpartumJournalConfig.items.sleep.journalSubtitle'),
      tint: '#E8DDF8',
    },
    {
      key: 'mood',
      label: i18n.t('postpartumJournalConfig.items.mood.label'),
      dashboardLabel: i18n.t('postpartumJournalConfig.items.mood.label'),
      icon: 'heart-outline',
      journalSubtitle: i18n.t('postpartumJournalConfig.items.mood.journalSubtitle'),
      tint: '#F9DDE8',
    },
    {
      key: 'pain',
      label: i18n.t('postpartumJournalConfig.items.pain.label'),
      dashboardLabel: i18n.t('postpartumJournalConfig.items.pain.label'),
      icon: 'heat-wave',
      journalSubtitle: i18n.t('postpartumJournalConfig.items.pain.journalSubtitle'),
      tint: '#FBE3E3',
    },
    {
      key: 'physicalRecovery',
      label: i18n.t('postpartumJournalConfig.items.physicalRecovery.label'),
      dashboardLabel: i18n.t('postpartumJournalConfig.items.physicalRecovery.dashboardLabel'),
      icon: 'heart-pulse',
      journalSubtitle: i18n.t('postpartumJournalConfig.items.physicalRecovery.journalSubtitle'),
      tint: '#DDEEFF',
    },
  ];
}

export const POSTPARTUM_JOURNAL_ITEMS: PostpartumJournalItem[] = buildPostpartumJournalItems();

// Keeps POSTPARTUM_JOURNAL_ITEMS's labels in sync with the active language
// WITHOUT ever changing the array's identity — same reasoning/pattern as
// menopauseJournalConfig.ts's MENOPAUSE_JOURNAL_ITEMS /
// irregularJournalConfig.ts's IRREGULAR_JOURNAL_ITEMS subscribers.
// PostpartumDashboard.tsx and PostpartumCalendarContent.tsx both hold onto
// this exact array reference, so a language change mutates its elements IN
// PLACE instead of replacing it.
i18n.on('languageChanged', () => {
  const refreshed = buildPostpartumJournalItems();
  refreshed.forEach((item, index) => {
    POSTPARTUM_JOURNAL_ITEMS[index] = item;
  });
});

// DATA-BEARING — NOT display-only text. PostpartumJournalEntryScreen.tsx
// saves these raw French label strings verbatim as `mood: string` via
// savePostpartumJournalField(entryDateKey, 'mood', mood) — there is no
// separate enum. Translating these options would silently corrupt/orphan
// already-saved history and break statistics matching against these exact
// strings, so they stay French (same rule as contraceptionJournalConfig.ts's
// CONTRACEPTION_FEELINGS_OPTIONS and irregularJournalConfig.ts's
// IRREGULAR_MOOD_OPTIONS).
export const POSTPARTUM_MOOD_OPTIONS: string[] = ['Très difficile', 'Difficile', 'Neutre', 'Bien', 'Très bien'];

// DATA-BEARING — NOT display-only text. PostpartumJournalEntryScreen.tsx
// saves this raw French label string verbatim as `sleep: string` via
// savePostpartumJournalField(entryDateKey, 'sleep', sleepQuality) — there is
// no separate enum. Translating these options would silently corrupt/orphan
// already-saved history and break statistics matching against these exact
// strings.
export const POSTPARTUM_SLEEP_OPTIONS: string[] = ['Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'];

// Fatigue/Douleurs share the same intensity scale (Aucune → Très forte) —
// neutral, non-diagnostic wording, consistent with Cycle's own symptom
// intensity vocabulary.
//
// DATA-BEARING — NOT display-only text. PostpartumJournalEntryScreen.tsx
// saves these raw French label strings verbatim as `fatigue`/`pain: string`
// via savePostpartumJournalField(...) — there is no separate enum.
// Translating these would silently corrupt/orphan already-saved history and
// break statistics matching against these exact strings.
export const POSTPARTUM_FATIGUE_OPTIONS: string[] = ['Aucune', 'Légère', 'Modérée', 'Forte', 'Très forte'];
export const POSTPARTUM_PAIN_OPTIONS: string[] = ['Aucune', 'Légère', 'Modérée', 'Forte', 'Très forte'];

// Récupération physique — a subjective progress scale (Difficile → Très
// bonne), tracking-only, never a medical interpretation.
//
// DATA-BEARING — NOT display-only text. PostpartumJournalEntryScreen.tsx
// saves this raw French label string verbatim as `physicalRecovery: string`
// via savePostpartumJournalField(entryDateKey, 'physicalRecovery',
// physicalRecovery) — there is no separate enum. Translating these would
// silently corrupt/orphan already-saved history and break statistics
// matching against these exact strings.
export const POSTPARTUM_RECOVERY_OPTIONS: string[] = ['Difficile', 'Lente', 'Stable', 'Bonne', 'Très bonne'];
