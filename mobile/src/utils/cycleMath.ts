import type {CycleRegularity} from '../state/onboardingPreferences';
import {getHijriAdjustmentDays} from '../state/onboardingPreferences';

export type DayKind = 'period' | 'fertile' | 'ovulation' | 'normal';

export type CycleBasics = {
  lastPeriodStart: Date;
  cycleDuration: number;
  periodDuration: number;
};

export const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const DAY_MS = 86_400_000;

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const diffDays = (later: Date, earlier: Date): number =>
  Math.round(
    (startOfDay(later).getTime() - startOfDay(earlier).getTime()) / DAY_MS,
  );

export const positiveModulo = (value: number, divisor: number): number =>
  ((value % divisor) + divisor) % divisor;

export const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const capitalize = (value: string): string =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export const formatShortDate = (date: Date): string =>
  capitalize(
    new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long'}).format(date),
  );

export const formatFullDate = (date: Date): string =>
  capitalize(
    new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date),
  );

export const formatDateRange = (start: Date, end: Date): string => {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return sameMonth
    ? `${start.getDate()} – ${formatShortDate(end)}`
    : `${formatShortDate(start)} – ${formatShortDate(end)}`;
};

// Same adjustment application as hijriCalendar.ts's hijriPartsFor() — shift
// the Gregorian input before formatting, never the displayed string itself,
// so this stays mathematically identical to the classification path (isRamadan/
// isDhoulHijja) and can never show a Hijri date that disagrees with a Ramadan/
// Dhoul Hijja marker computed from the same underlying date.
const withHijriAdjustment = (date: Date): Date => addDays(date, getHijriAdjustmentDays());

export const formatHijriDate = (date: Date): string | undefined => {
  try {
    return capitalize(
      new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(withHijriAdjustment(date)),
    );
  } catch {
    return undefined;
  }
};

export const formatHijriDay = (date: Date): string | undefined => {
  try {
    return new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {day: 'numeric'}).format(withHijriAdjustment(date));
  } catch {
    return undefined;
  }
};

export const formatHijriMonthYear = (date: Date): string | undefined => {
  try {
    return capitalize(
      new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {month: 'long', year: 'numeric'}).format(withHijriAdjustment(date)),
    );
  } catch {
    return undefined;
  }
};

export const ovulationDayFor = (cycleDuration: number): number => cycleDuration - 13;

export const cycleDayFor = (date: Date, basics: CycleBasics): number =>
  positiveModulo(diffDays(date, basics.lastPeriodStart), basics.cycleDuration) + 1;

export const kindFor = (date: Date, basics: CycleBasics): DayKind => {
  const cycleDay = cycleDayFor(date, basics);
  const ovulationDay = ovulationDayFor(basics.cycleDuration);

  if (cycleDay <= basics.periodDuration) {
    return 'period';
  }

  if (cycleDay === ovulationDay) {
    return 'ovulation';
  }

  if (cycleDay >= ovulationDay - 5 && cycleDay <= ovulationDay + 1) {
    return 'fertile';
  }

  return 'normal';
};

export type ComputedCyclePhase = 'menstruation' | 'follicular' | 'fertile' | 'ovulation' | 'luteal';

export const phaseFor = (date: Date, basics: CycleBasics): ComputedCyclePhase => {
  const kind = kindFor(date, basics);
  if (kind === 'period') {return 'menstruation';}
  if (kind === 'ovulation') {return 'ovulation';}
  if (kind === 'fertile') {return 'fertile';}
  const cycleDay = cycleDayFor(date, basics);
  const ovulationDay = ovulationDayFor(basics.cycleDuration);
  return cycleDay < ovulationDay ? 'follicular' : 'luteal';
};

export const computeNextPeriod = (basics: CycleBasics, today: Date): Date => {
  const elapsed = diffDays(today, basics.lastPeriodStart);
  const cyclesElapsed = Math.max(0, Math.floor(elapsed / basics.cycleDuration));
  let next = addDays(basics.lastPeriodStart, (cyclesElapsed + 1) * basics.cycleDuration);
  if (next < today) {
    next = addDays(next, basics.cycleDuration);
  }
  return next;
};

export const periodStartForCycleContaining = (date: Date, basics: CycleBasics): Date => {
  const cycleDay = cycleDayFor(date, basics);
  return addDays(date, -(cycleDay - 1));
};

export const upcomingDateForCycleDay = (basics: CycleBasics, dayNumber: number, today: Date): Date => {
  let date = addDays(basics.lastPeriodStart, dayNumber - 1);
  while (date < today) {
    date = addDays(date, basics.cycleDuration);
  }
  return date;
};

// phaseFor only estimates menstruation from the cycle length/period-duration
// averages. If the user has explicitly confirmed her period ended (via
// MenstrualFlowScreen) at a datetime within the current period, that
// confirmation overrides the estimate so the rest of the app (purity status,
// spiritual guidance) reflects reality instead of the average-based guess.
export const isMenstruatingNow = (
  now: Date,
  basics: CycleBasics,
  periodEndDateTime: Date | null,
): boolean => {
  if (phaseFor(now, basics) !== 'menstruation') {return false;}
  if (
    periodEndDateTime &&
    periodEndDateTime.getTime() <= now.getTime() &&
    periodEndDateTime.getTime() >= basics.lastPeriodStart.getTime()
  ) {
    return false;
  }
  return true;
};

// ===========================================================================
// CYCLE REGULARITY — irregular prediction window + "unknown" observation mode
// ===========================================================================
// Centralized here (not duplicated across Dashboard/Calendar/Profile) per the
// HAWA product rule: a declared-irregular cycle gets a flexible 26–32 day
// window instead of one exact predicted date, and a declared-unknown cycle
// is observed for ~3 months against REAL confirmed period starts before
// HAWA adapts its prediction behavior. `regularity` itself is never
// auto-changed by this logic — only the derived prediction mode adapts.

/** Business rule: earliest/latest expected next period, relative to the
 * latest confirmed period start, for an irregular cycle. */
export const IRREGULAR_WINDOW_MIN_DAYS = 26;
export const IRREGULAR_WINDOW_MAX_DAYS = 32;

/** "Je ne sais pas" is observed for ~3 months (real confirmed periods only)
 * before HAWA infers a regular-looking or variable pattern. */
export const UNKNOWN_OBSERVATION_MONTHS = 3;
const UNKNOWN_OBSERVATION_DAYS = UNKNOWN_OBSERVATION_MONTHS * 30;

/** At least this many completed real cycle gaps (i.e. this + 1 recorded
 * period starts) are required before a pattern can be classified at all —
 * product rule: 3 completed intervals, i.e. 4 confirmed period starts. */
const MIN_OBSERVED_CYCLE_GAPS = 3;

/** A gap-to-gap range at or below this is classified "regular-looking" —
 * intentionally close in magnitude to the 6-day irregular window itself, for
 * product consistency. This is a UX classification for prediction display,
 * not a medical diagnosis. */
const CYCLE_STABILITY_MAX_RANGE_DAYS = 7;

/** The 26–32 day estimated window for an irregular cycle's next period. */
export const computeIrregularWindow = (lastPeriodStart: Date): {start: Date; end: Date} => ({
  start: addDays(startOfDay(lastPeriodStart), IRREGULAR_WINDOW_MIN_DAYS),
  end: addDays(startOfDay(lastPeriodStart), IRREGULAR_WINDOW_MAX_DAYS),
});

/** True only once today is strictly after the irregular window's end for the
 * LATEST confirmed period start. Since `lastPeriodStart` itself advances the
 * moment a new real period is recorded, this can never fire against a
 * window that a newer period has already superseded. */
export const isPeriodLate = (lastPeriodStart: Date, today: Date): boolean =>
  startOfDay(today).getTime() > computeIrregularWindow(lastPeriodStart).end.getTime();

export type ObservedCyclePattern = 'insufficient' | 'regular-looking' | 'variable';

export type ObservedCycleAnalysis = {
  pattern: ObservedCyclePattern;
  /** Only set when pattern === 'regular-looking'. */
  averageCycleLength?: number;
  observedGapCount: number;
};

/** Classifies REAL confirmed period starts recorded on/after
 * `observationStartedAt` — never predicted/mock dates. Only gaps since that
 * anchor count, so switching TO 'unknown' mid-history doesn't retroactively
 * judge data recorded under a different regularity setting. */
export const analyzeObservedCyclePattern = (
  periodStartDates: readonly Date[],
  observationStartedAt: Date,
): ObservedCycleAnalysis => {
  const relevant = periodStartDates
    .filter(date => startOfDay(date).getTime() >= startOfDay(observationStartedAt).getTime())
    .sort((a, b) => a.getTime() - b.getTime());

  const gaps: number[] = [];
  for (let index = 1; index < relevant.length; index += 1) {
    gaps.push(diffDays(relevant[index], relevant[index - 1]));
  }

  if (gaps.length < MIN_OBSERVED_CYCLE_GAPS) {
    return {pattern: 'insufficient', observedGapCount: gaps.length};
  }

  const average = gaps.reduce((sum, value) => sum + value, 0) / gaps.length;
  const range = Math.max(...gaps) - Math.min(...gaps);

  if (range <= CYCLE_STABILITY_MAX_RANGE_DAYS) {
    return {pattern: 'regular-looking', averageCycleLength: Math.round(average), observedGapCount: gaps.length};
  }

  return {pattern: 'variable', observedGapCount: gaps.length};
};

/** "Mois X sur 3" — 1-indexed, capped at UNKNOWN_OBSERVATION_MONTHS. */
export const observationMonthsElapsed = (observationStartedAt: Date, today: Date): number =>
  Math.min(UNKNOWN_OBSERVATION_MONTHS, Math.floor(diffDays(today, observationStartedAt) / 30) + 1);

export const isObservationWindowComplete = (observationStartedAt: Date, today: Date): boolean =>
  diffDays(today, observationStartedAt) >= UNKNOWN_OBSERVATION_DAYS;

export type CyclePredictionStatus =
  | {mode: 'exact'; date: Date; averageCycleLength: number; observedPattern?: 'regular-looking'}
  | {mode: 'window'; windowStart: Date; windowEnd: Date; isLate: boolean; observedPattern?: 'variable'}
  | {mode: 'observing'; monthsElapsed: number; totalMonths: number; complete: boolean};

/** THE single entry point Dashboard/Calendar/Profile must call instead of
 * branching on `regularity` themselves.
 *
 * - 'yes' preserves the exact existing computeNextPeriod behavior, unchanged
 *   (averageCycleLength echoes the manually-configured cycleDuration).
 * - 'no' uses the 26–32 day window.
 * - 'unknown' observes real period history: a regular-looking pattern
 *   behaves like 'yes' (using the OBSERVED average cycle length — exposed via
 *   averageCycleLength — instead of the manually-configured one), a variable
 *   pattern behaves like 'no', and insufficient data stays in observation
 *   mode. The persisted `regularity` value is never rewritten by this
 *   function — only the derived prediction mode adapts to what real history
 *   shows. Callers displaying "average cycle length" (Dashboard/Calendar/
 *   Profile) should read `averageCycleLength` off an 'exact' result instead
 *   of reaching for the raw configured cycleDuration, so a learned average
 *   is never silently shadowed by the onboarding estimate. */
export const computeCyclePredictionStatus = (
  basics: CycleBasics,
  regularity: CycleRegularity,
  periodStartDates: readonly Date[],
  observationStartedAt: Date | null,
  today: Date,
): CyclePredictionStatus => {
  if (regularity === 'yes') {
    return {mode: 'exact', date: computeNextPeriod(basics, today), averageCycleLength: basics.cycleDuration};
  }

  if (regularity === 'no') {
    const {start, end} = computeIrregularWindow(basics.lastPeriodStart);
    return {mode: 'window', windowStart: start, windowEnd: end, isLate: isPeriodLate(basics.lastPeriodStart, today)};
  }

  const anchor = observationStartedAt ?? basics.lastPeriodStart;
  const analysis = analyzeObservedCyclePattern(periodStartDates, anchor);

  if (analysis.pattern === 'regular-looking' && analysis.averageCycleLength) {
    return {
      mode: 'exact',
      date: computeNextPeriod({...basics, cycleDuration: analysis.averageCycleLength}, today),
      averageCycleLength: analysis.averageCycleLength,
      observedPattern: 'regular-looking',
    };
  }

  if (analysis.pattern === 'variable') {
    const {start, end} = computeIrregularWindow(basics.lastPeriodStart);
    return {
      mode: 'window',
      windowStart: start,
      windowEnd: end,
      isLate: isPeriodLate(basics.lastPeriodStart, today),
      observedPattern: 'variable',
    };
  }

  return {
    mode: 'observing',
    monthsElapsed: observationMonthsElapsed(anchor, today),
    totalMonths: UNKNOWN_OBSERVATION_MONTHS,
    complete: isObservationWindowComplete(anchor, today),
  };
};
