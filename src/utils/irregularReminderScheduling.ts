import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {addDays, startOfDay} from './cycleMath';
import {calculateAverageCycleDuration} from './cycleStatisticsMath';
import {getActiveObjective} from '../state/onboardingPreferences';
import {getIrregularPreferences, type IrregularPreferences} from '../state/irregularPreferences';
import {getConfirmedPeriodHistory} from '../state/confirmedPeriodHistoryStore';

// SOPK's 2 optional reminders — reuses the exact same chokepoint
// (scheduleLocalNotification/cancelLocalNotification in
// pregnancyNotifications.ts) every other reminder already goes through, and
// the same daily HH:mm→Date helper (nextDailyFireDate) Cycle/Pregnancy/
// Contraception/Menopause already share. No independent notification system.
//
// CRITICAL PRODUCT RULE: this file must NEVER compute or display a "days
// late" value, and must never use "retard"/"late" framing anywhere — a long
// cycle is never automatically a delay for this objective. The
// "unrecorded period" reminder below is deliberately NOT anchored to a
// single predicted date the way Cycle's own syncPeriodStartCheckReminder is
// (see cycleReminderScheduling.ts) — it only fires once real history shows a
// generous, neutral buffer has passed since the last confirmed period, and
// its copy only ever invites the user to update her tracking "if" her period
// has started, never asserts anything about timing.

const DAILY_JOURNAL_ID = 'irregular-daily-journal-reminder';
const UNRECORDED_PERIOD_ID = 'irregular-unrecorded-period-reminder';

// Tag carried in the notification's `data` payload so
// genericReminderNotificationPersistence.ts can recognize and record every
// SOPK reminder into the in-app notification history — never used to decide
// whether/how to schedule.
export const IRREGULAR_REMINDER_NOTIFICATION_KIND = 'irregular-reminder';

const DATE_REMINDER_HOUR = 9;

/** Deliberately generous — this is NOT a "late period" threshold. It is only
 * a floor below which AWA won't yet suggest checking in, so the reminder
 * never implies anything about what counts as "on time" for an irregular
 * cycle. */
export const UNRECORDED_PERIOD_BUFFER_DAYS = 7;

function atReminderHour(date: Date): Date {
  const result = startOfDay(date);
  result.setHours(DATE_REMINDER_HOUR, 0, 0, 0);
  return result;
}

/** Real confirmed period history only (confirmedPeriodHistoryStore.ts — the
 * same source Cycle/qadaa/Statistics already treat as authoritative). Returns
 * `null` — never a fabricated date — when there isn't enough real history to
 * compute a neutral average cycle length from. */
export function computeUnrecordedPeriodReminderDate(now: Date): Date | null {
  const starts = getConfirmedPeriodHistory()
    .map(occurrence => new Date(occurrence.periodStart))
    .sort((a, b) => a.getTime() - b.getTime());

  const average = calculateAverageCycleDuration(starts);
  if (!average) {return null;}

  const lastStart = starts[starts.length - 1];
  const reminderDate = atReminderHour(addDays(lastStart, average.averageDays + UNRECORDED_PERIOD_BUFFER_DAYS));
  return reminderDate.getTime() > now.getTime() ? reminderDate : null;
}

async function syncDailyJournalReminder(active: boolean, prefs: IrregularPreferences): Promise<void> {
  if (!active || !prefs.reminders.dailyJournalEnabled || !prefs.reminders.dailyJournalTime) {
    await cancelLocalNotification(DAILY_JOURNAL_ID);
    return;
  }

  await scheduleLocalNotification({
    id: DAILY_JOURNAL_ID,
    title: 'Journal quotidien',
    body: 'Comment te sens-tu aujourd’hui ? Pense à mettre ton suivi à jour.',
    fireDate: nextDailyFireDate(prefs.reminders.dailyJournalTime),
    repeatFrequency: 'daily',
    data: {
      hawaNotificationKind: IRREGULAR_REMINDER_NOTIFICATION_KIND,
      irregularReminderType: 'daily-journal',
      inAppTitle: 'Journal quotidien',
      inAppMessage: 'Comment te sens-tu aujourd’hui ? Pense à mettre ton suivi à jour.',
    },
  });
}

async function syncUnrecordedPeriodReminder(active: boolean, prefs: IrregularPreferences, now: Date): Promise<void> {
  if (!active || !prefs.reminders.unrecordedPeriodEnabled) {
    await cancelLocalNotification(UNRECORDED_PERIOD_ID);
    return;
  }

  const fireDate = computeUnrecordedPeriodReminderDate(now);
  if (!fireDate) {
    await cancelLocalNotification(UNRECORDED_PERIOD_ID);
    return;
  }

  await scheduleLocalNotification({
    id: UNRECORDED_PERIOD_ID,
    title: 'Règles non renseignées',
    body: 'Tu n’as pas encore renseigné de nouvelles règles. Pense à mettre ton suivi à jour si elles ont commencé.',
    fireDate,
    data: {
      hawaNotificationKind: IRREGULAR_REMINDER_NOTIFICATION_KIND,
      irregularReminderType: 'unrecorded-period',
      inAppTitle: 'Règles non renseignées',
      inAppMessage:
        'Tu n’as pas encore renseigné de nouvelles règles. Pense à mettre ton suivi à jour si elles ont commencé.',
    },
  });
}

/** Re-derives and (re)schedules — or explicitly cancels — both SOPK
 * reminders from real persisted preferences + real confirmed period history.
 * Safe to call any number of times (scheduleLocalNotification always
 * cancels-then-reschedules by id). Never schedules while a different
 * objective is active, so switching away from SOPK cleanly clears both. */
export async function syncIrregularReminders(now: Date = new Date()): Promise<void> {
  const active = getActiveObjective() === 'irregular';
  const prefs = getIrregularPreferences();

  await Promise.all([
    syncDailyJournalReminder(active, prefs),
    syncUnrecordedPeriodReminder(active, prefs, now),
  ]);
}
