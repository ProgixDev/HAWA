import AsyncStorage from '@react-native-async-storage/async-storage';

export type ConceptionTryingDuration = 'starting_now' | 'under_3_months' | '3_to_6_months' | '6_to_12_months' | 'over_1_year';
export type OvulationAwareness = 'often' | 'sometimes' | 'not_really';
export type FertilityIndicator = 'temperature' | 'cervical_mucus' | 'lh_tests' | 'intercourse';
export type ConceptionReminderKey = 'fertile_window' | 'estimated_ovulation' | 'temperature' | 'lh_test' | 'daily_journal' | 'intercourse';

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
  reminders: {fertile_window: true, estimated_ovulation: true, temperature: true, lh_test: true, daily_journal: true, intercourse: false},
};
let preferences: ConceptionPreferences = {...defaultPreferences, reminders: {...defaultPreferences.reminders}};
let hydration: Promise<ConceptionPreferences> | null = null;

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

export const getConceptionPreferences = (): ConceptionPreferences => ({...preferences, indicators: [...preferences.indicators], reminders: {...preferences.reminders}});

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
          reminders: isObject(value.reminders) ? {...defaultPreferences.reminders, ...value.reminders} : {...defaultPreferences.reminders},
        } as ConceptionPreferences;
      }
      return getConceptionPreferences();
    }).catch(() => getConceptionPreferences());
  }
  return hydration;
};

export const setConceptionPreferences = async (next: Partial<ConceptionPreferences>): Promise<void> => {
  preferences = {...preferences, ...next, indicators: next.indicators ? [...next.indicators] : preferences.indicators, reminders: next.reminders ? {...next.reminders} : preferences.reminders};
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
};
