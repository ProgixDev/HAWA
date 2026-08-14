import AsyncStorage from '@react-native-async-storage/async-storage';

// Pregnancy dating configuration, collected during onboarding for the
// `pregnancy` objective only. Deliberately isolated from cyclePreferences /
// periodHistory (onboardingPreferences.ts) — a separate storage key, a
// separate in-memory singleton, never read or written by any Cycle code
// path. No medical calculation happens here; this only records how/when
// the user wants her pregnancy dated.
export type PregnancyDatingMethod = 'lastPeriod' | 'dueDate' | 'conceptionDate' | 'later';

export type PregnancyDatingPreferences = {
  method: PregnancyDatingMethod;
  /** ISO date string. Always null when method === 'later'; otherwise null
   * only until the user has picked a real date. */
  date: string | null;
};

const STORAGE_KEY = '@hawa/pregnancy-dating';
const DEFAULT_PREFERENCES: PregnancyDatingPreferences = {method: 'lastPeriod', date: null};

let pregnancyDating: PregnancyDatingPreferences = {...DEFAULT_PREFERENCES};
const listeners = new Set<() => void>();
let hydration: Promise<PregnancyDatingPreferences> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidMethod = (value: unknown): value is PregnancyDatingMethod =>
  value === 'lastPeriod' || value === 'dueDate' || value === 'conceptionDate' || value === 'later';

const isValidPreferences = (value: unknown): value is PregnancyDatingPreferences => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<PregnancyDatingPreferences>;
  return isValidMethod(candidate.method) && (candidate.date === null || typeof candidate.date === 'string');
};

export const getPregnancyDating = (): PregnancyDatingPreferences => ({...pregnancyDating});

export const setPregnancyDating = async (value: PregnancyDatingPreferences): Promise<void> => {
  pregnancyDating = {...value};
  notifyListeners();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pregnancyDating));
};

export const hydratePregnancyDating = (): Promise<PregnancyDatingPreferences> => {
  if (hydrated) {
    return Promise.resolve(getPregnancyDating());
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidPreferences(parsed)) {
            pregnancyDating = parsed;
            notifyListeners();
          }
        }
        return getPregnancyDating();
      })
      .catch(() => {
        hydrated = true;
        return getPregnancyDating();
      });
  }
  return hydration;
};

export const subscribePregnancyDating = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

// Which daily-tracking categories the user wants surfaced — collected right
// after the dating step, reusable later by the Pregnancy Dashboard/Journal/
// Calendar filters. Kept as its own key in this same "pregnancy onboarding
// preferences" module rather than a new store, and rather than folded into
// PregnancyDatingPreferences above (different concern, different shape).
export type PregnancyTrackingPreference =
  | 'symptoms'
  | 'mood'
  | 'weight'
  | 'sleep'
  | 'hydration'
  | 'activity'
  | 'notes'
  | 'medicalInfo'
  | 'appointments';

export const ALL_PREGNANCY_TRACKING_PREFERENCES: readonly PregnancyTrackingPreference[] = [
  'symptoms', 'mood', 'weight', 'sleep', 'hydration', 'activity', 'notes', 'medicalInfo', 'appointments',
];

const TRACKING_STORAGE_KEY = '@hawa/pregnancy-tracking-preferences';

// Default: everything selected (acceptable for the current frontend-only
// onboarding demo) — fully editable, never locked.
let pregnancyTrackingPreferences: Set<PregnancyTrackingPreference> = new Set(ALL_PREGNANCY_TRACKING_PREFERENCES);
const trackingListeners = new Set<() => void>();
let trackingHydration: Promise<Set<PregnancyTrackingPreference>> | null = null;
let trackingHydrated = false;

const notifyTrackingListeners = () => {
  trackingListeners.forEach(listener => listener());
};

const isValidTrackingPreference = (value: unknown): value is PregnancyTrackingPreference =>
  typeof value === 'string' && (ALL_PREGNANCY_TRACKING_PREFERENCES as readonly string[]).includes(value);

export const getPregnancyTrackingPreferences = (): Set<PregnancyTrackingPreference> =>
  new Set(pregnancyTrackingPreferences);

export const setPregnancyTrackingPreferences = async (value: Set<PregnancyTrackingPreference>): Promise<void> => {
  pregnancyTrackingPreferences = new Set(value);
  notifyTrackingListeners();
  await AsyncStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(Array.from(pregnancyTrackingPreferences)));
};

export const hydratePregnancyTrackingPreferences = (): Promise<Set<PregnancyTrackingPreference>> => {
  if (trackingHydrated) {
    return Promise.resolve(getPregnancyTrackingPreferences());
  }
  if (!trackingHydration) {
    trackingHydration = AsyncStorage.getItem(TRACKING_STORAGE_KEY)
      .then(raw => {
        trackingHydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.every(isValidTrackingPreference)) {
            pregnancyTrackingPreferences = new Set(parsed);
            notifyTrackingListeners();
          }
        }
        return getPregnancyTrackingPreferences();
      })
      .catch(() => {
        trackingHydrated = true;
        return getPregnancyTrackingPreferences();
      });
  }
  return trackingHydration;
};

export const subscribePregnancyTrackingPreferences = (listener: () => void) => {
  trackingListeners.add(listener);
  return () => {trackingListeners.delete(listener);};
};

// Which reminder categories the user wants — the last pregnancy onboarding
// step. Purely a UI preference at this stage: no notification/scheduling
// infrastructure is wired up yet (see PregnancyRemindersScreen.tsx).
// "Hydratation" and "Suivi du poids" (weight) reminders were replaced by a
// single "Rappels personnalisés" (customReminders) option — see
// normalizeReminderPreferences below for how old persisted data carrying
// those obsolete keys is handled safely.
export type PregnancyReminderPreferences = {
  appointments: boolean;
  exams: boolean;
  dailyJournal: boolean;
  customReminders: boolean;
};

const REMINDER_STORAGE_KEY = '@hawa/pregnancy-reminder-preferences';

// Default: everything enabled (matches the onboarding reference), fully
// editable, never locked.
const DEFAULT_REMINDER_PREFERENCES: PregnancyReminderPreferences = {
  appointments: true,
  exams: true,
  dailyJournal: true,
  customReminders: true,
};

let pregnancyReminderPreferences: PregnancyReminderPreferences = {...DEFAULT_REMINDER_PREFERENCES};
const reminderListeners = new Set<() => void>();
let reminderHydration: Promise<PregnancyReminderPreferences> | null = null;
let reminderHydrated = false;

const notifyReminderListeners = () => {
  reminderListeners.forEach(listener => listener());
};

// Reconstructs a valid PregnancyReminderPreferences field-by-field rather
// than rejecting the whole persisted object outright — old data may still
// carry the obsolete `hydration`/`weight` reminder keys (from before they
// were replaced by `customReminders`), and those must be safely ignored,
// never crashing and never migrated into `customReminders` (they mean
// different things). Each of the 4 current keys keeps its own real saved
// value when present and falls back to its own canonical default otherwise
// — so a user's existing appointments/exams/dailyJournal choices survive
// even though `customReminders` didn't exist yet when they were saved.
const normalizeReminderPreferences = (value: unknown): PregnancyReminderPreferences => {
  const candidate = (value && typeof value === 'object' ? value : {}) as Partial<Record<keyof PregnancyReminderPreferences, unknown>>;
  return {
    appointments: typeof candidate.appointments === 'boolean' ? candidate.appointments : DEFAULT_REMINDER_PREFERENCES.appointments,
    exams: typeof candidate.exams === 'boolean' ? candidate.exams : DEFAULT_REMINDER_PREFERENCES.exams,
    dailyJournal: typeof candidate.dailyJournal === 'boolean' ? candidate.dailyJournal : DEFAULT_REMINDER_PREFERENCES.dailyJournal,
    customReminders: typeof candidate.customReminders === 'boolean' ? candidate.customReminders : DEFAULT_REMINDER_PREFERENCES.customReminders,
  };
};

export const getPregnancyReminderPreferences = (): PregnancyReminderPreferences => ({...pregnancyReminderPreferences});

export const setPregnancyReminderPreferences = async (value: PregnancyReminderPreferences): Promise<void> => {
  pregnancyReminderPreferences = {...value};
  notifyReminderListeners();
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(pregnancyReminderPreferences));
};

export const hydratePregnancyReminderPreferences = (): Promise<PregnancyReminderPreferences> => {
  if (reminderHydrated) {
    return Promise.resolve(getPregnancyReminderPreferences());
  }
  if (!reminderHydration) {
    reminderHydration = AsyncStorage.getItem(REMINDER_STORAGE_KEY)
      .then(raw => {
        reminderHydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          pregnancyReminderPreferences = normalizeReminderPreferences(parsed);
          notifyReminderListeners();
        }
        return getPregnancyReminderPreferences();
      })
      .catch(() => {
        reminderHydrated = true;
        return getPregnancyReminderPreferences();
      });
  }
  return reminderHydration;
};

export const subscribePregnancyReminderPreferences = (listener: () => void) => {
  reminderListeners.add(listener);
  return () => {reminderListeners.delete(listener);};
};
