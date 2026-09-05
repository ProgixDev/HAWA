import type {IrregularJournalCategory, IrregularJournalEntry} from '../state/irregularJournalStore';
import {groupEntriesByMonth, formatMonthLabel} from './cycleStatisticsMath';

// Pure calculation layer for the SOPK / Cycles irréguliers Statistics screen
// (IrregularStatisticsScreen.tsx). Reads exclusively from
// irregularJournalStore.ts's IrregularJournalEntry — the canonical SOPK daily
// tracking data model (acne/hairGrowth/weight/pain/mood/fatigue, each a
// free-form or 5-point-scale STRING, never a structured numeric value). This
// deliberately replaces an earlier version of this file that read the
// generic dailyJournalStore.ts (symptoms.names / weight.value), which never
// matched what the real SOPK Dashboard actually saves.
//
// Same "missing is never zero" convention as cycleStatisticsMath.ts: a day
// never recorded for a category is simply excluded, never counted against
// it. Nothing here computes a severity score, a hormonal index, or an
// "improving/worsening" judgment — only real recorded counts/distributions.

/** Categories that represent a symptom/observation for the purposes of
 * "day with at least one symptom" counting — deliberately excludes `mood`
 * (an emotional state, not a physical symptom) and `weight` (a measurement,
 * tracked separately). */
const SYMPTOM_CATEGORIES: IrregularJournalCategory[] = ['acne', 'hairGrowth', 'pain', 'fatigue'];

export type CategoryDistributionEntry = {value: string; days: number};

/** Real recorded distribution of values for one category (e.g. how many
 * days "Légère" vs "Modérée" acne was reported) — only real canonical
 * values already saved by IrregularJournalEntryScreen.tsx, never an invented
 * severity bucket. Sorted most-frequent first (ties broken alphabetically
 * for a stable order). */
export function calculateCategoryDistribution(
  entries: readonly IrregularJournalEntry[],
  category: IrregularJournalCategory,
): CategoryDistributionEntry[] {
  const counts = new Map<string, number>();
  entries.forEach(entry => {
    const value = entry[category];
    if (!value) {return;}
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([value, days]) => ({value, days}))
    .sort((a, b) => b.days - a.days || a.value.localeCompare(b.value, 'fr'));
}

/** Distinct days a category was actually recorded — never a fabricated
 * total, and a day with no entry never counts as "no symptom" (it's simply
 * absent from the count, not evidence of the category's absence). */
export function countCategoryDays(
  entries: readonly IrregularJournalEntry[],
  category: IrregularJournalCategory,
): number {
  return entries.filter(entry => Boolean(entry[category])).length;
}

/** Days where at least one real physical symptom (acné, pilosité, douleurs,
 * fatigue) was recorded — mood and weight excluded (see SYMPTOM_CATEGORIES).
 * A day with zero entries anywhere is simply absent, never counted as
 * symptom-free. */
export function countDaysWithAnySymptom(entries: readonly IrregularJournalEntry[]): number {
  return entries.filter(entry => SYMPTOM_CATEGORIES.some(category => Boolean(entry[category]))).length;
}

export type MonthlyCategoryTrendEntry = {
  monthKey: string;
  monthLabel: string;
  distribution: CategoryDistributionEntry[];
};

/** Premium longitudinal view — real recorded value distribution for one
 * category, per real calendar month. Months with nothing recorded for this
 * category are omitted (never a fabricated empty/zero month). */
export function calculateMonthlyCategoryTrend(
  entries: readonly IrregularJournalEntry[],
  category: IrregularJournalCategory,
): MonthlyCategoryTrendEntry[] {
  const byMonth = groupEntriesByMonth(entries);
  return Array.from(byMonth.keys())
    .sort()
    .map(monthKey => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      distribution: calculateCategoryDistribution(byMonth.get(monthKey) ?? [], category),
    }))
    .filter(month => month.distribution.length > 0);
}

export type SymptomFrequencyEntry = {name: string; days: number};

/** Real recorded frequency of each "symptôme associé" multi-selected on the
 * combined "Fatigue & symptômes" screen (IrregularJournalEntry.symptoms) —
 * a day where nothing was multi-selected (or the category wasn't saved at
 * all) never counts toward any symptom. Sorted most-frequent first (ties
 * broken alphabetically). Distinct from countCategoryDays/
 * calculateCategoryDistribution above, which only look at the single-value
 * scale fields (acne/hairGrowth/pain/mood/fatigue), never this array field. */
export function calculateAssociatedSymptomFrequency(
  entries: readonly IrregularJournalEntry[],
): SymptomFrequencyEntry[] {
  const counts = new Map<string, number>();
  entries.forEach(entry => {
    entry.symptoms?.forEach(name => {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([name, days]) => ({name, days}))
    .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name, 'fr'));
}

export type IrregularWeightEntry = {date: string; value: string};

/** Real recorded weight entries, exactly as saved (a free-form string, e.g.
 * "68,5 kg") — never parsed into a number, never converted, never used to
 * compute a BMI or any health classification. Sorted chronologically. */
export function calculateIrregularWeightEntries(
  entries: readonly IrregularJournalEntry[],
): IrregularWeightEntry[] {
  return entries
    .filter((entry): entry is IrregularJournalEntry & {weight: string} => Boolean(entry.weight))
    .map(entry => ({date: entry.date, value: entry.weight}))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export type MonthlyIrregularWeightTrendEntry = {
  monthKey: string;
  monthLabel: string;
  entries: IrregularWeightEntry[];
};

/** Premium "Poids" longitudinal view — real recorded weight entries per real
 * calendar month. Months with no recorded weight are omitted. */
export function calculateMonthlyIrregularWeightTrend(
  entries: readonly IrregularJournalEntry[],
): MonthlyIrregularWeightTrendEntry[] {
  const byMonth = groupEntriesByMonth(entries);
  return Array.from(byMonth.keys())
    .sort()
    .map(monthKey => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      entries: calculateIrregularWeightEntries(byMonth.get(monthKey) ?? []),
    }))
    .filter(month => month.entries.length > 0);
}
