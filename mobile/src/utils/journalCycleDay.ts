import type {CycleRegularity, ObjectiveId} from '../state/onboardingPreferences';
import {
  IRREGULAR_WINDOW_MAX_DAYS,
  computeCyclePredictionStatus,
  cycleDayFor,
  diffDays,
  type CycleBasics,
} from './cycleMath';

// THE one place the shared journal entry screens (Humeur, Sommeil, Activité,
// Notes personnelles, Vie intime, Flux, Rapports…) decide whether to show a
// "Jour N du cycle" and which N. They used to compute a raw
// `floor((now - lastPeriodStart) / 1 day) + 1` — unbounded (Jour 143 after a
// missed period, or on a Pregnancy/Postpartum/Menopause day where a
// menstrual cycle day means nothing).
//
// Semantics mirror the canonical Cycle Dashboard (CycleHomeScreen.tsx /
// ConceiveDashboard.tsx `currentCycleDay`) exactly — see the comment there:
//   - 'exact' prediction (declared-regular or observed regular-looking
//     pattern): the day wraps by the trusted average cycle length, so it is
//     always within 1..averageCycleLength.
//   - 'window' / 'observing': no single cycle length can be trusted to wrap
//     by, so the Dashboard shows the raw elapsed count. The Dashboard can do
//     that inside a screen that also explains the late/observation state; a
//     bare header on a journal screen cannot, so past the last day the
//     irregular window itself supports (IRREGULAR_WINDOW_MAX_DAYS, the same
//     constant computeCyclePredictionStatus uses to call a period "late")
//     the number is omitted rather than shown as an ever-growing count.
//
// Only Cycle ("Suivre mon cycle") and Conceive ("Essayer de concevoir") have
// a menstrual cycle day at all — every other objective's own dashboard
// (Pregnancy, Postpartum, Loss, Menopause, Contraception, SOPK) shows none
// — and only once real cycle data has been confirmed (never the onboarding
// placeholder defaults, see getHasConfirmedCycleData()).
const CYCLE_DAY_OBJECTIVES: readonly ObjectiveId[] = ['cycle', 'conceive'];

export type JournalCycleDayInput = {
  objective: ObjectiveId;
  hasConfirmedCycleData: boolean;
  basics: CycleBasics;
  regularity: CycleRegularity;
  /** Recorded period start dates only (getRecordedPeriodHistory()). */
  periodStartDates: readonly Date[];
  observationStartedAt: Date | null;
  today: Date;
};

/** The valid "Jour N du cycle" for `today`, or null when the header must not
 * mention a cycle day at all. */
export function journalCycleDayFor(input: JournalCycleDayInput): number | null {
  const {objective, hasConfirmedCycleData, basics, regularity, periodStartDates, observationStartedAt, today} = input;
  if (!CYCLE_DAY_OBJECTIVES.includes(objective) || !hasConfirmedCycleData) {
    return null;
  }

  const status = computeCyclePredictionStatus(basics, regularity, periodStartDates, observationStartedAt, today);
  if (status.mode === 'exact') {
    return cycleDayFor(today, {...basics, cycleDuration: status.averageCycleLength});
  }

  const rawCycleDay = diffDays(today, basics.lastPeriodStart) + 1;
  return rawCycleDay >= 1 && rawCycleDay <= IRREGULAR_WINDOW_MAX_DAYS ? rawCycleDay : null;
}
