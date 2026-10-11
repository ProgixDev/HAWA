import {
  cancelLocalNotification,
  scheduleLocalNotification,
  scheduleReminderSeries,
} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {getActiveObjective, hydrateActiveObjective} from '../state/onboardingPreferences';
import {
  getContraceptionPreferences,
  type ContraceptionMethod,
  type ContraceptionPreferences,
} from '../state/contraceptionPreferences';
import {
  contraceptionDefaultReminderNotificationTitle,
  contraceptionReminderNotificationTitle,
} from '../config/contraceptionLabels';
import {areReminderSourcesUnavailable} from './reminderSourceAvailability';
import {
  getCyclicPillSchedule,
  getPillPackDay,
  isPillBreakDateKey,
  type CyclicPillSchedule,
} from './contraceptionMath';
import {coalescedSync} from './serializedSync';
import {dateAtTimeOfDay} from './timeOfDay';
import i18n from '../i18n';

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

export type ContraceptionReminderIndicator = 'enabled' | 'disabled' | 'unavailable';

/** What every "Rappels" indicator (Dashboard, Calendar, Statistics, Profile,
 * Summary) may truthfully show. `remindersEnabled` is ONE stored flag shared
 * by every method, so after e.g. Pill → Ring it can still be true from the
 * Pill even though nothing is (or can be) scheduled for a ring/patch. Those
 * methods are 'unavailable' — never "enabled" — whatever the stored flag is
 * (the flag itself is left untouched, so switching back to a pill shows the
 * user's earlier choice again). Uses the SAME predicate as the scheduling gate
 * above, so the UI can never promise a reminder this file wouldn't schedule.
 * An unset method (not configured yet) keeps showing the flag as before. */
export function getContraceptionReminderIndicator(
  method: ContraceptionMethod | null,
  remindersEnabled: boolean,
): ContraceptionReminderIndicator {
  if (method !== null && !contraceptionMethodSupportsDailyReminder(method)) {
    return 'unavailable';
  }
  return remindersEnabled ? 'enabled' : 'disabled';
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

// --- cyclic pill packs: no reminder on a break (arrêt) day ----------------------------------------------------------
//
// A native repeating trigger fires every day and cannot skip any, so a "take your pill" reminder that simply repeated
// also went off on the BREAK days of a cyclic pack — days the Dashboard, the Calendar, the journal and the
// statistics all treat as having nothing to take. For a real cyclic schedule the reminder is therefore laid out day
// by day: one one-shot trigger per upcoming non-break day (ids `<id>`, `<id>::1`, ...), re-planned on every sync
// (app start, preference/objective change, foreground, after a delivery) so the window ahead stays full. Every other
// pill / "other" reminder keeps its single repeating daily trigger, exactly as before.

/** Calendar days (today included) the pill reminder is laid out for. */
export const PILL_REMINDER_WINDOW_DAYS = 14;

/**
 * The pack schedule whose break days must not notify, or null when the reminder is simply "every day".
 *
 * Break days come from `getCyclicPillSchedule` + `isPillBreakDateKey` (contraceptionMath.ts — the predicate every
 * screen uses), counted from `methodStartDate` exactly as they are everywhere else. When no break day can exist —
 * continuous / unknown / other methods, a "cyclic" pack entered with 0 break days, or no readable start date to count
 * from — the repeating trigger is both correct and more durable (it never runs out), so it is kept.
 */
function breakDayScheduleFor(preferences: ContraceptionPreferences): CyclicPillSchedule | null {
  const schedule = getCyclicPillSchedule(preferences);
  if (!schedule || schedule.totalDays <= schedule.activeDays) {
    return null;
  }
  const {methodStartDate} = preferences;
  if (!methodStartDate || getPillPackDay(methodStartDate, methodStartDate, schedule.totalDays) === null) {
    return null;
  }
  return schedule;
}

/**
 * The instants, earliest first, at which the pill reminder fires over the next PILL_REMINDER_WINDOW_DAYS calendar
 * days: `reminderTime` on every day that is not a break day, and only the ones still ahead of `now`.
 *
 * Each instant is built from LOCAL calendar components (never "+ 24 h"), so the reminder keeps the wall-clock time
 * she chose across a daylight-saving change (a 23 h / 25 h day). When the window holds no instant at all — a break
 * longer than the window — the first active day after it is added, so that a trigger is always pending for the pack
 * that follows and the chain (a delivery re-syncs, which fills the window again) cannot be left without one.
 */
export function planPillReminderOccurrences({
  reminderTime,
  methodStartDate,
  schedule,
  now = new Date(),
}: {
  reminderTime: string;
  methodStartDate: string | null;
  schedule: CyclicPillSchedule;
  now?: Date;
}): Date[] {
  const occurrences: Date[] = [];
  // One full pack beyond the window is enough to reach the next active day of any schedule.
  const lastOffset = PILL_REMINDER_WINDOW_DAYS + schedule.totalDays;

  for (let offset = 0; offset < lastOffset; offset += 1) {
    if (offset >= PILL_REMINDER_WINDOW_DAYS && occurrences.length > 0) {
      break;
    }
    // Noon: the date key of this calendar day can never slip to a neighbouring day on a clock-change day.
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
    if (isPillBreakDateKey(day.toLocaleDateString('en-CA'), methodStartDate, schedule)) {
      continue;
    }
    const fireDate = dateAtTimeOfDay(day, reminderTime);
    if (fireDate.getTime() > now.getTime()) {
      occurrences.push(fireDate);
    }
  }
  return occurrences;
}

/** Re-derives and (re)schedules — or explicitly cancels — the Contraception
 * daily reminder from real persisted preferences. Safe to call any number of
 * times (every trigger it creates REPLACES the pending one of the same id, and
 * triggers it no longer needs are cancelled).
 * Never schedules without a real, user-chosen `reminderTime` — no invented
 * fallback hour — and never schedules while a different objective is
 * active, so switching away from Contraception cleanly clears it. */
async function runContraceptionReminderSync(): Promise<void> {
  // The objective gates this reminder, so it must have been READ first: before that memory holds the default
  // objective, and a run triggered by another store's hydration would cancel (or arm) reminders on its strength.
  await hydrateActiveObjective();
  // Unreadable preferences are not "method unset, reminders off": the existing reminder is left untouched.
  if (areReminderSourcesUnavailable({ownerBases: ['@hawa/contraception-preferences']})) {
    return;
  }

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
    contraceptionReminderNotificationTitle(i18n.t)[preferences.method] ??
    contraceptionDefaultReminderNotificationTitle(i18n.t);

  const body = i18n.t('notifications.contraception.body');

  const data = {
    hawaNotificationKind: CONTRACEPTION_REMINDER_NOTIFICATION_KIND,
    inAppTitle: title,
    inAppMessage: body,
  };

  const breakSchedule = breakDayScheduleFor(preferences);
  if (breakSchedule) {
    const occurrences = planPillReminderOccurrences({
      reminderTime: preferences.reminderTime,
      methodStartDate: preferences.methodStartDate,
      schedule: breakSchedule,
    });
    if (occurrences.length === 0) {
      // No active day at all (a pack with no pill days): nothing may fire, and nothing earlier may stay pending.
      await cancelLocalNotification(CONTRACEPTION_REMINDER_ID);
      setScheduleStatus('idle');
      return;
    }

    const result = await scheduleReminderSeries({id: CONTRACEPTION_REMINDER_ID, title, body, data, occurrences});
    if (!result.scheduled && result.reason === 'error') {
      // Same contract as scheduleLocalNotification below: a native failure rejects, anything else is "not scheduled".
      throw result.error ?? new Error('Scheduling the contraception reminder failed.');
    }
    setScheduleStatus(result.scheduled ? 'scheduled' : 'failed');
    return;
  }

  const success = await scheduleLocalNotification({
    id: CONTRACEPTION_REMINDER_ID,
    title,
    body,
    fireDate: nextDailyFireDate(preferences.reminderTime),
    repeatFrequency: 'daily',
    data,
  });

  setScheduleStatus(success ? 'scheduled' : 'failed');
}

/** The public entry point (see runContraceptionReminderSync). Calls made while a run is in progress share ONE
 * follow-up run that starts afterwards and therefore reads the newest preferences — an older run can never finish
 * after a newer one and put back what the person just switched off. Takes no arguments: it is handed straight to
 * store subscribers and `.then()`. */
export const syncContraceptionReminder = coalescedSync(runContraceptionReminderSync);
