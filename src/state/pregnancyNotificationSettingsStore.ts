import AsyncStorage from '@react-native-async-storage/async-storage';
import type {PregnancyReminderOffset} from './pregnancyMedicalEventsStore';

// Preferences for the "Notifications & rappels" screen — general
// grossesse/journal toggles plus the default reminder offset applied when a
// new appointment/exam is created (individual events can still override
// their own offset). Same module-singleton + AsyncStorage pattern as
// pregnancyPreferences.ts.
export type PregnancyNotificationSettings = {
  weeklyUpdateEnabled: boolean;
  dailyJournalEnabled: boolean;
  /** 'HH:mm', local time. */
  dailyJournalTime: string;
  appointmentsEnabled: boolean;
  examsEnabled: boolean;
  defaultAppointmentReminderOffset: PregnancyReminderOffset;
  defaultExamReminderOffset: PregnancyReminderOffset;
};

const STORAGE_KEY = '@hawa/pregnancy-notification-settings';

const DEFAULT_SETTINGS: PregnancyNotificationSettings = {
  weeklyUpdateEnabled: true,
  dailyJournalEnabled: false,
  dailyJournalTime: '20:00',
  appointmentsEnabled: true,
  examsEnabled: true,
  defaultAppointmentReminderOffset: '1day',
  defaultExamReminderOffset: '1day',
};

let cache: PregnancyNotificationSettings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

/** Synchronous last-known value — read after hydratePregnancyNotificationSettings() has resolved once. */
export function getPregnancyNotificationSettings(): PregnancyNotificationSettings {
  return cache;
}

export async function hydratePregnancyNotificationSettings(): Promise<PregnancyNotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = {...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PregnancyNotificationSettings>)};
    }
  } catch {
    // keep defaults
  }
  return cache;
}

export async function setPregnancyNotificationSettings(value: PregnancyNotificationSettings): Promise<void> {
  cache = value;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  listeners.forEach(listener => listener());
}

export function subscribePregnancyNotificationSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
