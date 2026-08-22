import AsyncStorage from '@react-native-async-storage/async-storage';

export type ConceptionTryingDuration = 'starting_now' | 'under_3_months' | '3_to_6_months' | '6_to_12_months' | 'over_1_year';
export type OvulationAwareness = 'often' | 'sometimes' | 'not_really';
export type FertilityIndicator = 'temperature' | 'cervical_mucus' | 'lh_tests' | 'intercourse';
export type ConceptionReminderKey = 'fertile_window' | 'estimated_ovulation' | 'temperature' | 'lh_test' | 'daily_journal';

export type ConceptionPreferences = {
  tryingDuration: ConceptionTryingDuration | null;
  ovulationAwareness: OvulationAwareness | null;
  indicators: FertilityIndicator[];
  reminders: Record<ConceptionReminderKey, boolean>;
};

const STORAGE_KEY = '@hawa/conception-preferences';
const defaultPreferences: ConceptionPreferences = {
  tryingDuration: null,
  ovulationAwareness: null,
  indicators: [],
  // All off by default — reminders are opt-in only, never enabled without an
  // explicit user choice on the "Rappels personnalisés" screen.
  reminders: {fertile_window: false, estimated_ovulation: false, temperature: false, lh_test: false, daily_journal: false},
};
let preferences: ConceptionPreferences = {...defaultPreferences, reminders: {...defaultPreferences.reminders}};
let hydration: Promise<ConceptionPreferences> | null = null;
const listeners = new Set<() => void>();
const notifyListeners = () => listeners.forEach(listener => listener());

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

const REMINDER_KEYS: ConceptionReminderKey[] = ['fertile_window', 'estimated_ovulation', 'temperature', 'lh_test', 'daily_journal'];

/** Drops any unrecognized key (e.g. a stale `intercourse` persisted before
 * that reminder was removed) instead of carrying it forward indefinitely —
 * same filtering discipline `indicators` already applies just below. */
const sanitizeReminders = (value: unknown): Record<ConceptionReminderKey, boolean> => {
  const sanitized = {...defaultPreferences.reminders};
  if (isObject(value)) {
    for (const key of REMINDER_KEYS) {
      const entry = value[key];
      if (typeof entry === 'boolean') {
        sanitized[key] = entry;
      }
    }
  }
  return sanitized;
};

export const getConceptionPreferences = (): ConceptionPreferences => ({...preferences, indicators: [...preferences.indicators], reminders: {...preferences.reminders}});

/** Notified whenever conception preferences change (e.g. "Rappels
 * personnalisés" toggles) — see conceptionReminderScheduling.ts, the sole
 * consumer, which re-syncs TTC local reminders on every change. */
export const subscribeConceptionPreferences = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const hydrateConceptionPreferences = (): Promise<ConceptionPreferences> => {
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) {return getConceptionPreferences();}
      const value: unknown = JSON.parse(raw);
      if (isObject(value)) {
        preferences = {
          ...defaultPreferences,
          ...value,
          indicators: Array.isArray(value.indicators) ? value.indicators.filter((item): item is FertilityIndicator => item === 'temperature' || item === 'cervical_mucus' || item === 'lh_tests' || item === 'intercourse') : [],
          reminders: sanitizeReminders(value.reminders),
        } as ConceptionPreferences;
      }
      notifyListeners();
      return getConceptionPreferences();
    }).catch(() => getConceptionPreferences());
  }
  return hydration;
};

export const setConceptionPreferences = async (next: Partial<ConceptionPreferences>): Promise<void> => {
  preferences = {...preferences, ...next, indicators: next.indicators ? [...next.indicators] : preferences.indicators, reminders: next.reminders ? {...next.reminders} : preferences.reminders};
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  notifyListeners();
};
