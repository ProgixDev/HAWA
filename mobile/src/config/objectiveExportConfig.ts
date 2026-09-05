import type {ObjectiveId} from '../state/onboardingPreferences';

// Single source of truth for "which export categories exist for which
// objective" (DataExportScreen in BackupUtilityScreens.tsx) AND for the
// actual reader dispatch (medicalExportReaders.ts/medicalExportOrchestrator.ts)
// — so the checkbox list shown to the user and the data actually read can
// never drift apart. Every category here maps to a REAL, audited store field
// (see medicalExportReaders.ts for exactly which store/field each one
// reads) — nothing here is invented or copied from another objective.
//
// 'irregular' (SOPK) has no dedicated store anywhere in the app — per the
// documented architecture (HomeScreen.tsx/ObjectiveAwareCalendarScreen.tsx/
// ObjectiveAwareStatisticsScreen.tsx all fall through to the generic Cycle
// screens for 'irregular'), its export reuses the exact same categories and
// reader as 'cycle'.
export type ExportCategoryDef = {
  value: string;
  label: string;
  icon: string;
  /** Sensitive categories are never part of the default selection — the
   * user must explicitly opt in every time (see DataExportScreen). */
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
  {value: 'cycle', label: 'Cycle', icon: 'calendar-heart'},
  {value: 'flow', label: 'Flux menstruel', icon: 'water-outline'},
  {value: 'symptoms', label: 'Symptômes', icon: 'heart-pulse'},
  {value: 'mood', label: 'Humeur', icon: 'emoticon-happy-outline'},
  {value: 'sleep', label: 'Sommeil', icon: 'weather-night'},
  {value: 'activity', label: 'Activité', icon: 'walk'},
  {value: 'hydration', label: 'Hydratation', icon: 'cup-water'},
  {value: 'temperature', label: 'Température', icon: 'thermometer'},
  {value: 'weight', label: 'Poids', icon: 'scale-bathroom'},
  {value: 'notes', label: 'Notes privées', icon: 'notebook-edit-outline', sensitive: true},
  {value: 'intimacy', label: 'Vie intime', icon: 'heart-outline', sensitive: true},
];

export const OBJECTIVE_EXPORT_CONFIG: Record<ObjectiveId, ObjectiveExportConfig> = {
  cycle: {objective: 'cycle', label: 'Suivre mon cycle', categories: CYCLE_CATEGORIES},
  // Same real backing stores as Cycle — no dedicated SOPK store exists.
  irregular: {objective: 'irregular', label: 'Cycles irréguliers (SOPK)', categories: CYCLE_CATEGORIES},

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
