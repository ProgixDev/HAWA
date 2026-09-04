import type {MenopauseSymptom} from '../state/menopausePreferences';
import type {
  MenopauseEnergyLevel,
  MenopauseJournalEntry,
  MenopauseLabResult,
} from '../state/menopauseJournalStore';
import type {MoodLevel} from '../types/journal';
import {formatMonthLabel, groupEntriesByMonth} from './cycleStatisticsMath';

// Pure calculation layer for Menopause's Premium longitudinal statistics
// (MenopauseStatisticsScreen.tsx). Reads exclusively from real
// MenopauseJournalEntry/MenopauseLabResult values (menopauseJournalStore.ts)
// — nothing here invents a tracked field, a severity score, or a medical
// interpretation. Returns raw stored enum values (e.g. MenopauseEnergyLevel,
// MoodLevel), never a pre-formatted French label — the screen owns display
// text via menopauseJournalConfig.ts, matching cycleStatisticsMath.ts's own
// convention of returning FlowIntensity rather than a label. Reuses
// cycleStatisticsMath.ts's generic groupEntriesByMonth/formatMonthLabel
// instead of a Menopause-specific duplicate.

export type SymptomMonthlyTrendPoint = {monthKey: string; monthLabel: string; count: number};

/** Real per-calendar-month day-count for ONE tracked symptom — months with
 * zero recorded days for it are still included (never silently dropped),
 * so a caller can distinguish "not tracked this month" from "no data at
 * all" if needed. */
export function calculateSymptomMonthlyTrend(
  entries: readonly MenopauseJournalEntry[],
  symptomId: MenopauseSymptom,
): SymptomMonthlyTrendPoint[] {
  const byMonth = groupEntriesByMonth(entries);
  return Array.from(byMonth.keys())
    .sort()
    .map(monthKey => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      count: (byMonth.get(monthKey) ?? []).filter(entry => entry.symptoms?.includes(symptomId)).length,
    }));
}

export type SleepMonthlyTrendPoint = {monthKey: string; monthLabel: string; averageHours: number; count: number};

/** Real average recorded sleep duration per month — months with no
 * recorded duration are omitted entirely, never shown as a fabricated 0h. */
export function calculateSleepMonthlyTrend(entries: readonly MenopauseJournalEntry[]): SleepMonthlyTrendPoint[] {
  const byMonth = groupEntriesByMonth(entries);
  return Array.from(byMonth.keys())
    .sort()
    .flatMap(monthKey => {
      const monthEntries = (byMonth.get(monthKey) ?? []).filter(entry => entry.sleepDurationHours !== undefined);
      if (monthEntries.length === 0) {return [];}
      const averageHours =
        monthEntries.reduce((sum, entry) => sum + (entry.sleepDurationHours ?? 0), 0) / monthEntries.length;
      return [{monthKey, monthLabel: formatMonthLabel(monthKey), averageHours, count: monthEntries.length}];
    });
}

/** Energy is real, stored as low/medium/high (menopauseJournalStore.ts) — no
 * numeric score exists in the data. Used ONLY to pick a month's bar height
 * for visualization; `dominantLevel` (the month's real most-recorded level)
 * is what a caller should actually display as text. */
export const ENERGY_VISUAL_SCORE: Record<MenopauseEnergyLevel, number> = {low: 1, medium: 2, high: 3};

export type EnergyMonthlyTrendPoint = {
  monthKey: string;
  monthLabel: string;
  averageScore: number;
  dominantLevel: MenopauseEnergyLevel;
  count: number;
};

export function calculateEnergyMonthlyTrend(entries: readonly MenopauseJournalEntry[]): EnergyMonthlyTrendPoint[] {
  const byMonth = groupEntriesByMonth(entries);
  return Array.from(byMonth.keys())
    .sort()
    .flatMap(monthKey => {
      const monthEntries = (byMonth.get(monthKey) ?? []).filter(
        (entry): entry is MenopauseJournalEntry & {energyLevel: MenopauseEnergyLevel} => Boolean(entry.energyLevel),
      );
      if (monthEntries.length === 0) {return [];}
      const counts: Record<MenopauseEnergyLevel, number> = {
        low: monthEntries.filter(entry => entry.energyLevel === 'low').length,
        medium: monthEntries.filter(entry => entry.energyLevel === 'medium').length,
        high: monthEntries.filter(entry => entry.energyLevel === 'high').length,
      };
      const dominantLevel = (Object.keys(counts) as MenopauseEnergyLevel[]).sort(
        (a, b) => counts[b] - counts[a],
      )[0];
      const averageScore =
        monthEntries.reduce((sum, entry) => sum + ENERGY_VISUAL_SCORE[entry.energyLevel], 0) / monthEntries.length;
      return [{monthKey, monthLabel: formatMonthLabel(monthKey), averageScore, dominantLevel, count: monthEntries.length}];
    });
}

export type MoodMonthlyTrendPoint = {
  monthKey: string;
  monthLabel: string;
  dominantMood: MoodLevel;
  dominantCount: number;
  totalCount: number;
};

/** Mood has no natural single-axis ordering (9 real values, types/journal.ts)
 * — never fabricated into a numeric score. Each month's real dominant
 * (most-recorded) mood is returned as-is; a caller renders it as text, a
 * genuine chronological evolution without inventing a scale the data
 * doesn't have. */
export function calculateMoodMonthlyTrend(entries: readonly MenopauseJournalEntry[]): MoodMonthlyTrendPoint[] {
  const byMonth = groupEntriesByMonth(entries);
  return Array.from(byMonth.keys())
    .sort()
    .flatMap(monthKey => {
      const monthEntries = (byMonth.get(monthKey) ?? []).filter(
        (entry): entry is MenopauseJournalEntry & {mood: MoodLevel} => Boolean(entry.mood),
      );
      if (monthEntries.length === 0) {return [];}
      const counts = new Map<MoodLevel, number>();
      monthEntries.forEach(entry => counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1));
      const [dominantMood, dominantCount] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
      return [{monthKey, monthLabel: formatMonthLabel(monthKey), dominantMood, dominantCount, totalCount: monthEntries.length}];
    });
}

/** Real lab results filtered to the selected period — previously
 * `getMenopauseLabResults()` returned the full all-time history regardless
 * of the 1/3/6/12-month selector; this is the fix. Chronological order. */
export function filterLabResultsForPeriod(
  results: readonly MenopauseLabResult[],
  cutoff: Date,
): MenopauseLabResult[] {
  return results
    .filter(result => new Date(`${result.date}T12:00:00`) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type LabChartPoint = {key: string; label: string; value: number; maxValue: number};

const LAB_CHART_DISPLAY_CAP = 20;

/** Real value/date points scaled for bar height — never bucketed by month
 * (a lab draw is a single real event; averaging distinct draws would
 * misrepresent the actual recorded values), capped for chart readability
 * like every other objective's own trend caps. Returns `[]` for 0 or 1
 * result — a single point is not a trend; the caller shows it as an
 * informational value instead, never a fabricated line. */
export function buildLabChartPoints(results: readonly MenopauseLabResult[]): LabChartPoint[] {
  if (results.length < 2) {return [];}
  const values = results.map(result => result.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.001);
  return results.slice(-LAB_CHART_DISPLAY_CAP).map(result => ({
    key: result.id,
    label: result.date,
    value: 1 + ((result.value - min) / span) * 9,
    maxValue: 10,
  }));
}
