import {
  calculateAverageCycleDuration,
  calculateAveragePeriodDuration,
  calculateCycleLengthRange,
  calculateMoodDistribution,
  calculateSymptomFrequency,
  filterPeriodStartsForPeriod,
} from '../cycleStatisticsMath';
import type {ConfirmedPeriodOccurrence} from '../../state/confirmedPeriodHistoryStore';
import type {DailyJournalEntry} from '../../types/journal';

// Phase 8 — Cycle Statistics are computed ONLY from real, confirmed, profile-specific records. These
// pin the rules: nothing is invented (no 28/5 default), incomplete or duplicate periods never inflate a
// number, and "not enough data" is an explicit null.

const NOW = new Date(2026, 8, 25, 15, 0, 0);
const at = (month: number, day: number) => new Date(2026, month, day, 12);

const occurrence = (start: Date, end: Date | null): ConfirmedPeriodOccurrence => ({
  id: `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`,
  periodStart: start.toISOString(),
  periodEndDateTime: end ? end.toISOString() : 'not-a-date',
  capturedAt: start.toISOString(),
});

const journal = (date: string, extra: Partial<DailyJournalEntry>): DailyJournalEntry => ({id: date, date, ...extra});

describe('cycle statistics — real data only', () => {
  it('no records: every statistic is an explicit "no data", never a default number', () => {
    expect(calculateAverageCycleDuration([])).toBeNull();
    expect(calculateCycleLengthRange([])).toBeNull();
    expect(calculateAveragePeriodDuration([], '12', NOW)).toBeNull();
    expect(calculateMoodDistribution([])).toEqual([]);
    expect(calculateSymptomFrequency([])).toEqual([]);
  });

  it('one period: no cycle length exists yet, but its real duration does', () => {
    const history = [occurrence(at(8, 10), at(8, 14))];
    const starts = filterPeriodStartsForPeriod(history, '3', NOW);
    expect(calculateAverageCycleDuration(starts)).toBeNull();
    expect(calculateCycleLengthRange(starts)).toBeNull();
    expect(calculateAveragePeriodDuration(history, '3', NOW)).toEqual({averageDays: 5, periodsAnalyzed: 1});
  });

  it('multiple periods: cycle lengths are the gaps between consecutive confirmed starts (not 28)', () => {
    const history = [
      occurrence(at(6, 2), at(6, 6)),
      occurrence(at(6, 27), at(6, 30)), // 25 days later, 4-day period
      occurrence(at(7, 25), at(7, 27)), // 29 days later, 3-day period
    ];
    const starts = filterPeriodStartsForPeriod(history, '12', NOW);
    expect(calculateAverageCycleDuration(starts)).toEqual({averageDays: 27, cyclesAnalyzed: 2});
    expect(calculateCycleLengthRange(starts)).toEqual({shortestDays: 25, longestDays: 29, cyclesAnalyzed: 2});
    expect(calculateAveragePeriodDuration(history, '12', NOW)).toEqual({averageDays: 4, periodsAnalyzed: 3});
  });

  it('irregular cycles: the spread is reported as it is', () => {
    const starts = [at(2, 1), at(2, 22), at(4, 10), at(5, 1)];
    expect(calculateCycleLengthRange(starts)).toEqual({shortestDays: 21, longestDays: 49, cyclesAnalyzed: 3});
  });

  it('incomplete periods (no usable end) never count towards the period duration', () => {
    const history = [occurrence(at(7, 2), null), occurrence(at(8, 3), at(8, 6))];
    expect(calculateAveragePeriodDuration(history, '3', NOW)).toEqual({averageDays: 4, periodsAnalyzed: 1});
    expect(calculateAveragePeriodDuration([occurrence(at(7, 2), null)], '3', NOW)).toBeNull();
  });

  it('an end before its start, or an implausibly long "period", is skipped rather than averaged', () => {
    expect(calculateAveragePeriodDuration([occurrence(at(8, 10), at(8, 5))], '3', NOW)).toBeNull();
    expect(calculateAveragePeriodDuration([occurrence(at(6, 1), at(8, 1))], '12', NOW)).toBeNull();
  });

  it('duplicate starts are counted once', () => {
    const history = [occurrence(at(8, 3), at(8, 7)), occurrence(at(8, 3), at(8, 7))];
    expect(calculateAveragePeriodDuration(history, '3', NOW)).toEqual({averageDays: 5, periodsAnalyzed: 1});
    expect(calculateAverageCycleDuration([at(8, 3), at(8, 3)])).toBeNull();
    expect(calculateCycleLengthRange([at(8, 3), at(8, 3)])).toBeNull();
  });

  it('deleted history: removing a period removes it from every statistic', () => {
    const full = [occurrence(at(6, 2), at(6, 6)), occurrence(at(6, 30), at(7, 3))];
    expect(calculateAverageCycleDuration(filterPeriodStartsForPeriod(full, '12', NOW))).toEqual({averageDays: 28, cyclesAnalyzed: 1});
    const afterDelete = full.slice(0, 1);
    expect(calculateAverageCycleDuration(filterPeriodStartsForPeriod(afterDelete, '12', NOW))).toBeNull();
    expect(calculateAveragePeriodDuration(afterDelete, '12', NOW)).toEqual({averageDays: 5, periodsAnalyzed: 1});
  });

  it('only periods inside the selected window are used', () => {
    const history = [occurrence(at(0, 5), at(0, 12)), occurrence(at(8, 10), at(8, 12))];
    expect(calculateAveragePeriodDuration(history, '1', NOW)).toEqual({averageDays: 3, periodsAnalyzed: 1});
    expect(calculateAveragePeriodDuration(history, '12', NOW)).toEqual({averageDays: 6, periodsAnalyzed: 2});
  });

  it('real symptom frequencies, most frequent first', () => {
    const entries = [
      journal('2026-09-20', {symptoms: {names: ['Crampes', 'Fatigue'], severity: 'mild'}}),
      journal('2026-09-21', {symptoms: {names: ['Crampes'], severity: 'mild'}}),
      journal('2026-09-22', {}),
    ];
    expect(calculateSymptomFrequency(entries)).toEqual([
      {name: 'Crampes', days: 2},
      {name: 'Fatigue', days: 1},
    ]);
  });

  it('real mood distribution: only recorded moods, most frequent first, days without a mood absent', () => {
    const mood = (level: 'good' | 'sad' | 'tired') => ({level, energy: 3, stress: 2, irritability: 1, motivation: 3});
    const entries = [
      journal('2026-09-20', {mood: mood('good')}),
      journal('2026-09-21', {mood: mood('good')}),
      journal('2026-09-22', {mood: mood('tired')}),
      journal('2026-09-23', {}),
    ];
    expect(calculateMoodDistribution(entries)).toEqual([
      {level: 'good', days: 2},
      {level: 'tired', days: 1},
    ]);
  });
});
