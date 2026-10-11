import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate} from './pregnancyReminderScheduling';
import {addDays, startOfDay} from './cycleMath';
import {calculateAverageCycleDuration} from './cycleStatisticsMath';
import {getActiveObjective, hydrateActiveObjective} from '../state/onboardingPreferences';
import {getIrregularPreferences, type IrregularPreferences} from '../state/irregularPreferences';
import {getConfirmedPeriodHistory, hydrateConfirmedPeriodHistory} from '../state/confirmedPeriodHistoryStore';
import {getAllJournalEntries} from '../state/dailyJournalStore';
import {isOwnerActive} from '../state/activeProfileStore';
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
import {areReminderSourcesUnavailable} from './reminderSourceAvailability';
import {loadOwnerProfileData} from './ownerReminderGate';
import {coalescedSync, createSerializer} from './serializedSync';
import type {DailyJournalEntry} from '../types/journal';
import i18n from '../i18n';

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
  return buildIrregularPeriodSources(journalEntries);
}

/** The synchronous half of loadIrregularPeriodSources(): everything but the daily journal is read from memory, so
 * the whole snapshot is taken in ONE tick — a sync that has just checked which profile is active can build its
 * sources without another await in which that could change. */
function buildIrregularPeriodSources(journalEntries: DailyJournalEntry[]): IrregularPeriodSources {
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

  const title = i18n.t('notifications.irregular.dailyJournal.title');
  const body = i18n.t('notifications.irregular.dailyJournal.body');

  await scheduleLocalNotification({
    id: DAILY_JOURNAL_ID,
    title,
    body,
    fireDate: nextDailyFireDate(prefs.reminders.dailyJournalTime),
    repeatFrequency: 'daily',
    data: {
      hawaNotificationKind: IRREGULAR_REMINDER_NOTIFICATION_KIND,
      irregularReminderType: 'daily-journal',
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

async function syncUnrecordedPeriodReminder(
  active: boolean,
  prefs: IrregularPreferences,
  now: Date,
  sources: IrregularPeriodSources | undefined,
): Promise<void> {
  if (!active || !prefs.reminders.unrecordedPeriodEnabled) {
    await cancelLocalNotification(UNRECORDED_PERIOD_ID);
    return;
  }

  const fireDate = await computeUnrecordedPeriodReminderDate(now, sources);
  if (!fireDate) {
    await cancelLocalNotification(UNRECORDED_PERIOD_ID);
    return;
  }

  const title = i18n.t('notifications.irregular.unrecordedPeriod.title');
  const body = i18n.t('notifications.irregular.unrecordedPeriod.body');

  await scheduleLocalNotification({
    id: UNRECORDED_PERIOD_ID,
    title,
    body,
    fireDate,
    data: {
      hawaNotificationKind: IRREGULAR_REMINDER_NOTIFICATION_KIND,
      irregularReminderType: 'unrecorded-period',
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

async function syncIrregularRemindersOnce(now: Date): Promise<void> {
  // The objective gates this reminder, so it must have been READ first: before that memory holds the default
  // objective, and a run triggered by another store's hydration would cancel (or arm) reminders on its strength.
  await hydrateActiveObjective();
  // These reminders have OWNER-GLOBAL ids but are derived from the ACTIVE profile's confirmed periods and daily
  // journal. While a managed (daughter) profile is active those records are hers, not the phone owner's: this run
  // neither schedules, cancels nor changes anything — the owner's triggers stay exactly as they are until she is
  // active again. Checked before ANY read.
  if (!isOwnerActive()) {
    return;
  }

  const active = getActiveObjective() === 'irregular';
  let journalEntries: DailyJournalEntry[] | undefined;
  if (active) {
    // The owner's own records are READ before anything is derived from them: right after a switch (or at launch)
    // memory holds the previous profile's / a neutral state, and reading the records also registers any that cannot
    // be read — checked right below. Re-checked after the wait: if a managed profile became active meanwhile, the
    // data read may be hers and nothing is touched.
    const loaded = await loadOwnerProfileData(() =>
      Promise.all([hydrateIrregularJournal(), hydrateConfirmedPeriodHistory(), getAllJournalEntries().catch(() => undefined)]),
    );
    if (!loaded?.isCurrent()) {
      return;
    }
    journalEntries = loaded.value[2];
  }
  // Unreadable preferences / journals / confirmed history are not "no reminders" or "no period recorded": the
  // existing reminders are left untouched and nothing is derived from the default state.
  if (areReminderSourcesUnavailable({
    ownerBases: ['@hawa/irregular-preferences/v1', '@hawa/irregular-journal/v1'],
    profileBases: ['@hawa/daily-journal/v1', '@hawa/confirmed-period-history'],
  })) {
    return;
  }
  const prefs = getIrregularPreferences();

  // Everything the unrecorded-period reminder is derived from is captured HERE, in the same tick as the owner check
  // above — nothing between that check and the snapshot can await.
  let sources: IrregularPeriodSources | undefined;
  if (active) {
    if (!journalEntries) {
      // The daily journal could not be read at all: that is not "no period recorded" either.
      return;
    }
    sources = buildIrregularPeriodSources(journalEntries);
  }

  await Promise.all([
    syncDailyJournalReminder(active, prefs),
    syncUnrecordedPeriodReminder(active, prefs, now, sources),
  ]);
}

// Runs are requested from many places (app start, a preference/objective/period change, a SOPK journal save, a
// profile switch, a privacy/language change). They never overlap: the no-argument form shares ONE follow-up run
// among any number of requests made while one is in progress (that run starts afterwards, so it reads the newest
// state), and an explicit `now` — only tests and previews pass one — queues behind whatever is running.
const runIrregularSyncInOrder = createSerializer();
const runCoalescedIrregularSync = coalescedSync(() =>
  runIrregularSyncInOrder(() => syncIrregularRemindersOnce(new Date())),
);

/** Re-derives and (re)schedules — or explicitly cancels — both SOPK
 * reminders from real persisted preferences + real period data (journal,
 * confirmed history, onboarding answer).
 * Safe to call any number of times (scheduleLocalNotification always
 * upserts by id). Never schedules while a different
 * objective is active, so switching away from SOPK cleanly clears both.
 *
 * A no-op while a managed (daughter) profile is active: these reminders belong
 * to the phone's owner and are never derived from — nor cancelled because of —
 * another profile's periods or journal.
 *
 * `now` is for tests only: every real caller passes nothing (this function is
 * handed straight to subscribers, which may also hand it unrelated arguments —
 * anything that is not a Date is ignored). */
export function syncIrregularReminders(now?: Date): Promise<void> {
  if (now instanceof Date) {
    return runIrregularSyncInOrder(() => syncIrregularRemindersOnce(now));
  }
  return runCoalescedIrregularSync();
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
