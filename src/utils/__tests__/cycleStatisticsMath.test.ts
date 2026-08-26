import {
  isPeriodFree,
  cutoffDateForPeriod,
  filterEntriesForPeriod,
  filterPeriodStartsForPeriod,
  calculateAverageCycleDuration,
  calculateFlowDistribution,
  calculateSymptomFrequency,
  calculateMonthlyFlowTrend,
  calculateMonthlySymptomTrend,
  countTrackedDays,
  coverageMonthsForAnchor,
  describeMonthsCoverage,
} from '../cycleStatisticsMath';
import type {DailyJournalEntry} from '../../types/journal';
import type {ConfirmedPeriodOccurrence} from '../../state/confirmedPeriodHistoryStore';

const NOW = new Date(2026, 7, 26); // 26 August 2026 — matches the session's currentDate.

const entry = (date: string, fields: Partial<DailyJournalEntry> = {}): DailyJournalEntry => ({
  id: date,
  date,
  ...fields,
});

const occurrence = (id: string, periodStart: string, periodEndDateTime: string): ConfirmedPeriodOccurrence => ({
  id,
  periodStart,
  periodEndDateTime,
  capturedAt: periodEndDateTime,
});

describe('isPeriodFree', () => {
  it('only 1 mois is Free — 3/6/12 mois are Premium', () => {
    expect(isPeriodFree('1')).toBe(true);
    expect(isPeriodFree('3')).toBe(false);
    expect(isPeriodFree('6')).toBe(false);
    expect(isPeriodFree('12')).toBe(false);
  });
});

// (A) period filtering for 1/3/6/12 months
describe('cutoffDateForPeriod', () => {
  it('computes the correct lookback boundary for each period', () => {
    expect(cutoffDateForPeriod('1', NOW)).toEqual(new Date(2026, 6, 26));
    expect(cutoffDateForPeriod('3', NOW)).toEqual(new Date(2026, 4, 26));
    expect(cutoffDateForPeriod('6', NOW)).toEqual(new Date(2026, 1, 26));
    expect(cutoffDateForPeriod('12', NOW)).toEqual(new Date(2025, 7, 26));
  });
});

// (B) boundary behavior — entries before range excluded, inside range included
describe('filterEntriesForPeriod', () => {
  it('excludes entries before the cutoff and includes entries inside the window', () => {
    const entries = [
      entry('2026-07-01'), // before the 1-month cutoff (2026-07-26)
      entry('2026-07-27'), // just inside the cutoff
      entry('2026-08-01'), // well inside, before "now"
    ];
    const result = filterEntriesForPeriod(entries, '1', NOW);
    expect(result.map(item => item.date)).toEqual(['2026-07-27', '2026-08-01']);
  });

  it('never includes an entry dated after "now"', () => {
    const entries = [entry('2026-08-27')];
    expect(filterEntriesForPeriod(entries, '12', NOW)).toEqual([]);
  });
});

describe('filterPeriodStartsForPeriod', () => {
  it('keeps only confirmed period starts inside the selected window, sorted chronologically', () => {
    const history = [
      occurrence('a', '2026-01-01T08:00:00', '2026-01-05T08:00:00'),
      occurrence('b', '2026-06-01T08:00:00', '2026-06-05T08:00:00'),
      occurrence('c', '2026-07-01T08:00:00', '2026-07-05T08:00:00'),
    ];
    const result = filterPeriodStartsForPeriod(history, '3', NOW);
    expect(result).toEqual([new Date('2026-06-01T08:00:00'), new Date('2026-07-01T08:00:00')]);
  });
});

// (C) average cycle duration correctness + insufficient-data-does-not-return-fake-average
describe('calculateAverageCycleDuration', () => {
  it('computes the average gap across multiple confirmed period starts', () => {
    const starts = [new Date(2026, 4, 1), new Date(2026, 4, 29), new Date(2026, 5, 26)];
    expect(calculateAverageCycleDuration(starts)).toEqual({averageDays: 28, cyclesAnalyzed: 2});
  });

  it('returns null — never a fabricated average — with fewer than 2 confirmed starts', () => {
    expect(calculateAverageCycleDuration([])).toBeNull();
    expect(calculateAverageCycleDuration([new Date(2026, 4, 1)])).toBeNull();
  });

  it('is order-independent (sorts internally before computing gaps)', () => {
    const starts = [new Date(2026, 5, 26), new Date(2026, 4, 1), new Date(2026, 4, 29)];
    expect(calculateAverageCycleDuration(starts)).toEqual({averageDays: 28, cyclesAnalyzed: 2});
  });
});

// (D) flow correct counts/distribution with missing days ignored
describe('calculateFlowDistribution', () => {
  it('counts only days with a real recorded flow intensity', () => {
    const entries = [
      entry('2026-08-01', {flow: {intensity: 'light'}}),
      entry('2026-08-02', {flow: {intensity: 'light'}}),
      entry('2026-08-03', {}), // no flow recorded — must not count as anything
      entry('2026-08-04', {flow: {intensity: 'heavy'}}),
    ];
    expect(calculateFlowDistribution(entries)).toEqual([
      {intensity: 'light', days: 2},
      {intensity: 'heavy', days: 1},
    ]);
  });

  it('returns an empty array — never a fake distribution — with no flow entries at all', () => {
    expect(calculateFlowDistribution([entry('2026-08-01', {})])).toEqual([]);
  });
});

// (E) symptom correct occurrence counts including same symptom on multiple days
describe('calculateSymptomFrequency', () => {
  it('counts the same symptom across multiple days and sorts most-frequent first', () => {
    const entries = [
      entry('2026-08-01', {symptoms: {names: ['Crampes', 'Fatigue']}}),
      entry('2026-08-02', {symptoms: {names: ['Crampes']}}),
      entry('2026-08-03', {symptoms: {names: ['Fatigue']}}),
      entry('2026-08-04', {symptoms: {names: ['Crampes']}}),
    ];
    expect(calculateSymptomFrequency(entries)).toEqual([
      {name: 'Crampes', days: 3},
      {name: 'Fatigue', days: 2},
    ]);
  });

  // (F) missing journal day is not interpreted as zero
  it('excludes days without a symptoms section entirely, never counting them as zero for every symptom', () => {
    const entries = [
      entry('2026-08-01', {symptoms: {names: ['Crampes']}}),
      entry('2026-08-02', {}),
    ];
    expect(calculateSymptomFrequency(entries)).toEqual([{name: 'Crampes', days: 1}]);
  });
});

describe('calculateMonthlyFlowTrend', () => {
  it('groups real flow days by real calendar month and omits months with none', () => {
    const entries = [
      entry('2026-06-01', {flow: {intensity: 'light'}}),
      entry('2026-06-02', {flow: {intensity: 'light'}}),
      entry('2026-07-05', {}), // no flow this month — must not appear as a zero month
      entry('2026-08-10', {flow: {intensity: 'heavy'}}),
    ];
    const trend = calculateMonthlyFlowTrend(entries);
    expect(trend.map(month => month.monthKey)).toEqual(['2026-06', '2026-08']);
    expect(trend[0]).toMatchObject({daysWithFlow: 2, distribution: [{intensity: 'light', days: 2}]});
    expect(trend[1]).toMatchObject({daysWithFlow: 1, distribution: [{intensity: 'heavy', days: 1}]});
  });
});

describe('calculateMonthlySymptomTrend', () => {
  it('caps each month to its top 3 symptoms and omits months with none', () => {
    const entries = [
      entry('2026-06-01', {symptoms: {names: ['Crampes']}}),
      entry('2026-06-02', {symptoms: {names: ['Crampes', 'Fatigue', 'Ballonnements', 'Acné']}}),
      entry('2026-07-01', {}),
    ];
    const trend = calculateMonthlySymptomTrend(entries);
    expect(trend).toHaveLength(1);
    expect(trend[0].monthKey).toBe('2026-06');
    expect(trend[0].topSymptoms).toEqual([
      {name: 'Crampes', days: 2},
      {name: 'Acné', days: 1},
      {name: 'Ballonnements', days: 1},
    ]);
  });
});

describe('countTrackedDays', () => {
  it('counts real recorded journal days only', () => {
    expect(countTrackedDays([entry('2026-08-01'), entry('2026-08-02')])).toBe(2);
    expect(countTrackedDays([])).toBe(0);
  });
});

describe('coverageMonthsForAnchor', () => {
  it('caps coverage to the months actually elapsed since a recent anchor', () => {
    // Anchor 3 months before NOW (2026-08-26) — a 12-month window can only
    // ever have ~3 real months of history, never 12.
    const anchor = new Date(2026, 4, 26); // 26 May 2026
    expect(coverageMonthsForAnchor('12', anchor, NOW)).toBe(4);
    expect(coverageMonthsForAnchor('3', anchor, NOW)).toBe(3);
  });

  it('returns the full requested window when there is no anchor', () => {
    expect(coverageMonthsForAnchor('12', null, NOW)).toBe(12);
  });

  it('never returns a negative coverage for a future anchor', () => {
    const futureAnchor = new Date(2027, 0, 1);
    expect(coverageMonthsForAnchor('3', futureAnchor, NOW)).toBe(0);
  });
});

describe('describeMonthsCoverage', () => {
  it('describes partial coverage only when narrower than the requested period', () => {
    expect(describeMonthsCoverage('12', 7)).toBe('Données disponibles sur 7 mois');
  });

  it('returns null when coverage already matches or exceeds the requested period', () => {
    expect(describeMonthsCoverage('3', 3)).toBeNull();
    expect(describeMonthsCoverage('3', 12)).toBeNull();
  });

  it('returns null for zero coverage — a screen should show its own empty state instead', () => {
    expect(describeMonthsCoverage('12', 0)).toBeNull();
  });
});
