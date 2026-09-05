import {
  FREE_HISTORY_WINDOW_DAYS,
  filterRecordsForHistoryAccess,
  getHistoryLowerBound,
  isDateWithinHistoryAccess,
  isMonthWithinHistoryAccess,
} from '../historyAccess';

// The shared "Historique illimité" entitlement gate — pure, read-only, never
// touches AsyncStorage. These tests exercise the actual boundary math
// against real Date fixtures, never a mock, and explicitly prove this file
// has no relationship to the separate Statistics 1/3/6/12-month
// architecture (cycleStatisticsMath.ts), which stays untouched.

const NOW = new Date('2026-09-15T12:00:00');

describe('getHistoryLowerBound', () => {
  it('FREE users get a finite lower bound', () => {
    const bound = getHistoryLowerBound(false, NOW);
    expect(bound).not.toBeNull();
  });

  it('PREMIUM users get no artificial lower bound (null)', () => {
    expect(getHistoryLowerBound(true, NOW)).toBeNull();
  });

  it('the FREE bound is exactly the configured window, inclusive of today', () => {
    const bound = getHistoryLowerBound(false, NOW)!;
    // 2026-09-15 minus (30 - 1) days = 2026-08-17
    expect(bound.toLocaleDateString('en-CA')).toBe('2026-08-17');
    expect(FREE_HISTORY_WINDOW_DAYS).toBe(30);
  });
});

describe('isDateWithinHistoryAccess', () => {
  it('a recent FREE record (within the last 30 days) is accessible', () => {
    expect(isDateWithinHistoryAccess(new Date('2026-09-01T00:00:00'), false, NOW)).toBe(true);
  });

  it('an older FREE record (outside the last 30 days) is locked', () => {
    expect(isDateWithinHistoryAccess(new Date('2026-06-01T00:00:00'), false, NOW)).toBe(false);
  });

  it('the exact same older record is accessible for Premium', () => {
    expect(isDateWithinHistoryAccess(new Date('2026-06-01T00:00:00'), true, NOW)).toBe(true);
  });

  it('a record more than 12 months old remains accessible for Premium — no artificial cutoff', () => {
    expect(isDateWithinHistoryAccess(new Date('2023-01-15T00:00:00'), true, NOW)).toBe(true);
    expect(isDateWithinHistoryAccess(new Date('2020-01-01T00:00:00'), true, NOW)).toBe(true);
  });

  it('a record more than 12 months old is still locked for Free — no special-cased exemption', () => {
    expect(isDateWithinHistoryAccess(new Date('2023-01-15T00:00:00'), false, NOW)).toBe(false);
  });

  it('the boundary date itself (exactly at the cutoff) is accessible (inclusive)', () => {
    const bound = getHistoryLowerBound(false, NOW)!;
    expect(isDateWithinHistoryAccess(bound, false, NOW)).toBe(true);
  });

  it('one day before the boundary is locked', () => {
    const bound = getHistoryLowerBound(false, NOW)!;
    const dayBefore = new Date(bound);
    dayBefore.setDate(dayBefore.getDate() - 1);
    expect(isDateWithinHistoryAccess(dayBefore, false, NOW)).toBe(false);
  });

  it('is timezone-safe: only the local calendar day matters, not the time-of-day component', () => {
    const lateNight = new Date('2026-08-17T23:59:00');
    const earlyMorning = new Date('2026-08-17T00:00:01');
    expect(isDateWithinHistoryAccess(lateNight, false, NOW)).toBe(true);
    expect(isDateWithinHistoryAccess(earlyMorning, false, NOW)).toBe(true);
  });
});

describe('isMonthWithinHistoryAccess — Calendar month navigation', () => {
  it('the current month is always reachable for Free', () => {
    expect(isMonthWithinHistoryAccess(new Date('2026-09-01T00:00:00'), false, NOW)).toBe(true);
  });

  it('the boundary month (the one the 30-day window cuts through) stays reachable', () => {
    // Bound is 2026-08-17, so August 2026 still has reachable days.
    expect(isMonthWithinHistoryAccess(new Date('2026-08-01T00:00:00'), false, NOW)).toBe(true);
  });

  it('a month entirely before the boundary is locked for Free', () => {
    expect(isMonthWithinHistoryAccess(new Date('2026-07-01T00:00:00'), false, NOW)).toBe(false);
  });

  it('every month, however old, is reachable for Premium', () => {
    expect(isMonthWithinHistoryAccess(new Date('2024-01-01T00:00:00'), true, NOW)).toBe(true);
    expect(isMonthWithinHistoryAccess(new Date('2018-06-01T00:00:00'), true, NOW)).toBe(true);
  });
});

describe('filterRecordsForHistoryAccess', () => {
  const records = [
    {date: '2026-09-10', value: 'recent'},
    {date: '2026-08-01', value: 'boundary-ish'},
    {date: '2026-05-01', value: 'old'},
    {date: '2023-01-01', value: 'very-old'},
  ];

  it('Premium sees every real record, however old — no artificial cutoff', () => {
    const result = filterRecordsForHistoryAccess(records, true, NOW);
    expect(result).toHaveLength(4);
    expect(result.map(r => r.value)).toEqual(['recent', 'boundary-ish', 'old', 'very-old']);
  });

  it('Free sees only records inside the allowed window', () => {
    const result = filterRecordsForHistoryAccess(records, false, NOW);
    expect(result.map(r => r.value)).toEqual(['recent']);
  });

  it('never mutates the source array', () => {
    const original = [...records];
    filterRecordsForHistoryAccess(records, false, NOW);
    expect(records).toEqual(original);
  });

  it('downgrade never deletes data — filtering is purely a read-time view, the input records are untouched', () => {
    const before = records.length;
    filterRecordsForHistoryAccess(records, false, NOW);
    filterRecordsForHistoryAccess(records, true, NOW);
    expect(records).toHaveLength(before);
  });
});

describe('independence from the Statistics 1/3/6/12-month architecture', () => {
  it('this module exports nothing named after or shaped like a statistics period', () => {
    const historyAccessModule = require('../historyAccess');
    expect(historyAccessModule.STATISTICS_PERIODS).toBeUndefined();
    expect(historyAccessModule.isPeriodFree).toBeUndefined();
  });
});
