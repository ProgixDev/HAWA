import AsyncStorage from '../services/secureAsyncStorage';

import {getActiveProfileId, subscribeActiveProfileId} from './activeProfileStore';
import {profileScopedKey} from './profileScopedStorage';

// Canonical reminder preferences for the "Suivi du cycle" objective —
// deliberately isolated from cyclePreferences/CyclePreferences in
// onboardingPreferences.ts (which holds real cycle DATA: lastPeriodStart,
// periodDuration, cycleDuration, regularity, period history) — this store
// only ever holds the user's REMINDER choices, never a prediction or a
// schedule. Same module-singleton + AsyncStorage pattern as
// menopausePreferences.ts / contraceptionPreferences.ts. All 5 reminders
// are opt-in and independent — enabling one never implies another.
//
// PROFILE-SCOPED (same pattern as qadaaStore.ts/confirmedPeriodHistoryStore.ts):
// the mother and each managed daughter profile keep their own, completely
// independent reminder choices — turning Haifa's "Règles à venir" on/off
// must never read or write the mother's (or another daughter's) preferences.
// The owner's key stays unsuffixed (backward compatible with data written
// before managed profiles existed); a managed profile gets its own
// `:profile:<id>`-suffixed key — see profileScopedStorage.ts.
export type UpcomingPeriodDaysBefore = 1 | 2 | 3;

export type CycleReminderPreferences = {
  upcomingPeriodEnabled: boolean;
  upcomingPeriodDaysBefore: UpcomingPeriodDaysBefore;

  periodStartCheckEnabled: boolean;

  dailyJournalEnabled: boolean;
  /** 'HH:mm', local time — same format as every other AWA reminder time
   * (contraceptionPreferences.ts's reminderTime, pregnancyNotificationSettingsStore.ts's
   * dailyJournalTime, menopausePreferences.ts's *ReminderTime). Null until
   * the user explicitly picks a time; never a fabricated default hour. */
  dailyJournalTime: string | null;

  fertileWindowEnabled: boolean;
  ovulationEnabled: boolean;
};

const STORAGE_KEY_BASE = '@hawa/cycle-reminder-preferences/v1';
const currentStorageKey = () => profileScopedKey(STORAGE_KEY_BASE, getActiveProfileId());

const DEFAULT_PREFERENCES: CycleReminderPreferences = {
  upcomingPeriodEnabled: false,
  upcomingPeriodDaysBefore: 2,
  periodStartCheckEnabled: false,
  dailyJournalEnabled: false,
  dailyJournalTime: null,
  fertileWindowEnabled: false,
  ovulationEnabled: false,
};

let preferences: CycleReminderPreferences = {...DEFAULT_PREFERENCES};
const listeners = new Set<() => void>();
let hydration: Promise<CycleReminderPreferences> | null = null;
let hydrated = false;
let hydratedForProfileId: string | null = null;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidDaysBefore = (value: unknown): value is UpcomingPeriodDaysBefore =>
  value === 1 || value === 2 || value === 3;

const isValidReminderTime = (value: unknown): value is string | null =>
  value === null || value === undefined || typeof value === 'string';

const isValidPreferences = (value: unknown): value is Partial<CycleReminderPreferences> => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<CycleReminderPreferences>;
  return (
    (candidate.upcomingPeriodEnabled === undefined || typeof candidate.upcomingPeriodEnabled === 'boolean') &&
    (candidate.upcomingPeriodDaysBefore === undefined || isValidDaysBefore(candidate.upcomingPeriodDaysBefore)) &&
    (candidate.periodStartCheckEnabled === undefined || typeof candidate.periodStartCheckEnabled === 'boolean') &&
    (candidate.dailyJournalEnabled === undefined || typeof candidate.dailyJournalEnabled === 'boolean') &&
    isValidReminderTime(candidate.dailyJournalTime) &&
    (candidate.fertileWindowEnabled === undefined || typeof candidate.fertileWindowEnabled === 'boolean') &&
    (candidate.ovulationEnabled === undefined || typeof candidate.ovulationEnabled === 'boolean')
  );
};

export const getCycleReminderPreferences = (): CycleReminderPreferences => ({...preferences});

/** THE single canonical way to persist Cycle reminder preferences — used by
 * the Cycle "Notifications & rappels" screen (and nowhere else; do not
 * duplicate this call). Accepts a full object (same convention as
 * menopausePreferences.ts's setMenopauseReminderPreferences) so a caller
 * never has to guess which fields survive a partial merge. Always writes to
 * whichever profile is CURRENTLY active — never the mother's key while a
 * daughter is active, or vice versa. */
export const setCycleReminderPreferences = async (value: CycleReminderPreferences): Promise<void> => {
  preferences = {...value};
  notifyListeners();
  await AsyncStorage.setItem(currentStorageKey(), JSON.stringify(preferences));
};

export const hydrateCycleReminderPreferences = (): Promise<CycleReminderPreferences> => {
  const profileId = getActiveProfileId();
  if (hydrated && hydratedForProfileId === profileId) {
    return Promise.resolve(getCycleReminderPreferences());
  }
  hydration = AsyncStorage.getItem(currentStorageKey())
    .then(raw => {
      hydrated = true;
      hydratedForProfileId = profileId;
      // A clean slate before applying whatever this profile's own key holds —
      // otherwise a profile with no persisted reminders yet (e.g. a freshly
      // switched-to daughter) would keep showing whichever profile's choices
      // happened to be in memory just before the switch.
      preferences = {...DEFAULT_PREFERENCES};
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidPreferences(parsed)) {
          preferences = {...DEFAULT_PREFERENCES, ...parsed};
        }
      }
      notifyListeners();
      return getCycleReminderPreferences();
    })
    .catch(() => {
      hydrated = true;
      hydratedForProfileId = profileId;
      return getCycleReminderPreferences();
    });
  return hydration;
};

// Re-reads (and re-notifies) from the newly active profile's own reminder
// preferences whenever the active profile changes — same pattern as every
// other profile-scoped store (see qadaaStore.ts/confirmedPeriodHistoryStore.ts).
subscribeActiveProfileId(() => {
  hydrated = false;
  hydrateCycleReminderPreferences().catch(() => undefined);
});

export const subscribeCycleReminderPreferences = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Test-only: resets the in-memory cache so the next hydrate re-reads from
 * AsyncStorage — simulates a fresh app start (same convention as
 * resetActiveProfileForTests()/resetManagedProfilesForTests()). */
export const resetCycleReminderPreferencesForTests = (): void => {
  preferences = {...DEFAULT_PREFERENCES};
  hydrated = false;
  hydratedForProfileId = null;
  hydration = null;
};
