import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {
  addDays,
  computeCyclePredictionStatus,
  estimateFertilityDates,
  startOfDay,
  type CycleBasics,
  type CycleFertilityEstimate,
  type CyclePredictionStatus,
} from './cycleMath';
import {
  getActiveObjective,
  getCyclePreferences,
  getCycleObservationStartedAt,
  getHasConfirmedCycleData,
  getHasConfirmedCycleDuration,
  getRecordedPeriodHistory,
} from '../state/onboardingPreferences';
import {getCycleReminderPreferences, type CycleReminderPreferences} from '../state/cycleReminderPreferences';
import {getActiveProfileId, getActiveProfileIdentity, isOwnerActive} from '../state/activeProfileStore';

// Cycle's 5 optional reminders — reuses the exact same chokepoint
// (scheduleLocalNotification/cancelLocalNotification in
// pregnancyNotifications.ts) every other reminder already goes through, the
// same daily HH:mm→Date helper (nextDailyFireDate) Pregnancy/Contraception/
// Menopause already share, and — critically — the exact same prediction
// entry point (computeCyclePredictionStatus) the Cycle Dashboard/Calendar
// use, so a scheduled notification can never disagree with what's shown on
// screen. No independent date math is implemented here.
//
// PREDICTION MODE → REMINDER BEHAVIOUR (same status the Cycle Dashboard shows):
//  - 'exact'     → upcoming-period / period-start-check from the exact
//                  predicted date; fertile-window / ovulation from the
//                  estimated dates (estimateFertilityDates).
//  - 'window'    → NO precise date exists (Dashboard: "Non estimable" fertile
//                  window / ovulation, next period = a 26–32 day window), so
//                  all four date-based reminders are cancelled — never
//                  scheduled from a date the UI treats as uncertain.
//  - 'observing' → the Dashboard still shows an estimated fertile window /
//                  ovulation, so those two stay scheduled; no single
//                  next-period date exists, so the two period reminders are
//                  cancelled.
// A mode change (e.g. exact → window after the user switches to irregular)
// re-runs this sync, which cancels the notification ids that no longer apply.

const UPCOMING_PERIOD_ID = 'cycle-upcoming-period-reminder';
const PERIOD_START_CHECK_ID = 'cycle-period-start-check-reminder';
const DAILY_JOURNAL_ID = 'cycle-daily-journal-reminder';
const FERTILE_WINDOW_ID = 'cycle-fertile-window-reminder';
const OVULATION_ID = 'cycle-ovulation-reminder';
const LEGACY_IDS = [UPCOMING_PERIOD_ID, PERIOD_START_CHECK_ID, DAILY_JOURNAL_ID, FERTILE_WINDOW_ID, OVULATION_ID];

// PROFILE-SCOPED notification ids — the mother and each managed daughter
// profile schedule their own, independently cancellable set of Cycle
// reminders (CLAUDE.md §4 objective isolation: turning Haifa's reminder on/
// off must never touch the mother's, or another daughter's, scheduled
// notification). scheduleLocalNotification() upserts BY ID (cancel-then-
// reschedule), so two profiles reusing the same bare id would silently
// overwrite one another — this namespaces every id by the active profile.
const idFor = (base: string): string => `${base}:${getActiveProfileId()}`;

/** Returns the mother's own EXISTING wording, byte-identical, while she's
 * active; while a managed daughter is active, builds profile-aware wording
 * from her real firstName instead (never hardcoded, never speaking as if
 * her cycle belonged to the phone owner — CLAUDE.md §4/§16 of this task). */
function ownerOrDaughterCopy(
  ownerCopy: {title: string; body: string},
  daughterCopy: (firstName: string) => {title: string; body: string},
): {title: string; body: string} {
  if (isOwnerActive()) {return ownerCopy;}
  const firstName = getActiveProfileIdentity().managedProfile?.firstName || 'elle';
  return daughterCopy(firstName);
}

// Tag carried in the notification's `data` payload so
// genericReminderNotificationPersistence.ts can recognize and record every
// Cycle reminder into the in-app notification history — never used to decide
// whether/how to schedule. Same pattern already established by
// postpartum/menopause/qadaa's own exported *_NOTIFICATION_KIND constants.
export const CYCLE_REMINDER_NOTIFICATION_KIND = 'cycle-reminder';

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
  // PRODUCT DECISION REQUIRED: in 'window' mode the Dashboard shows the
  // window start–end (and a "Règles en retard" state once it has passed).
  // Whether a reminder such as "ta fenêtre de règles estimée commence
  // bientôt" (from windowStart) should exist is a product choice that is not
  // defined anywhere in the code or tests — the existing, documented
  // behaviour (cancel) is kept until it is decided.
  const id = idFor(UPCOMING_PERIOD_ID);
  if (!active || !prefs.upcomingPeriodEnabled || prediction.mode !== 'exact') {
    await cancelLocalNotification(id);
    return;
  }

  // The phone belongs to the mother — a daughter's reminder must not speak
  // as if her cycle were the phone owner's own (CLAUDE.md §4). Her own
  // wording is unaffected: byte-identical to before.
  const {title, body} = ownerOrDaughterCopy(
    {title: 'Tes règles sont prévues bientôt 🌸', body: 'Pense à garder ce dont tu as besoin à portée de main.'},
    firstName => ({title: `Suivi de ${firstName}`, body: `Ses prochaines règles sont estimées dans quelques jours.`}),
  );

  await scheduleLocalNotification({
    id,
    title,
    body,
    // addDays() reconstructs the Date from year/month/day only (it zeroes
    // the time-of-day), so the day offset must be applied BEFORE
    // atReminderHour() sets the hour — not after, or the hour is lost.
    fireDate: atReminderHour(addDays(prediction.date, -prefs.upcomingPeriodDaysBefore)),
    data: {
      hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND,
      cycleReminderType: 'upcoming-period',
      profileId: getActiveProfileId(),
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

async function syncPeriodStartCheckReminder(
  active: boolean,
  prefs: CycleReminderPreferences,
  prediction: CyclePredictionStatus,
): Promise<void> {
  // PRODUCT DECISION REQUIRED: same open question as the upcoming-period
  // reminder above (a "have your periods started?" check in 'window' mode,
  // e.g. from windowEnd / when isLate) — kept as the existing safe cancel.
  const id = idFor(PERIOD_START_CHECK_ID);
  if (!active || !prefs.periodStartCheckEnabled || prediction.mode !== 'exact') {
    await cancelLocalNotification(id);
    return;
  }

  const {title, body} = ownerOrDaughterCopy(
    {title: 'Tes règles ont peut-être commencé ?', body: 'Pense à renseigner leur début pour garder ton suivi à jour.'},
    firstName => ({title: `Cycle de ${firstName}`, body: `Tu peux vérifier si ses règles ont commencé.`}),
  );

  // A single, one-time check on the predicted day itself — never recurring,
  // so this can never turn into a daily nag. If she records her period
  // (confirmPeriodStart) before this fires, lastPeriodStart advances and the
  // NEXT resync (triggered by subscribeCyclePreferences in App.tsx)
  // recomputes `prediction.date` as the following cycle's date — upserting
  // this same id cancels the now-obsolete trigger automatically.
  await scheduleLocalNotification({
    id,
    title,
    body,
    fireDate: atReminderHour(prediction.date),
    data: {
      hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND,
      cycleReminderType: 'period-start-check',
      profileId: getActiveProfileId(),
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

async function syncDailyJournalReminder(active: boolean, prefs: CycleReminderPreferences): Promise<void> {
  const id = idFor(DAILY_JOURNAL_ID);
  if (!active || !prefs.dailyJournalEnabled || !prefs.dailyJournalTime) {
    await cancelLocalNotification(id);
    return;
  }

  const {title, body} = ownerOrDaughterCopy(
    {title: 'Comment te sens-tu aujourd’hui ?', body: 'Prends un moment pour mettre ton suivi à jour.'},
    firstName => ({title: `Journal de ${firstName}`, body: `Pense à compléter son journal du jour.`}),
  );

  await scheduleLocalNotification({
    id,
    title,
    body,
    fireDate: nextDailyFireDate(prefs.dailyJournalTime),
    repeatFrequency: 'daily',
    data: {
      hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND,
      cycleReminderType: 'daily-journal',
      profileId: getActiveProfileId(),
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

/** First occurrence of `date` (a date of the current/next cycle) that is not
 * already past — steps whole cycles forward. Reminders are one-time
 * triggers, so once this cycle's fertile start/ovulation has passed the
 * reminder points at the NEXT cycle's date (same "next occurrence" behaviour
 * as before; only the source of the dates is now the shared estimate). */
function nextOccurrence(date: Date, cycleLength: number, today: Date): Date {
  let result = date;
  while (result < today) {
    result = addDays(result, cycleLength);
  }
  return result;
}

/** The estimated dates the Cycle Dashboard shows (estimateFertilityDates) —
 * null in 'window' mode, or in 'observing' mode with an unconfirmed duration
 * (see estimateFertilityDates's own doc comment — a managed daughter who just
 * recorded her first-ever period is exactly this case: NO precise fertile/
 * ovulation date may be shown OR notified) — plus the cycle length that
 * estimate is built on. */
function fertilityForReminders(
  basics: CycleBasics,
  prediction: CyclePredictionStatus,
  today: Date,
): {estimate: CycleFertilityEstimate; cycleLength: number} | null {
  const estimate = estimateFertilityDates(basics, prediction, today, getHasConfirmedCycleDuration());
  if (!estimate) {
    return null;
  }
  return {
    estimate,
    cycleLength: prediction.mode === 'exact' ? prediction.averageCycleLength : basics.cycleDuration,
  };
}

async function syncFertileWindowReminder(
  active: boolean,
  prefs: CycleReminderPreferences,
  fertility: ReturnType<typeof fertilityForReminders>,
  today: Date,
): Promise<void> {
  const id = idFor(FERTILE_WINDOW_ID);
  if (!active || !prefs.fertileWindowEnabled || !fertility) {
    await cancelLocalNotification(id);
    return;
  }

  const {title, body} = ownerOrDaughterCopy(
    {title: 'Ta fenêtre fertile estimée approche', body: 'Selon les données de ton cycle, ta période fertile estimée commence bientôt.'},
    firstName => ({title: `Cycle de ${firstName}`, body: `Sa fenêtre fertile estimée approche.`}),
  );

  const fertileStart = nextOccurrence(fertility.estimate.fertileStart, fertility.cycleLength, today);
  await scheduleLocalNotification({
    id,
    title,
    body,
    // Same addDays()-before-atReminderHour() ordering as the upcoming-period
    // reminder above — addDays() would otherwise zero the hour it sets.
    fireDate: atReminderHour(addDays(fertileStart, -FERTILE_WINDOW_LEAD_DAYS)),
    data: {
      hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND,
      cycleReminderType: 'fertile-window',
      profileId: getActiveProfileId(),
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

async function syncOvulationReminder(
  active: boolean,
  prefs: CycleReminderPreferences,
  fertility: ReturnType<typeof fertilityForReminders>,
  today: Date,
): Promise<void> {
  const id = idFor(OVULATION_ID);
  if (!active || !prefs.ovulationEnabled || !fertility) {
    await cancelLocalNotification(id);
    return;
  }

  const {title, body} = ownerOrDaughterCopy(
    {title: 'Ovulation estimée 🌸', body: 'Selon ton suivi, ton ovulation est estimée prochainement.'},
    firstName => ({title: `Cycle de ${firstName}`, body: `Son ovulation est estimée prochainement.`}),
  );

  const ovulation = nextOccurrence(fertility.estimate.ovulation, fertility.cycleLength, today);
  await scheduleLocalNotification({
    id,
    title,
    body,
    fireDate: atReminderHour(ovulation),
    data: {
      hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND,
      cycleReminderType: 'ovulation',
      profileId: getActiveProfileId(),
      inAppTitle: title,
      inAppMessage: body,
    },
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
  // A managed daughter's objective is ALWAYS forced to "Suivre mon cycle"
  // regardless of the mother's own real, globally-stored objective (same
  // effectiveObjective pattern as HomeScreen/CalendarScreen/JournalSheetHost
  // — see CLAUDE.md §4). getActiveObjective() alone would wrongly cancel
  // every one of a daughter's reminders whenever the mother's own objective
  // happens to be something else (e.g. 'pregnancy').
  const active = isOwnerActive() ? getActiveObjective() === 'cycle' : true;
  const prefs = getCycleReminderPreferences();
  const basics = getCyclePreferences();
  const today = startOfDay(new Date());
  // Recorded periods only — the SAME input CycleHomeScreen feeds the status
  // (never the placeholder record seeded from unconfirmed defaults).
  const periodStartDates = getRecordedPeriodHistory().map(record => new Date(`${record.startDate}T12:00:00`));
  const prediction = computeCyclePredictionStatus(
    basics,
    basics.regularity,
    periodStartDates,
    getCycleObservationStartedAt(),
    today,
  );

  const fertility = fertilityForReminders(basics, prediction, today);

  // A managed daughter who has no real, confirmed cycle data yet (never had
  // her first period, or it was never recorded) must never get a fabricated
  // next-period/fertile-window/ovulation reminder derived from the neutral
  // placeholder defaults — the daily journal reminder is unaffected, it
  // never depends on cycle predictions. The mother's own existing behaviour
  // is untouched either way (isOwnerActive() short-circuits to true).
  const dateBasedActive = active && (isOwnerActive() || getHasConfirmedCycleData());

  // One-time cleanup of the pre-profile-scoping bare ids (harmless no-op if
  // nothing is scheduled under them) so a stray duplicate can never linger
  // for the mother after this upgrade — see idFor()'s own header comment.
  await Promise.all(LEGACY_IDS.map(cancelLocalNotification));

  await Promise.all([
    syncUpcomingPeriodReminder(dateBasedActive, prefs, prediction),
    syncPeriodStartCheckReminder(dateBasedActive, prefs, prediction),
    syncDailyJournalReminder(active, prefs),
    syncFertileWindowReminder(dateBasedActive, prefs, fertility, today),
    syncOvulationReminder(dateBasedActive, prefs, fertility, today),
  ]);
}
