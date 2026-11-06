import AsyncStorage from '@react-native-async-storage/async-storage';

// How often the home screen may offer "Sauvegarde tes données": dismissing it (the cross or "Plus tard") hides it for 10 days; after the
// third dismissal it never comes back; and it is shown at most once per calendar day. A preference stored on the phone only.

const KEY = '@awa/account/backup-reminder-v1';

export const REMINDER_PAUSE_DAYS = 10;
export const REMINDER_MAX_DISMISSALS = 3;

type ReminderRecord = {
  dismissCount: number;
  /** ISO timestamp of the last dismissal. */
  lastDismissedAt: string | null;
  /** Local day (YYYY-MM-DD) on which the card was last shown. */
  lastShownDay: string | null;
};

const EMPTY: ReminderRecord = {dismissCount: 0, lastDismissedAt: null, lastShownDay: null};

let record: ReminderRecord | null = null;
let loading: Promise<ReminderRecord> | null = null;

const dayKey = (date: Date): string => date.toLocaleDateString('en-CA');

export function loadBackupReminder(): Promise<ReminderRecord> {
  if (record) {return Promise.resolve(record);}
  if (!loading) {
    loading = AsyncStorage.getItem(KEY)
      .then(raw => {
        const parsed = raw ? (JSON.parse(raw) as Partial<ReminderRecord>) : {};
        record = {...EMPTY, ...parsed};
        return record;
      })
      .catch(() => {
        record = EMPTY;
        return record;
      });
  }
  return loading;
}

async function save(next: ReminderRecord): Promise<void> {
  record = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
}

/** Whether the card may be offered now (before the "once a day" rule, which `markBackupReminderShown` enforces). */
export async function canShowBackupReminder(now: Date = new Date()): Promise<boolean> {
  const current = await loadBackupReminder();
  if (current.dismissCount >= REMINDER_MAX_DISMISSALS) {return false;}
  if (current.lastDismissedAt) {
    const elapsedDays = (now.getTime() - new Date(current.lastDismissedAt).getTime()) / 86400000;
    if (elapsedDays < REMINDER_PAUSE_DAYS) {return false;}
  }
  return current.lastShownDay !== dayKey(now);
}

/** Records that the card is on screen today (so a later visit the same day does not show it again). */
export async function markBackupReminderShown(now: Date = new Date()): Promise<void> {
  const current = await loadBackupReminder();
  await save({...current, lastShownDay: dayKey(now)});
}

/** The cross or "Plus tard": hides the card for 10 days; the third time, for good. */
export async function dismissBackupReminder(now: Date = new Date()): Promise<void> {
  const current = await loadBackupReminder();
  await save({...current, dismissCount: current.dismissCount + 1, lastDismissedAt: now.toISOString()});
}

export function resetBackupReminderForTests(): void {
  record = null;
  loading = null;
}
