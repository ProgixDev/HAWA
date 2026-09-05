import AsyncStorage from '@react-native-async-storage/async-storage';

// Canonical onboarding/tracking data for the "Post-ménopause / Ménopause"
// objective (ObjectiveId === 'menopause'). Deliberately isolated from
// onboardingPreferences.ts (Cycle), miscarriagePreferences.ts,
// pregnancyPreferences.ts, postpartumPreferences.ts and
// contraceptionPreferences.ts — own storage key, own in-memory singleton,
// same module pattern already used by miscarriagePreferences.ts. This only
// ever configures what the user wants to track (stage, symptoms, whether
// hormonal-treatment tracking should be available, which lab results to
// track) — it never stores a diagnosis, an interpretation, or an invented
// treatment schedule (see the 4 onboarding screens for the product boundary).
export type MenopauseStage = 'perimenopause' | 'menopause' | 'unsure';

export type MenopauseSymptom =
  | 'hot_flashes'
  | 'night_sweats'
  | 'sleep_disturbances'
  | 'fatigue'
  | 'mood_changes'
  | 'brain_fog';

/** Whether hormonal-treatment tracking should be available/personalized
 * later — deliberately not a boolean: "not_now" must remain distinguishable
 * from an explicit "no", matching the 3 onboarding options exactly. Never
 * carries a dose/schedule/frequency — those are configured later, elsewhere,
 * only from the user's own explicit input. */
export type MenopauseHormonalTreatmentStatus = 'track' | 'no' | 'not_now';

export type MenopauseLabTracking = 'fsh' | 'estradiol' | 'both' | 'none';

export type MenopausePreferences = {
  stage: MenopauseStage | null;
  trackedSymptoms: MenopauseSymptom[];
  hormonalTreatmentStatus: MenopauseHormonalTreatmentStatus | null;
  labTracking: MenopauseLabTracking | null;
  /** Optional reminder onboarding (MenopauseRemindersScreen). Both reminders
   * are opt-in and independent — enabling one never implies the other.
   * `*ReminderTime` is 'HH:mm' local time, same format as
   * pregnancyNotificationSettingsStore.ts's dailyJournalTime and
   * contraceptionPreferences.ts's reminderTime — never a second time format.
   * `null` until the user explicitly picks a time; never a fabricated
   * default hour, so `*ReminderEnabled` can be true while the time is still
   * unset only transiently, during the onboarding screen's own validation. */
  dailyTrackingReminderEnabled: boolean;
  dailyTrackingReminderTime: string | null;
  /** Only ever meaningful while hormonalTreatmentStatus === 'track' — see
   * menopauseReminderScheduling.ts, which re-checks that condition on every
   * sync rather than trusting this flag alone. */
  treatmentReminderEnabled: boolean;
  treatmentReminderTime: string | null;
};

const STORAGE_KEY = '@hawa/menopause-preferences/v1';
const DEFAULT_PREFERENCES: MenopausePreferences = {
  stage: null,
  trackedSymptoms: [],
  hormonalTreatmentStatus: null,
  labTracking: null,
  dailyTrackingReminderEnabled: false,
  dailyTrackingReminderTime: null,
  treatmentReminderEnabled: false,
  treatmentReminderTime: null,
};

let menopausePreferences: MenopausePreferences = {...DEFAULT_PREFERENCES};
const listeners = new Set<() => void>();
let hydration: Promise<MenopausePreferences> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidStage = (value: unknown): value is MenopauseStage =>
  value === 'perimenopause' || value === 'menopause' || value === 'unsure';

const isValidSymptom = (value: unknown): value is MenopauseSymptom =>
  value === 'hot_flashes' ||
  value === 'night_sweats' ||
  value === 'sleep_disturbances' ||
  value === 'fatigue' ||
  value === 'mood_changes' ||
  value === 'brain_fog';

const isValidHormonalTreatmentStatus = (value: unknown): value is MenopauseHormonalTreatmentStatus =>
  value === 'track' || value === 'no' || value === 'not_now';

const isValidLabTracking = (value: unknown): value is MenopauseLabTracking =>
  value === 'fsh' || value === 'estradiol' || value === 'both' || value === 'none';

const isValidReminderTime = (value: unknown): value is string | null =>
  value === null || value === undefined || typeof value === 'string';

const isValidPreferences = (value: unknown): value is Partial<MenopausePreferences> => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<MenopausePreferences>;
  return (
    (candidate.stage === undefined || candidate.stage === null || isValidStage(candidate.stage)) &&
    (candidate.trackedSymptoms === undefined || (Array.isArray(candidate.trackedSymptoms) && candidate.trackedSymptoms.every(isValidSymptom))) &&
    (candidate.hormonalTreatmentStatus === undefined || candidate.hormonalTreatmentStatus === null || isValidHormonalTreatmentStatus(candidate.hormonalTreatmentStatus)) &&
    (candidate.labTracking === undefined || candidate.labTracking === null || isValidLabTracking(candidate.labTracking)) &&
    (candidate.dailyTrackingReminderEnabled === undefined || typeof candidate.dailyTrackingReminderEnabled === 'boolean') &&
    isValidReminderTime(candidate.dailyTrackingReminderTime) &&
    (candidate.treatmentReminderEnabled === undefined || typeof candidate.treatmentReminderEnabled === 'boolean') &&
    isValidReminderTime(candidate.treatmentReminderTime)
  );
};

export const getMenopausePreferences = (): MenopausePreferences => ({
  ...menopausePreferences,
  trackedSymptoms: [...menopausePreferences.trackedSymptoms],
});

export const setMenopausePreferences = async (value: MenopausePreferences): Promise<void> => {
  menopausePreferences = {...value, trackedSymptoms: [...value.trackedSymptoms]};
  notifyListeners();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(menopausePreferences));
};

/** THE single canonical way to record the current-stage answer — used by
 * MenopauseStageScreen (and nowhere else; do not duplicate this call). The
 * user's explicit choice only — never inferred from age, cycle history,
 * symptoms or lab values. */
export const setMenopauseStage = async (stage: MenopauseStage): Promise<void> => {
  await setMenopausePreferences({...menopausePreferences, stage});
};

/** THE single canonical way to record which symptoms the user wants to
 * track — used by MenopauseSymptomsScreen (and nowhere else; do not
 * duplicate this call). Replaces the full list so an unchecked symptom is
 * correctly removed; an empty array is a valid, deliberate choice. */
export const setMenopauseTrackedSymptoms = async (symptoms: MenopauseSymptom[]): Promise<void> => {
  await setMenopausePreferences({...menopausePreferences, trackedSymptoms: [...symptoms]});
};

/** THE single canonical way to record the hormonal-treatment tracking
 * answer — used by MenopauseHormonalTreatmentScreen (and nowhere else; do
 * not duplicate this call). Only ever enables/personalizes later tracking —
 * never stores a dose, schedule or frequency. */
export const setMenopauseHormonalTreatmentStatus = async (status: MenopauseHormonalTreatmentStatus): Promise<void> => {
  await setMenopausePreferences({...menopausePreferences, hormonalTreatmentStatus: status});
};

/** THE single canonical way to record which biological results the user
 * wants available for tracking — used by MenopauseLabTrackingScreen (and
 * nowhere else; do not duplicate this call). Configures availability only —
 * never a value, an interpretation or a threshold. */
export const setMenopauseLabTracking = async (labTracking: MenopauseLabTracking): Promise<void> => {
  await setMenopausePreferences({...menopausePreferences, labTracking});
};

/** THE single canonical way to record the optional reminder onboarding
 * answer — used by MenopauseRemindersScreen (and nowhere else; do not
 * duplicate this call). Never infers a schedule: both times come only from
 * what the user explicitly picked on that screen. */
export const setMenopauseReminderPreferences = async (value: {
  dailyTrackingReminderEnabled: boolean;
  dailyTrackingReminderTime: string | null;
  treatmentReminderEnabled: boolean;
  treatmentReminderTime: string | null;
}): Promise<void> => {
  await setMenopausePreferences({...menopausePreferences, ...value});
};

export const hydrateMenopausePreferences = (): Promise<MenopausePreferences> => {
  if (hydrated) {
    return Promise.resolve(getMenopausePreferences());
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidPreferences(parsed)) {
            menopausePreferences = {...DEFAULT_PREFERENCES, ...parsed, trackedSymptoms: parsed.trackedSymptoms ? [...parsed.trackedSymptoms] : []};
            notifyListeners();
          }
        }
        return getMenopausePreferences();
      })
      .catch(() => {
        hydrated = true;
        return getMenopausePreferences();
      });
  }
  return hydration;
};

export const subscribeMenopausePreferences = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
