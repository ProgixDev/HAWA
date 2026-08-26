import type {DailyJournalEntry} from '../types/journal';
import type {IrregularJournalEntry} from '../state/irregularJournalStore';

// Pure calculation layer for the SOPK / Cycles irréguliers Calendar
// (IrregularCalendarContent.tsx). Same convention as
// menopauseCalendarMath.ts: distinct-day counts only, scoped to exactly one
// calendar month (`month` is 0-indexed, like Date), never a rolling window.
// A day never recorded simply doesn't count toward any tile — nothing here
// is a medical score, a severity index, or an "improving/worsening" signal.
// A long cycle is never classified as "late" anywhere in this file (no
// prediction logic exists here at all).

export type IrregularMonthlySummary = {
  periodDays: number;
  acneDays: number;
  hairGrowthDays: number;
  painDays: number;
  fatigueDays: number;
  moodDays: number;
  weightDays: number;
  hasAnyDataThisMonth: boolean;
};

export type DayMarkerOverflow<T> = {visible: T[]; overflowCount: number};

/** Caps how many marker dots a single compact day cell actually renders — a
 * ~42px cell can't legibly fit up to 7 distinct icons (Règles + 6 SOPK
 * categories can all land on the same real day). Returns the markers to
 * render plus how many were left out (`0` when nothing was truncated) so
 * the caller can show a "+N" badge instead of silently dropping markers
 * with no visual trace. This is a rendering-capacity decision ONLY — it
 * never mutates or drops anything from the caller's own full list, which
 * the selected-day card keeps reading in full regardless of this cap. */
export function computeVisibleDayMarkers<T>(
  activeCategories: readonly T[],
  maxVisible: number,
): DayMarkerOverflow<T> {
  if (activeCategories.length <= maxVisible) {
    return {visible: [...activeCategories], overflowCount: 0};
  }
  return {
    visible: activeCategories.slice(0, maxVisible),
    overflowCount: activeCategories.length - maxVisible,
  };
}

function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const parsed = new Date(`${dateStr}T12:00:00`);
  return parsed.getFullYear() === year && parsed.getMonth() === month;
}

/** Real recorded period days this month — a day counts only when
 * `flow.intensity` was actually saved (src/screens/journal/MenstrualFlowScreen.tsx),
 * the same shared source every other objective's calendar already reads.
 * Never derived from a predicted cycle. */
export function countPeriodDaysInMonth(
  journalEntries: readonly DailyJournalEntry[],
  year: number,
  month: number,
): number {
  return journalEntries.filter(
    entry => Boolean(entry.flow?.intensity) && isSameMonth(entry.date, year, month),
  ).length;
}

/** Distinct-day counts for the SOPK Calendar's "Résumé de ce mois" card,
 * from the canonical irregularJournalStore.ts entries. `entriesByDate` holds
 * at most one entry per date key, so counting matching entries already
 * counts distinct days. */
export function computeIrregularMonthlySummary(
  entriesByDate: Record<string, IrregularJournalEntry>,
  journalEntries: readonly DailyJournalEntry[],
  year: number,
  month: number,
): IrregularMonthlySummary {
  const entriesThisMonth = Object.values(entriesByDate).filter(entry => isSameMonth(entry.date, year, month));
  const periodDays = countPeriodDaysInMonth(journalEntries, year, month);

  return {
    periodDays,
    acneDays: entriesThisMonth.filter(entry => Boolean(entry.acne)).length,
    hairGrowthDays: entriesThisMonth.filter(entry => Boolean(entry.hairGrowth)).length,
    painDays: entriesThisMonth.filter(entry => Boolean(entry.pain)).length,
    fatigueDays: entriesThisMonth.filter(entry => Boolean(entry.fatigue)).length,
    moodDays: entriesThisMonth.filter(entry => Boolean(entry.mood)).length,
    weightDays: entriesThisMonth.filter(entry => Boolean(entry.weight)).length,
    hasAnyDataThisMonth: periodDays > 0 || entriesThisMonth.length > 0,
  };
}
