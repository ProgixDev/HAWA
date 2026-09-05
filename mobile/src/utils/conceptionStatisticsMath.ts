import type {CervicalMucusType, DailyJournalEntry} from '../types/journal';
import {formatMonthLabel, groupEntriesByMonth} from './cycleStatisticsMath';

// Pure calculation layer for TTC ("Essayer de concevoir")'s Premium
// longitudinal LH/mucus views (ConceiveStatisticsScreen.tsx). Reads
// exclusively from real DailyJournalEntry.lhTest/.cervicalMucus fields
// (types/journal.ts) — nothing here invents a state the app doesn't
// actually store. Reuses cycleStatisticsMath.ts's generic
// groupEntriesByMonth/formatMonthLabel rather than re-implementing monthly
// bucketing, matching that file's own "reuse across objectives" intent.

export type LhMonthlyTrendEntry = {
  monthKey: string;
  monthLabel: string;
  positiveCount: number;
  totalCount: number;
};

type EntryWithLhTest = DailyJournalEntry & {lhTest: NonNullable<DailyJournalEntry['lhTest']>};

/** Real per-calendar-month LH test counts — never an interpolated line
 * between too-sparse points. LHTestResult only has 3 real stored states
 * (negative/positive/invalid) — no ordinal "low/high" scale exists in the
 * data, so this stays an honest event count rather than a fabricated
 * continuous score. Months with zero real tests are simply absent. */
export function calculateLhMonthlyTrend(entries: readonly EntryWithLhTest[]): LhMonthlyTrendEntry[] {
  const byMonth = groupEntriesByMonth(entries);
  return Array.from(byMonth.keys())
    .sort()
    .map(monthKey => {
      const monthEntries = byMonth.get(monthKey) as EntryWithLhTest[];
      return {
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        positiveCount: monthEntries.filter(entry => entry.lhTest.result === 'positive').length,
        totalCount: monthEntries.length,
      };
    });
}

/** Visualization-only ordering of the app's real, stored cervical-mucus
 * types along the standard fertility-awareness sequence — never shown to
 * the user as a number, never a lab value. Used purely to pick a bar's
 * height in "Évolution de la glaire cervicale"; the real recorded
 * label/date is what's actually displayed. */
export const MUCUS_FERTILITY_ORDER: Record<CervicalMucusType, number> = {
  dry: 0,
  sticky: 1,
  creamy: 2,
  watery: 3,
  eggWhite: 4,
};

export type MucusTimelinePoint = {
  date: string;
  type: CervicalMucusType;
  order: number;
};

type EntryWithMucus = DailyJournalEntry & {cervicalMucus: NonNullable<DailyJournalEntry['cervicalMucus']>};

/** Chronological, real-data timeline (never a fabricated line chart) of
 * every recorded cervical-mucus observation, capped at `cap` for chart
 * readability — mirrors the temperature trend's own display cap
 * convention. Entries must already be date-sorted and period-filtered by
 * the caller (same contract as every other *Trend helper in this codebase). */
export function buildMucusTimeline(entries: readonly EntryWithMucus[], cap: number): MucusTimelinePoint[] {
  return entries.slice(-cap).map(entry => ({
    date: entry.date,
    type: entry.cervicalMucus.type,
    order: MUCUS_FERTILITY_ORDER[entry.cervicalMucus.type],
  }));
}
