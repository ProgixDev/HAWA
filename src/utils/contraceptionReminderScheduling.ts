import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {getActiveObjective} from '../state/onboardingPreferences';
import {getContraceptionPreferences} from '../state/contraceptionPreferences';
import {
  CONTRACEPTION_DEFAULT_REMINDER_NOTIFICATION_TITLE,
  CONTRACEPTION_REMINDER_NOTIFICATION_TITLE,
} from '../config/contraceptionLabels';

// Contraception's daily reminder — reuses the exact same chokepoint
// (scheduleLocalNotification/cancelLocalNotification in
// pregnancyNotifications.ts) every other reminder in the app already goes
// through, and the same HH:mm→Date helper (nextDailyFireDate) Pregnancy's
// own daily-journal reminder and Conception's reminders already share.
// Deliberately a single daily notification, never a method-specific cadence
// (every 21/28 days for ring, every 7 for patch, etc.) — no such schedule is
// collected anywhere, so none is invented here.

const CONTRACEPTION_REMINDER_ID = 'contraception-daily-reminder';

export type ContraceptionReminderScheduleStatus = 'idle' | 'scheduled' | 'failed';

// Deliberately NOT persisted to AsyncStorage: this reflects whether the last
// scheduling ATTEMPT succeeded, not a user preference. Persisting it would
// let a stale "failed" survive across a restart even after the underlying
// cause (e.g. permission) was fixed, or worse, let a stale "scheduled"
// silently outlive an actual failure. Recomputed every sync instead.
let scheduleStatus: ContraceptionReminderScheduleStatus = 'idle';
const statusListeners = new Set<() => void>();

const setScheduleStatus = (next: ContraceptionReminderScheduleStatus) => {
  if (scheduleStatus === next) {return;}
  scheduleStatus = next;
  statusListeners.forEach(listener => listener());
};

export const getContraceptionReminderScheduleStatus = (): ContraceptionReminderScheduleStatus => scheduleStatus;

export const subscribeContraceptionReminderScheduleStatus = (listener: () => void) => {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
};

/** Re-derives and (re)schedules — or explicitly cancels — the Contraception
 * daily reminder from real persisted preferences. Safe to call any number of
 * times (scheduleLocalNotification always cancels-then-reschedules by id).
 * Never schedules without a real, user-chosen `reminderTime` — no invented
 * fallback hour — and never schedules while a different objective is
 * active, so switching away from Contraception cleanly clears it. */
export async function syncContraceptionReminder(): Promise<void> {
  const preferences = getContraceptionPreferences();

  if (
    getActiveObjective() !== 'contraception' ||
    !preferences.remindersEnabled ||
    !preferences.reminderTime ||
    !preferences.method
  ) {
    await cancelLocalNotification(CONTRACEPTION_REMINDER_ID);
    setScheduleStatus('idle');
    return;
  }

  const title =
    CONTRACEPTION_REMINDER_NOTIFICATION_TITLE[preferences.method] ??
    CONTRACEPTION_DEFAULT_REMINDER_NOTIFICATION_TITLE;

  const success = await scheduleLocalNotification({
    id: CONTRACEPTION_REMINDER_ID,
    title,
    body: 'Prends un instant pour ton suivi de contraception.',
    fireDate: nextDailyFireDate(preferences.reminderTime),
    repeatFrequency: 'daily',
  });

  setScheduleStatus(success ? 'scheduled' : 'failed');
}
