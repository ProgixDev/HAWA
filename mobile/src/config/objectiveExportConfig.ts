import type {ObjectiveId} from '../state/onboardingPreferences';

// Single source of truth for "which export categories exist for which
// objective" (DataExportScreen in BackupUtilityScreens.tsx) AND for the
// actual reader dispatch (medicalExportReaders.ts/medicalExportOrchestrator.ts)
// — so the checkbox list shown to the user and the data actually read can
// never drift apart. Every category here maps to a REAL, audited store field
// (see medicalExportReaders.ts for exactly which store/field each one
// reads) — nothing here is invented or copied from another objective.
//
// 'irregular' (SOPK) has its own daily-tracking store (irregularJournalStore.ts)
// plus the shared dailyJournalStore `flow` section for the period answer, so
// its export offers ONLY the categories the SOPK journal actually writes (see
// buildIrregularExportDays in medicalExportReaders.ts) — never Cycle-only
// fields (sleep, hydration, temperature, intimacy...) it would always leave
// empty.
//
// 'cycle' offers ONLY what the Cycle objective can actually record: the
// period dates (onboardingPreferences recorded period history + the
// confirmed-end history) and the categories saved by Cycle's own "Journal
// quotidien" (CYCLE_JOURNAL_ITEMS: symptoms, mood, activity, sleep,
// hydration, flow, intimacy, note). Temperature and weight have no Cycle
// writer (their entry screens belong to Conceive / Pregnancy / SOPK — the
// Cycle Calendar already dropped them, see calendarFilters.ts) and the old
// "Cycle" (journal cycleDay) category was never written by anything, so none
// of the three is offered: a checkbox that can never produce data is misleading.
export type ExportCategoryDef = {
  value: string;
  label: string;
  icon: string;
  /** Sensitive categories are never part of the default selection — the
   * user must explicitly opt in every time (see DataExportScreen). They are
   * also the categories that carry DECRYPTED private content (free-text notes,
   * intimacy, medical information...): exporting any of them requires the
   * existing private-section unlock first (see exportRequiresPrivateUnlock and
   * medicalExportOrchestrator.ts). Every ENCRYPTED-at-rest free-text field an
   * objective can export must land in a category flagged here — never inside a
   * plain, default-on category. */
  sensitive?: boolean;
};

export type ObjectiveExportConfig = {
  objective: ObjectiveId;
  /** French display label reused from ProfileScreen.tsx's own
   * OBJECTIVE_LABELS wording, kept local here since it's a static string,
   * not shared business logic. */
  label: string;
  categories: ExportCategoryDef[];
};

const CYCLE_CATEGORIES: ExportCategoryDef[] = [
  {value: 'periods', label: 'Dates des règles', icon: 'calendar-heart'},
  {value: 'flow', label: 'Flux menstruel', icon: 'water-outline'},
  {value: 'symptoms', label: 'Symptômes', icon: 'heart-pulse'},
  {value: 'mood', label: 'Humeur', icon: 'emoticon-happy-outline'},
  {value: 'sleep', label: 'Sommeil', icon: 'weather-night'},
  {value: 'activity', label: 'Activité', icon: 'walk'},
  {value: 'hydration', label: 'Hydratation', icon: 'cup-water'},
  {value: 'notes', label: 'Notes privées', icon: 'notebook-edit-outline', sensitive: true},
  {value: 'intimacy', label: 'Vie intime', icon: 'heart-outline', sensitive: true},
];

const IRREGULAR_CATEGORIES: ExportCategoryDef[] = [
  {value: 'period', label: 'Règles (flux, spotting)', icon: 'water-outline'},
  {value: 'acne', label: 'Acné', icon: 'face-woman-shimmer-outline'},
  {value: 'hairGrowth', label: 'Pilosité', icon: 'content-cut'},
  {value: 'pain', label: 'Douleurs', icon: 'heat-wave'},
  {value: 'fatigue', label: 'Fatigue & symptômes associés', icon: 'lightning-bolt-outline'},
  {value: 'mood', label: 'Humeur', icon: 'emoticon-happy-outline'},
  {value: 'weight', label: 'Poids', icon: 'scale-bathroom'},
  {value: 'notes', label: 'Notes du jour', icon: 'notebook-edit-outline', sensitive: true},
];

export const OBJECTIVE_EXPORT_CONFIG: Record<ObjectiveId, ObjectiveExportConfig> = {
  cycle: {objective: 'cycle', label: 'Suivre mon cycle', categories: CYCLE_CATEGORIES},
  irregular: {objective: 'irregular', label: 'Cycles irréguliers (SOPK)', categories: IRREGULAR_CATEGORIES},

  conceive: {
    objective: 'conceive',
    label: 'Essayer de concevoir',
    categories: [
      {value: 'temperature', label: 'Température basale', icon: 'thermometer'},
      {value: 'lhTest', label: 'Tests d’ovulation (LH)', icon: 'flask-outline'},
      {value: 'cervicalMucus', label: 'Glaire cervicale', icon: 'water-outline'},
      {value: 'symptoms', label: 'Symptômes', icon: 'heart-pulse'},
      {value: 'mood', label: 'Humeur', icon: 'emoticon-happy-outline'},
      {value: 'intimacy', label: 'Rapports / Vie intime', icon: 'heart-outline', sensitive: true},
      {value: 'notes', label: 'Notes privées', icon: 'notebook-edit-outline', sensitive: true},
    ],
  },

  pregnancy: {
    objective: 'pregnancy',
    label: 'Suivi de grossesse',
    categories: [
      {value: 'symptoms', label: 'Symptômes', icon: 'heart-pulse'},
      {value: 'weight', label: 'Poids', icon: 'scale-bathroom'},
      {value: 'mood', label: 'Humeur', icon: 'emoticon-happy-outline'},
      {value: 'sleep', label: 'Sommeil', icon: 'weather-night'},
      {value: 'appointments', label: 'Rendez-vous / Examens', icon: 'calendar-clock-outline'},
      {value: 'medicalInfo', label: 'Informations médicales', icon: 'shield-lock-outline', sensitive: true},
      // Encrypted free text (symptom notes, appointment/exam notes, journal
      // mood/sleep notes) — see buildPregnancyExportDays. Category name is a
      // PRODUCT DECISION (M43): "Notes personnelles" mirrors the other objectives.
      {value: 'notes', label: 'Notes personnelles', icon: 'notebook-edit-outline', sensitive: true},
    ],
  },

  contraception: {
    objective: 'contraception',
    label: 'Contraception',
    categories: [
      {value: 'intake', label: 'Suivi de prise', icon: 'pill'},
      {value: 'events', label: 'Anneau / Patch', icon: 'calendar-clock-outline'},
      {value: 'journal', label: 'Journal (ressenti, notes)', icon: 'notebook-edit-outline', sensitive: true},
    ],
  },

  postpartum: {
    objective: 'postpartum',
    label: 'Suivi post-partum',
    categories: [
      {value: 'fatigue', label: 'Fatigue', icon: 'lightning-bolt-outline'},
      {value: 'sleep', label: 'Sommeil', icon: 'weather-night'},
      {value: 'mood', label: 'Humeur', icon: 'heart-outline'},
      {value: 'pain', label: 'Douleurs', icon: 'heat-wave'},
      {value: 'physicalRecovery', label: 'Récupération physique', icon: 'heart-pulse'},
      {value: 'lochia', label: 'Lochies', icon: 'water-outline', sensitive: true},
      // Encrypted mood note — see buildPostpartumExportDays. Category name is a
      // PRODUCT DECISION (M43): "Notes personnelles" mirrors the other objectives.
      {value: 'notes', label: 'Notes personnelles', icon: 'notebook-edit-outline', sensitive: true},
    ],
  },

  loss: {
    objective: 'loss',
    label: 'Après une fausse couche',
    categories: [
      {value: 'bleeding', label: 'Saignements', icon: 'water-outline'},
      {value: 'symptoms', label: 'Symptômes physiques', icon: 'heart-pulse'},
      {value: 'notes', label: 'Notes personnelles', icon: 'notebook-edit-outline', sensitive: true},
    ],
  },

  menopause: {
    objective: 'menopause',
    label: 'Périménopause / Ménopause',
    categories: [
      {value: 'symptoms', label: 'Symptômes', icon: 'heart-pulse'},
      {value: 'mood', label: 'Humeur', icon: 'emoticon-happy-outline'},
      {value: 'sleep', label: 'Sommeil', icon: 'weather-night'},
      {value: 'energy', label: 'Énergie', icon: 'lightning-bolt-outline'},
      {value: 'treatment', label: 'Traitement hormonal', icon: 'pill', sensitive: true},
      {value: 'labResults', label: 'Résultats d’analyses (FSH, Estradiol)', icon: 'flask-outline'},
      {value: 'notes', label: 'Notes du jour', icon: 'notebook-edit-outline', sensitive: true},
    ],
  },
};

export function getExportConfigurationForObjective(objective: ObjectiveId): ObjectiveExportConfig {
  return OBJECTIVE_EXPORT_CONFIG[objective];
}

/** The subset of `selected` that is flagged `sensitive` for this objective
 * (values that are not valid categories for the objective are ignored). */
export function getSensitiveExportCategories(objective: ObjectiveId, selected: readonly string[]): string[] {
  const sensitiveValues = new Set(
    getExportConfigurationForObjective(objective)
      .categories.filter(category => category.sensitive)
      .map(category => category.value),
  );
  return selected.filter(value => sensitiveValues.has(value));
}

/** True when the selection includes at least one sensitive category — i.e. the
 * export would decrypt private content and must first be authorised by the
 * existing private-section unlock (PIN / biometrics). */
export function exportRequiresPrivateUnlock(objective: ObjectiveId, selected: readonly string[]): boolean {
  return getSensitiveExportCategories(objective, selected).length > 0;
}
