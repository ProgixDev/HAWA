import {
  getMiscarriagePreferences,
  setMiscarriageBleedingStatus,
  setMiscarriageCycleReturnStatus,
  setMiscarriageDate,
  setMiscarriagePreferences,
  setMiscarriageTryingAgainStatus,
} from '../miscarriagePreferences';

// M36 / M37 at the STORE level — the guard no UI path can bypass. The clock is
// pinned to 2026-09-26. The module-singleton store persists between tests in
// this file, so every test seeds its own state through the raw writer.
const seed = (overrides: Partial<ReturnType<typeof getMiscarriagePreferences>> = {}) =>
  setMiscarriagePreferences({
    miscarriageDate: '2026-09-10',
    bleedingStatus: 'yes',
    cycleReturnStatus: 'no',
    firstReturnedPeriodDate: null,
    tryingAgainStatus: 'soon',
    dailyTrackingReminderEnabled: false,
    dailyTrackingReminderTime: null,
    ...overrides,
  });

beforeAll(() => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 12, 0, 0)});
});
afterAll(() => {
  jest.useRealTimers();
});

describe('M36 — setMiscarriageCycleReturnStatus is the guarded writer of the cycle-return date', () => {
  it('rejects a FUTURE date: nothing written, previous values intact', async () => {
    await seed({cycleReturnStatus: 'unknown'});
    const result = await setMiscarriageCycleReturnStatus('yes', new Date(2026, 8, 27));
    expect(result).toEqual({valid: false, message: expect.stringContaining('dans le futur')});
    expect(getMiscarriagePreferences().cycleReturnStatus).toBe('unknown');
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBeNull();
  });

  it('rejects a date BEFORE the loss date', async () => {
    await seed();
    const result = await setMiscarriageCycleReturnStatus('yes', new Date(2026, 8, 5));
    expect(result).toEqual({valid: false, message: expect.stringContaining('précéder')});
    expect(getMiscarriagePreferences().cycleReturnStatus).toBe('no');
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBeNull();
  });

  it('rejects an invalid Date', async () => {
    await seed();
    const result = await setMiscarriageCycleReturnStatus('yes', new Date('invalid'));
    expect(result.valid).toBe(false);
    expect(getMiscarriagePreferences().cycleReturnStatus).toBe('no');
  });

  it('accepts a valid date (today, the loss day, in between) and "yes" without a date', async () => {
    await seed();
    expect(await setMiscarriageCycleReturnStatus('yes', new Date(2026, 8, 18))).toEqual({valid: true});
    expect(getMiscarriagePreferences()).toMatchObject({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-18'});
    expect((await setMiscarriageCycleReturnStatus('yes', new Date(2026, 8, 26))).valid).toBe(true);
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-09-26');
    expect((await setMiscarriageCycleReturnStatus('yes', new Date(2026, 8, 10))).valid).toBe(true);
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-09-10');
    expect((await setMiscarriageCycleReturnStatus('yes', null)).valid).toBe(true);
    expect(getMiscarriagePreferences()).toMatchObject({cycleReturnStatus: 'yes', firstReturnedPeriodDate: null});
  });

  it('a non-yes answer still clears the date and needs no date validation', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-15'});
    expect((await setMiscarriageCycleReturnStatus('no', new Date(2030, 0, 1))).valid).toBe(true);
    expect(getMiscarriagePreferences()).toMatchObject({cycleReturnStatus: 'no', firstReturnedPeriodDate: null});
  });

  it('LEGACY invalid values (future / before loss) are not destroyed by any other writer or by a rejected write', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-10-20'});
    await setMiscarriageBleedingStatus('no');
    await setMiscarriageTryingAgainStatus('ready');
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-10-20');
    // a rejected new write leaves it as it was, too
    expect((await setMiscarriageCycleReturnStatus('yes', new Date(2026, 8, 30))).valid).toBe(false);
    expect(getMiscarriagePreferences()).toMatchObject({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-10-20'});

    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-08-20'});
    await setMiscarriageBleedingStatus('variable');
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-08-20');
  });

  it('only an explicit VALID correction replaces a legacy invalid value', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-10-20'});
    expect((await setMiscarriageCycleReturnStatus('yes', new Date(2026, 8, 20))).valid).toBe(true);
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-09-20');
  });
});

describe('M37 — setMiscarriageDate is guarded against contradicting dated data', () => {
  it('safe edit is accepted (no dependents, or dependents after the new date)', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-20'});
    expect(await setMiscarriageDate(new Date(2026, 8, 12), {journalDates: ['2026-09-13']})).toEqual({valid: true});
    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-12');
  });

  it('a loss date AFTER the recorded cycle-return date is rejected; nothing is moved', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-15'});
    const result = await setMiscarriageDate(new Date(2026, 8, 18));
    expect(result).toEqual({valid: false, message: expect.stringContaining('retour de tes règles')});
    expect(getMiscarriagePreferences()).toMatchObject({miscarriageDate: '2026-09-10', firstReturnedPeriodDate: '2026-09-15'});
  });

  it('a loss date AFTER existing dated journal history is rejected', async () => {
    await seed();
    const result = await setMiscarriageDate(new Date(2026, 8, 14), {journalDates: ['2026-09-12']});
    expect(result).toEqual({valid: false, message: expect.stringContaining('12 septembre 2026')});
    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-10');
  });

  it('a future loss date is rejected', async () => {
    await seed();
    expect((await setMiscarriageDate(new Date(2026, 8, 27))).valid).toBe(false);
    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-10');
  });

  it('first-time entry (no date, no dependents) is accepted', async () => {
    await seed({miscarriageDate: null});
    expect((await setMiscarriageDate(new Date(2026, 8, 20))).valid).toBe(true);
    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-20');
  });
});
