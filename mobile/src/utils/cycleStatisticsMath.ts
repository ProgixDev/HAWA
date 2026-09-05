import type {DailyJournalEntry, FlowIntensity} from '../types/journal';
import type {ConfirmedPeriodOccurrence} from '../state/confirmedPeriodHistoryStore';
import {capitalize} from './cycleMath';

// Pure calculation layer for Cycle Tracking's Statistics screen
// (StatisticsScreen.tsx). Deliberately free of React/native imports so it
// stays trivially unit-testable. Every function here is a plain
// transformation of REAL data already read from the canonical stores
// (dailyJournalStore.ts / confirmedPeriodHistoryStore.ts) — nothing here
// invents, mocks, or defaults a value. "Missing" always stays missing
// (never coerced to zero); "not enough data" is a distinct, explicit result
// (`null` / an empty array), never a fabricated placeholder statistic.

export type StatisticsPeriod = '1' | '3' | '6' | '12';

export const STATISTICS_PERIODS: StatisticsPeriod[] = ['1', '3', '6', '12'];

/** Only '1 mois' is Free — matches the cahier des charges' "Premium: advanced
 * statistics" positioning and the paywall's own "Analyse ton évolution sur
 * 3, 6 et 12 mois" benefit copy. */
export function isPeriodFree(period: StatisticsPeriod): boolean {
  return period === '1';
}

export function monthsForPeriod(period: StatisticsPeriod): number {
  return Number(period);
}

/** How many of the selected period's months actually fall on/after the
 * objective's own tracking-start anchor (e.g. a pregnancy's dating anchor, a
 * delivery date, a loss date, a method start date) — used so a 12-month
 * Premium view never implies 12 months of history exist when the real
 * anchor is more recent. Pass `anchorDate: null` when the objective has no
 * such anchor (coverage is then simply the full requested window). */
export function coverageMonthsForAnchor(period: StatisticsPeriod, anchorDate: Date | null, now: Date): number {
  const requested = monthsForPeriod(period);
  if (!anchorDate) {return requested;}
  const monthsSinceAnchor =
    (now.getFullYear() - anchorDate.getFullYear()) * 12 + (now.getMonth() - anchorDate.getMonth()) + 1;
  return Math.min(requested, Math.max(0, monthsSinceAnchor));
}

/** "Données disponibles sur 7 mois" — only returned when the real coverage
 * is narrower than the selected period, so a screen never implies more
 * history exists than it actually does. Returns null when coverage already
 * matches (or exceeds) what was requested — nothing extra to say. */
export function describeMonthsCoverage(period: StatisticsPeriod, coverageMonths: number): string | null {
  const requested = monthsForPeriod(period);
  if (coverageMonths <= 0 || coverageMonths >= requested) {return null;}
  return `Données disponibles sur ${coverageMonths} mois`;
}

const DAY_MS = 86_400_000;

/** The real lookback boundary for `period`, anchored on `now` (always an
 * explicit parameter — never `new Date()` internally — so every function in
 * this file stays deterministic and testable). */
export function cutoffDateForPeriod(period: StatisticsPeriod, now: Date): Date {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - monthsForPeriod(period));
  return cutoff;
}

/** Keeps only the real entries whose date falls inside [cutoff, now] for the
 * selected period — never entries just because they exist, and never
 * invents an entry for a day nothing was recorded. Generic over any
 * `{date: string}`-shaped record (not just DailyJournalEntry) so other
 * objectives' own per-day entry types — e.g. IrregularJournalEntry — can
 * reuse this exact filtering logic instead of duplicating it; existing
 * DailyJournalEntry[] callers are unaffected (T is inferred as
 * DailyJournalEntry there, identical behavior). */
export function filterEntriesForPeriod<T extends {date: string}>(
  entries: readonly T[],
  period: StatisticsPeriod,
  now: Date,
): T[] {
  const cutoff = cutoffDateForPeriod(period, now);
  return entries.filter(entry => {
    const date = new Date(`${entry.date}T12:00:00`);
    return date.getTime() >= cutoff.getTime() && date.getTime() <= now.getTime();
  });
}

/** Real confirmed period-start dates (confirmedPeriodHistoryStore.ts — the
 * SAME historical source qadaa derives from, never the predictive
 * cyclePreferences.cycleDuration configuration value) inside the selected
 * period, sorted chronologically. */
export function filterPeriodStartsForPeriod(
  history: readonly ConfirmedPeriodOccurrence[],
  period: StatisticsPeriod,
  now: Date,
): Date[] {
  const cutoff = cutoffDateForPeriod(period, now);
  return history
    .map(occurrence => new Date(occurrence.periodStart))
    .filter(date => !Number.isNaN(date.getTime()) && date.getTime() >= cutoff.getTime() && date.getTime() <= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());
}

export type AverageCycleDuration = {averageDays: number; cyclesAnalyzed: number};

/** "Durée moyenne des cycles" — a cycle duration only exists as the gap
 * between two CONSECUTIVE confirmed period starts, so this needs at least 2
 * confirmed starts in the period to return anything. Returns `null` — never
 * a fabricated average, never the onboarding's manually-configured
 * `cycleDuration` preference — when there isn't enough real history yet. */
export function calculateAverageCycleDuration(periodStarts: readonly Date[]): AverageCycleDuration | null {
  if (periodStarts.length < 2) {return null;}
  const sorted = [...periodStarts].sort((a, b) => a.getTime() - b.getTime());
  const durations: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    const days = Math.round((sorted[index].getTime() - sorted[index - 1].getTime()) / DAY_MS);
    if (days > 0) {durations.push(days);}
  }
  if (!durations.length) {return null;}
  const averageDays = Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
  return {averageDays, cyclesAnalyzed: durations.length};
}

export type FlowDistributionEntry = {intensity: FlowIntensity; days: number};

const FLOW_ORDER: FlowIntensity[] = ['light', 'moderate', 'heavy', 'veryHeavy', 'none'];

/** "Évolution du flux" — counts only days with a real recorded `flow.intensity`
 * value; a day with no flow entry is simply absent, never counted as
 * `'none'`. Never a medical judgment ("normal"/"abnormal") — purely a count
 * of what was recorded. */
export function calculateFlowDistribution(entries: readonly DailyJournalEntry[]): FlowDistributionEntry[] {
  const counts = new Map<FlowIntensity, number>();
  entries.forEach(entry => {
    const intensity = entry.flow?.intensity;
    if (!intensity) {return;}
    counts.set(intensity, (counts.get(intensity) ?? 0) + 1);
  });
  return FLOW_ORDER.filter(intensity => counts.has(intensity)).map(intensity => ({
    intensity,
    days: counts.get(intensity) as number,
  }));
}

export type SymptomFrequencyEntry = {name: string; days: number};

/** "Fréquence des symptômes" — real occurrence counts from Daily Journal
 * `symptoms.names`. A day never recorded is simply excluded, not counted
 * against any symptom. Sorted most-frequent first (ties broken
 * alphabetically for a stable, predictable order). */
export function calculateSymptomFrequency(entries: readonly DailyJournalEntry[]): SymptomFrequencyEntry[] {
  const counts = new Map<string, number>();
  entries.forEach(entry => {
    entry.symptoms?.names?.forEach(name => {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([name, days]) => ({name, days}))
    .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name, 'fr'));
}

/** 'YYYY-MM' → "Août 2026", for the Premium longitudinal (month-by-month)
 * views below. Exported — this is generic calendar formatting with no
 * cycle-specific semantics, so other objectives' Statistics screens
 * (Conceive, SOPK/irregular, Menopause, ...) reuse it instead of
 * duplicating it, per CLAUDE.md's REUSE→EXTEND→CREATE rule. */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return capitalize(new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(new Date(year, month - 1, 1)));
}

/** Groups journal entries by real calendar month ('YYYY-MM'). Exported for
 * the same reason as formatMonthLabel above — generic grouping, no
 * cycle-specific semantics. */
// Generic over any `{date: string}`-shaped record for the same reason as
// filterEntriesForPeriod above — existing DailyJournalEntry[] callers are
// unaffected.
export function groupEntriesByMonth<T extends {date: string}>(entries: readonly T[]): Map<string, T[]> {
  const byMonth = new Map<string, T[]>();
  entries.forEach(entry => {
    const monthKey = entry.date.slice(0, 7);
    const bucket = byMonth.get(monthKey);
    if (bucket) {
      bucket.push(entry);
    } else {
      byMonth.set(monthKey, [entry]);
    }
  });
  return byMonth;
}

export type MonthlyFlowTrendEntry = {
  monthKey: string;
  monthLabel: string;
  daysWithFlow: number;
  distribution: FlowDistributionEntry[];
};

/** Premium "Évolution du flux" longitudinal view — real recorded flow days
 * per real calendar month, not the 1-month card repeated with a wider
 * filter. Months with zero recorded flow days are omitted (nothing to show,
 * never a fabricated zero bar). Chronological order. */
export function calculateMonthlyFlowTrend(entries: readonly DailyJournalEntry[]): MonthlyFlowTrendEntry[] {
  const byMonth = groupEntriesByMonth(entries);
  return Array.from(byMonth.keys())
    .sort()
    .map(monthKey => {
      const distribution = calculateFlowDistribution(byMonth.get(monthKey) as DailyJournalEntry[]);
      return {
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        daysWithFlow: distribution.reduce((sum, entry) => sum + entry.days, 0),
        distribution,
      };
    })
    .filter(month => month.daysWithFlow > 0);
}

export type MonthlySymptomTrendEntry = {
  monthKey: string;
  monthLabel: string;
  topSymptoms: SymptomFrequencyEntry[];
};

/** Premium "Évolution des symptômes" longitudinal view — the top 3 most
 * frequent symptoms per real calendar month. Months with no recorded
 * symptoms are omitted. */
export function calculateMonthlySymptomTrend(entries: readonly DailyJournalEntry[]): MonthlySymptomTrendEntry[] {
  const byMonth = groupEntriesByMonth(entries);
  return Array.from(byMonth.keys())
    .sort()
    .map(monthKey => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      topSymptoms: calculateSymptomFrequency(byMonth.get(monthKey) as DailyJournalEntry[]).slice(0, 3),
    }))
    .filter(month => month.topSymptoms.length > 0);
}

/** "Basé sur X jours renseignés" — real Daily Journal activity in the
 * selected period (each entry already only exists because something was
 * genuinely saved that day), used to convey how much data supports a
 * displayed statistic — never medical advice, purely a transparency count. */
export function countTrackedDays(entries: readonly DailyJournalEntry[]): number {
  return entries.length;
}
