import {
  computeIrregularMonthlySummary,
  computeVisibleDayMarkers,
  countPeriodDaysInMonth,
} from '../irregularCalendarMath';
import type {IrregularJournalEntry} from '../../state/irregularJournalStore';
import type {DailyJournalEntry} from '../../types/journal';

const irregularEntry = (date: string, fields: Partial<IrregularJournalEntry> = {}): IrregularJournalEntry => ({
  date,
  ...fields,
});

const journalEntry = (date: string, fields: Partial<DailyJournalEntry> = {}): DailyJournalEntry => ({
  id: date,
  date,
  ...fields,
});

describe('countPeriodDaysInMonth', () => {
  it('counts only real recorded flow days within the given month', () => {
    const entries = [
      journalEntry('2026-08-01', {flow: {intensity: 'moderate'}}),
      journalEntry('2026-08-02', {flow: {intensity: 'light'}}),
      journalEntry('2026-07-30', {flow: {intensity: 'heavy'}}), // different month — excluded
      journalEntry('2026-08-03', {}), // no flow recorded — excluded
    ];
    expect(countPeriodDaysInMonth(entries, 2026, 7)).toBe(2);
  });

  it('never classifies a long cycle as late — this function only counts real recorded days', () => {
    expect(countPeriodDaysInMonth([], 2026, 7)).toBe(0);
  });
});

describe('computeVisibleDayMarkers', () => {
  // Règles + 6 SOPK categories = up to 7 real same-day markers.
  const ALL_SEVEN = ['period', 'acne', 'hairGrowth', 'weight', 'pain', 'mood', 'fatigue'] as const;

  it('A. 0 markers — nothing to show, no overflow', () => {
    expect(computeVisibleDayMarkers([], 4)).toEqual({visible: [], overflowCount: 0});
  });

  it('B. 1 marker — shown as-is, no overflow', () => {
    expect(computeVisibleDayMarkers(['period'], 4)).toEqual({visible: ['period'], overflowCount: 0});
  });

  it('C. 4 markers — all visible, no overflow badge', () => {
    const categories = ALL_SEVEN.slice(0, 4);
    expect(computeVisibleDayMarkers(categories, 4)).toEqual({visible: [...categories], overflowCount: 0});
  });

  it('D. 7 markers — capped at the visible limit, remainder reported as overflow, never dropped silently', () => {
    const result = computeVisibleDayMarkers(ALL_SEVEN, 3);
    expect(result.visible).toEqual(['period', 'acne', 'hairGrowth']);
    expect(result.overflowCount).toBe(4);
    // 3 shown + 4 overflow accounts for exactly the 7 real categories — no data lost.
    expect(result.visible.length + result.overflowCount).toBe(ALL_SEVEN.length);
  });

  it('E. never introduces a duplicate — the visible slice is a subset of the input with no repeats', () => {
    const result = computeVisibleDayMarkers(ALL_SEVEN, 4);
    expect(new Set(result.visible).size).toBe(result.visible.length);
    result.visible.forEach(category => expect(ALL_SEVEN).toContain(category));
  });

  it('exactly at the limit (5 markers, limit 5) never shows a "+0" overflow', () => {
    const categories = ALL_SEVEN.slice(0, 5);
    expect(computeVisibleDayMarkers(categories, 5).overflowCount).toBe(0);
  });

  it('F/G. overflow recalculates from the ACTIVE (already filtered) category list, never the hidden total', () => {
    // Simulates disabling 3 filters (Poids/Humeur/Douleurs) out of 7 recorded
    // categories — the caller passes only the remaining 4 active categories,
    // so overflow must be 0, never based on the original 7.
    const afterFilters = ['period', 'acne', 'hairGrowth', 'fatigue'];
    expect(computeVisibleDayMarkers(afterFilters, 4)).toEqual({visible: afterFilters, overflowCount: 0});
  });
});

describe('computeIrregularMonthlySummary', () => {
  it('counts distinct days per category, scoped to exactly one calendar month', () => {
    const entriesByDate = {
      '2026-08-01': irregularEntry('2026-08-01', {acne: 'Légère', pain: 'Forte'}),
      '2026-08-05': irregularEntry('2026-08-05', {fatigue: 'Modérée'}),
      '2026-07-20': irregularEntry('2026-07-20', {acne: 'Forte'}), // different month — excluded
    };
    const journalEntries = [journalEntry('2026-08-02', {flow: {intensity: 'light'}})];

    const summary = computeIrregularMonthlySummary(entriesByDate, journalEntries, 2026, 7);

    expect(summary).toEqual({
      periodDays: 1,
      acneDays: 1,
      hairGrowthDays: 0,
      painDays: 1,
      fatigueDays: 1,
      moodDays: 0,
      weightDays: 0,
      hasAnyDataThisMonth: true,
    });
  });

  it('reports no data when nothing was recorded that month — never a fabricated zero-with-data state', () => {
    const summary = computeIrregularMonthlySummary({}, [], 2026, 7);
    expect(summary.hasAnyDataThisMonth).toBe(false);
  });
});
