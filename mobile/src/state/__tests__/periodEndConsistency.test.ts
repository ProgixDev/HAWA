import {
  correctPeriodOccurrence,
  getPeriodEndDateTime,
  getRecordedPeriodHistory,
  setCyclePreferences,
  setPeriodEndDateTime,
} from '../onboardingPreferences';
import {getConfirmedPeriodHistory, recordConfirmedPeriodEnd} from '../confirmedPeriodHistoryStore';

// Data consistency only: the user-confirmed end of the CURRENT period
// (periodEndDateTime, read by purity/prayer) must not disagree with the
// recorded range once that range is corrected. No religious rule is involved -
// a mismatching scalar is dropped (nothing invented), an older/unrelated period
// and its confirmed history are never touched.
const day = (month: number, date: number, hour = 12, year = 2026) => new Date(year, month - 1, date, hour);
const key = (date: Date | null) => (date ? date.toLocaleDateString('en-CA') : null);
const habits = {periodDuration: 5, cycleDuration: 28, regularity: 'yes' as const};

// The stores are module singletons: every test builds its own history on
// distinct months so the tests do not depend on each other.
const seedCurrentPeriod = async (start: Date, end: Date) => {
  setCyclePreferences({lastPeriodStart: start, ...habits});
  await setPeriodEndDateTime(end);
  await recordConfirmedPeriodEnd(start, end);
};

describe('correcting the CURRENT period range vs the confirmed end (periodEndDateTime)', () => {
  it('confirmed end Sep 5 -> range corrected to end Sep 7: the stale Sep 5 end is dropped, recorded end is Sep 7', async () => {
    await seedCurrentPeriod(day(9, 1), day(9, 5));
    expect(key(getPeriodEndDateTime())).toBe('2026-09-05');

    await correctPeriodOccurrence(day(9, 1), day(9, 1), day(9, 7));

    expect(getPeriodEndDateTime()).toBeNull();
    const record = getRecordedPeriodHistory().find(item => item.startDate === '2026-09-01');
    expect(record?.endDate).toBe('2026-09-07');
    // The confirmed occurrence for the OLD range no longer describes the period.
    expect(getConfirmedPeriodHistory().some(item => item.id === '2026-09-01')).toBe(false);
  });

  it('a correction that keeps the same end day leaves the confirmed end alone', async () => {
    await seedCurrentPeriod(day(11, 3), day(11, 7));
    await correctPeriodOccurrence(day(11, 3), day(11, 2), day(11, 7));
    expect(key(getPeriodEndDateTime())).toBe('2026-11-07');
  });

  it('early end: range shortened Dec 1-6 -> Dec 1-4 also drops the (later) confirmed end', async () => {
    await seedCurrentPeriod(day(12, 1), day(12, 6));
    await correctPeriodOccurrence(day(12, 1), day(12, 1), day(12, 4));
    expect(getPeriodEndDateTime()).toBeNull();
    expect(getRecordedPeriodHistory().find(item => item.startDate === '2026-12-01')?.endDate).toBe('2026-12-04');
  });

  it('correcting an OLDER period does not touch the current period end nor other confirmed periods', async () => {
    // Older period (Jan), then the current one (Feb) with its confirmed end.
    // (2027, i.e. later than every period the earlier tests recorded.)
    setCyclePreferences({lastPeriodStart: day(1, 5, 12, 2027), ...habits});
    await recordConfirmedPeriodEnd(day(1, 5, 12, 2027), day(1, 9, 12, 2027));
    await seedCurrentPeriod(day(2, 10, 12, 2027), day(2, 14, 12, 2027));

    await correctPeriodOccurrence(day(1, 5, 12, 2027), day(1, 5, 12, 2027), day(1, 11, 12, 2027));

    expect(key(getPeriodEndDateTime())).toBe('2027-02-14');
    expect(getConfirmedPeriodHistory().some(item => item.id === '2027-02-10')).toBe(true);
  });

  it('history is preserved: unrelated recorded periods survive the correction', async () => {
    const before = getRecordedPeriodHistory().filter(item => item.startDate < '2027-02-01').map(item => item.startDate);
    await correctPeriodOccurrence(day(2, 10, 12, 2027), day(2, 10, 12, 2027), day(2, 16, 12, 2027));
    const after = getRecordedPeriodHistory().map(item => item.startDate);
    before.forEach(start => expect(after).toContain(start));
  });
});
