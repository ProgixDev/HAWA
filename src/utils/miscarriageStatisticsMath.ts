import type {MiscarriageCycleReturnStatus} from '../state/miscarriagePreferences';

// Pure calculation layer for the "Après une fausse couche" Statistics
// screen's "Retour du cycle" evolution section (MiscarriageStatisticsScreen.tsx).
// miscarriagePreferences.ts stores exactly ONE confirmed return-of-cycle
// date (no history of multiple returns) — this file never infers a return
// from elapsed days, bleeding entries, or an average cycle duration, and
// never classifies a cycle as late. Only a real `status === 'yes'` plus a
// real recorded date ever counts as a confirmed event.

/**
 * Resolves whether the objective's ONE confirmed return-of-cycle date falls
 * inside the currently selected 1/3/6/12-month window.
 *
 * Returns the date only when ALL of the following are real:
 * - `status` is exactly 'yes' (never inferred from 'no'/'unknown'/null)
 * - a `firstReturnedPeriodDate` was actually recorded
 * - that date falls within [cutoff, now] — an older confirmed date is
 *   deliberately NOT surfaced under a shorter selected period, so it can
 *   never look like it belongs to a period it doesn't.
 *
 * Returns `null` in every other case (no event, unconfirmed, or a real
 * event outside the selected window) — never "late", never a prediction.
 */
export function resolveCycleReturnEventInPeriod(
  status: MiscarriageCycleReturnStatus | null,
  firstReturnedPeriodDate: Date | null,
  cutoff: Date,
  now: Date,
): Date | null {
  if (status !== 'yes' || !firstReturnedPeriodDate) {
    return null;
  }
  const withinSelectedPeriod =
    firstReturnedPeriodDate.getTime() >= cutoff.getTime() &&
    firstReturnedPeriodDate.getTime() <= now.getTime();
  return withinSelectedPeriod ? firstReturnedPeriodDate : null;
}
