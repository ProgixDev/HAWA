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

export type UpcomingFertileWindow = {start: Date; end: Date; ovulation: Date};

/** ONE coherent fertile window of the repeating cycle — the occurrence whose
 * LAST fertile day is today or later: the window that contains today, or
 * else the next one. Same project formula as everywhere else (ovulation on
 * `ovulationDayFor(cycleDuration)`, fertile from 5 days before to 1 day
 * after it), only the date range is now anchored to a SINGLE occurrence.
 *
 * Why: calling upcomingDateForCycleDay() separately for the start and the
 * end returns "the first occurrence on/after today" for each — so once today
 * is inside the window the start has already passed and jumps to the NEXT
 * cycle while the end is still in the current one (start > end). Here only
 * the end is resolved against today; start and ovulation are derived from
 * it by the fixed in-cycle offsets, so start <= ovulation <= end always
 * holds. `today` is normalised to the start of its day so the last fertile
 * day still counts as "today or later" at any time of day. */
export const upcomingFertileWindow = (basics: CycleBasics, today: Date): UpcomingFertileWindow => {
  const ovulationDay = ovulationDayFor(basics.cycleDuration);
  const startDay = Math.max(1, ovulationDay - 5);
  const endDay = ovulationDay + 1;
  const end = upcomingDateForCycleDay(basics, endDay, startOfDay(today));
  return {
    start: addDays(end, -(endDay - startDay)),
    end,
    ovulation: addDays(end, -(endDay - ovulationDay)),
  };
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
  return !isPeriodEndConfirmedWithin(now, basics, periodEndDateTime);
};

const isPeriodEndConfirmedWithin = (
  now: Date,
  basics: CycleBasics,
  periodEndDateTime: Date | null,
): boolean =>
  !!periodEndDateTime &&
  periodEndDateTime.getTime() <= now.getTime() &&
  periodEndDateTime.getTime() >= basics.lastPeriodStart.getTime();

/** Prediction-aware "is she menstruating now?" — the SAME guard the Cycle
 * Dashboard applies to its displayed phase (CycleHomeScreen's
 * `isReliablyMenstruating`), so purity / prayer state can never treat a
 * merely PROJECTED period as a real one.
 * - 'exact' (declared regular, or an observed regular-looking pattern): the
 *   projection wrapped by the SAME cycle length the prediction uses — unchanged
 *   behaviour for a regular cycle.
 * - 'window' (declared irregular / observed variable) and 'observing'
 *   (unknown, still learning): no single cycle length can be trusted, so a
 *   wrapped projection is NEVER menstruation — only the days elapsed since the
 *   latest recorded period start count, and only within the bleeding duration.
 *   A late irregular period therefore stays "not menstruating" until she
 *   records the start.
 * A confirmed period end (MenstrualFlowScreen) still overrides in every mode. */
export const isMenstruatingWithPrediction = (
  now: Date,
  basics: CycleBasics,
  status: CyclePredictionStatus,
  periodEndDateTime: Date | null,
): boolean => {
  if (status.mode === 'exact') {
    return isMenstruatingNow(now, {...basics, cycleDuration: status.averageCycleLength}, periodEndDateTime);
  }
  const elapsedDay = diffDays(now, basics.lastPeriodStart) + 1;
  if (elapsedDay < 1 || elapsedDay > basics.periodDuration) {return false;}
  return !isPeriodEndConfirmedWithin(now, basics, periodEndDateTime);
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

// ===========================================================================
// DASHBOARD ⇄ CALENDAR ⇄ PROFILE CONSISTENCY
// ===========================================================================
// Everything below only PRESENTS what computeCyclePredictionStatus() already
// derived — there is no second prediction algorithm here. Its purpose is that
// CycleHomeScreen, CalendarScreen and ProfileScreen can never disagree: a
// prediction communicated as a window/observation is never painted or worded
// as one certain date somewhere else.

/** One recorded period (same shape as PeriodHistoryRecord, dates are local
 * 'YYYY-MM-DD' keys). Kept structural so this file stays free of a runtime
 * dependency on the store that owns the list. */
export type RecordedPeriod = {startDate: string; endDate: string};

const dayKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** True when `date` falls inside one of the recorded periods (inclusive). */
export const isWithinRecordedPeriod = (date: Date, periods: readonly RecordedPeriod[]): boolean => {
  const key = dayKeyOf(date);
  return periods.some(period => period.startDate <= key && key <= period.endDate);
};

/** The recorded period `date` belongs to — or, when it falls between two
 * periods, the most recent one that started on/before it. Null when the date
 * precedes every recorded period. */
export const recordedPeriodFor = (date: Date, periods: readonly RecordedPeriod[]): RecordedPeriod | null => {
  const key = dayKeyOf(date);
  let found: RecordedPeriod | null = null;
  periods.forEach(period => {
    if (period.startDate <= key && (!found || period.startDate > found.startDate)) {
      found = period;
    }
  });
  return found;
};

const dateOfDayKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** The recorded period `date` belongs to as a CYCLE day: the one returned by
 * recordedPeriodFor() only when `date` still falls within `cycleLength` days of
 * its start (a date many cycles later is not part of that period's cycle). */
export const recordedPeriodInCycleOf = (
  date: Date,
  periods: readonly RecordedPeriod[],
  cycleLength: number,
): RecordedPeriod | null => {
  const found = recordedPeriodFor(date, periods);
  return found && diffDays(date, dateOfDayKey(found.startDate)) < cycleLength ? found : null;
};

/** Length in days of the period that starts on `basics.lastPeriodStart`: what
 * was really RECORDED for it (edited range / confirmed end), falling back to
 * the habitual `periodDuration` only when no such record exists. The habitual
 * duration is a setting; it is not what an edited or ended actual period
 * lasted (M7/M8). */
export const currentPeriodLength = (
  basics: CycleBasics,
  recordedPeriods: readonly RecordedPeriod[],
): number => {
  const startKey = dayKeyOf(basics.lastPeriodStart);
  const record = recordedPeriods.find(period => period.startDate === startKey);
  return record
    ? diffDays(dateOfDayKey(record.endDate), dateOfDayKey(record.startDate)) + 1
    : basics.periodDuration;
};

/** True for a day BEFORE the projected cycle that contains `today` — the
 * range in which the modulo projection is only a retroactive guess (old
 * months), as opposed to the current/future cycle it is meant to show. */
export const isBeforeCurrentProjectedCycle = (
  date: Date,
  basics: CycleBasics,
  today: Date,
): boolean => diffDays(date, periodStartForCycleContaining(today, basics)) < 0;

/** What a Calendar cell represents, given the SAME prediction status the
 * Dashboard shows:
 * - 'exact'   → the projected cycle, wrapped by the SAME cycle length the
 *               prediction uses (declared length, or the observed average for
 *               a regular-looking 'unknown' pattern) — unchanged for a
 *               declared-regular cycle.
 * - 'window'  → a single projected cycle would present an estimate as a
 *               certainty (the Dashboard says "26–32 days"), so only the
 *               periods the user actually RECORDED are painted.
 * - 'observing' → existing observation behavior is preserved as-is.
 *
 * Passing `today` switches on the prediction-overlay rule (M9): a projection
 * describes the CURRENT and FUTURE cycles, so it is never painted
 * retroactively into old months — a day before the projected cycle containing
 * today is a period only if it was RECORDED. Recorded periods always win (they
 * are the truthful source, including a period edited longer than the habitual
 * duration); and once a recorded period was ended earlier than the habitual
 * duration, its remaining projected days are no longer painted. Without
 * `today` the original projection is returned unchanged. */
export const calendarDayKindFor = (
  date: Date,
  basics: CycleBasics,
  status: CyclePredictionStatus,
  recordedPeriods: readonly RecordedPeriod[],
  today?: Date,
): DayKind => {
  if (status.mode === 'window') {
    return isWithinRecordedPeriod(date, recordedPeriods) ? 'period' : 'normal';
  }
  const effective = status.mode === 'exact' ? {...basics, cycleDuration: status.averageCycleLength} : basics;
  if (!today) {
    return kindFor(date, effective);
  }
  if (isWithinRecordedPeriod(date, recordedPeriods)) {
    return 'period';
  }
  if (isBeforeCurrentProjectedCycle(date, effective, today)) {
    return 'normal';
  }
  const kind = kindFor(date, effective);
  if (kind === 'period') {
    const record = recordedPeriodFor(date, recordedPeriods);
    if (record && dayKeyOf(periodStartForCycleContaining(date, effective)) === record.startDate) {
      return 'normal';
    }
  }
  return kind;
};

export type CycleFertilityEstimate = {fertileStart: Date; fertileEnd: Date; ovulation: Date};

/** Upcoming fertile window + ovulation date — or null when no single cycle
 * length can be trusted ('window': declared irregular / observed variable),
 * in which case NO precise date may be shown. */
export const estimateFertilityDates = (
  basics: CycleBasics,
  status: CyclePredictionStatus,
  today: Date,
): CycleFertilityEstimate | null => {
  if (status.mode === 'window') {return null;}
  const effective = status.mode === 'exact' ? {...basics, cycleDuration: status.averageCycleLength} : basics;
  // ONE occurrence of the repeating cycle (see upcomingFertileWindow): looking
  // the three dates up independently made the start jump to the NEXT cycle
  // once today was inside the window (start > end).
  const {start, end, ovulation} = upcomingFertileWindow(effective, today);
  return {fertileStart: start, fertileEnd: end, ovulation};
};

export type AverageCycleDisplay = {label: string; value: string; subtitle: string};

/** The "average cycle length" tile shown by Dashboard, Calendar and Profile.
 * A number is only called an AVERAGE when it was actually observed from the
 * user's own recorded cycles; a declared/configured length is worded as such,
 * and an unconfirmed fallback (onboarding placeholder values) is never shown
 * as if it were the user's data. */
export const describeAverageCycle = (
  status: CyclePredictionStatus,
  basics: CycleBasics,
  hasConfirmedCycleData: boolean,
): AverageCycleDisplay => {
  if (status.mode === 'window') {
    return {
      label: 'Cycle variable',
      value: `${IRREGULAR_WINDOW_MIN_DAYS}–${IRREGULAR_WINDOW_MAX_DAYS} jours`,
      subtitle: 'Fenêtre estimée',
    };
  }
  if (status.mode === 'exact' && status.observedPattern === 'regular-looking') {
    return {label: 'Durée moyenne', value: `${status.averageCycleLength} jours`, subtitle: 'Basée sur tes cycles enregistrés'};
  }
  if (!hasConfirmedCycleData) {
    return {label: 'Durée habituelle', value: 'Non renseignée', subtitle: 'Complète ton cycle'};
  }
  if (status.mode === 'exact') {
    return {label: 'Durée habituelle', value: `${status.averageCycleLength} jours`, subtitle: 'Renseignée par toi'};
  }
  return {label: 'Durée habituelle', value: `${basics.cycleDuration} jours`, subtitle: 'Estimation provisoire'};
};
