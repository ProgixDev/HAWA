import {
  computeCyclePredictionStatus,
  computeNextPeriod,
  cycleDayFor,
  formatShortDate,
  phaseFor,
  startOfDay,
  upcomingFertileWindow,
  type ComputedCyclePhase,
} from './cycleMath';
import {
  getActiveObjective,
  getCycleObservationStartedAt,
  getCyclePreferences,
  getHasConfirmedCycleData,
  getRecordedPeriodHistory,
} from '../state/onboardingPreferences';

// The REAL cycle information shown to the partner (PartnerHomeScreen / PartnerCalendarScreen):
// no fabricated numbers. It reuses the exact same underlying calculation as the owner's own
// journal headers (utils/journalCycleDay.ts's journalCycleDayFor) and Dashboard
// (computeCyclePredictionStatus, cycleMath.ts) — never a second implementation of cycle math.
//
// Deliberately conservative: a value is only returned once the prediction is 'exact' (a
// declared-regular or observed regular-looking cycle) — the same mode journalCycleDayFor
// requires before showing a bounded "Jour N". An irregular / late / still-observed cycle
// (`'window'` / `'observing'`) has no trustworthy single number to hand to someone who
// cannot see the owner's own history to interpret it, so everything here becomes `null`
// ("Information non disponible") instead of a guess.

export type PartnerCycleInfo = {
  /** "Jour N du cycle", bounded to 1..averageCycleLength. */
  cycleDay: number | null;
  /** The trusted average cycle length itself — needed alongside `cycleDay` by the SAME
   * shared cycle ring the owner's own dashboard uses (CycleProgressRing's `{currentDay,
   * cycleLength}` contract), so progress is computed identically in ONE place. */
  cycleLength: number | null;
  /** Real 0..1 cycle progress, using the same trusted average length as cycleDay. */
  cycleProgress: number | null;
  phase: ComputedCyclePhase | null;
  /** Short formatted date of the next predicted period start. */
  nextPeriod: string | null;
  nextPeriodDate: Date | null;
  /** Short formatted date range of the upcoming fertile window. */
  fertileWindow: string | null;
  /** The same range as raw dates, for a calendar to actually mark the days. */
  fertileWindowRange: {start: Date; end: Date} | null;
  /** Short formatted date of the estimated ovulation day (same single occurrence as
   * `fertileWindowRange`'s window — never a second calculation). */
  ovulation: string | null;
  ovulationDate: Date | null;
};

const CYCLE_OBJECTIVES = ['cycle', 'conceive'] as const;

export function computePartnerCycleInfo(today: Date = new Date()): PartnerCycleInfo {
  const unavailable: PartnerCycleInfo = {
    cycleDay: null,
    cycleLength: null,
    cycleProgress: null,
    phase: null,
    nextPeriod: null,
    nextPeriodDate: null,
    fertileWindow: null,
    fertileWindowRange: null,
    ovulation: null,
    ovulationDate: null,
  };

  if (!CYCLE_OBJECTIVES.includes(getActiveObjective() as (typeof CYCLE_OBJECTIVES)[number]) || !getHasConfirmedCycleData()) {
    return unavailable;
  }

  const cyclePreferences = getCyclePreferences();
  const recordedPeriods = getRecordedPeriodHistory();
  const periodStartDates = recordedPeriods.map(record => new Date(`${record.startDate}T12:00:00`));
  const day = startOfDay(today);

  const status = computeCyclePredictionStatus(
    cyclePreferences,
    cyclePreferences.regularity,
    periodStartDates,
    getCycleObservationStartedAt(),
    day,
  );
  if (status.mode !== 'exact') {return unavailable;}

  const basics = {...cyclePreferences, cycleDuration: status.averageCycleLength};
  const cycleDay = cycleDayFor(day, basics);
  const fertile = upcomingFertileWindow(basics, day);
  const nextPeriodDate = computeNextPeriod(basics, day);

  return {
    cycleDay,
    cycleLength: status.averageCycleLength,
    // Identical progress model to the owner's HeroCycleCard: current day divided by
    // the trusted cycle length. `status.mode === 'exact'` above guarantees that the
    // denominator is reliable; variable/observing cycles return null instead.
    cycleProgress: Math.min(Math.max(cycleDay / Math.max(status.averageCycleLength, 1), 0), 1),
    phase: phaseFor(day, basics),
    nextPeriod: formatShortDate(nextPeriodDate),
    nextPeriodDate,
    fertileWindow: `${formatShortDate(fertile.start)} – ${formatShortDate(fertile.end)}`,
    fertileWindowRange: {start: fertile.start, end: fertile.end},
    // Same single fertile-window occurrence `upcomingFertileWindow()` already computed
    // above — its own `.ovulation` date, never a second calculation.
    ovulation: formatShortDate(fertile.ovulation),
    ovulationDate: fertile.ovulation,
  };
}

const PHASE_LABELS: Record<ComputedCyclePhase, string> = {
  menstruation: 'Règles',
  follicular: 'Phase folliculaire',
  fertile: 'Phase fertile',
  ovulation: 'Ovulation',
  luteal: 'Phase lutéale',
};

export const formatPartnerCyclePhase = (phase: ComputedCyclePhase): string => PHASE_LABELS[phase];
