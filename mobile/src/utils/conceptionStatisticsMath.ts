import type {CervicalMucusType, DailyJournalEntry} from '../types/journal';
import {formatMonthLabel, groupEntriesByMonth} from './cycleStatisticsMath';
import {currentPeriodLength, cycleDayFor, diffDays, phaseFor, type ComputedCyclePhase, type CycleBasics, type CyclePredictionStatus, type RecordedPeriod} from './cycleMath';

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

// ---------------------------------------------------------------------------
// BASAL TEMPERATURE — one display unit for the whole statistics screen
// ---------------------------------------------------------------------------
// Each journal temperature is stored WITH its own unit (JournalTemperatureScreen
// lets the user pick °C or °F per entry; there is no app-wide unit
// preference), so a history can legitimately mix both. Averaging/min/max or
// scaling a chart over raw mixed values (36.6 next to 97.9) is meaningless.
// Statistics therefore pick ONE unit — the unit of the user's most recent
// reading — and convert every value to it AT DISPLAY TIME ONLY. Stored
// entries are never rewritten.

export type TemperatureUnit = 'C' | 'F';

type EntryWithTemperature = DailyJournalEntry & {temperature: NonNullable<DailyJournalEntry['temperature']>};

export function convertTemperature(value: number, from: TemperatureUnit, to: TemperatureUnit): number {
  if (from === to) {
    return value;
  }
  return from === 'C' ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9;
}

/** "36.6 °C" / "97.9 °F" — the ONLY formatter every temperature shown by
 * the Conceive statistics goes through, so the unit is always explicit. */
export function formatTemperature(value: number, unit: TemperatureUnit): string {
  return `${value.toFixed(1)} °${unit}`;
}

export type TemperatureStats = {
  unit: TemperatureUnit;
  /** True when at least one reading was recorded in the OTHER unit and had
   * to be converted for display. */
  hasConvertedReadings: boolean;
  trend: Array<{date: string; value: number}>;
  latest: {date: string; value: number} | null;
  average: number | null;
  min: number | null;
  max: number | null;
};

/** Real, chronological (caller-sorted, period-filtered) temperature entries
 * → display-unit statistics. `trendCap` only limits the chart series; the
 * average/min/max/latest always cover every entry passed in. Null unit
 * fallback ('C') only applies when there are no readings at all. */
export function buildTemperatureStats(entries: readonly EntryWithTemperature[], trendCap: number): TemperatureStats {
  if (entries.length === 0) {
    return {unit: 'C', hasConvertedReadings: false, trend: [], latest: null, average: null, min: null, max: null};
  }
  const unit = entries[entries.length - 1].temperature.unit;
  const converted = entries.map(entry => ({
    date: entry.date,
    value: convertTemperature(entry.temperature.value, entry.temperature.unit, unit),
  }));
  const values = converted.map(item => item.value);
  return {
    unit,
    hasConvertedReadings: entries.some(entry => entry.temperature.unit !== unit),
    trend: converted.slice(-trendCap),
    latest: converted[converted.length - 1],
    average: values.reduce((total, value) => total + value, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/** M18 - the ONE cycle length every Conceive fertility surface (Dashboard
 * timeline, Calendar painted phases, Statistics fertile window, and the
 * fertile-window/ovulation/LH reminders) derives its fertile window from.
 * In 'exact' mode that is computeCyclePredictionStatus's averageCycleLength
 * (the declared length for regular users, the OBSERVED average for a
 * regular-looking "Je ne sais pas" pattern); in 'window'/'observing' mode it
 * stays the declared cycleDuration. Same rule Cycle's Calendar/Dashboard use
 * for their projection basics - it only removes the case where some Conceive
 * surfaces used the observed average while others kept the declared length.
 *
 * PRODUCT DECISION REQUIRED (not decided here): for an irregular ('window')
 * cycle Conceive still shows ONE precise fertile window/ovulation day
 * (Cycle suppresses it via estimateFertilityDates -> null). Should Conceive
 * intentionally retain a precise conception-oriented fertile estimate for
 * irregular cycles, or use Cycle's non-precise/window behaviour? */
export function resolveConceptionCycleBasics<T extends CycleBasics>(declared: T, status: CyclePredictionStatus): T {
  return status.mode === 'exact' ? {...declared, cycleDuration: status.averageCycleLength} : declared;
}

/** Current cycle day + phase for a Conceive user - the ONE derivation shared
 * by ConceiveDashboard's hero and the "Evolution du cycle" screen, so the two
 * can never disagree. 'exact' mode wraps by the effective (observed/declared)
 * cycle length; otherwise the raw day since the last recorded period start is
 * used (a late cycle keeps counting instead of wrapping back to a false
 * "day 3"), with the CURRENT period's real recorded length deciding whether
 * she is still menstruating. */
export function resolveConceptionCurrentPhase(
  declared: CycleBasics,
  status: CyclePredictionStatus,
  recordedPeriods: readonly RecordedPeriod[],
  today: Date,
): {cycleDay: number; phase: ComputedCyclePhase} {
  const phaseBasics = {...declared, periodDuration: currentPeriodLength(declared, recordedPeriods)};
  if (status.mode === 'exact') {
    return {
      cycleDay: cycleDayFor(today, {...declared, cycleDuration: status.averageCycleLength}),
      phase: phaseFor(today, {...phaseBasics, cycleDuration: status.averageCycleLength}),
    };
  }
  const rawCycleDay = diffDays(today, declared.lastPeriodStart) + 1;
  if (rawCycleDay <= phaseBasics.periodDuration) {
    return {cycleDay: rawCycleDay, phase: 'menstruation'};
  }
  const wrapped = phaseFor(today, phaseBasics);
  return {cycleDay: rawCycleDay, phase: wrapped === 'menstruation' ? 'follicular' : wrapped};
}
