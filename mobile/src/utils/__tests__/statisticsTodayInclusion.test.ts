import {
  countRecordedStartsForPeriod,
  endOfStatisticsDay,
  filterEntriesForPeriod,
  filterPeriodStartsForPeriod,
  filterStartKeysForPeriod,
  isDateKeyWithinPeriod,
  STATISTICS_PERIODS,
  type StatisticsPeriod,
} from '../cycleStatisticsMath';
import {withinPeriod, resolvePostpartumCycleReturnEventInPeriod} from '../postpartumStatisticsMath';
import {resolveCycleReturnEventInPeriod} from '../miscarriageStatisticsMath';
import {cutoffDateForPeriod} from '../cycleStatisticsMath';

// H3 — Statistics windows compare CALENDAR days: today's own entry (anchored at
// local noon) is inside the window at any hour, tomorrow's never is, and the
// 1/3/6/12-month lookback is unchanged.
const TODAY_KEY = '2026-09-26';
const YESTERDAY_KEY = '2026-09-25';
const TOMORROW_KEY = '2026-09-27';

// Every hour that used to matter: just after midnight, morning, just before
// noon, exactly noon (the entry anchor), and the last minute of the day.
const CLOCKS: Array<[string, Date]> = [
  ['00:01', new Date(2026, 8, 26, 0, 1)],
  ['08:00', new Date(2026, 8, 26, 8, 0)],
  ['11:59', new Date(2026, 8, 26, 11, 59)],
  ['12:00', new Date(2026, 8, 26, 12, 0)],
  ['23:59', new Date(2026, 8, 26, 23, 59)],
];

describe.each(CLOCKS)('at %s on 2026-09-26', (_label, now) => {
  const entries = [{date: YESTERDAY_KEY}, {date: TODAY_KEY}, {date: TOMORROW_KEY}];

  it('journal entries: yesterday and TODAY included, tomorrow excluded (every period)', () => {
    for (const period of STATISTICS_PERIODS) {
      expect(filterEntriesForPeriod(entries, period, now).map(e => e.date)).toEqual([YESTERDAY_KEY, TODAY_KEY]);
    }
  });

  it('date-keyed helper (Pregnancy symptoms/weights/events)', () => {
    for (const period of STATISTICS_PERIODS) {
      expect(isDateKeyWithinPeriod(YESTERDAY_KEY, period, now)).toBe(true);
      expect(isDateKeyWithinPeriod(TODAY_KEY, period, now)).toBe(true);
      expect(isDateKeyWithinPeriod(TOMORROW_KEY, period, now)).toBe(false);
    }
  });

  it('postpartum entries (lochia / journal) via withinPeriod', () => {
    const cutoff = cutoffDateForPeriod('1', now);
    expect(withinPeriod(YESTERDAY_KEY, cutoff, now)).toBe(true);
    expect(withinPeriod(TODAY_KEY, cutoff, now)).toBe(true);
    expect(withinPeriod(TOMORROW_KEY, cutoff, now)).toBe(false);
  });

  it('SOPK period start keys and recorded starts', () => {
    expect(filterStartKeysForPeriod([YESTERDAY_KEY, TODAY_KEY, TOMORROW_KEY], '1', now).length).toBe(2);
    expect(
      countRecordedStartsForPeriod(
        [{startDate: YESTERDAY_KEY}, {startDate: TODAY_KEY}, {startDate: TOMORROW_KEY}],
        '1',
        now,
      ),
    ).toBe(2);
  });

  it('confirmed period starts', () => {
    const occ = (periodStart: string) => ({id: periodStart, periodStart, periodEndDateTime: periodStart, capturedAt: periodStart});
    const starts = filterPeriodStartsForPeriod(
      [occ(`${YESTERDAY_KEY}T12:00:00`), occ(`${TODAY_KEY}T12:00:00`), occ(`${TOMORROW_KEY}T12:00:00`)],
      '1',
      now,
    );
    expect(starts.length).toBe(2);
  });

  it('a cycle-return / first-period event recorded today is inside the window', () => {
    const cutoff = cutoffDateForPeriod('1', now);
    expect(resolveCycleReturnEventInPeriod('yes', new Date(`${TODAY_KEY}T12:00:00`), cutoff, now)).not.toBeNull();
    expect(resolveCycleReturnEventInPeriod('yes', new Date(`${TOMORROW_KEY}T12:00:00`), cutoff, now)).toBeNull();
    expect(resolvePostpartumCycleReturnEventInPeriod(TODAY_KEY, cutoff, now)).not.toBeNull();
    expect(resolvePostpartumCycleReturnEventInPeriod(TOMORROW_KEY, cutoff, now)).toBeNull();
  });
});

describe('Conceive-style boundary: `today` is the START of the day (00:00)', () => {
  const today = new Date(2026, 8, 26); // what useToday() hands to the Conceive screen
  it("today's noon-anchored entry is included — it was dropped for the whole day before", () => {
    expect(filterEntriesForPeriod([{date: TODAY_KEY}], '1', today)).toHaveLength(1);
    expect(filterEntriesForPeriod([{date: TOMORROW_KEY}], '1', today)).toHaveLength(0);
  });
});

describe('1 / 3 / 6 / 12-month lookback is unchanged', () => {
  const now = new Date(2026, 8, 26, 15, 30);
  const table: Array<[StatisticsPeriod, string, string]> = [
    // [period, oldest KEPT day, newest DROPPED day]
    ['1', '2026-08-26', '2026-08-25'],
    ['3', '2026-06-26', '2026-06-25'],
    ['6', '2026-03-26', '2026-03-25'],
    ['12', '2025-09-26', '2025-09-25'],
  ];
  it.each(table)('%s mois keeps its own first day and drops the day before', (period, kept, dropped) => {
    expect(filterEntriesForPeriod([{date: kept}, {date: dropped}], period, now).map(e => e.date)).toEqual([kept]);
  });

  it('the lower bound is the start of the day (independent of time of day)', () => {
    expect(cutoffDateForPeriod('3', new Date(2026, 8, 26, 23, 59))).toEqual(new Date(2026, 5, 26));
    expect(cutoffDateForPeriod('3', new Date(2026, 8, 26, 0, 1))).toEqual(new Date(2026, 5, 26));
  });

  it('endOfStatisticsDay is 23:59:59.999 of the same calendar day', () => {
    expect(endOfStatisticsDay(new Date(2026, 8, 26, 3, 0))).toEqual(new Date(2026, 8, 26, 23, 59, 59, 999));
  });
});
