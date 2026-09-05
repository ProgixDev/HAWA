import {formatMonthLabel} from './cycleStatisticsMath';

// Pure calculation layer for Postpartum's Statistics screen
// (PostpartumStatisticsScreen.tsx). `withinPeriod`/`groupByMonth`/
// `averageByMonth` are moved here verbatim from that screen (previously
// screen-local) so they're reusable and independently testable — behavior
// is unchanged, only the location. Postpartum-specific entry shapes aren't
// compatible with cycleStatisticsMath.ts's DailyJournalEntry-typed
// groupEntriesByMonth, so this file stays its own small helper rather than
// forcing an incompatible generic reuse; it does reuse that file's
// formatMonthLabel for the actual label text.

/** True when `date` (a 'YYYY-MM-DD' journal/lochia entry date) falls inside
 * the selected period's real lookback window. */
export function withinPeriod(date: string, cutoff: Date, now: Date): boolean {
  const time = new Date(`${date}T12:00:00`).getTime();
  return time >= cutoff.getTime() && time <= now.getTime();
}

/** Groups entries by their real calendar month (from `entry.date`,
 * `YYYY-MM-DD`) — a month with zero real entries is simply absent, never
 * fabricated. */
export function groupByMonth<T extends {date: string}>(entries: T[]): Array<{monthKey: string; entries: T[]}> {
  const buckets = new Map<string, T[]>();
  entries.forEach(entry => {
    const key = entry.date.slice(0, 7);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      buckets.set(key, [entry]);
    }
  });
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, monthEntries]) => ({monthKey, entries: monthEntries}));
}

/** Averages a numeric field per real calendar month — the Premium (3/6/12
 * mois) counterpart to the free tier's real 1-month window trend. Callers
 * pass an already period-filtered entry set, so a 12-month selection never
 * silently includes data from outside that window. */
export function averageByMonth<T extends {date: string}>(
  entries: T[],
  valueOf: (entry: T) => number,
): Array<{date: string; label: string; value: number}> {
  return groupByMonth(entries).map(group => ({
    date: group.monthKey,
    label: formatMonthLabel(group.monthKey),
    value: group.entries.reduce((sum, entry) => sum + valueOf(entry), 0) / group.entries.length,
  }));
}

/**
 * Resolves whether Postpartum's ONE real confirmed "retour des règles" date
 * (postpartumPreferences.ts's `firstPostpartumPeriodDate`, written only by
 * `recordFirstPostpartumPeriod()` — lochia bleeding is explicitly never
 * passed there) falls inside the currently selected 1/3/6/12-month window.
 *
 * Returns the date only when it was actually recorded AND falls within
 * [cutoff, now] — an older confirmed date is deliberately NOT surfaced
 * under a shorter selected period. Never infers a return from elapsed
 * postpartum days, lochia ending, average cycle length, breastfeeding
 * status, or a predicted period — only a real recorded date ever counts.
 */
export function resolvePostpartumCycleReturnEventInPeriod(
  firstPostpartumPeriodDate: string | null,
  cutoff: Date,
  now: Date,
): Date | null {
  if (!firstPostpartumPeriodDate) {
    return null;
  }
  const recordedDate = new Date(`${firstPostpartumPeriodDate}T12:00:00`);
  if (Number.isNaN(recordedDate.getTime())) {
    return null;
  }
  return withinPeriod(firstPostpartumPeriodDate, cutoff, now) ? recordedDate : null;
}
