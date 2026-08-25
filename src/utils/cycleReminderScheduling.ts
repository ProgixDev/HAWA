import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {
  addDays,
  computeCyclePredictionStatus,
  ovulationDayFor,
  startOfDay,
  upcomingDateForCycleDay,
  type CycleBasics,
  type CyclePredictionStatus,
} from './cycleMath';
import {
  getActiveObjective,
  getCyclePreferences,
  getCycleObservationStartedAt,
  getPeriodHistory,
} from '../state/onboardingPreferences';
import {getCycleReminderPreferences, type CycleReminderPreferences} from '../state/cycleReminderPreferences';

// Cycle's 5 optional reminders — reuses the exact same chokepoint
// (scheduleLocalNotification/cancelLocalNotification in
// pregnancyNotifications.ts) every other reminder already goes through, the
// same daily HH:mm→Date helper (nextDailyFireDate) Pregnancy/Contraception/
// Menopause already share, and — critically — the exact same prediction
// entry point (computeCyclePredictionStatus) the Cycle Dashboard/Calendar
// use, so a scheduled notification can never disagree with what's shown on
// screen. No independent date math is implemented here.

const UPCOMING_PERIOD_ID = 'cycle-upcoming-period-reminder';
const PERIOD_START_CHECK_ID = 'cycle-period-start-check-reminder';
const DAILY_JOURNAL_ID = 'cycle-daily-journal-reminder';
const FERTILE_WINDOW_ID = 'cycle-fertile-window-reminder';
const OVULATION_ID = 'cycle-ovulation-reminder';

// Same fixed local fire-hour convention already established by
// postpartumNifasReminderScheduling.ts / qadaaReminderScheduling.ts for
// date-based (not daily-habit) reminders — never a silently invented hour.
const DATE_REMINDER_HOUR = 9;

// Fertile-window notice fires this many days BEFORE the estimated start —
// "ta fenêtre fertile estimée approche" reads as advance notice, not a
// same-day alert. A fixed internal lead time, not a user-facing setting —
// same precedent as Nifas's own hardcoded J35 warning lead time
// (NIFAS_WARNING_DAYS), never exposed as a switch.
const FERTILE_WINDOW_LEAD_DAYS = 1;

function atReminderHour(date: Date): Date {
  const result = startOfDay(date);
  result.setHours(DATE_REMINDER_HOUR, 0, 0, 0);
  return result;
}

async function syncUpcomingPeriodReminder(
  active: boolean,
  prefs: CycleReminderPreferences,
  prediction: CyclePredictionStatus,
): Promise<void> {
  // Only meaningful when a single concrete predicted date exists — an
  // irregular 'window' or still-'observing' cycle has no one date to count
  // days back from, so no reminder is invented for those cases.
  if (!active || !prefs.upcomingPeriodEnabled || prediction.mode !== 'exact') {
    await cancelLocalNotification(UPCOMING_PERIOD_ID);
    return;
  }

  await scheduleLocalNotification({
    id: UPCOMING_PERIOD_ID,
    title: 'Tes règles sont prévues bientôt 🌸',
    body: 'Pense à garder ce dont tu as besoin à portée de main.',
    // addDays() reconstructs the Date from year/month/day only (it zeroes
    // the time-of-day), so the day offset must be applied BEFORE
    // atReminderHour() sets the hour — not after, or the hour is lost.
    fireDate: atReminderHour(addDays(prediction.date, -prefs.upcomingPeriodDaysBefore)),
  });
}

async function syncPeriodStartCheckReminder(
  active: boolean,
  prefs: CycleReminderPreferences,
  prediction: CyclePredictionStatus,
): Promise<void> {
  if (!active || !prefs.periodStartCheckEnabled || prediction.mode !== 'exact') {
    await cancelLocalNotification(PERIOD_START_CHECK_ID);
    return;
  }

  // A single, one-time check on the predicted day itself — never recurring,
  // so this can never turn into a daily nag. If she records her period
  // (confirmPeriodStart) before this fires, lastPeriodStart advances and the
  // NEXT resync (triggered by subscribeCyclePreferences in App.tsx)
  // recomputes `prediction.date` as the following cycle's date — upserting
  // this same id cancels the now-obsolete trigger automatically.
  await scheduleLocalNotification({
    id: PERIOD_START_CHECK_ID,
    title: 'Tes règles ont peut-être commencé ?',
    body: 'Pense à renseigner leur début pour garder ton suivi à jour.',
    fireDate: atReminderHour(prediction.date),
  });
}

async function syncDailyJournalReminder(active: boolean, prefs: CycleReminderPreferences): Promise<void> {
  if (!active || !prefs.dailyJournalEnabled || !prefs.dailyJournalTime) {
    await cancelLocalNotification(DAILY_JOURNAL_ID);
    return;
  }

  await scheduleLocalNotification({
    id: DAILY_JOURNAL_ID,
    title: 'Comment te sens-tu aujourd’hui ?',
    body: 'Prends un moment pour mettre ton suivi à jour.',
    fireDate: nextDailyFireDate(prefs.dailyJournalTime),
    repeatFrequency: 'daily',
  });
}

/** Same ovulationDay/upcomingDateForCycleDay combination the Cycle Dashboard
 * (CycleHomeScreen.tsx) already uses for its own fertile-window/ovulation
 * tiles — always computable regardless of prediction mode (unlike period-start
 * prediction), since it walks forward from lastPeriodStart using the
 * configured cycleDuration rather than requiring a single-date-confidence
 * regularity classification. */
function computeFertilityDates(basics: CycleBasics, today: Date): {fertileStart: Date; ovulation: Date} {
  const ovulationDay = ovulationDayFor(basics.cycleDuration);
  return {
    fertileStart: upcomingDateForCycleDay(basics, ovulationDay - 5, today),
    ovulation: upcomingDateForCycleDay(basics, ovulationDay, today),
  };
}

async function syncFertileWindowReminder(
  active: boolean,
  prefs: CycleReminderPreferences,
  basics: CycleBasics,
  today: Date,
): Promise<void> {
  if (!active || !prefs.fertileWindowEnabled) {
    await cancelLocalNotification(FERTILE_WINDOW_ID);
    return;
  }

  const {fertileStart} = computeFertilityDates(basics, today);
  await scheduleLocalNotification({
    id: FERTILE_WINDOW_ID,
    title: 'Ta fenêtre fertile estimée approche',
    body: 'Selon les données de ton cycle, ta période fertile estimée commence bientôt.',
    // Same addDays()-before-atReminderHour() ordering as the upcoming-period
    // reminder above — addDays() would otherwise zero the hour it sets.
    fireDate: atReminderHour(addDays(fertileStart, -FERTILE_WINDOW_LEAD_DAYS)),
  });
}

async function syncOvulationReminder(
  active: boolean,
  prefs: CycleReminderPreferences,
  basics: CycleBasics,
  today: Date,
): Promise<void> {
  if (!active || !prefs.ovulationEnabled) {
    await cancelLocalNotification(OVULATION_ID);
    return;
  }

  const {ovulation} = computeFertilityDates(basics, today);
  await scheduleLocalNotification({
    id: OVULATION_ID,
    title: 'Ovulation estimée 🌸',
    body: 'Selon ton suivi, ton ovulation est estimée prochainement.',
    fireDate: atReminderHour(ovulation),
  });
}

/** Re-derives and (re)schedules — or explicitly cancels — every Cycle
 * reminder from real persisted preferences + the same canonical cycle
 * prediction used by the Dashboard/Calendar. Safe to call any number of
 * times (scheduleLocalNotification always cancels-then-reschedules by id,
 * and is itself a no-op for a fire date already in the past). Never
 * schedules while a different objective is active, so switching away from
 * Cycle cleanly clears all 5. */
export async function syncCycleReminders(): Promise<void> {
  const active = getActiveObjective() === 'cycle';
  const prefs = getCycleReminderPreferences();
  const basics = getCyclePreferences();
  const today = startOfDay(new Date());
  const periodStartDates = getPeriodHistory().map(record => new Date(`${record.startDate}T12:00:00`));
  const prediction = computeCyclePredictionStatus(
    basics,
    basics.regularity,
    periodStartDates,
    getCycleObservationStartedAt(),
    today,
  );

  await Promise.all([
    syncUpcomingPeriodReminder(active, prefs, prediction),
    syncPeriodStartCheckReminder(active, prefs, prediction),
    syncDailyJournalReminder(active, prefs),
    syncFertileWindowReminder(active, prefs, basics, today),
    syncOvulationReminder(active, prefs, basics, today),
  ]);
}
