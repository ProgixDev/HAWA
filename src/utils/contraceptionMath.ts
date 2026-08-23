import type {ContraceptionIntakeRecord} from '../state/contraceptionIntakeHistoryStore';
import type {ContraceptionEvent, ContraceptionEventType} from '../state/contraceptionEventStore';

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
  const elapsedDays = Math.floor((target.getTime() - start.getTime()) / 86_400_000);
  if (elapsedDays < 0) {
    return null;
  }
  return (elapsedDays % totalDays) + 1;
};

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
): ContraceptionRangeSummary => {
  let taken = 0;
  let late = 0;
  let missed = 0;
  for (const record of Object.values(recordsByDate)) {
    if (record.date < startKey || record.date > endKey) {
      continue;
    }
    if (record.status === 'taken') {taken += 1;}
    if (record.status === 'late') {late += 1;}
    if (record.status === 'missed') {missed += 1;}
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
    expectedTrackedDays += 1;
    if (recordsByDate[formatDateKey(cursor)]) {
      recordedDays += 1;
    }
  }

  const notRecorded = Math.max(0, expectedTrackedDays - recordedDays);
  const regularityPercent =
    expectedTrackedDays > 0 ? Math.round((taken / expectedTrackedDays) * 100) : null;

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

  return computeContraceptionRangeSummary(recordsByDate, monthStartKey, effectiveEndKey, methodStartDate);
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
 * streak. Never assumes a pause/placebo day counts as "on track": the
 * schedule model has no real day-boundary pause data (see
 * ContraceptionCalendarContent's "Prochaine pause" omission), so every day
 * without a real `taken` record ends the current streak, full stop. */
export const computeContraceptionBestStreak = (
  recordsByDate: Record<string, ContraceptionIntakeRecord>,
  startKey: string,
  endKey: string,
): number => {
  const start = parseLocalDate(startKey);
  const end = parseLocalDate(endKey);
  if (!start || !end || start.getTime() > end.getTime()) {
    return 0;
  }

  let best = 0;
  let current = 0;
  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = nextDay(cursor)) {
    if (recordsByDate[formatDateKey(cursor)]?.status === 'taken') {
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
