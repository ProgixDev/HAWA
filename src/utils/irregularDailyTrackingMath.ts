import {diffDays, startOfDay} from './cycleMath';
import type {IrregularJournalCategory, IrregularJournalEntry} from '../state/irregularJournalStore';
import type {ConfirmedPeriodOccurrence} from '../state/confirmedPeriodHistoryStore';

// Pure calculation layer for the SOPK ("Cycles irréguliers") Dashboard.
// Deliberately free of React/native imports so it stays trivially
// unit-testable, and deliberately independent of cycleMath.ts's
// computeCyclePredictionStatus() — that function's 'window' mode carries an
// `isLate` flag (used elsewhere for the generic Cycle objective's "Règles en
// retard" wording), and the SOPK product rule is that a long cycle must
// NEVER be automatically classified as a delay. computeIrregularCycleDay()
// below only ever returns a plain elapsed-day count — there is no branch,
// field, or code path here that could produce a "late" classification.

/** Real elapsed days since the last confirmed period start, 1-indexed (day
 * 1 = the day it started) — or `null` when no real period has been
 * confirmed yet. Never a fabricated 28-day assumption. A long real gap
 * simply keeps counting (e.g. day 45) — this function has no concept of
 * "expected" cycle length and therefore can never flag anything as late. */
export function computeIrregularCycleDay(lastPeriodStart: Date | null, today: Date): number | null {
  if (!lastPeriodStart) {return null;}
  return diffDays(startOfDay(today), startOfDay(lastPeriodStart)) + 1;
}

/** The most recently confirmed real period (by `periodStart`) from
 * confirmedPeriodHistoryStore.ts — the SAME canonical history qadaa/exports
 * already derive from, never the predictive cyclePreferences configuration.
 * Returns `null` when nothing has ever been confirmed yet — never a
 * fabricated "first period". Used for SOPK's Profile summary ("Dernières
 * règles"/"Durée des règles"), which only ever describes what was actually
 * recorded, never a prediction or an average across cycles (SOPK cycles can
 * vary too much for a single "typical duration" to be meaningful). */
export function findLatestConfirmedPeriod(
  history: readonly ConfirmedPeriodOccurrence[],
): ConfirmedPeriodOccurrence | null {
  if (!history.length) {return null;}
  return history.reduce((mostRecent, occurrence) =>
    occurrence.periodStart > mostRecent.periodStart ? occurrence : mostRecent,
  );
}

/** Real recorded duration (in days, inclusive of both the start and end
 * day) of one confirmed period occurrence — or `null` if the stored dates
 * are inconsistent (end before start), never a fabricated "0 jour". */
export function computeConfirmedPeriodDurationDays(occurrence: ConfirmedPeriodOccurrence): number | null {
  const start = new Date(`${occurrence.periodStart}T12:00:00`);
  const end = new Date(occurrence.periodEndDateTime);
  const days = diffDays(end, start) + 1;
  return days > 0 ? days : null;
}

export type IrregularDailyProgress = {completed: number; total: number};

/** "X / N complété" — N is always the real number of configured daily
 * categories (Règles + every entry in `categories`), never hardcoded.
 * `periodDoneToday` reflects a real recorded flow entry for today (from the
 * shared dailyJournalStore), and each other category counts as done only
 * when the canonical irregularJournalStore genuinely holds a value for it
 * today — a missing/undefined field is never counted as complete. */
export function computeIrregularDailyProgress(
  periodDoneToday: boolean,
  todayEntry: IrregularJournalEntry | undefined,
  categories: readonly IrregularJournalCategory[],
): IrregularDailyProgress {
  const completed =
    (periodDoneToday ? 1 : 0) + categories.filter(key => Boolean(todayEntry?.[key])).length;
  return {completed, total: categories.length + 1};
}

/** Parses a free-form weight string like "68,5 kg" into a number + the
 * exact unit text the user typed — returns `null` if it doesn't start with a
 * recognizable number, never a fabricated guess. */
function parseWeightValue(raw: string): {value: number; unit: string} | null {
  const match = raw.trim().match(/^(-?\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) {return null;}
  const value = Number(match[1].replace(',', '.'));
  if (Number.isNaN(value)) {return null;}
  return {value, unit: match[2].trim()};
}

/** "Variation depuis la dernière mesure" — a neutral, purely descriptive
 * signed difference between today's real recorded weight and the most
 * recent prior real recorded weight, formatted with the SAME unit text the
 * user actually typed (never converted or assumed). Returns `null` — never
 * a fabricated variation — when either value can't be parsed or the two
 * units differ (comparing "68 kg" to "150 lb" would be meaningless).
 * Deliberately returns a plain signed string, never a
 * good/bad/healthy/unhealthy judgment. */
export function computeWeightVariation(previousValue: string | undefined, currentValue: string): string | null {
  if (!previousValue) {return null;}
  const previous = parseWeightValue(previousValue);
  const current = parseWeightValue(currentValue);
  if (!previous || !current) {return null;}
  if (previous.unit.toLowerCase() !== current.unit.toLowerCase()) {return null;}

  const delta = Math.round((current.value - previous.value) * 10) / 10;
  const unitSuffix = current.unit ? ` ${current.unit}` : '';
  if (delta === 0) {return `0${unitSuffix}`;}

  const sign = delta > 0 ? '+' : '−';
  const formatted = Math.abs(delta).toString().replace('.', ',');
  return `${sign}${formatted}${unitSuffix}`;
}

/** Orders daily-tracking category keys so the ones the user actually chose
 * to prioritize during SOPK onboarding (irregularPreferences.trackedItems)
 * appear first — a presentation-only reordering. Every category stays
 * present regardless of selection (spec requirement: disabling a category's
 * priority must never hide it or block tracking it), and a category never
 * appears twice. */
export function prioritizeIrregularCategories<T extends string>(
  allCategories: readonly T[],
  trackedItems: readonly string[],
): T[] {
  const tracked = new Set(trackedItems);
  const prioritized = allCategories.filter(key => tracked.has(key));
  const rest = allCategories.filter(key => !tracked.has(key));
  return [...prioritized, ...rest];
}
