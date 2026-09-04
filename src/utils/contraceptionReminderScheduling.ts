import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {getActiveObjective} from '../state/onboardingPreferences';
import {getContraceptionPreferences, type ContraceptionMethod} from '../state/contraceptionPreferences';
import {
  CONTRACEPTION_DEFAULT_REMINDER_NOTIFICATION_TITLE,
  CONTRACEPTION_REMINDER_NOTIFICATION_TITLE,
} from '../config/contraceptionLabels';

// Contraception's daily reminder — reuses the exact same chokepoint
// (scheduleLocalNotification/cancelLocalNotification in
// pregnancyNotifications.ts) every other reminder in the app already goes
// through, and the same HH:mm→Date helper (nextDailyFireDate) Pregnancy's
// own daily-journal reminder and Conception's reminders already share.
//
// Only 'pill' and 'other' actually have a daily action to be reminded about
// — the same two methods contraceptionIntakeHistoryStore.ts tracks via a
// single taken/late/missed status per day. 'ring'/'patch' are tracked as
// discrete, user-logged events instead (contraceptionEventStore.ts, whose
// own header comment states it "deliberately does NOT compute or assume any
// replacement schedule" — there is no predicted next-insertion/next-change
// date anywhere in the app to schedule against). Scheduling a recurring
// DAILY notification for ring/patch would misrepresent a method that has no
// daily action at all, so this never schedules for those two methods — see
// the `pill`/`other`-only gate below. ContraceptionRemindersScreen.tsx hides
// the enable/time controls for ring/patch accordingly, so the UI never
// promises a reminder this file wouldn't actually schedule.
const DAILY_REMINDER_METHODS = new Set<ContraceptionMethod>(['pill', 'other']);

/** Whether `method` has a real daily action to remind about — the single
 * source of truth shared by this file's own scheduling gate and
 * ContraceptionRemindersScreen.tsx's UI, so the UI can never promise a
 * reminder this file wouldn't actually schedule. */
export function contraceptionMethodSupportsDailyReminder(
  method: ContraceptionMethod | null,
): boolean {
  return method !== null && DAILY_REMINDER_METHODS.has(method);
}

const CONTRACEPTION_REMINDER_ID = 'contraception-daily-reminder';

// Tag carried in the notification's `data` payload so
// genericReminderNotificationPersistence.ts can recognize and record this
// reminder into the in-app notification history — never used to decide
// whether/how to schedule.
export const CONTRACEPTION_REMINDER_NOTIFICATION_KIND = 'contraception-reminder';

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
    !preferences.method ||
    !contraceptionMethodSupportsDailyReminder(preferences.method)
  ) {
    await cancelLocalNotification(CONTRACEPTION_REMINDER_ID);
    setScheduleStatus('idle');
    return;
  }

  const title =
    CONTRACEPTION_REMINDER_NOTIFICATION_TITLE[preferences.method] ??
    CONTRACEPTION_DEFAULT_REMINDER_NOTIFICATION_TITLE;

  const body = 'Prends un instant pour ton suivi de contraception.';

  const success = await scheduleLocalNotification({
    id: CONTRACEPTION_REMINDER_ID,
    title,
    body,
    fireDate: nextDailyFireDate(preferences.reminderTime),
    repeatFrequency: 'daily',
    data: {
      hawaNotificationKind: CONTRACEPTION_REMINDER_NOTIFICATION_KIND,
      inAppTitle: title,
      inAppMessage: body,
    },
  });

  setScheduleStatus(success ? 'scheduled' : 'failed');
}
