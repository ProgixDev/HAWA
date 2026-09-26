import {
  computeCyclePredictionStatus,
  isMenstruatingNow,
  isMenstruatingWithPrediction,
  type CycleBasics,
} from '../cycleMath';
import type {CycleRegularity} from '../../state/onboardingPreferences';

// H14 — purity/menstruation state must never treat a PROJECTED (wrapped)
// period as a real one for irregular / late / still-observed cycles. Religious
// rules are untouched: only WHICH state feeds the existing purity logic changes.
const at = (month: number, date: number, hour = 12) => new Date(2026, month - 1, date, hour, 0);

const statusFor = (basics: CycleBasics, regularity: CycleRegularity, now: Date, starts: Date[] = [basics.lastPeriodStart]) =>
  computeCyclePredictionStatus(basics, regularity, starts, regularity === 'unknown' ? basics.lastPeriodStart : null, new Date(now.getFullYear(), now.getMonth(), now.getDate()));

const menstruating = (basics: CycleBasics, regularity: CycleRegularity, now: Date, periodEnd: Date | null = null, starts?: Date[]) =>
  isMenstruatingWithPrediction(now, basics, statusFor(basics, regularity, now, starts), periodEnd);

describe('H14 — confirmed recorded period', () => {
  it('a period started 2 days ago (declared irregular) is menstruation — recorded, not predicted', () => {
    const basics: CycleBasics = {lastPeriodStart: at(9, 24, 0), cycleDuration: 28, periodDuration: 5};
    expect(menstruating(basics, 'no', at(9, 26))).toBe(true);
  });

  it('manually confirmed START today counts immediately (irregular)', () => {
    const basics: CycleBasics = {lastPeriodStart: at(9, 26, 8), cycleDuration: 28, periodDuration: 5};
    expect(menstruating(basics, 'no', at(9, 26, 9))).toBe(true);
  });

  it('a manually confirmed END ends menstruation in every mode (regular and irregular)', () => {
    const basics: CycleBasics = {lastPeriodStart: at(9, 24, 0), cycleDuration: 28, periodDuration: 5};
    const end = at(9, 25, 20);
    expect(menstruating(basics, 'no', at(9, 26), end)).toBe(false);
    expect(menstruating(basics, 'yes', at(9, 26), end)).toBe(false);
    // …but before the end was confirmed she was menstruating.
    expect(menstruating(basics, 'no', at(9, 25, 10), end)).toBe(true);
  });
});

describe('H14 — regular exact cycle keeps its projection (unchanged)', () => {
  const basics: CycleBasics = {lastPeriodStart: at(8, 30, 0), cycleDuration: 28, periodDuration: 5};
  it('the projected next period days are still menstruation for a declared-regular cycle', () => {
    for (const day of [27, 28, 29, 30]) {
      expect(menstruating(basics, 'yes', at(9, day))).toBe(true);
      expect(menstruating(basics, 'yes', at(9, day))).toBe(isMenstruatingNow(at(9, day), basics, null));
    }
    expect(menstruating(basics, 'yes', at(9, 26))).toBe(false);
    expect(menstruating(basics, 'yes', at(10, 2))).toBe(false);
  });
});

describe('H14 — irregular / window: a wrapped projection is NOT menstruation', () => {
  const basics: CycleBasics = {lastPeriodStart: at(8, 30, 0), cycleDuration: 28, periodDuration: 5};
  it('the wrapped predicted days (Sept 27–Oct 1) used to be reported as menstruation', () => {
    for (const day of [27, 28, 29]) {
      expect(isMenstruatingNow(at(9, day), basics, null)).toBe(true); // the old, wrong answer
      expect(menstruating(basics, 'no', at(9, day))).toBe(false);
    }
  });
  it('an observed VARIABLE pattern (regularity unknown) behaves like irregular', () => {
    const starts = [at(5, 1), at(6, 10), at(7, 5), at(8, 20), at(8, 30)];
    const variable: CycleBasics = {lastPeriodStart: at(8, 30, 0), cycleDuration: 28, periodDuration: 5};
    const status = computeCyclePredictionStatus(variable, 'unknown', starts, at(5, 1), at(9, 28));
    expect(status.mode).toBe('window');
    expect(isMenstruatingNow(at(9, 28), variable, null)).toBe(true); // wrapped projection: old, wrong answer
    expect(isMenstruatingWithPrediction(at(9, 28), variable, status, null)).toBe(false);
  });
  it('the days right after the recorded start remain menstruation (raw elapsed ≤ duration), and stop after', () => {
    expect(menstruating(basics, 'no', at(8, 30, 15))).toBe(true);
    expect(menstruating(basics, 'no', at(9, 3))).toBe(true);
    expect(menstruating(basics, 'no', at(9, 4))).toBe(false);
  });
});

describe('H14 — late period', () => {
  it('a period 55 days after the last start (declared irregular) is not menstruation until recorded', () => {
    const basics: CycleBasics = {lastPeriodStart: at(8, 1, 0), cycleDuration: 28, periodDuration: 5};
    // Sept 26 is cycle day 1 of the wrapped 28-day projection (Aug 1 + 56).
    expect(isMenstruatingNow(at(9, 26), basics, null)).toBe(true);
    const status = statusFor(basics, 'no', at(9, 26));
    expect(status.mode).toBe('window');
    if (status.mode === 'window') {expect(status.isLate).toBe(true);}
    expect(isMenstruatingWithPrediction(at(9, 26), basics, status, null)).toBe(false);
  });
});

describe('H14 — unknown / provisional (observing)', () => {
  it('while observing, a wrapped projected period is not menstruation', () => {
    const basics: CycleBasics = {lastPeriodStart: at(8, 30, 0), cycleDuration: 28, periodDuration: 5};
    const status = statusFor(basics, 'unknown', at(9, 28));
    expect(status.mode).toBe('observing');
    expect(isMenstruatingWithPrediction(at(9, 28), basics, status, null)).toBe(false);
  });
  it('but the days just after a recorded start still count', () => {
    const basics: CycleBasics = {lastPeriodStart: at(9, 25, 0), cycleDuration: 28, periodDuration: 5};
    expect(menstruating(basics, 'unknown', at(9, 26))).toBe(true);
  });
});

describe('H14 — the store-backed helper feeds the purity hook and MenstrualFlow', () => {
  it('isCurrentlyMenstruating reads regularity from the cycle preferences', () => {
    const {isCurrentlyMenstruating} = require('../menstruationStatus');
    const basics = {lastPeriodStart: at(8, 30, 0), cycleDuration: 28, periodDuration: 5};
    expect(isCurrentlyMenstruating(at(9, 28), {...basics, regularity: 'no'}, null)).toBe(false);
    expect(isCurrentlyMenstruating(at(9, 28), {...basics, regularity: 'yes'}, null)).toBe(true);
  });
});
