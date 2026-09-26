// H8 - getPillPackDay must count CALENDAR days. With the previous
// floor(ms / 86_400_000) a span containing the spring-forward change (a 23-hour
// day) came out one day short.
//
// The assertions are valid in EVERY zone, but they only discriminate the old
// bug in a zone that observes DST: run `TZ=Europe/Paris npx jest <file>` on
// Linux/macOS/CI. Node on Windows ignores TZ, so on a no-DST machine the
// spring/autumn cases below pass without exercising a DST change - the
// `zone` test records which situation a given run was in.
import {getCyclicPillSchedule, getPillPackDay, isPillBreakDateKey} from '../contraceptionMath';

const key = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day, 12).toLocaleDateString('en-CA');
const addKey = (start: string, offset: number) => {
  const [y, m, d] = start.split('-').map(Number);
  return new Date(y, m - 1, d + offset, 12).toLocaleDateString('en-CA');
};

const offsetAt = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTimezoneOffset();
const zoneHasDst = offsetAt(2026, 1, 15) !== offsetAt(2026, 7, 15);
// DST cases below are written for the EU rules (change on 2026-03-29 / 2026-10-25).
const zoneIsEuDst = zoneHasDst && offsetAt(2026, 3, 28) !== offsetAt(2026, 3, 30) && offsetAt(2026, 10, 24) !== offsetAt(2026, 10, 26);
const dstIt = it;

describe('getPillPackDay - calendar days', () => {
  it('zone under test (informational): reports whether a DST change is actually exercised', () => {
    console.info(`[H8] time zone has EU DST changes in this run: ${zoneIsEuDst}`);
    expect(typeof zoneIsEuDst).toBe('boolean');
  });

  it('same day is pack day 1 and the next day is 2', () => {
    expect(getPillPackDay('2026-03-01', '2026-03-01', 28)).toBe(1);
    expect(getPillPackDay('2026-03-01', '2026-03-02', 28)).toBe(2);
  });

  dstIt('crossing the SPRING-forward change: start Mar 28 -> Apr 1 is pack day 5 (was 4 with the ms floor)', () => {
    expect(getPillPackDay('2026-03-28', '2026-03-28', 28)).toBe(1);
    expect(getPillPackDay('2026-03-28', '2026-03-29', 28)).toBe(2);
    expect(getPillPackDay('2026-03-28', '2026-03-30', 28)).toBe(3);
    expect(getPillPackDay('2026-03-28', '2026-04-01', 28)).toBe(5);
  });

  dstIt('crossing the AUTUMN change: start Oct 22 -> Oct 28 is pack day 7', () => {
    expect(getPillPackDay('2026-10-22', '2026-10-25', 28)).toBe(4);
    expect(getPillPackDay('2026-10-22', '2026-10-26', 28)).toBe(5);
    expect(getPillPackDay('2026-10-22', '2026-10-28', 28)).toBe(7);
  });

  dstIt('a full 21 + 7 pack that STRADDLES the spring change keeps its boundaries (break = days 22-28)', () => {
    const start = '2026-03-15'; // day 15 is Mar 29 (change day)
    const schedule = getCyclicPillSchedule({method: 'pill', pillScheduleType: 'cyclic', activeDays: 21, breakDays: 7});
    for (let offset = 0; offset < 28; offset += 1) {
      const date = addKey(start, offset);
      expect(getPillPackDay(start, date, 28)).toBe(offset + 1);
      expect(isPillBreakDateKey(date, start, schedule)).toBe(offset + 1 > 21);
    }
  });

  dstIt('multiple packs across the change: pack 2 starts exactly 28 calendar days later, pack 3 after 56', () => {
    const start = '2026-03-10';
    expect(getPillPackDay(start, addKey(start, 27), 28)).toBe(28);
    expect(getPillPackDay(start, addKey(start, 28), 28)).toBe(1); // crosses Mar 29
    expect(getPillPackDay(start, addKey(start, 55), 28)).toBe(28);
    expect(getPillPackDay(start, addKey(start, 56), 28)).toBe(1);
    expect(getPillPackDay(start, key(2026, 5, 5), 28)).toBe(1); // 56 days after Mar 10
  });

  it('before the start / no start / invalid date stay null', () => {
    expect(getPillPackDay('2026-03-10', '2026-03-09', 28)).toBeNull();
    expect(getPillPackDay(null, '2026-03-09', 28)).toBeNull();
    expect(getPillPackDay('nope', '2026-03-09', 28)).toBeNull();
  });
});
