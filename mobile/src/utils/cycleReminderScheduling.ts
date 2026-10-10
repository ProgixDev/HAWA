import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {areReminderSourcesUnavailable} from './reminderSourceAvailability';

// The records the Cycle reminders are derived from. If any of them could not be READ, the reminders must not be rebuilt
// from the neutral placeholder state the stores fall back to: that would cancel real reminders or invent wrong ones.
const CYCLE_REMINDER_SOURCE_BASES = ['@hawa/cycle-preferences', '@hawa/period-end-datetime', '@hawa/cycle-reminder-preferences/v1', '@hawa/confirmed-period-history'] as const;

/** Cancels one reminder id and THROWS if the native layer reported a failure, so a reminder that may still be
 * scheduled is never mistaken for a cancelled one (the run is then retried, see scheduleRetry). */
async function cancelReminder(id: string): Promise<void> {
  if ((await cancelLocalNotification(id)) === false) {
    throw new Error(`reminder ${id} could not be cancelled`);
  }
}
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import i18n from '../i18n';
import {
  addDays,
  computeCyclePredictionStatus,
  effectiveRegularityFor,
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
  hydrateCyclePreferences,
} from '../state/onboardingPreferences';
import {getCycleReminderPreferences, hydrateCycleReminderPreferences, type CycleReminderPreferences} from '../state/cycleReminderPreferences';
import {getActiveProfileId, getActiveProfileIdentity, isOwnerActive} from '../state/activeProfileStore';
import {getManagedProfiles} from '../state/managedProfilesStore';

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
const idFor = (base: string, profileId: string): string => `${base}:${profileId}`;

/** Everything one synchronization run needs to know about WHICH profile it is
 * working for, captured ONCE and synchronously at the start of the run — in the
 * same tick as the preferences / cycle data it reads. Ids, wording and the
 * `profileId` carried by every notification all come from here, never from
 * "whoever is active at the moment the line executes": a run that began for one
 * profile can therefore never write another profile's ids or name, however long
 * its native calls take. `isStale()` turns true as soon as a newer run has been
 * requested, so an obsolete run stops scheduling (a newer run always follows). */
type ReminderContext = {
  profileId: string;
  isOwner: boolean;
  firstName: string | null;
  isStale: () => boolean;
};

/** Returns the mother's own EXISTING wording, byte-identical, for the owner;
 * for a managed daughter, builds profile-aware wording from her real firstName
 * instead (never hardcoded, never speaking as if her cycle belonged to the
 * phone owner — CLAUDE.md §4/§16 of this task). */
function ownerOrDaughterCopy(
  ctx: ReminderContext,
  ownerCopy: {title: string; body: string},
  daughterCopy: (firstName: string) => {title: string; body: string},
): {title: string; body: string} {
  if (ctx.isOwner) {return ownerCopy;}
  return daughterCopy(ctx.firstName || 'elle');
}

/** The single place a reminder is handed to the native layer: a run that has
 * been superseded writes nothing more (its newer successor reconciles). */
async function scheduleFor(ctx: ReminderContext, input: Parameters<typeof scheduleLocalNotification>[0]): Promise<void> {
  if (ctx.isStale()) {return;}
  await scheduleLocalNotification(input);
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
  ctx: ReminderContext,
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
  const id = idFor(UPCOMING_PERIOD_ID, ctx.profileId);
  if (!active || !prefs.upcomingPeriodEnabled || prediction.mode !== 'exact') {
    await cancelReminder(id);
    return;
  }

  // The phone belongs to the mother — a daughter's reminder must not speak
  // as if her cycle were the phone owner's own (CLAUDE.md §4). Her own
  // wording is unaffected: byte-identical to before.
  const {title, body} = ownerOrDaughterCopy(
    ctx,
    {title: i18n.t('notifications.cycle.upcomingPeriod.title'), body: i18n.t('notifications.cycle.upcomingPeriod.body')},
    firstName => ({
      title: i18n.t('notifications.cycle.upcomingPeriodDaughter.title', {firstName}),
      body: i18n.t('notifications.cycle.upcomingPeriodDaughter.body', {firstName}),
    }),
  );

  await scheduleFor(ctx, {
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
      profileId: ctx.profileId,
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

async function syncPeriodStartCheckReminder(
  ctx: ReminderContext,
  active: boolean,
  prefs: CycleReminderPreferences,
  prediction: CyclePredictionStatus,
): Promise<void> {
  // PRODUCT DECISION REQUIRED: same open question as the upcoming-period
  // reminder above (a "have your periods started?" check in 'window' mode,
  // e.g. from windowEnd / when isLate) — kept as the existing safe cancel.
  const id = idFor(PERIOD_START_CHECK_ID, ctx.profileId);
  if (!active || !prefs.periodStartCheckEnabled || prediction.mode !== 'exact') {
    await cancelReminder(id);
    return;
  }

  const {title, body} = ownerOrDaughterCopy(
    ctx,
    {title: i18n.t('notifications.cycle.periodStartCheck.title'), body: i18n.t('notifications.cycle.periodStartCheck.body')},
    firstName => ({
      title: i18n.t('notifications.cycle.periodStartCheckDaughter.title', {firstName}),
      body: i18n.t('notifications.cycle.periodStartCheckDaughter.body', {firstName}),
    }),
  );

  // A single, one-time check on the predicted day itself — never recurring,
  // so this can never turn into a daily nag. If she records her period
  // (confirmPeriodStart) before this fires, lastPeriodStart advances and the
  // NEXT resync (triggered by subscribeCyclePreferences in App.tsx)
  // recomputes `prediction.date` as the following cycle's date — upserting
  // this same id cancels the now-obsolete trigger automatically.
  await scheduleFor(ctx, {
    id,
    title,
    body,
    fireDate: atReminderHour(prediction.date),
    data: {
      hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND,
      cycleReminderType: 'period-start-check',
      profileId: ctx.profileId,
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

async function syncDailyJournalReminder(ctx: ReminderContext, active: boolean, prefs: CycleReminderPreferences): Promise<void> {
  const id = idFor(DAILY_JOURNAL_ID, ctx.profileId);
  if (!active || !prefs.dailyJournalEnabled || !prefs.dailyJournalTime) {
    await cancelReminder(id);
    return;
  }

  const {title, body} = ownerOrDaughterCopy(
    ctx,
    {title: i18n.t('notifications.cycle.dailyJournal.title'), body: i18n.t('notifications.cycle.dailyJournal.body')},
    firstName => ({
      title: i18n.t('notifications.cycle.dailyJournalDaughter.title', {firstName}),
      body: i18n.t('notifications.cycle.dailyJournalDaughter.body', {firstName}),
    }),
  );

  await scheduleFor(ctx, {
    id,
    title,
    body,
    fireDate: nextDailyFireDate(prefs.dailyJournalTime),
    repeatFrequency: 'daily',
    data: {
      hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND,
      cycleReminderType: 'daily-journal',
      profileId: ctx.profileId,
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
  ctx: ReminderContext,
  active: boolean,
  prefs: CycleReminderPreferences,
  fertility: ReturnType<typeof fertilityForReminders>,
  today: Date,
): Promise<void> {
  const id = idFor(FERTILE_WINDOW_ID, ctx.profileId);
  if (!active || !prefs.fertileWindowEnabled || !fertility) {
    await cancelReminder(id);
    return;
  }

  const {title, body} = ownerOrDaughterCopy(
    ctx,
    {title: i18n.t('notifications.cycle.fertileWindow.title'), body: i18n.t('notifications.cycle.fertileWindow.body')},
    firstName => ({
      title: i18n.t('notifications.cycle.fertileWindowDaughter.title', {firstName}),
      body: i18n.t('notifications.cycle.fertileWindowDaughter.body', {firstName}),
    }),
  );

  const fertileStart = nextOccurrence(fertility.estimate.fertileStart, fertility.cycleLength, today);
  await scheduleFor(ctx, {
    id,
    title,
    body,
    // Same addDays()-before-atReminderHour() ordering as the upcoming-period
    // reminder above — addDays() would otherwise zero the hour it sets.
    fireDate: atReminderHour(addDays(fertileStart, -FERTILE_WINDOW_LEAD_DAYS)),
    data: {
      hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND,
      cycleReminderType: 'fertile-window',
      profileId: ctx.profileId,
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

async function syncOvulationReminder(
  ctx: ReminderContext,
  active: boolean,
  prefs: CycleReminderPreferences,
  fertility: ReturnType<typeof fertilityForReminders>,
  today: Date,
): Promise<void> {
  const id = idFor(OVULATION_ID, ctx.profileId);
  if (!active || !prefs.ovulationEnabled || !fertility) {
    await cancelReminder(id);
    return;
  }

  const {title, body} = ownerOrDaughterCopy(
    ctx,
    {title: i18n.t('notifications.cycle.ovulation.title'), body: i18n.t('notifications.cycle.ovulation.body')},
    firstName => ({
      title: i18n.t('notifications.cycle.ovulationDaughter.title', {firstName}),
      body: i18n.t('notifications.cycle.ovulationDaughter.body', {firstName}),
    }),
  );

  const ovulation = nextOccurrence(fertility.estimate.ovulation, fertility.cycleLength, today);
  await scheduleFor(ctx, {
    id,
    title,
    body,
    fireDate: atReminderHour(ovulation),
    data: {
      hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND,
      cycleReminderType: 'ovulation',
      profileId: ctx.profileId,
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

/** One reconciliation of every Cycle reminder of the ACTIVE profile (see
 * syncCycleReminders below for how runs are queued). */
async function syncCycleRemindersOnce(revision: number): Promise<void> {
  // The profile's stored cycle and reminder preferences must have been READ
  // before anything is derived from them: right after a switch (or at launch)
  // memory holds a neutral placeholder, and reconciling against it would cancel
  // the profile's real reminders. Re-checked after the wait — the active profile
  // may have changed meanwhile.
  for (;;) {
    const waitingFor = getActiveProfileId();
    await Promise.all([hydrateCyclePreferences(), hydrateCycleReminderPreferences()]);
    if (getActiveProfileId() === waitingFor) {break;}
  }
  // Unreadable source data is not "no data": leave every scheduled reminder exactly as it is and let a later run
  // (after the data is readable again) reconcile.
  // (the active objective gates the OWNER's Cycle reminders; a managed profile's are always Cycle)
  if (areReminderSourcesUnavailable({profileBases: CYCLE_REMINDER_SOURCE_BASES, includeObjective: isOwnerActive()})) {return;}
  // Which profile this run works for — captured here, in the same tick as every
  // value read below, and never re-read from the active-profile store.
  const profileId = getActiveProfileId();
  const isOwner = isOwnerActive();
  const ctx: ReminderContext = {
    profileId,
    isOwner,
    firstName: isOwner ? null : getActiveProfileIdentity().managedProfile?.firstName ?? null,
    // Superseded only while STILL the same profile: then its snapshot is obsolete and
    // a newer run for her follows. Once another profile is active, this profile's
    // snapshot can no longer change (only the active profile's data is editable),
    // so it is still the right one to finish writing — under her own ids.
    isStale: () => revision !== syncRevision && getActiveProfileId() === profileId,
  };
  // A profile that was deleted can have no reminders: everything is cancelled.
  const profileExists = isOwner || getManagedProfiles().some(profile => profile.id === profileId);

  // A managed daughter's objective is ALWAYS forced to "Suivre mon cycle"
  // regardless of the mother's own real, globally-stored objective (same
  // effectiveObjective pattern as HomeScreen/CalendarScreen/JournalSheetHost
  // — see CLAUDE.md §4). getActiveObjective() alone would wrongly cancel
  // every one of a daughter's reminders whenever the mother's own objective
  // happens to be something else (e.g. 'pregnancy').
  const active = profileExists && (isOwner ? getActiveObjective() === 'cycle' : true);
  const prefs = getCycleReminderPreferences();
  const basics = getCyclePreferences();
  const today = startOfDay(new Date());
  // Recorded periods only — the SAME input CycleHomeScreen feeds the status
  // (never the placeholder record seeded from unconfirmed defaults).
  const periodStartDates = getRecordedPeriodHistory().map(record => new Date(`${record.startDate}T12:00:00`));
  const prediction = computeCyclePredictionStatus(
    basics,
    // A managed profile's declared-regular cycle whose lengths nobody provided is
    // observed, not projected from the placeholder 28 days — no reminder may be
    // scheduled from it (see effectiveRegularityFor). The owner is untouched.
    effectiveRegularityFor(basics.regularity, getHasConfirmedCycleDuration()),
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
  const dateBasedActive = active && getHasConfirmedCycleData();

  // One-time cleanup of the pre-profile-scoping bare ids (harmless no-op if
  // nothing is scheduled under them) so a stray duplicate can never linger
  // for the mother after this upgrade — see idFor()'s own header comment.
  const legacyCleanup = await Promise.allSettled(LEGACY_IDS.map(cancelReminder));

  // One failing reminder (a rejected native call) must not stop the other four;
  // the next run — every cycle / preference / profile change triggers one —
  // reconciles it, because each reminder is rebuilt from scratch and upserted by id.
  const results = await Promise.allSettled([
    syncUpcomingPeriodReminder(ctx, dateBasedActive, prefs, prediction),
    syncPeriodStartCheckReminder(ctx, dateBasedActive, prefs, prediction),
    syncDailyJournalReminder(ctx, active, prefs),
    syncFertileWindowReminder(ctx, dateBasedActive, prefs, fertility, today),
    syncOvulationReminder(ctx, dateBasedActive, prefs, fertility, today),
  ]);
  // A failed native call leaves that reminder in an unknown state: try again later instead of assuming.
  if ([...legacyCleanup, ...results].some(result => result.status === 'rejected')) {
    scheduleRetry();
  } else {
    retryAttempts = 0;
  }
}

// ---------------------------------------------------------------------------
// SERIALIZED, COALESCED SYNCHRONIZATION
//
// The native calls (cancel → permission → channel → create) take several
// awaits, and a sync is requested by many sources (cycle edits, reminder
// preferences, objective changes, profile switches, app start). Run in parallel
// they finish in ANY order, so an older run could land after a newer one and
// resurrect a reminder the newer run had just cancelled, or write one
// profile's reminders over another's. JavaScript cannot cancel a native call
// that was already dispatched, so correctness comes from ordering instead:
//   - runs never overlap (one queue, strictly sequential);
//   - a request made while a run is only QUEUED joins it (it reads the latest
//     state when it actually starts) — no pile-up of identical runs;
//   - a request made while a run is RUNNING queues exactly one more run, and
//     the running run stops scheduling (isStale) so the successor — which sees
//     the authoritative state — is the last writer.
// ---------------------------------------------------------------------------
let queueTail: Promise<void> = Promise.resolve();
let queuedSync: Promise<void> | null = null;
let syncRevision = 0;

// Bounded retry after a native failure: 3 more attempts, 30 s / 2 min / 10 min apart, then the next ordinary
// trigger (any cycle, preference, profile change or app start) reconciles. Reset on the first clean run.
const RETRY_DELAYS_MS = [30_000, 120_000, 600_000];
let retryAttempts = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRetry(): void {
  if (retryTimer || retryAttempts >= RETRY_DELAYS_MS.length) {return;}
  const delay = RETRY_DELAYS_MS[retryAttempts];
  retryAttempts += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    syncCycleReminders().catch(() => undefined);
  }, delay);
}

const enqueue = (task: () => Promise<void>): Promise<void> => {
  const run = queueTail.then(task, task);
  queueTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

/** Re-derives and (re)schedules — or explicitly cancels — every Cycle
 * reminder from real persisted preferences + the same canonical cycle
 * prediction used by the Dashboard/Calendar. Safe to call any number of
 * times, from anywhere, concurrently: the returned promise resolves once the
 * reminders reflect the state at (or after) the moment of the call. Never
 * schedules while a different objective is active, so switching away from
 * Cycle cleanly clears all 5. */
export function syncCycleReminders(): Promise<void> {
  syncRevision += 1;
  // Any new request supersedes a pending retry: the run it starts reconciles everything anyway.
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (queuedSync) {
    return queuedSync;
  }
  const job = enqueue(async () => {
    queuedSync = null;
    await syncCycleRemindersOnce(syncRevision);
  });
  queuedSync = job;
  return job;
}

/** Cancels every Cycle reminder scheduled for ONE profile — used when that
 * managed profile is deleted. Queued behind any run in flight, so a late run
 * for that profile cannot re-create what this cancels. Touches only that
 * profile's five namespaced ids. */
export function cancelCycleRemindersForProfile(profileId: string): Promise<void> {
  return enqueue(async () => {
    const results = await Promise.allSettled(LEGACY_IDS.map(base => cancelReminder(idFor(base, profileId))));
    if (results.some(result => result.status === 'rejected')) {
      // Reported, not hidden: the deletion keeps the profile and retries instead of leaving a live reminder.
      throw new Error('some reminders of the profile could not be cancelled');
    }
  });
}
