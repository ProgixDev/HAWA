import {
  calculateLhMonthlyTrend,
  buildMucusTimeline,
  MUCUS_FERTILITY_ORDER,
} from '../conceptionStatisticsMath';
import type {DailyJournalEntry} from '../../types/journal';

// TTC's Premium longitudinal LH/mucus views (audited as static
// distributions only, now real month-by-month/chronological evolutions).
// Every test here exercises the actual computed payload against real
// DailyJournalEntry fixtures — never a snapshot, never a mock array.

function entryWithLh(date: string, result: 'negative' | 'positive' | 'invalid'): DailyJournalEntry & {lhTest: NonNullable<DailyJournalEntry['lhTest']>} {
  return {date, lhTest: {result}} as never;
}

function entryWithMucus(date: string, type: 'dry' | 'sticky' | 'creamy' | 'watery' | 'eggWhite'): DailyJournalEntry & {cervicalMucus: NonNullable<DailyJournalEntry['cervicalMucus']>} {
  return {date, cervicalMucus: {type}} as never;
}

describe('calculateLhMonthlyTrend — real per-month LH test counts', () => {
  it('uses real recorded data: counts positive vs total tests per real calendar month', () => {
    const entries = [
      entryWithLh('2026-06-10', 'negative'),
      entryWithLh('2026-06-14', 'positive'),
      entryWithLh('2026-07-12', 'negative'),
    ];
    expect(calculateLhMonthlyTrend(entries)).toEqual([
      {monthKey: '2026-06', monthLabel: 'Juin 2026', positiveCount: 1, totalCount: 2},
      {monthKey: '2026-07', monthLabel: 'Juillet 2026', positiveCount: 0, totalCount: 1},
    ]);
  });

  it('filters by whatever period-filtered entries are passed in — 1 month window', () => {
    const oneMonth = [entryWithLh('2026-08-05', 'positive')];
    expect(calculateLhMonthlyTrend(oneMonth)).toEqual([
      {monthKey: '2026-08', monthLabel: 'Août 2026', positiveCount: 1, totalCount: 1},
    ]);
  });

  it('filters by a wider 3-month window — every real month present is returned', () => {
    const threeMonths = [
      entryWithLh('2026-06-01', 'positive'),
      entryWithLh('2026-07-01', 'negative'),
      entryWithLh('2026-08-01', 'positive'),
    ];
    expect(calculateLhMonthlyTrend(threeMonths).map(m => m.monthKey)).toEqual(['2026-06', '2026-07', '2026-08']);
  });

  it('filters by a 6-month window — real months only, none fabricated', () => {
    const sixMonths = [entryWithLh('2026-03-01', 'positive'), entryWithLh('2026-08-01', 'negative')];
    const result = calculateLhMonthlyTrend(sixMonths);
    expect(result).toHaveLength(2);
    expect(result.map(m => m.monthKey)).toEqual(['2026-03', '2026-08']);
  });

  it('filters by a 12-month window — a full year of real months, no gaps invented', () => {
    const twelveMonths = [entryWithLh('2025-09-01', 'negative'), entryWithLh('2026-08-01', 'positive')];
    const result = calculateLhMonthlyTrend(twelveMonths);
    expect(result.map(m => m.monthKey)).toEqual(['2025-09', '2026-08']);
  });

  it('never fabricates a trend for zero real records', () => {
    expect(calculateLhMonthlyTrend([])).toEqual([]);
  });

  it('never invents an ordinal LH scale — only real negative/positive/invalid counts', () => {
    const entries = [entryWithLh('2026-08-01', 'invalid'), entryWithLh('2026-08-02', 'positive')];
    const result = calculateLhMonthlyTrend(entries);
    expect(result[0].positiveCount).toBe(1);
    expect(result[0].totalCount).toBe(2);
  });
});

describe('MUCUS_FERTILITY_ORDER — visualization-only mapping of real stored states', () => {
  it('only maps the 5 real CervicalMucusType states actually stored in the app', () => {
    expect(Object.keys(MUCUS_FERTILITY_ORDER).sort()).toEqual(['creamy', 'dry', 'eggWhite', 'sticky', 'watery'].sort());
  });

  it('orders them along the standard fertility-awareness sequence', () => {
    expect(MUCUS_FERTILITY_ORDER.dry).toBeLessThan(MUCUS_FERTILITY_ORDER.sticky);
    expect(MUCUS_FERTILITY_ORDER.sticky).toBeLessThan(MUCUS_FERTILITY_ORDER.creamy);
    expect(MUCUS_FERTILITY_ORDER.creamy).toBeLessThan(MUCUS_FERTILITY_ORDER.watery);
    expect(MUCUS_FERTILITY_ORDER.watery).toBeLessThan(MUCUS_FERTILITY_ORDER.eggWhite);
  });
});

describe('buildMucusTimeline — real chronological observation timeline', () => {
  it('uses real recorded data — date, type and its visualization order', () => {
    const entries = [entryWithMucus('2026-08-01', 'dry'), entryWithMucus('2026-08-05', 'eggWhite')];
    expect(buildMucusTimeline(entries, 20)).toEqual([
      {date: '2026-08-01', type: 'dry', order: 0},
      {date: '2026-08-05', type: 'eggWhite', order: 4},
    ]);
  });

  it('respects the selected-period entries passed in (caller already filtered by 1/3/6/12 months)', () => {
    const onlyAugust = [entryWithMucus('2026-08-01', 'watery')];
    expect(buildMucusTimeline(onlyAugust, 20)).toHaveLength(1);
  });

  it('caps the timeline for chart readability without altering the real recorded values', () => {
    const manyEntries = Array.from({length: 25}, (_, index) => entryWithMucus(`2026-08-${String(index + 1).padStart(2, '0')}`, 'creamy'));
    const timeline = buildMucusTimeline(manyEntries, 20);
    expect(timeline).toHaveLength(20);
    expect(timeline[timeline.length - 1].date).toBe('2026-08-25');
  });

  it('returns an empty timeline for zero real observations — never a fabricated point', () => {
    expect(buildMucusTimeline([], 20)).toEqual([]);
  });
});
