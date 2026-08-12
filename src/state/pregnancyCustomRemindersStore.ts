import AsyncStorage from '@react-native-async-storage/async-storage';

// User-created custom reminders ("Rappels personnalisés") in "Notifications
// & rappels". Same conventions as pregnancyMedicalEventsStore.ts (plain
// async read/write, no in-memory cache).
export type CustomReminderRepeat = 'once' | 'daily' | 'weekly';

export type CustomReminder = {
  id: string;
  title: string;
  description?: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  /** 'HH:mm', local time. */
  time: string;
  repeat: CustomReminderRepeat;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = '@hawa/pregnancy-custom-reminders';

async function readReminders(): Promise<CustomReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {return [];}
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomReminder[]) : [];
  } catch {
    return [];
  }
}

async function writeReminders(reminders: CustomReminder[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

export async function getCustomReminders(): Promise<CustomReminder[]> {
  return readReminders();
}

/** Adds a new reminder or, when `reminder.id` matches an existing one, replaces it. */
export async function saveCustomReminder(reminder: CustomReminder): Promise<CustomReminder[]> {
  const reminders = await readReminders();
  const next = [...reminders.filter(item => item.id !== reminder.id), reminder];
  await writeReminders(next);
  return next;
}

export async function deleteCustomReminder(id: string): Promise<CustomReminder[]> {
  const reminders = await readReminders();
  const next = reminders.filter(item => item.id !== id);
  await writeReminders(next);
  return next;
}
