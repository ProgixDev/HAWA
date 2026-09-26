import type {ContraceptionIntakeRecord} from '../state/contraceptionIntakeHistoryStore';
import type {ContraceptionEvent, ContraceptionEventType} from '../state/contraceptionEventStore';
import {diffDays} from './cycleMath';

const parseLocalDate = (dateKey: string): Date | null => {
  const parsed = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const nextDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12);

/** Pill pack day-of-cycle (1-based) for `forDateKey`, given the real
 * persisted `methodStartDate`. Returns null when the method hasn't started,
 * dates are invalid, or `forDateKey` precedes `methodStartDate` — never
 * fabricates a day number. Single canonical source, reused by
 * ContraceptionDashboard and ContraceptionCalendarContent so none of them
 * can disagree. `totalDays` is a REQUIRED real value (activeDays + breakDays
 * from the user's own PillScheduleScreen answer, `pillScheduleType ===
 * 'cyclic'` only) — deliberately no default, so a future caller can never
 * silently fall back to an invented pack length; callers must only call
 * this when they already know a real finite total exists. */
export const getPillPackDay = (
  methodStartDate: string | null,
  forDateKey: string,
  totalDays: number,
): number | null => {
  if (!methodStartDate) {
    return null;
  }
  const start = parseLocalDate(methodStartDate);
  const target = parseLocalDate(forDateKey);
  if (!start || !target) {
    return null;
  }
  // Calendar-day difference (rounded from local-midnight dates, see cycleMath.diffDays):
  // dividing raw milliseconds and flooring is one day short across a spring
  // daylight-saving change (23-hour day), which shifted the pill break-day
  // boundary by a day for the rest of summer time.
  const elapsedDays = diffDays(target, start);
  if (elapsedDays < 0) {
    return null;
  }
  return (elapsedDays % totalDays) + 1;
};

/** Whether a pill pack day falls in the BREAK (arrêt) part of a CYCLIC
 * schedule: days 1..activeDays are pill days, activeDays+1..total are break
 * days. `packDay` comes from getPillPackDay(), which is only ever non-null
 * for a real cyclic schedule — so continuous / unknown / not-started / not
 * configured (packDay === null) and ring / patch / other (never given a
 * pack day) are never a break day. Presentation only: it carries no medical
 * instruction. */
export const isPillBreakDay = (packDay: number | null, activeDays: number | null): boolean =>
  packDay !== null && activeDays !== null && packDay > activeDays;

/** A REAL cyclic pill schedule (user-entered activeDays + breakDays). null for
 * everything else — continuous, unknown, unconfigured, ring, patch, other —
 * which have no break days and keep their previous behavior. */
export type CyclicPillSchedule = {activeDays: number; totalDays: number};

export const getCyclicPillSchedule = (prefs: {
  method: string | null;
  pillScheduleType: string | null;
  activeDays: number | null;
  breakDays: number | null;
}): CyclicPillSchedule | null => {
  if (
    prefs.method === 'pill' &&
    prefs.pillScheduleType === 'cyclic' &&
    prefs.activeDays !== null &&
    prefs.breakDays !== null &&
    prefs.activeDays + prefs.breakDays > 0
  ) {
    return {activeDays: prefs.activeDays, totalDays: prefs.activeDays + prefs.breakDays};
  }
  return null;
};

/** THE canonical "is this calendar day a break (arrêt) day?" predicate for
 * every consumer that only has a date key (Statistics, adherence, streak,
 * Calendar monthly summary, Journal). It is exactly isPillBreakDay(
 * getPillPackDay(...)) — the same rule the Dashboard hero and the Calendar
 * cells apply. false for any non-cyclic schedule. */
export const isPillBreakDateKey = (
  dateKey: string,
  methodStartDate: string | null,
  schedule: CyclicPillSchedule | null,
): boolean =>
  schedule !== null &&
  isPillBreakDay(getPillPackDay(methodStartDate, dateKey, schedule.totalDays), schedule.activeDays);

export type ContraceptionRangeSummary = {
  taken: number;
  /** Real, distinct from `missed` — a delay was recorded, not a full miss.
   * Never folded into either `taken` or `missed`. */
  late: number;
  missed: number;
  /** null when a truthful "non enregistrée" count can't be derived (no
   * persisted methodStartDate to anchor an "expected tracked day" window,
   * or the window doesn't intersect the requested range at all). */
  notRecorded: number | null;
  /** null when the denominator isn't valid — see `notRecorded`. Counts only
   * `taken` records (on-time) as "on track" — a `late` record is real and
   * counted separately above, but by definition wasn't on time, so it never
   * inflates this percentage. */
  regularityPercent: number | null;
};

/** THE single canonical taken/missed/non-enregistrée/regularity calculation
 * for an arbitrary inclusive date range ['startKey', 'endKey'] — every other
 * summary helper in this file (monthly, or any future range) must call this
 * rather than redefining the formula. `taken`/`missed` are simple counts of
 * real persisted records within the range. `notRecorded`/`regularityPercent`
 * are computed ONLY over the "expected tracked" window — the intersection
 * of [methodStartDate, endKey] with [startKey, endKey] — since days before
 * the method even started were never expected to have a record. Regularity
 * formula: taken / expectedTrackedDays * 100, rounded. All date comparisons
 * use local 'YYYY-MM-DD' string keys (lexicographically ordered, DST-safe)
 * rather than Date object comparisons. */
export const computeContraceptionRangeSummary = (
  recordsByDate: Record<string, ContraceptionIntakeRecord>,
  startKey: string,
  endKey: string,
  methodStartDate: string | null,
  /** CYCLIC pill schedule only (see getCyclicPillSchedule): its break days are
   * NOT expected intakes — they never count as expected, never as "non
   * enregistrée", never as missed, and never reduce the regularity. */
  schedule: CyclicPillSchedule | null = null,
): ContraceptionRangeSummary => {
  let taken = 0;
  let takenOnExpectedDays = 0;
  let late = 0;
  let missed = 0;
  for (const record of Object.values(recordsByDate)) {
    if (record.date < startKey || record.date > endKey) {
      continue;
    }
    const onBreakDay = isPillBreakDateKey(record.date, methodStartDate, schedule);
    if (record.status === 'taken') {
      taken += 1;
      if (!onBreakDay) {takenOnExpectedDays += 1;}
    }
    if (record.status === 'late') {late += 1;}
    // A break day has nothing to take: a "missed" recorded there is not a miss.
    if (record.status === 'missed' && !onBreakDay) {missed += 1;}
  }

  if (!methodStartDate) {
    return {taken, late, missed, notRecorded: null, regularityPercent: null};
  }

  const expectedStartKey = methodStartDate > startKey ? methodStartDate : startKey;
  if (expectedStartKey > endKey) {
    return {taken, late, missed, notRecorded: null, regularityPercent: null};
  }

  const expectedStart = parseLocalDate(expectedStartKey);
  const expectedEnd = parseLocalDate(endKey);
  if (!expectedStart || !expectedEnd) {
    return {taken, late, missed, notRecorded: null, regularityPercent: null};
  }

  let expectedTrackedDays = 0;
  let recordedDays = 0;
  for (let cursor = expectedStart; cursor.getTime() <= expectedEnd.getTime(); cursor = nextDay(cursor)) {
    const cursorKey = formatDateKey(cursor);
    if (isPillBreakDateKey(cursorKey, methodStartDate, schedule)) {
      continue; // break day: not an expected intake
    }
    expectedTrackedDays += 1;
    if (recordsByDate[cursorKey]) {
      recordedDays += 1;
    }
  }

  const notRecorded = Math.max(0, expectedTrackedDays - recordedDays);
  const regularityPercent =
    expectedTrackedDays > 0 ? Math.round((takenOnExpectedDays / expectedTrackedDays) * 100) : null;

  return {taken, late, missed, notRecorded, regularityPercent};
};

export type ContraceptionMonthlySummary = ContraceptionRangeSummary;

/** Convenience wrapper over `computeContraceptionRangeSummary` for one
 * calendar month, clipped so days after `todayKey` are never treated as
 * "expected" (nothing can be logged for the future). Kept as its own export
 * only because ContraceptionCalendarContent already calls it with a `Date`
 * month-start rather than a pair of range keys — it does not redefine the
 * formula, it just derives the range boundaries and delegates. */
export const computeContraceptionMonthlySummary = (
  recordsByDate: Record<string, ContraceptionIntakeRecord>,
  monthStart: Date,
  todayKey: string,
  methodStartDate: string | null,
  schedule: CyclicPillSchedule | null = null,
): ContraceptionMonthlySummary => {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStartKey = formatDateKey(new Date(year, month, 1, 12));
  const monthEndKey = formatDateKey(new Date(year, month, daysInMonth, 12));
  const effectiveEndKey = monthEndKey < todayKey ? monthEndKey : todayKey;

  if (effectiveEndKey < monthStartKey) {
    // Entire month is in the future — nothing expected or recorded yet.
    return computeContraceptionRangeSummary(recordsByDate, monthStartKey, monthStartKey, null);
  }

  return computeContraceptionRangeSummary(recordsByDate, monthStartKey, effectiveEndKey, methodStartDate, schedule);
};

export type ContraceptionPeriodBucket = {
  /** Short, human-readable label for the bucket (e.g. "4 août" for a week,
   * "août" for a month) — display-only, never used for comparisons. */
  label: string;
  taken: number;
  late: number;
  missed: number;
};

/** Buckets real taken/late/missed counts by 7-day week across ['startKey',
 * 'endKey'] — used for the short (1-month) trend chart, where a handful of
 * weekly bars stays readable on a small screen. */
export const computeContraceptionWeeklyBreakdown = (
  recordsByDate: Record<string, ContraceptionIntakeRecord>,
  startKey: string,
  endKey: string,
): ContraceptionPeriodBucket[] => {
  const start = parseLocalDate(startKey);
  const end = parseLocalDate(endKey);
  if (!start || !end || start.getTime() > end.getTime()) {
    return [];
  }

  const buckets: ContraceptionPeriodBucket[] = [];
  let weekStart = start;

  while (weekStart.getTime() <= end.getTime()) {
    const rawWeekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6, 12);
    const weekEnd = rawWeekEnd.getTime() < end.getTime() ? rawWeekEnd : end;

    let taken = 0;
    let late = 0;
    let missed = 0;
    for (let cursor = weekStart; cursor.getTime() <= weekEnd.getTime(); cursor = nextDay(cursor)) {
      const record = recordsByDate[formatDateKey(cursor)];
      if (record?.status === 'taken') {taken += 1;}
      if (record?.status === 'late') {late += 1;}
      if (record?.status === 'missed') {missed += 1;}
    }

    buckets.push({
      label: new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short'}).format(weekStart),
      taken,
      late,
      missed,
    });

    weekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7, 12);
  }

  return buckets;
};

/** Buckets real taken/late/missed counts by calendar month across
 * ['startKey', 'endKey'] — used for the longer (3/6-month) trend chart,
 * where monthly bars stay compact and readable instead of 12-26 weekly
 * bars. */
export const computeContraceptionMonthlyBreakdown = (
  recordsByDate: Record<string, ContraceptionIntakeRecord>,
  startKey: string,
  endKey: string,
): ContraceptionPeriodBucket[] => {
  const start = parseLocalDate(startKey);
  const end = parseLocalDate(endKey);
  if (!start || !end || start.getTime() > end.getTime()) {
    return [];
  }

  const buckets: ContraceptionPeriodBucket[] = [];
  let monthCursor = new Date(start.getFullYear(), start.getMonth(), 1, 12);

  while (monthCursor.getTime() <= end.getTime()) {
    const monthLastDay = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0, 12);
    const bucketStart = monthCursor.getTime() > start.getTime() ? monthCursor : start;
    const bucketEnd = monthLastDay.getTime() < end.getTime() ? monthLastDay : end;

    let taken = 0;
    let late = 0;
    let missed = 0;
    for (let cursor = bucketStart; cursor.getTime() <= bucketEnd.getTime(); cursor = nextDay(cursor)) {
      const record = recordsByDate[formatDateKey(cursor)];
      if (record?.status === 'taken') {taken += 1;}
      if (record?.status === 'late') {late += 1;}
      if (record?.status === 'missed') {missed += 1;}
    }

    buckets.push({
      label: new Intl.DateTimeFormat('fr-FR', {month: 'short'}).format(monthCursor),
      taken,
      late,
      missed,
    });

    monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1, 12);
  }

  return buckets;
};

/** Longest run of CONSECUTIVE real `taken` records within ['startKey',
 * 'endKey'] — a `missed` record or a day with no record at all breaks the
 * streak. With no cyclic schedule every day without a real `taken` record ends
 * the current streak; for a cyclic pill schedule its break days (see
 * isPillBreakDateKey) are skipped instead — they are not expected intakes. */
export const computeContraceptionBestStreak = (
  recordsByDate: Record<string, ContraceptionIntakeRecord>,
  startKey: string,
  endKey: string,
  /** CYCLIC pill schedule only: a break day is transparent — it neither
   * extends nor breaks the streak (nothing is expected on it). */
  methodStartDate: string | null = null,
  schedule: CyclicPillSchedule | null = null,
): number => {
  const start = parseLocalDate(startKey);
  const end = parseLocalDate(endKey);
  if (!start || !end || start.getTime() > end.getTime()) {
    return 0;
  }

  let best = 0;
  let current = 0;
  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = nextDay(cursor)) {
    const cursorKey = formatDateKey(cursor);
    if (isPillBreakDateKey(cursorKey, methodStartDate, schedule)) {
      continue;
    }
    if (recordsByDate[cursorKey]?.status === 'taken') {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
};

export type ContraceptionEventCounts = Partial<Record<ContraceptionEventType, number>>;

/** Real per-type event counts within ['startKey', 'endKey'] — for ring/patch,
 * tracked via contraceptionEventStore.ts's discrete insertion/removal/
 * replacement events rather than a single daily taken/late/missed status.
 * Deliberately never derives an expected-event count or an adherence
 * percentage: no real replacement-cadence schedule is collected anywhere in
 * the app, so none is fabricated here — this only totals events the user
 * actually logged, e.g. "3 changements enregistrés". */
export const computeContraceptionEventCounts = (
  eventsByDate: Record<string, ContraceptionEvent[]>,
  startKey: string,
  endKey: string,
): ContraceptionEventCounts => {
  const counts: ContraceptionEventCounts = {};
  for (const events of Object.values(eventsByDate)) {
    for (const event of events) {
      if (event.date < startKey || event.date > endKey) {
        continue;
      }
      counts[event.type] = (counts[event.type] ?? 0) + 1;
    }
  }
  return counts;
};
