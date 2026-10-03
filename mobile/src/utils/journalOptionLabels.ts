// A plain functional shape (not i18next's branded TFunction) so this also
// accepts the simple `(key) => string` lookups tests build for a fixed
// language (e.g. `key => i18n.t(key, {lng: 'en'})`), not only the live `t`.
type SimpleTFunction = (key: string, options?: Record<string, unknown>) => string;

// PHASE 7H — centralized DISPLAY-ONLY label lookup for Journal option values
// that are themselves the persisted/stored data (no separate semantic id).
// See each config/screen file's own "DATA-BEARING" comment for why these
// exact French strings must never change in storage: they are compared
// against, counted, and read back from already-saved user records.
//
// journalOptionLabel(namespace, value, t) returns:
//   - the current language's translated label when `value` is a known
//     option for that `namespace` (every mapped key's FRENCH translation is
//     byte-identical to the original string, so `fr.ts` is itself a
//     verification that nothing was silently reworded);
//   - `value` unchanged when it isn't recognized (an unknown/legacy value
//     saved before this config existed, or removed since) — never throws,
//     never hides, never returns an empty string.
//
// Namespaces are kept separate (never one flat global map) so that the same
// French word in two different categories (e.g. "Fatigue" in Cycle's
// symptoms vs. Postpartum's mood) can never collide or cross-contaminate.
//
// Usage at a call site never changes what is stored/compared/selected —
// only `journalOptionLabel(...)`'s OWN return value is rendered; the
// surrounding `key=`, `onPress`, `.includes(...)`, lookup-map keys, etc. all
// keep using the raw stored value exactly as before.
export type JournalOptionNamespace =
  | 'cycleSymptom'
  | 'cycleSymptomLocation'
  | 'cycleSleepQuality'
  | 'cycleSleepFeeling'
  | 'cycleActivityType'
  | 'cycleActivityFeeling'
  | 'cycleActivityIntensity'
  | 'cycleTemperatureMethod'
  | 'cycleIntimacyLibido'
  | 'cycleIntimacyDiscomfort'
  | 'irregularSymptom'
  | 'irregularIntensity'
  | 'irregularFatigueLevel'
  | 'irregularPeriodPainLevel'
  | 'irregularMood'
  | 'irregularAcne'
  | 'irregularHair'
  | 'irregularPainType'
  | 'irregularWeightFeeling'
  | 'irregularAcneArea'
  | 'irregularHairArea'
  | 'irregularPainArea'
  | 'contraceptionFeeling'
  | 'miscarriageBleeding'
  | 'miscarriageBleedingColor'
  | 'miscarriagePhysicalSymptom'
  | 'postpartumMood'
  | 'postpartumSleep'
  | 'postpartumFatigue'
  | 'postpartumPain'
  | 'postpartumRecovery'
  | 'postpartumLochiaFlow'
  | 'postpartumLochiaColor'
  | 'postpartumLochiaConsistency'
  | 'postpartumLochiaSymptom'
  | 'pregnancySymptom';

// Maps each namespace's ORIGINAL French stored value (the key — never
// changed) to a stable slug used only to build the i18n key. Adding a
// language, or fixing a translation's wording, never touches stored data.
const SLUGS: Record<JournalOptionNamespace, Record<string, string>> = {
  cycleSymptom: {
    'Douleurs menstruelles': 'menstrualPain',
    'Crampes': 'cramps',
    'Maux de tête': 'headache',
    'Migraines': 'migraines',
    'Fatigue': 'fatigue',
    'Ballonnements': 'bloating',
    'Nausées': 'nausea',
    'Seins sensibles': 'tenderBreasts',
    'Acné': 'acne',
    'Douleurs lombaires': 'lowerBackPain',
    'Douleurs musculaires': 'musclePain',
    'Constipation': 'constipation',
    'Diarrhée': 'diarrhea',
    'Pertes': 'discharge',
    'Autre': 'other',
  },
  cycleSymptomLocation: {
    'Bas ventre': 'lowerAbdomen',
    'Dos': 'back',
    'Tête': 'head',
    'Seins': 'breasts',
    'Corps entier': 'wholeBody',
  },
  cycleSleepQuality: {
    'Très mauvaise': 'veryPoor',
    'Mauvaise': 'poor',
    'Moyenne': 'average',
    'Bonne': 'good',
    'Excellente': 'excellent',
  },
  cycleSleepFeeling: {
    'Reposée': 'rested',
    'Moyenne': 'average',
    'Fatiguée': 'tired',
  },
  cycleActivityType: {
    'Marche': 'walking',
    'Course': 'running',
    'Yoga': 'yoga',
    'Musculation': 'strengthTraining',
    'Natation': 'swimming',
    'Vélo': 'cycling',
    'Étirements': 'stretching',
    'Pilates': 'pilates',
    'Danse': 'dance',
    'Autre': 'other',
  },
  cycleActivityFeeling: {
    'Très fatiguée': 'veryTired',
    'Fatiguée': 'tired',
    'Neutre': 'neutral',
    'Bien': 'good',
    'Très bien': 'veryGood',
  },
  cycleActivityIntensity: {
    'Légère': 'light',
    'Modérée': 'moderate',
    'Élevée': 'high',
  },
  cycleTemperatureMethod: {
    'Orale': 'oral',
    'Axillaire': 'axillary',
    'Rectale': 'rectal',
    'Autre': 'other',
  },
  cycleIntimacyLibido: {
    'Très faible': 'veryLow',
    'Faible': 'low',
    'Modérée': 'moderate',
    'Élevée': 'high',
    'Très élevée': 'veryHigh',
  },
  cycleIntimacyDiscomfort: {
    'Douleur pendant le rapport': 'painDuringIntercourse',
    'Sécheresse vaginale': 'vaginalDryness',
    'Saignement après rapport': 'bleedingAfterIntercourse',
    'Fatigue': 'fatigue',
    'Douleurs pelviennes': 'pelvicPain',
    'Irritation': 'irritation',
    'Aucun': 'none',
    'Autre': 'other',
  },
  irregularSymptom: {
    'Ballonnements': 'bloating',
    'Maux de tête': 'headache',
    'Nausées': 'nausea',
    'Crampes': 'cramps',
    'Seins sensibles': 'tenderBreasts',
    'Troubles du sommeil': 'sleepTrouble',
    'Autre': 'other',
  },
  irregularIntensity: {
    'Aucune': 'none',
    'Légère': 'light',
    'Modérée': 'moderate',
    'Forte': 'strong',
    'Très forte': 'veryStrong',
  },
  irregularFatigueLevel: {
    'Aucune': 'none',
    'Légère': 'light',
    'Modérée': 'moderate',
    'Forte': 'strong',
  },
  irregularPeriodPainLevel: {
    'Aucune': 'none',
    'Légères': 'light',
    'Modérées': 'moderate',
    'Sévères': 'severe',
  },
  irregularMood: {
    'Très difficile': 'veryHard',
    'Difficile': 'hard',
    'Neutre': 'neutral',
    'Bien': 'good',
    'Très bien': 'veryGood',
  },
  irregularAcne: {
    'Aucune': 'none',
    'Légère': 'light',
    'Modérée': 'moderate',
    'Marquée': 'noticeable',
    'Très marquée': 'veryNoticeable',
  },
  irregularHair: {
    'Aucune': 'none',
    'Légère': 'light',
    'Modérée': 'moderate',
    'Importante': 'significant',
    'Très importante': 'verysignificant',
  },
  irregularPainType: {
    'Crampes': 'cramps',
    'Bas-ventre': 'lowerAbdomen',
    'Dos': 'back',
    'Maux de tête': 'headache',
    'Autre': 'other',
  },
  irregularWeightFeeling: {
    'Bien': 'good',
    'Neutre': 'neutral',
    'Préoccupée': 'concerned',
  },
  irregularAcneArea: {
    'Visage': 'face',
    'Dos': 'back',
    'Poitrine': 'chest',
    'Autre': 'other',
  },
  irregularHairArea: {
    'Visage': 'face',
    'Menton': 'chin',
    'Ventre': 'belly',
    'Bras': 'arms',
    'Jambes': 'legs',
    'Autre': 'other',
  },
  irregularPainArea: {
    'Bas-ventre': 'lowerAbdomen',
    'Dos': 'back',
    'Tête': 'head',
    'Seins': 'breasts',
    'Autre': 'other',
  },
  contraceptionFeeling: {
    'Fatigue': 'fatigue',
    'Maux de tête': 'headache',
    'Nausées': 'nausea',
    'Sensibilité (poitrine)': 'breastTenderness',
    'Changement d’humeur': 'moodChange',
    'Ballonnements': 'bloating',
    'Baisse de libido': 'lowerLibido',
    'Aucun effet particulier': 'noParticularEffect',
  },
  miscarriageBleeding: {
    'Absent': 'absent',
    'Léger': 'light',
    'Modéré': 'moderate',
    'Important': 'heavy',
  },
  miscarriageBleedingColor: {
    'Rouge clair': 'brightRed',
    'Rouge foncé': 'darkRed',
    'Brun': 'brown',
    'Rose': 'pink',
    'Autre': 'other',
  },
  miscarriagePhysicalSymptom: {
    'Fatigue': 'fatigue',
    'Crampes': 'cramps',
    'Douleurs pelviennes': 'pelvicPain',
    'Maux de tête': 'headache',
    'Nausées': 'nausea',
    'Vertiges': 'dizziness',
    'Sensibilité': 'tenderness',
  },
  postpartumMood: {
    'Très difficile': 'veryHard',
    'Difficile': 'hard',
    'Neutre': 'neutral',
    'Bien': 'good',
    'Très bien': 'veryGood',
  },
  postpartumSleep: {
    'Très mauvais': 'veryPoor',
    'Mauvais': 'poor',
    'Moyen': 'average',
    'Bon': 'good',
    'Excellent': 'excellent',
  },
  postpartumFatigue: {
    'Aucune': 'none',
    'Légère': 'light',
    'Modérée': 'moderate',
    'Forte': 'strong',
    'Très forte': 'veryStrong',
  },
  postpartumPain: {
    'Aucune': 'none',
    'Légère': 'light',
    'Modérée': 'moderate',
    'Forte': 'strong',
    'Très forte': 'veryStrong',
  },
  postpartumRecovery: {
    'Difficile': 'hard',
    'Lente': 'slow',
    'Stable': 'stable',
    'Bonne': 'good',
    'Très bonne': 'veryGood',
  },
  postpartumLochiaFlow: {
    'Très léger': 'veryLight',
    'Léger': 'light',
    'Modéré': 'moderate',
    'Abondant': 'heavy',
  },
  postpartumLochiaColor: {
    'Rouge vif': 'brightRed',
    'Rouge': 'red',
    'Rose': 'pink',
    'Brun': 'brown',
    'Jaune / blanc': 'yellowWhite',
  },
  postpartumLochiaConsistency: {
    'Liquide': 'liquid',
    'Épais': 'thick',
    'Avec petits caillots': 'withSmallClots',
  },
  postpartumLochiaSymptom: {
    'Aucun': 'none',
    'Crampes': 'cramps',
    'Fatigue': 'fatigue',
    'Maux de tête': 'headache',
    'Sensibilité': 'tenderness',
    'Autres': 'other',
  },
  pregnancySymptom: {
    'Nausées': 'nausea',
    'Fatigue': 'fatigue',
    'Sensibilité des seins': 'breastTenderness',
    'Ballonnements': 'bloating',
    'Maux de tête': 'headache',
    'Reflux / brûlures d’estomac': 'refluxHeartburn',
    'Douleurs lombaires': 'lowerBackPain',
    'Constipation': 'constipation',
    'Crampes légères': 'lightCramps',
    'Essoufflement': 'shortnessOfBreath',
    'Gonflement': 'swelling',
    'Vertiges': 'dizziness',
    'Troubles du sommeil': 'sleepTrouble',
  },
};

export function journalOptionLabel(namespace: JournalOptionNamespace, value: string, t: SimpleTFunction): string {
  const slug = SLUGS[namespace]?.[value];
  if (!slug) {return value;} // unknown/legacy value — display as-is, never hide or throw
  return t(`journalOptions.${namespace}.${slug}`, {defaultValue: value});
}
