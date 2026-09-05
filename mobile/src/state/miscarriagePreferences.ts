import AsyncStorage from '@react-native-async-storage/async-storage';

// Canonical onboarding/tracking data for the "Après une fausse couche"
// objective (ObjectiveId === 'loss'). Deliberately isolated from
// onboardingPreferences.ts (Cycle), pregnancyPreferences.ts and
// postpartumPreferences.ts — own storage key, own in-memory singleton, same
// module pattern already used by postpartumPreferences.ts. The product
// intent is explicitly a gentle space to track evolution after a loss
// WITHOUT silently resuming classic cycle/fertility tracking — see
// setMiscarriageCycleReturnStatus and MiscarriageTryingAgainScreen for how
// that boundary is respected.
export type MiscarriageBleedingStatus = 'yes' | 'no' | 'variable';
export type MiscarriageCycleReturnStatus = 'yes' | 'no' | 'unknown';
export type MiscarriageTryingAgainStatus = 'not_now' | 'soon' | 'ready';

export type MiscarriagePreferences = {
  /** 'YYYY-MM-DD' (local calendar day), same convention as the rest of the
   * project's onboarding date fields. Null until the user has picked a
   * date on MiscarriageDateScreen. */
  miscarriageDate: string | null;
  bleedingStatus: MiscarriageBleedingStatus | null;
  cycleReturnStatus: MiscarriageCycleReturnStatus | null;
  /** 'YYYY-MM-DD' — only meaningful when cycleReturnStatus === 'yes'.
   * Optional even then (the date field is explicitly optional in the
   * onboarding UI); cleared whenever cycleReturnStatus changes away from
   * 'yes' so a stale date can never linger under a 'no'/'unknown' answer. */
  firstReturnedPeriodDate: string | null;
  tryingAgainStatus: MiscarriageTryingAgainStatus | null;
  /** The ONLY Miscarriage reminder: an optional, gentle "Suivi quotidien"
   * nudge — never a period/fertility prediction (see the objective's own
   * boundary rule above). Same shape/naming convention as
   * postpartumPreferences.ts's/menopausePreferences.ts's own
   * dailyTrackingReminderEnabled/Time pair — read/written identically by
   * MiscarriageRemindersScreen.tsx in both its onboarding and Profile "Mon
   * objectif" edit modes, so there is exactly one source of truth. */
  dailyTrackingReminderEnabled: boolean;
  dailyTrackingReminderTime: string | null;
};

const STORAGE_KEY = '@hawa/miscarriage-preferences/v1';
const DEFAULT_PREFERENCES: MiscarriagePreferences = {
  miscarriageDate: null,
  bleedingStatus: null,
  cycleReturnStatus: null,
  firstReturnedPeriodDate: null,
  tryingAgainStatus: null,
  dailyTrackingReminderEnabled: false,
  dailyTrackingReminderTime: null,
};

let miscarriagePreferences: MiscarriagePreferences = {...DEFAULT_PREFERENCES};
const listeners = new Set<() => void>();
let hydration: Promise<MiscarriagePreferences> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidBleedingStatus = (value: unknown): value is MiscarriageBleedingStatus =>
  value === 'yes' || value === 'no' || value === 'variable';

const isValidCycleReturnStatus = (value: unknown): value is MiscarriageCycleReturnStatus =>
  value === 'yes' || value === 'no' || value === 'unknown';

const isValidTryingAgainStatus = (value: unknown): value is MiscarriageTryingAgainStatus =>
  value === 'not_now' || value === 'soon' || value === 'ready';

const isValidPreferences = (value: unknown): value is Partial<MiscarriagePreferences> => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<MiscarriagePreferences>;
  return (
    (candidate.miscarriageDate === undefined || candidate.miscarriageDate === null || typeof candidate.miscarriageDate === 'string') &&
    (candidate.bleedingStatus === undefined || candidate.bleedingStatus === null || isValidBleedingStatus(candidate.bleedingStatus)) &&
    (candidate.cycleReturnStatus === undefined || candidate.cycleReturnStatus === null || isValidCycleReturnStatus(candidate.cycleReturnStatus)) &&
    (candidate.firstReturnedPeriodDate === undefined || candidate.firstReturnedPeriodDate === null || typeof candidate.firstReturnedPeriodDate === 'string') &&
    (candidate.tryingAgainStatus === undefined || candidate.tryingAgainStatus === null || isValidTryingAgainStatus(candidate.tryingAgainStatus)) &&
    (candidate.dailyTrackingReminderEnabled === undefined || typeof candidate.dailyTrackingReminderEnabled === 'boolean') &&
    (candidate.dailyTrackingReminderTime === undefined ||
      candidate.dailyTrackingReminderTime === null ||
      typeof candidate.dailyTrackingReminderTime === 'string')
  );
};

export const getMiscarriagePreferences = (): MiscarriagePreferences => ({...miscarriagePreferences});

export const setMiscarriagePreferences = async (value: MiscarriagePreferences): Promise<void> => {
  miscarriagePreferences = {...value};
  notifyListeners();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(miscarriagePreferences));
};

/** THE single canonical way to record the miscarriage date — used by
 * MiscarriageDateScreen (and nowhere else; do not duplicate this call).
 * Deliberately never written to onboardingPreferences.ts (Cycle). */
export const setMiscarriageDate = async (date: Date): Promise<void> => {
  await setMiscarriagePreferences({
    ...miscarriagePreferences,
    miscarriageDate: date.toLocaleDateString('en-CA'),
  });
};

/** THE single canonical way to record the current-bleeding answer — used by
 * MiscarriageBleedingScreen (and nowhere else; do not duplicate this call).
 * Intensity/color/duration are deliberately NOT collected here — those
 * belong to Journal quotidien → Saignements. */
export const setMiscarriageBleedingStatus = async (status: MiscarriageBleedingStatus): Promise<void> => {
  await setMiscarriagePreferences({...miscarriagePreferences, bleedingStatus: status});
};

/** THE single canonical way to record the cycle-return answer — used by
 * MiscarriageCycleReturnScreen (and nowhere else; do not duplicate this
 * call). `firstReturnedPeriodDate` is only kept when `status === 'yes'`;
 * any other status clears it, so a stale date can never survive under a
 * changed answer. This deliberately never touches onboardingPreferences.ts
 * (Cycle) — a returned period here must NOT silently start classic cycle/
 * fertility tracking (see MiscarriageTryingAgainScreen for the same
 * boundary on the "trying again" answer). */
export const setMiscarriageCycleReturnStatus = async (
  status: MiscarriageCycleReturnStatus,
  firstReturnedPeriodDate?: Date | null,
): Promise<void> => {
  await setMiscarriagePreferences({
    ...miscarriagePreferences,
    cycleReturnStatus: status,
    firstReturnedPeriodDate: status === 'yes' && firstReturnedPeriodDate
      ? firstReturnedPeriodDate.toLocaleDateString('en-CA')
      : null,
  });
};

/** THE single canonical way to record the "reprise des essais" answer —
 * used by MiscarriageTryingAgainScreen (and nowhere else; do not duplicate
 * this call). This ONLY personalizes the miscarriage support experience —
 * it must never change activeObjective (see onboardingPreferences.ts); the
 * user can manually switch objective later from Profile if she wants. */
export const setMiscarriageTryingAgainStatus = async (status: MiscarriageTryingAgainStatus): Promise<void> => {
  await setMiscarriagePreferences({...miscarriagePreferences, tryingAgainStatus: status});
};

/** THE single canonical way to change the "Suivi quotidien" reminder — used
 * by MiscarriageRemindersScreen.tsx in BOTH its onboarding and Profile
 * "Notifications & rappels" edit modes (and nowhere else; do not duplicate
 * this call or introduce a second onboarding-only/Profile-only value). */
export const setMiscarriageDailyTrackingReminder = async (value: {
  dailyTrackingReminderEnabled: boolean;
  dailyTrackingReminderTime: string | null;
}): Promise<void> => {
  await setMiscarriagePreferences({...miscarriagePreferences, ...value});
};

export const hydrateMiscarriagePreferences = (): Promise<MiscarriagePreferences> => {
  if (hydrated) {
    return Promise.resolve(getMiscarriagePreferences());
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidPreferences(parsed)) {
            miscarriagePreferences = {...DEFAULT_PREFERENCES, ...parsed};
            notifyListeners();
          }
        }
        return getMiscarriagePreferences();
      })
      .catch(() => {
        hydrated = true;
        return getMiscarriagePreferences();
      });
  }
  return hydration;
};

export const subscribeMiscarriagePreferences = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
