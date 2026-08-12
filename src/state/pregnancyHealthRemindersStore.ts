import AsyncStorage from '@react-native-async-storage/async-storage';

// Vitamin/supplement and medication reminders the user creates herself in
// "Notifications & rappels". The app only ever echoes back what she typed —
// no dosage math, no medical suggestion. Same conventions as
// pregnancyMedicalEventsStore.ts (plain async read/write, no in-memory
// cache).
export type HealthReminderKind = 'vitamin' | 'medication';

export type HealthReminder = {
  id: string;
  kind: HealthReminderKind;
  name: string;
  /** 'HH:mm', local time. */
  time: string;
  repeat: 'daily';
  /** Medication only — 'YYYY-MM-DD'. */
  startDate?: string;
  /** Medication only, optional — 'YYYY-MM-DD'. */
  endDate?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = '@hawa/pregnancy-health-reminders';

async function readReminders(): Promise<HealthReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return [];}
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HealthReminder[]) : [];
  } catch {
    return [];
  }
}

async function writeReminders(reminders: HealthReminder[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

export async function getHealthReminders(): Promise<HealthReminder[]> {
  return readReminders();
}

/** Adds a new reminder or, when `reminder.id` matches an existing one, replaces it. */
export async function saveHealthReminder(reminder: HealthReminder): Promise<HealthReminder[]> {
  const reminders = await readReminders();
  const next = [...reminders.filter(item => item.id !== reminder.id), reminder];
  await writeReminders(next);
  return next;
}

export async function deleteHealthReminder(id: string): Promise<HealthReminder[]> {
  const reminders = await readReminders();
  const next = reminders.filter(item => item.id !== id);
  await writeReminders(next);
  return next;
}
