import {addDays, startOfDay} from './cycleMath';
import {hijriPartsFor, isRamadan} from './hijriCalendar';

export type ConfirmedOccurrenceDates = {
  periodStart: Date;
  periodEndDateTime: Date;
};

export type QadaaComputation = {
  remainingDays: number;
  /** Hijri year of the earliest counted Ramadan day, when remainingDays > 0. */
  hijriYear?: number;
};

/**
 * Counts confirmed fasting days missed to menstruation during Ramadan.
 *
 * Deliberately takes ONLY confirmed occurrences (see
 * confirmedPeriodHistoryStore.ts) — never `cyclePreferences` or a
 * standalone `periodEndDateTime`. Every day within a confirmed
 * occurrence's [periodStart, periodEndDateTime] window is, by definition,
 * an actual recorded menstruation day; no `isMenstruatingNow`/cycle-phase
 * projection is needed or used. This is the fix for the sync bug where a
 * later, unrelated `cyclePreferences` change (e.g. a new cycle's
 * `averagePeriodLength`) could reinterpret an already-confirmed historical
 * Ramadan occurrence — see the qadaa investigation for the full trace.
 *
 * `isRamadan`/`hijriPartsFor` are the existing Hijri calendar utilities,
 * reused as-is — no second Gregorian ↔ Hijri conversion.
 */
export function computeQadaaFromHistory(occurrences: ConfirmedOccurrenceDates[]): QadaaComputation {
  const countedDates = new Set<string>();
  let hijriYear: number | undefined;

  for (const occurrence of occurrences) {
    const start = startOfDay(occurrence.periodStart);
    const end = startOfDay(occurrence.periodEndDateTime);
    if (end.getTime() < start.getTime()) {continue;}

    let cursor = start;
    while (cursor.getTime() <= end.getTime()) {
      if (isRamadan(cursor)) {
        const key = cursor.toISOString();
        if (!countedDates.has(key)) {
          countedDates.add(key);
          if (hijriYear === undefined) {
            hijriYear = hijriPartsFor(cursor).year;
          }
        }
      }
      cursor = addDays(cursor, 1);
    }
  }

  return {remainingDays: countedDates.size, hijriYear};
}

/**
 * The gentle post-Ramadan reminder only makes sense once Ramadan itself is
 * over (during Ramadan she's either still purifying or already fasting)
 * and only when real confirmed days are still owed.
 */
export function shouldShowQadaaReminder(remainingDays: number, today: Date): boolean {
  return remainingDays > 0 && !isRamadan(today);
}
