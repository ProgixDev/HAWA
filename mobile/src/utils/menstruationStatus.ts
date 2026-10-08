import {
  computeCyclePredictionStatus,
  currentPeriodLength,
  effectiveRegularityFor,
  isMenstruatingWithPrediction,
  startOfDay,
} from './cycleMath';
import {
  getCycleObservationStartedAt,
  getHasConfirmedCycleDuration,
  getHasRecordedFirstPeriod,
  getRecordedPeriodHistory,
  type CyclePreferences,
} from '../state/onboardingPreferences';


/** "Is she menstruating right now?" for purity / prayer / period-end UI —
 * derived from the SAME regularity-aware prediction status the Cycle
 * Dashboard shows (computeCyclePredictionStatus), so an irregular / late /
 * still-observed cycle never turns a projected (wrapped) period into a real
 * one. Reads the recorded history from the cycle store on each call; callers
 * memoize on their cyclePreferences / period-end state. */
export function isCurrentlyMenstruating(
  now: Date,
  cyclePreferences: CyclePreferences,
  periodEndDateTime: Date | null,
): boolean {
  // No recorded period means no period to be in — for anyone: the internal
  // placeholder period (which can happen to cover today, e.g. on the 3rd of a
  // month) is not hers, and neither is a cycle projected from it.
  if (!getHasRecordedFirstPeriod()) {
    return false;
  }
  const recordedPeriods = getRecordedPeriodHistory();
  const periodStartDates = recordedPeriods.map(record => new Date(`${record.startDate}T12:00:00`));
  const status = computeCyclePredictionStatus(
    cyclePreferences,
    // A managed profile's declared-regular cycle whose lengths nobody provided is
    // observed, not projected from the placeholder 28 days (see effectiveRegularityFor).
    effectiveRegularityFor(cyclePreferences.regularity, getHasConfirmedCycleDuration()),
    periodStartDates,
    getCycleObservationStartedAt(),
    startOfDay(now),
  );
  // The current period's real (recorded / confirmed) length, not the habitual
  // periodDuration setting — see currentPeriodLength().
  const basics = {...cyclePreferences, periodDuration: currentPeriodLength(cyclePreferences, recordedPeriods)};
  return isMenstruatingWithPrediction(now, basics, status, periodEndDateTime);
}
