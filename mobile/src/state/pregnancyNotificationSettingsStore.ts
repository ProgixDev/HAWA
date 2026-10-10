import AsyncStorage, {readOwnedItem} from '../services/secureAsyncStorage';
import {commitOptimistic} from '../services/saveFailure';
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
    // readOwnedItem: a read that FAILED keeps the key write-protected (the cache below is only defaults) and is re-run by
    // "Try again"; this function is never memoised, so every later call re-reads too.
    const raw = await readOwnedItem(STORAGE_KEY, hydratePregnancyNotificationSettings);
    if (raw) {
      cache = {...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PregnancyNotificationSettings>)};
      listeners.forEach(listener => listener());
    }
  } catch {
    // keep defaults (the key is recorded as unavailable and held when that was the cause)
  }
  return cache;
}

export async function setPregnancyNotificationSettings(value: PregnancyNotificationSettings): Promise<void> {
  const previous = cache;
  cache = value;
  // Rejects on a refused/failed write (see services/saveFailure.ts) and puts the previous settings back.
  await commitOptimistic(previous, () => cache, restored => {
    cache = restored;
  }, () => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value)));
  listeners.forEach(listener => listener());
}

export function subscribePregnancyNotificationSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
