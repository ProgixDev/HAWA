import type {ObjectiveId} from '../../state/onboardingPreferences';
import {IRREGULAR_WINDOW_MAX_DAYS, addDays} from '../cycleMath';
import {journalCycleDayFor, type JournalCycleDayInput} from '../journalCycleDay';

// One shared rule for the "Jour N du cycle" shown by the Cycle journal entry
// screens: same semantics as the Cycle/Conceive Dashboards, and no number at
// all where a menstrual cycle day means nothing.
const TODAY = new Date(2026, 8, 25, 15, 0, 0);

const build = (overrides: Partial<JournalCycleDayInput> & {elapsedDays?: number} = {}): JournalCycleDayInput => {
  const {elapsedDays = 9, ...rest} = overrides;
  return {
    objective: 'cycle',
    hasConfirmedCycleData: true,
    basics: {
      lastPeriodStart: addDays(TODAY, -elapsedDays),
      periodDuration: 5,
      cycleDuration: 28,
    },
    regularity: 'yes',
    periodStartDates: [],
    observationStartedAt: null,
    today: TODAY,
    ...rest,
  };
};

describe('journalCycleDayFor', () => {
  it('Cycle + confirmed data + regular: the canonical wrapped cycle day', () => {
    expect(journalCycleDayFor(build({elapsedDays: 9}))).toBe(10);
  });

  it('Conceive + confirmed data behaves like Cycle', () => {
    expect(journalCycleDayFor(build({objective: 'conceive', elapsedDays: 9}))).toBe(10);
  });

  it('regular: an out-of-range elapsed count wraps by the cycle length instead of growing without bound', () => {
    // 143 elapsed days (a very old lastPeriodStart): 143 % 28 = 3 -> day 4.
    const day = journalCycleDayFor(build({elapsedDays: 143}));
    expect(day).toBe(4);
    expect(day).toBeLessThanOrEqual(28);
  });

  it('irregular window mode: the raw elapsed count while within the irregular window', () => {
    expect(journalCycleDayFor(build({regularity: 'no', elapsedDays: 23}))).toBe(24);
    expect(journalCycleDayFor(build({regularity: 'no', elapsedDays: IRREGULAR_WINDOW_MAX_DAYS - 1}))).toBe(
      IRREGULAR_WINDOW_MAX_DAYS,
    );
  });

  it('irregular window mode: no unbounded number past the irregular window', () => {
    expect(journalCycleDayFor(build({regularity: 'no', elapsedDays: IRREGULAR_WINDOW_MAX_DAYS}))).toBeNull();
    expect(journalCycleDayFor(build({regularity: 'no', elapsedDays: 143}))).toBeNull();
  });

  it('observing mode ("Je ne sais pas", not enough history): bounded the same way', () => {
    expect(journalCycleDayFor(build({regularity: 'unknown', elapsedDays: 9}))).toBe(10);
    expect(journalCycleDayFor(build({regularity: 'unknown', elapsedDays: 143}))).toBeNull();
  });

  it('a lastPeriodStart in the future never yields a day in a non-exact mode', () => {
    expect(journalCycleDayFor(build({regularity: 'no', elapsedDays: -3}))).toBeNull();
  });

  it('unconfirmed cycle data (onboarding placeholder defaults): no cycle day', () => {
    expect(journalCycleDayFor(build({hasConfirmedCycleData: false}))).toBeNull();
  });

  it.each<ObjectiveId>(['pregnancy', 'postpartum', 'loss', 'menopause', 'contraception', 'irregular'])(
    '%s: never a cycle day, even with confirmed cycle data',
    objective => {
      expect(journalCycleDayFor(build({objective}))).toBeNull();
    },
  );
});
