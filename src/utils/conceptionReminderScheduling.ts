import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import {nextDailyFireDate, parseHHmm} from './pregnancyReminderScheduling';
import {ovulationDayFor, startOfDay, upcomingDateForCycleDay} from './cycleMath';
import {getActiveObjective, getCyclePreferences, getHasConfirmedCycleData} from '../state/onboardingPreferences';
import {getConceptionPreferences, type ConceptionReminderKey} from '../state/conceptionPreferences';

// Scheduling for "Essayer de concevoir"'s 5 onboarding "Rappels
// personnalisés" toggles (conceptionPreferences.ts's `reminders`). Reuses
// the exact same chokepoint (scheduleLocalNotification/cancelLocalNotification
// in pregnancyNotifications.ts) every other reminder in the app already goes
// through — discreet-notification redaction, hidden-preview,
// AndroidVisibility.PRIVATE, and permission handling are all inherited
// automatically, nothing TTC-specific to reimplement here.
//
// Deliberately only 5 — no `intercourse` reminder: it overlapped with
// fertile_window and risked feeling intrusive (product decision). "Rapports"
// tracking itself is untouched — this only removes its automatic reminder.
//
// Two shapes, matching what each reminder actually means:
//  - temperature / daily_journal: plain daily habits, independent of cycle
//    day — same `repeatFrequency: 'daily'` pattern as Pregnancy's own daily
//    journal/health reminders (pregnancyReminderScheduling.ts).
//  - fertile_window / estimated_ovulation / lh_test: tied to a specific
//    cycle day, which (unlike a gestational week) is NOT a fixed interval,
//    so `repeatFrequency` can't express it. Each is instead a one-time
//    trigger for "the next occurrence of that cycle day from today", via
//    the exact same `upcomingDateForCycleDay()` ConceiveDashboard/
//    ConceiveStatisticsScreen already use for fertileStartDate/ovulationDate
//    — the reminder date can never disagree with what's shown on screen.
//    Because scheduleLocalNotification() always cancels-then-reschedules by
//    id, simply re-running this sync (on boot, on relevant preference/cycle
//    changes, and on TTC Dashboard focus) keeps each one-time reminder
//    pointed at the correct upcoming date every cycle — no separate
//    occurrence-id bookkeeping needed, unlike Nifas's one-time-ever reminder.
//
// Every scheduled notification carries `data.hawaNotificationKind:
// 'conception-reminder'` + `data.conceptionReminderType` — this is what lets
// conceptionReminderNotificationPersistence.ts/conceptionReminderNotification
// Navigation.ts (delivery → in-app notification-center card, and tap →
// navigation) recognize a TTC reminder among every other notification kind
// in the app.

/**
 * ⚠️ DEVELOPMENT TEST ONLY
 *
 * true:
 *   Every enabled TTC reminder is scheduled a few minutes from now instead
 *   of at its real cycle-relative date/daily time, so it can be verified on
 *   a real device without waiting for an actual fertile window/ovulation
 *   day or a real 07:00/20:00.
 *
 * false (default):
 *   Normal production scheduling is used — real cycle-relative dates, real
 *   daily times, unchanged.
 *
 * `__DEV__` guarantees this test behavior cannot run in a release build,
 * same convention as postpartumNifasReminderScheduling.ts's
 * TEST_NIFAS_NOTIFICATIONS. Flip back to `false` (or just stop overriding
 * it) and re-run the sync (e.g. reopen the TTC Dashboard) to return to real
 * scheduling — no manual cleanup needed, since scheduleLocalNotification()
 * always cancels-then-reschedules by the same stable id either way.
 */
const TEST_TTC_REMINDERS = __DEV__ && false;

/** Minutes from "now" each enabled reminder fires in test mode — staggered
 * so they arrive one at a time and stay distinguishable on a real device. */
const TEST_OFFSET_MINUTES: Record<ConceptionReminderKey, number> = {
  temperature: 1,
  fertile_window: 2,
  lh_test: 3,
  estimated_ovulation: 4,
  daily_journal: 5,
};

function testFireDate(key: ConceptionReminderKey): Date {
  return new Date(Date.now() + TEST_OFFSET_MINUTES[key] * 60 * 1000);
}

const ID_PREFIX = 'conceive';

export const CONCEPTION_REMINDER_NOTIFICATION_IDS: Record<ConceptionReminderKey, string> = {
  fertile_window: `${ID_PREFIX}-fertile-window`,
  estimated_ovulation: `${ID_PREFIX}-estimated-ovulation`,
  lh_test: `${ID_PREFIX}-lh-test`,
  temperature: `${ID_PREFIX}-temperature`,
  daily_journal: `${ID_PREFIX}-daily-journal`,
};

const DAILY_TIMES: Partial<Record<ConceptionReminderKey, string>> = {
  temperature: '07:00',
  daily_journal: '20:00',
};

const CYCLE_DAY_OFFSETS: Partial<Record<ConceptionReminderKey, {dayOffset: number; time: string}>> = {
  fertile_window: {dayOffset: -5, time: '08:00'},
  estimated_ovulation: {dayOffset: 0, time: '08:00'},
  lh_test: {dayOffset: -2, time: '09:00'},
};

// Exported so conceptionReminderNotificationPersistence.ts reuses the exact
// same title/message text for the in-app notification-center card instead
// of duplicating it — single source of truth for TTC reminder copy.
export const CONTENT: Record<ConceptionReminderKey, {title: string; body: string}> = {
  fertile_window: {
    title: 'Ta fenêtre fertile commence',
    body: 'Aujourd’hui commence ta période la plus fertile de ce cycle.',
  },
  estimated_ovulation: {
    title: 'Ovulation estimée aujourd’hui',
    body: 'Ton ovulation est estimée aujourd’hui, selon ton cycle.',
  },
  lh_test: {
    title: 'Pense à ton test d’ovulation (LH)',
    body: 'C’est un bon moment pour faire ton test LH.',
  },
  temperature: {
    title: 'Température basale',
    body: 'N’oublie pas de prendre ta température avant de te lever.',
  },
  daily_journal: {
    title: 'Journal quotidien',
    body: 'Prends un instant pour compléter ton suivi du jour.',
  },
};

const HAWA_NOTIFICATION_KIND = 'conception-reminder';

function dataFor(key: ConceptionReminderKey): Record<string, string> {
  return {hawaNotificationKind: HAWA_NOTIFICATION_KIND, conceptionReminderType: key};
}

async function syncDailyReminder(key: ConceptionReminderKey, enabled: boolean): Promise<void> {
  const id = CONCEPTION_REMINDER_NOTIFICATION_IDS[key];
  if (!enabled) {
    await cancelLocalNotification(id);
    return;
  }

  if (TEST_TTC_REMINDERS) {
    // One-shot in test mode — a repeating daily trigger would keep re-firing
    // every 24h after the test, and re-syncing (flag off + reopen Dashboard)
    // already restores the real repeating schedule anyway.
    await scheduleLocalNotification({
      id,
      title: CONTENT[key].title,
      body: CONTENT[key].body,
      fireDate: testFireDate(key),
      data: dataFor(key),
    });
    return;
  }

  const time = DAILY_TIMES[key] as string;
  await scheduleLocalNotification({
    id,
    title: CONTENT[key].title,
    body: CONTENT[key].body,
    fireDate: nextDailyFireDate(time),
    repeatFrequency: 'daily',
    data: dataFor(key),
  });
}

async function syncCycleDayReminder(key: ConceptionReminderKey, enabled: boolean): Promise<void> {
  const id = CONCEPTION_REMINDER_NOTIFICATION_IDS[key];
  // fertile_window/estimated_ovulation/lh_test are all computed from
  // getCyclePreferences() below — until the user has actually confirmed her
  // cycle baseline (see getHasConfirmedCycleData()'s doc comment), that data
  // is the app's internal fallback, not a real prediction, so scheduling one
  // of these would notify her of a fertile window/ovulation date that has no
  // basis in her real cycle. Cancel/skip regardless of the toggle state;
  // App.tsx's subscribeCyclePreferences(syncConceptionReminders) re-runs
  // this automatically the moment she confirms real data.
  if (!enabled || !getHasConfirmedCycleData()) {
    await cancelLocalNotification(id);
    return;
  }

  if (TEST_TTC_REMINDERS) {
    await scheduleLocalNotification({
      id,
      title: CONTENT[key].title,
      body: CONTENT[key].body,
      fireDate: testFireDate(key),
      data: dataFor(key),
    });
    return;
  }

  const cyclePrefs = getCyclePreferences();
  const ovulationDay = ovulationDayFor(cyclePrefs.cycleDuration);
  const {dayOffset, time} = CYCLE_DAY_OFFSETS[key] as {dayOffset: number; time: string};
  const targetCycleDay = Math.max(1, ovulationDay + dayOffset);
  // Must be midnight, not the current wall-clock time — upcomingDateForCycleDay
  // compares against always-midnight candidate dates, so a same-day target
  // would otherwise look "already past" until midnight and get pushed a full
  // cycle forward. Same normalization ConceiveStatisticsScreen.tsx/
  // CalendarScreen.tsx/CycleHomeScreen.tsx already apply before calling it.
  const today = startOfDay(new Date());
  const nextDate = upcomingDateForCycleDay(cyclePrefs, targetCycleDay, today);
  const {hours, minutes} = parseHHmm(time);
  const fireDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), hours, minutes, 0, 0);

  await scheduleLocalNotification({
    id,
    title: CONTENT[key].title,
    body: CONTENT[key].body,
    fireDate,
    data: dataFor(key),
  });
}

/** Re-derives and reschedules every TTC reminder from the current
 * conceptionPreferences + cycle preferences. Idempotent — safe to call
 * repeatedly (scheduleLocalNotification/cancelLocalNotification are
 * themselves upserts by id). Call on app boot, whenever cycle/conception
 * preferences or the active objective change, and on TTC Dashboard focus
 * (so cycle-relative dates stay correct as cycles roll over). */
export async function syncConceptionReminders(): Promise<void> {
  if (getActiveObjective() !== 'conceive') {
    await cancelAllConceptionReminders();
    return;
  }

  const {reminders} = getConceptionPreferences();

  await Promise.all([
    syncDailyReminder('temperature', reminders.temperature),
    syncDailyReminder('daily_journal', reminders.daily_journal),
    syncCycleDayReminder('fertile_window', reminders.fertile_window),
    syncCycleDayReminder('estimated_ovulation', reminders.estimated_ovulation),
    syncCycleDayReminder('lh_test', reminders.lh_test),
  ]);
}

/** Cancels every TTC reminder notification. Call when leaving the `conceive`
 * objective (also called internally by syncConceptionReminders() itself). */
export async function cancelAllConceptionReminders(): Promise<void> {
  await Promise.all(
    Object.values(CONCEPTION_REMINDER_NOTIFICATION_IDS).map(id => cancelLocalNotification(id)),
  );
}
