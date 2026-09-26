import {
  computeCyclePredictionStatus,
  currentPeriodLength,
  isMenstruatingWithPrediction,
  startOfDay,
} from './cycleMath';
import {
  getCycleObservationStartedAt,
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
  const recordedPeriods = getRecordedPeriodHistory();
  const periodStartDates = recordedPeriods.map(record => new Date(`${record.startDate}T12:00:00`));
  const status = computeCyclePredictionStatus(
    cyclePreferences,
    cyclePreferences.regularity,
    periodStartDates,
    getCycleObservationStartedAt(),
    startOfDay(now),
  );
  // The current period's real (recorded / confirmed) length, not the habitual
  // periodDuration setting — see currentPeriodLength().
  const basics = {...cyclePreferences, periodDuration: currentPeriodLength(cyclePreferences, recordedPeriods)};
  return isMenstruatingWithPrediction(now, basics, status, periodEndDateTime);
}
