import {addDays, diffDays, startOfDay} from '../cycleMath';
import {getPregnancyDatingRange, validatePregnancyDatingDate} from '../pregnancyDatingValidation';
import {
  PREGNANCY_TOTAL_DAYS,
  PREGNANCY_TOTAL_WEEKS,
  computePregnancyStatus,
  formatPregnancyTrimester,
} from '../pregnancyTrackingUtils';
import type {PregnancyDatingMethod} from '../../state/pregnancyPreferences';

const NOW = new Date(2026, 8, 25, 14, 30, 0); // September 25, 2026
const TODAY = startOfDay(NOW);
const daysFromToday = (offset: number) => addDays(TODAY, offset);

const DATED_METHODS: Array<Exclude<PregnancyDatingMethod, 'later'>> = ['lastPeriod', 'conceptionDate', 'dueDate'];

describe('A — last menstrual period', () => {
  it('REJECTS the day after today (Sept 26)', () => {
    const result = validatePregnancyDatingDate('lastPeriod', new Date(2026, 8, 26), NOW);
    expect(result).toMatchObject({valid: false, issue: 'future'});
  });
  it('accepts today and a normal past date', () => {
    expect(validatePregnancyDatingDate('lastPeriod', TODAY, NOW).valid).toBe(true);
    expect(validatePregnancyDatingDate('lastPeriod', daysFromToday(-70), NOW).valid).toBe(true);
  });
  it('picker bounds: maximum = today', () => {
    expect(getPregnancyDatingRange('lastPeriod', NOW)?.max.getTime()).toBe(TODAY.getTime());
  });
});

describe('B — conception date', () => {
  it('REJECTS the day after today (Sept 26)', () => {
    const result = validatePregnancyDatingDate('conceptionDate', new Date(2026, 8, 26), NOW);
    expect(result).toMatchObject({valid: false, issue: 'future'});
  });
  it('a date up to 14 days ahead would fit the timeline arithmetically but is still rejected (a conception is a past event)', () => {
    expect(validatePregnancyDatingDate('conceptionDate', daysFromToday(10), NOW).valid).toBe(false);
  });
  it('accepts today and a normal past date', () => {
    expect(validatePregnancyDatingDate('conceptionDate', TODAY, NOW).valid).toBe(true);
    expect(validatePregnancyDatingDate('conceptionDate', daysFromToday(-60), NOW).valid).toBe(true);
  });
});

describe('C — due date', () => {
  it('accepts a normal future due date (in 100 days)', () => {
    expect(validatePregnancyDatingDate('dueDate', daysFromToday(100), NOW).valid).toBe(true);
  });
  it('accepts today and today + 280 days (the first day of the timeline)', () => {
    expect(validatePregnancyDatingDate('dueDate', TODAY, NOW).valid).toBe(true);
    expect(validatePregnancyDatingDate('dueDate', daysFromToday(PREGNANCY_TOTAL_DAYS), NOW).valid).toBe(true);
  });
  it('picker bounds are NOT capped at today: [today, today + 280 days]', () => {
    const range = getPregnancyDatingRange('dueDate', NOW)!;
    expect(range.min.getTime()).toBe(TODAY.getTime());
    expect(range.max.getTime()).toBe(daysFromToday(PREGNANCY_TOTAL_DAYS).getTime());
  });
});

describe('D — incoherent / out-of-range dating', () => {
  it('LMP older than the 280-day timeline is rejected (281 days ago); exactly 280 days ago is accepted', () => {
    expect(validatePregnancyDatingDate('lastPeriod', daysFromToday(-280), NOW).valid).toBe(true);
    expect(validatePregnancyDatingDate('lastPeriod', daysFromToday(-281), NOW)).toMatchObject({valid: false, issue: 'tooOld'});
  });
  it('a very old LMP (2 years) is rejected', () => {
    expect(validatePregnancyDatingDate('lastPeriod', daysFromToday(-730), NOW).valid).toBe(false);
  });
  it('conception: 266 days ago is the oldest accepted; 267 is rejected', () => {
    expect(validatePregnancyDatingDate('conceptionDate', daysFromToday(-266), NOW).valid).toBe(true);
    expect(validatePregnancyDatingDate('conceptionDate', daysFromToday(-267), NOW)).toMatchObject({valid: false, issue: 'tooOld'});
  });
  it('due date already passed (yesterday) is rejected; more than 280 days ahead is rejected', () => {
    expect(validatePregnancyDatingDate('dueDate', daysFromToday(-1), NOW)).toMatchObject({valid: false, issue: 'pastDue'});
    expect(validatePregnancyDatingDate('dueDate', daysFromToday(PREGNANCY_TOTAL_DAYS + 1), NOW)).toMatchObject({
      valid: false,
      issue: 'tooFar',
    });
  });
  it('a missing date is rejected for a dated method; "later" needs none', () => {
    expect(validatePregnancyDatingDate('lastPeriod', null, NOW)).toMatchObject({valid: false, issue: 'missing'});
    expect(validatePregnancyDatingDate('later', null, NOW).valid).toBe(true);
    expect(getPregnancyDatingRange('later', NOW)).toBeNull();
  });
  it('every rejection carries a user-facing message', () => {
    const result = validatePregnancyDatingDate('lastPeriod', daysFromToday(1), NOW);
    expect(result.valid === false && result.message.length > 10).toBe(true);
  });
});

describe('validation and the shared pregnancy calculation agree on every single day', () => {
  it.each(DATED_METHODS)('%s: an accepted date is always a representable, UNCLAMPED timeline; a rejected one never is', method => {
    const range = getPregnancyDatingRange(method, NOW)!;
    for (let offset = -PREGNANCY_TOTAL_DAYS - 300; offset <= PREGNANCY_TOTAL_DAYS + 300; offset += 1) {
      const date = daysFromToday(offset);
      const inRange = date.getTime() >= range.min.getTime() && date.getTime() <= range.max.getTime();
      const verdict = validatePregnancyDatingDate(method, date, NOW);
      expect(verdict.valid).toBe(inRange);

      if (verdict.valid) {
        const status = computePregnancyStatus(method, date, NOW);
        const elapsed = PREGNANCY_TOTAL_DAYS - status.remainingDays;
        // not clamped: remaining days really equals due date − today
        expect(status.remainingDays).toBe(diffDays(status.estimatedDueDate!, TODAY));
        expect(elapsed).toBeGreaterThanOrEqual(0);
        expect(elapsed).toBeLessThanOrEqual(PREGNANCY_TOTAL_DAYS);
      }
    }
  });
});

describe('G/H — ONE progression result: remaining weeks and trimester', () => {
  const lmpElapsed = (elapsedDays: number) => computePregnancyStatus('lastPeriod', daysFromToday(-elapsedDays), NOW);

  it('the three methods give the same result for the same timeline', () => {
    const fromLmp = computePregnancyStatus('lastPeriod', daysFromToday(-100), NOW);
    const fromConception = computePregnancyStatus('conceptionDate', daysFromToday(-86), NOW);
    const fromDue = computePregnancyStatus('dueDate', daysFromToday(180), NOW);
    for (const other of [fromConception, fromDue]) {
      expect(other.week).toBe(fromLmp.week);
      expect(other.trimester).toBe(fromLmp.trimester);
      expect(other.remainingWeeks).toBe(fromLmp.remainingWeeks);
    }
  });

  it.each([
    // elapsed days, week, gestational weeks, trimester, remainingWeeks, remainder
    [0, 1, 0, 1, 40, 0],
    [6, 1, 0, 1, 39, 1],
    [7, 2, 1, 1, 39, 0],
    [90, 13, 12, 1, 27, 1],
    [91, 14, 13, 2, 27, 0], // trimester 1 → 2
    [188, 27, 26, 2, 13, 1],
    [189, 28, 27, 3, 13, 0], // trimester 2 → 3
    [259, 38, 37, 3, 3, 0],
    [273, 40, 39, 3, 1, 0],
    [279, 40, 39, 3, 0, 1],
    [280, 41, 40, 3, 0, 0], // due date (supported boundary)
  ])('elapsed %i days → week %i, %i SA, trimester %i, %i weeks + %i days remaining', (elapsed, week, sa, trimester, remainingWeeks, remainder) => {
    const status = lmpElapsed(elapsed);
    expect(status.week).toBe(week);
    expect(status.gestationalWeeks).toBe(sa);
    expect(status.trimester).toBe(trimester);
    expect(status.remainingWeeks).toBe(remainingWeeks);
    expect(status.remainingDaysRemainder).toBe(remainder);
    // remaining weeks always follow from the SAME elapsed count — no ±1 anywhere
    expect(status.remainingWeeks * 7 + status.remainingDaysRemainder).toBe(PREGNANCY_TOTAL_DAYS - elapsed);
    expect(PREGNANCY_TOTAL_WEEKS).toBe(40);
  });

  it('one French wording per trimester', () => {
    expect(formatPregnancyTrimester(1)).toBe('1er trimestre');
    expect(formatPregnancyTrimester(2)).toBe('2e trimestre');
    expect(formatPregnancyTrimester(3)).toBe('3e trimestre');
  });
});
