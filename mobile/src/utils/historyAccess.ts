import {addDays, startOfDay} from './cycleMath';

// The single shared implementation of the "Historique illimité" Premium
// entitlement — see CLAUDE.md's REUSE→EXTEND→CREATE rule: every objective's
// Calendar/journal-history screen calls into this file instead of each
// re-deriving its own date-window math.
//
// SCOPE: this is deliberately about HISTORY ACCESS only (calendars,
// journals, tracking-history lists) — it is NOT the Statistics 1/3/6/12-
// month period architecture (see cycleStatisticsMath.ts's own
// STATISTICS_PERIODS/isPeriodFree, which stays completely independent and
// untouched by this file). The two features intentionally use separate
// utilities so they can never accidentally become coupled.
//
// This file never touches AsyncStorage and never deletes/prunes anything —
// it is a pure read-only "is this date/month currently viewable" gate. Real
// historical records always remain in their store regardless of the
// caller's Premium status; only what a FREE user can currently reach
// through the UI changes.

/** How much real history a FREE user can browse — the most recent 30 days,
 * inclusive of today. Premium has no lower bound at all (`null`). */
export const FREE_HISTORY_WINDOW_DAYS = 30;

/**
 * The earliest date a user may currently browse, or `null` for "no limit"
 * (Premium). Always computed from real local calendar days via the
 * project's shared `startOfDay`/`addDays` — never UTC, matching every other
 * date boundary in this codebase.
 */
export function getHistoryLowerBound(isPremium: boolean, now: Date = new Date()): Date | null {
  if (isPremium) {
    return null;
  }
  return startOfDay(addDays(now, -(FREE_HISTORY_WINDOW_DAYS - 1)));
}

/** True when `date` currently falls within the caller's allowed history
 * window — always true for Premium, true for FREE only within the most
 * recent `FREE_HISTORY_WINDOW_DAYS` days (including today; a date in the
 * future is never itself restricted by this function — callers that care
 * about future dates handle that separately, as today). */
export function isDateWithinHistoryAccess(date: Date, isPremium: boolean, now: Date = new Date()): boolean {
  const bound = getHistoryLowerBound(isPremium, now);
  if (!bound) {
    return true;
  }
  return startOfDay(date).getTime() >= bound.getTime();
}

/**
 * True when at least part of the calendar month starting on `monthStart`
 * (any day of that month works — only year/month are read) is still
 * reachable under the caller's history window. Used to decide whether a
 * Calendar's "previous month" navigation should proceed or open the
 * Premium paywall instead — a month is locked only once ALL of its days
 * fall before the allowed window, so the boundary month (the one the
 * window cuts through) stays reachable rather than disappearing abruptly.
 */
export function isMonthWithinHistoryAccess(monthStart: Date, isPremium: boolean, now: Date = new Date()): boolean {
  const bound = getHistoryLowerBound(isPremium, now);
  if (!bound) {
    return true;
  }
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  return monthEnd.getTime() >= bound.getTime();
}

/** Filters a real, already-loaded list of `{date: 'YYYY-MM-DD', ...}`
 * records down to whatever the caller's current history window allows —
 * never mutates the source array, never touches storage. Every record
 * always remains in its store; this only narrows what a FREE session's UI
 * shows for a "voir tout l'historique"-style list. */
export function filterRecordsForHistoryAccess<T extends {date: string}>(
  records: readonly T[],
  isPremium: boolean,
  now: Date = new Date(),
): T[] {
  const bound = getHistoryLowerBound(isPremium, now);
  if (!bound) {
    return [...records];
  }
  return records.filter(record => startOfDay(new Date(`${record.date}T12:00:00`)).getTime() >= bound.getTime());
}
