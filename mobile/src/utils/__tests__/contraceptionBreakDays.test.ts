import {
  computeContraceptionBestStreak,
  computeContraceptionMonthlySummary,
  computeContraceptionRangeSummary,
  getCyclicPillSchedule,
  isPillBreakDateKey,
} from '../contraceptionMath';
import type {ContraceptionIntakeRecord} from '../../state/contraceptionIntakeHistoryStore';

// H7 - a cyclic pill break (arret) day is NOT an expected intake: it is not
// missed, not "non enregistree", does not break a streak and does not lower the
// regularity. Continuous / unknown / other keep their previous behaviour.
const key = (base: Date, offset: number) => {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, 12);
  return d.toLocaleDateString('en-CA');
};
const START = new Date(2026, 8, 1); // day 1 of a 21 + 7 pack on 2026-09-01
const START_KEY = key(START, 0);
const SCHEDULE_21_7 = getCyclicPillSchedule({method: 'pill', pillScheduleType: 'cyclic', activeDays: 21, breakDays: 7});

const record = (date: string, status: ContraceptionIntakeRecord['status']): ContraceptionIntakeRecord => ({
  date,
  status,
  recordedAt: `${date}T08:00:00.000Z`,
});

/** Perfect adherence: `taken` on every ACTIVE day of packs 1 and 2 up to `lastOffset`. */
const perfectRecords = (lastOffset: number) => {
  const out: Record<string, ContraceptionIntakeRecord> = {};
  for (let offset = 0; offset <= lastOffset; offset += 1) {
    const packDay = (offset % 28) + 1;
    if (packDay <= 21) {
      const date = key(START, offset);
      out[date] = record(date, 'taken');
    }
  }
  return out;
};

describe('getCyclicPillSchedule / isPillBreakDateKey', () => {
  it('a cyclic pill schedule exposes its break days (pack days 22-28)', () => {
    expect(SCHEDULE_21_7).toEqual({activeDays: 21, totalDays: 28});
    expect(isPillBreakDateKey(key(START, 20), START_KEY, SCHEDULE_21_7)).toBe(false); // day 21
    expect(isPillBreakDateKey(key(START, 21), START_KEY, SCHEDULE_21_7)).toBe(true); // day 22
    expect(isPillBreakDateKey(key(START, 27), START_KEY, SCHEDULE_21_7)).toBe(true); // day 28
    expect(isPillBreakDateKey(key(START, 28), START_KEY, SCHEDULE_21_7)).toBe(false); // pack 2, day 1
  });

  it('continuous / unknown / unconfigured / ring / patch / other have NO break days', () => {
    const none = [
      {method: 'pill', pillScheduleType: 'continuous', activeDays: null, breakDays: null},
      {method: 'pill', pillScheduleType: 'unknown', activeDays: 21, breakDays: 7},
      {method: 'pill', pillScheduleType: null, activeDays: null, breakDays: null},
      {method: 'ring', pillScheduleType: 'cyclic', activeDays: 21, breakDays: 7},
      {method: 'patch', pillScheduleType: 'cyclic', activeDays: 21, breakDays: 7},
      {method: 'other', pillScheduleType: 'cyclic', activeDays: 21, breakDays: 7},
    ];
    for (const prefs of none) {
      expect(getCyclicPillSchedule(prefs)).toBeNull();
    }
    expect(isPillBreakDateKey(key(START, 22), START_KEY, null)).toBe(false);
  });
});

describe('adherence over a full 21 + 7 pack', () => {
  const lastOffset = 27; // the whole first pack
  const endKey = key(START, lastOffset);

  it('perfect intake on every ACTIVE day is 100% - break days are not missed nor unrecorded', () => {
    const summary = computeContraceptionRangeSummary(perfectRecords(lastOffset), START_KEY, endKey, START_KEY, SCHEDULE_21_7);
    expect(summary).toEqual({taken: 21, late: 0, missed: 0, notRecorded: 0, regularityPercent: 100});
  });

  it('WITHOUT a schedule (continuous / other) the 7 empty days still count as unrecorded - unchanged', () => {
    const summary = computeContraceptionRangeSummary(perfectRecords(lastOffset), START_KEY, endKey, START_KEY, null);
    expect(summary.notRecorded).toBe(7);
    expect(summary.regularityPercent).toBe(75);
  });

  it('a genuinely missed ACTIVE day is still counted, a "missed" on a break day is not', () => {
    const records = perfectRecords(lastOffset);
    records[key(START, 4)] = record(key(START, 4), 'missed'); // active day 5
    records[key(START, 23)] = record(key(START, 23), 'missed'); // break day 24
    const summary = computeContraceptionRangeSummary(records, START_KEY, endKey, START_KEY, SCHEDULE_21_7);
    expect(summary.missed).toBe(1);
    expect(summary.taken).toBe(20);
    expect(summary.regularityPercent).toBe(Math.round((20 / 21) * 100));
  });
});

describe('best streak', () => {
  it('passes THROUGH break days: 21 active + 7 break + 7 active = 28 consecutive expected intakes', () => {
    const records = perfectRecords(34); // packs: days 1-21 taken, 29-35 taken
    expect(computeContraceptionBestStreak(records, START_KEY, key(START, 34), START_KEY, SCHEDULE_21_7)).toBe(28);
  });

  it('without a schedule the break days end the streak (unchanged)', () => {
    const records = perfectRecords(34);
    expect(computeContraceptionBestStreak(records, START_KEY, key(START, 34))).toBe(21);
  });

  it('a missed active day still ends it', () => {
    const records = perfectRecords(34);
    delete records[key(START, 10)];
    expect(computeContraceptionBestStreak(records, START_KEY, key(START, 34), START_KEY, SCHEDULE_21_7)).toBe(28 - 11);
  });
});

describe('Calendar monthly summary', () => {
  it('excludes break days from the expected days (September 2026, method started Sept 1, today Sept 28)', () => {
    const records = perfectRecords(27);
    const withSchedule = computeContraceptionMonthlySummary(records, new Date(2026, 8, 1), '2026-09-28', START_KEY, SCHEDULE_21_7);
    expect(withSchedule).toMatchObject({taken: 21, missed: 0, notRecorded: 0, regularityPercent: 100});

    const without = computeContraceptionMonthlySummary(records, new Date(2026, 8, 1), '2026-09-28', START_KEY, null);
    expect(without.notRecorded).toBe(7);
    expect(without.regularityPercent).toBe(75);
  });
});
