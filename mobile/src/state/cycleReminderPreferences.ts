import AsyncStorage from '@react-native-async-storage/async-storage';

// Canonical reminder preferences for the "Suivi du cycle" objective —
// deliberately isolated from cyclePreferences/CyclePreferences in
// onboardingPreferences.ts (which holds real cycle DATA: lastPeriodStart,
// periodDuration, cycleDuration, regularity, period history) — this store
// only ever holds the user's REMINDER choices, never a prediction or a
// schedule. Same module-singleton + AsyncStorage pattern as
// menopausePreferences.ts / contraceptionPreferences.ts. All 5 reminders
// are opt-in and independent — enabling one never implies another.
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

const STORAGE_KEY = '@hawa/cycle-reminder-preferences/v1';

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
 * never has to guess which fields survive a partial merge. */
export const setCycleReminderPreferences = async (value: CycleReminderPreferences): Promise<void> => {
  preferences = {...value};
  notifyListeners();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
};

export const hydrateCycleReminderPreferences = (): Promise<CycleReminderPreferences> => {
  if (hydrated) {
    return Promise.resolve(getCycleReminderPreferences());
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidPreferences(parsed)) {
            preferences = {...DEFAULT_PREFERENCES, ...parsed};
            notifyListeners();
          }
        }
        return getCycleReminderPreferences();
      })
      .catch(() => {
        hydrated = true;
        return getCycleReminderPreferences();
      });
  }
  return hydration;
};

export const subscribeCycleReminderPreferences = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
