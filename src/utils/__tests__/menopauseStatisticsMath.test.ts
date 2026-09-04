import {
  calculateSymptomMonthlyTrend,
  calculateSleepMonthlyTrend,
  calculateEnergyMonthlyTrend,
  calculateMoodMonthlyTrend,
  filterLabResultsForPeriod,
  buildLabChartPoints,
  ENERGY_VISUAL_SCORE,
} from '../menopauseStatisticsMath';
import type {MenopauseJournalEntry, MenopauseLabResult} from '../../state/menopauseJournalStore';

// Menopause's Premium longitudinal views — audited as real-data period
// TOTALS/averages with no true time-series evolution, and lab results that
// ignored the selected period entirely. Every test exercises the actual
// computed payload against real MenopauseJournalEntry/MenopauseLabResult
// fixtures — never a snapshot, never a mock array. No test asserts a
// normal/abnormal or diagnostic interpretation, because the functions never
// produce one — only real recorded counts/averages/dominant values.

const entry = (date: string, fields: Partial<MenopauseJournalEntry> = {}): MenopauseJournalEntry => ({date, ...fields});

describe('calculateSymptomMonthlyTrend — real per-symptom monthly day counts', () => {
  it('uses real journal data: hot_flashes counted per real calendar month', () => {
    const entries = [
      entry('2026-06-01', {symptoms: ['hot_flashes']}),
      entry('2026-06-02', {symptoms: ['hot_flashes', 'fatigue']}),
      entry('2026-07-01', {symptoms: ['fatigue']}),
    ];
    expect(calculateSymptomMonthlyTrend(entries, 'hot_flashes')).toEqual([
      {monthKey: '2026-06', monthLabel: 'Juin 2026', count: 2},
      {monthKey: '2026-07', monthLabel: 'Juillet 2026', count: 0},
    ]);
  });

  it('night_sweats: filters correctly within a real 1-month window', () => {
    const oneMonth = [entry('2026-08-10', {symptoms: ['night_sweats']})];
    expect(calculateSymptomMonthlyTrend(oneMonth, 'night_sweats')).toEqual([
      {monthKey: '2026-08', monthLabel: 'Août 2026', count: 1},
    ]);
  });

  it('sleep_disturbances: filters correctly across a real 3-month window', () => {
    const threeMonths = [
      entry('2026-06-05', {symptoms: ['sleep_disturbances']}),
      entry('2026-08-05', {symptoms: ['sleep_disturbances']}),
    ];
    expect(calculateSymptomMonthlyTrend(threeMonths, 'sleep_disturbances').map(m => m.count)).toEqual([1, 1]);
  });

  it('fatigue: filters correctly across a real 6-month window', () => {
    const sixMonths = [entry('2026-03-01', {symptoms: ['fatigue']}), entry('2026-08-01', {symptoms: []})];
    expect(calculateSymptomMonthlyTrend(sixMonths, 'fatigue')).toEqual([
      {monthKey: '2026-03', monthLabel: 'Mars 2026', count: 1},
      {monthKey: '2026-08', monthLabel: 'Août 2026', count: 0},
    ]);
  });

  it('mood_changes: filters correctly across a real 12-month window', () => {
    const twelveMonths = [entry('2025-09-01', {symptoms: ['mood_changes']}), entry('2026-08-01', {symptoms: ['mood_changes']})];
    expect(calculateSymptomMonthlyTrend(twelveMonths, 'mood_changes').map(m => m.count)).toEqual([1, 1]);
  });

  it('brain_fog: real data, never a fabricated field', () => {
    const entries = [entry('2026-08-01', {symptoms: ['brain_fog']}), entry('2026-08-02', {symptoms: []})];
    expect(calculateSymptomMonthlyTrend(entries, 'brain_fog')).toEqual([{monthKey: '2026-08', monthLabel: 'Août 2026', count: 1}]);
  });

  it('never fabricates a trend for zero real entries', () => {
    expect(calculateSymptomMonthlyTrend([], 'hot_flashes')).toEqual([]);
  });
});

describe('calculateSleepMonthlyTrend', () => {
  it('uses real recorded sleepDurationHours, averaged per real month', () => {
    const entries = [
      entry('2026-08-01', {sleepDurationHours: 6}),
      entry('2026-08-02', {sleepDurationHours: 8}),
      entry('2026-08-03', {}), // not recorded — excluded, never counted as 0h
    ];
    expect(calculateSleepMonthlyTrend(entries)).toEqual([
      {monthKey: '2026-08', monthLabel: 'Août 2026', averageHours: 7, count: 2},
    ]);
  });

  it('omits months with no recorded sleep duration entirely — never a fabricated 0h bar', () => {
    expect(calculateSleepMonthlyTrend([entry('2026-08-01', {})])).toEqual([]);
  });
});

describe('calculateEnergyMonthlyTrend', () => {
  it('uses real stored low/medium/high values — never a fabricated numeric level', () => {
    const entries = [
      entry('2026-08-01', {energyLevel: 'low'}),
      entry('2026-08-02', {energyLevel: 'low'}),
      entry('2026-08-03', {energyLevel: 'high'}),
    ];
    const result = calculateEnergyMonthlyTrend(entries);
    expect(result).toHaveLength(1);
    expect(result[0].dominantLevel).toBe('low');
    expect(result[0].count).toBe(3);
  });

  it('the visualization score only ever maps the 3 real stored energy levels', () => {
    expect(ENERGY_VISUAL_SCORE).toEqual({low: 1, medium: 2, high: 3});
  });

  it('omits months with no recorded energy level', () => {
    expect(calculateEnergyMonthlyTrend([entry('2026-08-01', {})])).toEqual([]);
  });
});

describe('calculateMoodMonthlyTrend', () => {
  it('returns the real dominant (most-recorded) mood per month — never a fabricated score', () => {
    const entries = [
      entry('2026-08-01', {mood: 'tired'}),
      entry('2026-08-02', {mood: 'tired'}),
      entry('2026-08-03', {mood: 'good'}),
    ];
    const result = calculateMoodMonthlyTrend(entries);
    expect(result).toEqual([{monthKey: '2026-08', monthLabel: 'Août 2026', dominantMood: 'tired', dominantCount: 2, totalCount: 3}]);
  });

  it('omits months with no recorded mood', () => {
    expect(calculateMoodMonthlyTrend([entry('2026-08-01', {})])).toEqual([]);
  });

  it('never adds a diagnostic/interpretive field — only the real recorded mood value', () => {
    const result = calculateMoodMonthlyTrend([entry('2026-08-01', {mood: 'anxious'})]);
    expect(Object.keys(result[0]).sort()).toEqual(['dominantCount', 'dominantMood', 'monthKey', 'monthLabel', 'totalCount'].sort());
  });
});

describe('filterLabResultsForPeriod — the previously-missing lab period filter', () => {
  const labResult = (id: string, date: string, value: number): MenopauseLabResult => ({
    id, type: 'fsh', value, date, recordedAt: `${date}T08:00:00.000Z`,
  });

  it('excludes real results older than the selected period cutoff', () => {
    const results = [labResult('a', '2026-01-01', 40), labResult('b', '2026-08-01', 55)];
    const cutoff = new Date('2026-06-15T12:00:00');
    expect(filterLabResultsForPeriod(results, cutoff)).toEqual([labResult('b', '2026-08-01', 55)]);
  });

  it('keeps a result exactly at the cutoff (inclusive)', () => {
    const cutoff = new Date('2026-06-15T12:00:00');
    const results = [labResult('a', '2026-06-15', 40)];
    expect(filterLabResultsForPeriod(results, cutoff)).toHaveLength(1);
  });

  it('returns real chronological order regardless of storage order', () => {
    const results = [labResult('b', '2026-08-01', 55), labResult('a', '2026-06-01', 40)];
    const cutoff = new Date('2026-01-01T12:00:00');
    expect(filterLabResultsForPeriod(results, cutoff).map(r => r.id)).toEqual(['a', 'b']);
  });

  it('zero results in range yields an empty array — the caller renders the empty state', () => {
    const cutoff = new Date('2026-06-15T12:00:00');
    expect(filterLabResultsForPeriod([labResult('a', '2026-01-01', 40)], cutoff)).toEqual([]);
  });
});

describe('buildLabChartPoints — real graphical history, never a fake trend', () => {
  const labResult = (id: string, date: string, value: number): MenopauseLabResult => ({
    id, type: 'estradiol', value, date, recordedAt: `${date}T08:00:00.000Z`,
  });

  it('a single real result does NOT produce a fabricated trend — empty chart points', () => {
    expect(buildLabChartPoints([labResult('a', '2026-08-01', 45)])).toEqual([]);
  });

  it('zero results produce an empty chart — the caller shows an empty state', () => {
    expect(buildLabChartPoints([])).toEqual([]);
  });

  it('2+ real results produce genuine graphical points scaled from real values, in chronological order', () => {
    const results = [labResult('a', '2026-06-01', 20), labResult('b', '2026-08-01', 60)];
    const points = buildLabChartPoints(results);
    expect(points).toHaveLength(2);
    expect(points[0].key).toBe('a');
    expect(points[1].key).toBe('b');
    expect(points[0].value).toBeLessThan(points[1].value);
  });

  it('never colors or labels a result as normal/abnormal — only key/label/value/maxValue exist', () => {
    const results = [labResult('a', '2026-06-01', 20), labResult('b', '2026-08-01', 999)];
    const points = buildLabChartPoints(results);
    expect(Object.keys(points[0]).sort()).toEqual(['key', 'label', 'maxValue', 'value'].sort());
  });
});
