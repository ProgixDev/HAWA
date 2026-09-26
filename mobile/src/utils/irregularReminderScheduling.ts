import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {addDays, startOfDay} from './cycleMath';
import {calculateAverageCycleDuration} from './cycleStatisticsMath';
import {getActiveObjective} from '../state/onboardingPreferences';
import {getIrregularPreferences, type IrregularPreferences} from '../state/irregularPreferences';
import {getConfirmedPeriodHistory} from '../state/confirmedPeriodHistoryStore';
import {getAllJournalEntries} from '../state/dailyJournalStore';
import {
  getAllIrregularJournalEntries,
  hydrateIrregularJournal,
  subscribeIrregularJournal,
} from '../state/irregularJournalStore';
import {
  collectActualPeriodDayKeys,
  resolveLatestIrregularPeriodStart,
  type IrregularPeriodSources,
} from './irregularJournalSelectors';

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

/** The SAME real-period inputs the SOPK screens use (see
 * hooks/useIrregularPeriodSources.ts), read non-reactively: actual period days
 * from the shared journal + the SOPK journal (Spotting / "Non" are already
 * excluded by collectActualPeriodDayKeys), the confirmed history, and the
 * onboarding answer. Read-only — nothing is written back. */
export async function loadIrregularPeriodSources(): Promise<IrregularPeriodSources> {
  await hydrateIrregularJournal();
  const journalEntries = await getAllJournalEntries();
  return {
    periodDayKeys: collectActualPeriodDayKeys(journalEntries, getAllIrregularJournalEntries()),
    confirmedHistory: getConfirmedPeriodHistory(),
    declaredLastPeriodDate: getIrregularPreferences().lastPeriodDate,
  };
}

/** The reminder is anchored on the LATEST REAL period start (the same
 * resolveLatestIrregularPeriodStart() Dashboard/Calendar/Statistics use), so a
 * period recorded through the journal after the last confirmed one is never
 * ignored. The neutral average cycle length itself (and therefore the
 * "at least 2 confirmed periods" requirement and the 7-day buffer) is
 * unchanged: it still comes from real confirmed period history only
 * (confirmedPeriodHistoryStore.ts — the source Cycle/qadaa/Statistics treat as
 * authoritative). Returns `null` — never a fabricated date — when there isn't
 * enough real history to compute that average from, or when the date has
 * already passed. */
export async function computeUnrecordedPeriodReminderDate(
  now: Date,
  sources?: IrregularPeriodSources,
): Promise<Date | null> {
  const resolvedSources = sources ?? (await loadIrregularPeriodSources());

  const confirmedStarts = resolvedSources.confirmedHistory
    .map(occurrence => new Date(occurrence.periodStart))
    .sort((a, b) => a.getTime() - b.getTime());

  const average = calculateAverageCycleDuration(confirmedStarts);
  if (!average) {return null;}

  const latestStartKey = resolveLatestIrregularPeriodStart(resolvedSources, now.toLocaleDateString('en-CA'));
  if (!latestStartKey) {return null;}

  const latestStart = new Date(`${latestStartKey}T12:00:00`);
  const reminderDate = atReminderHour(addDays(latestStart, average.averageDays + UNRECORDED_PERIOD_BUFFER_DAYS));
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

  const fireDate = await computeUnrecordedPeriodReminderDate(now);
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
 * reminders from real persisted preferences + real period data (journal,
 * confirmed history, onboarding answer).
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

// A period recorded through the SOPK journal must move (or clear) the
// unrecorded-period reminder immediately, not only at the next app start or
// confirmed-history change: the journal's "Règles" save writes the shared flow
// first and the SOPK entry last, and this store notifies after the latter.
// Idempotent (scheduleLocalNotification cancels-then-reschedules by id) and a
// no-op away from the SOPK objective (everything is cancelled there).
subscribeIrregularJournal(() => {
  syncIrregularReminders().catch(() => {});
});
