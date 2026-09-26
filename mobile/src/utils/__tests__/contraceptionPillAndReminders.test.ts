import {getPillPackDay, isPillBreakDay} from '../contraceptionMath';
import {getContraceptionReminderIndicator} from '../contraceptionReminderScheduling';

// contraceptionReminderScheduling.ts imports the real Notifee-backed
// scheduling chokepoint at module scope — replaced outright (see
// cycleReminderScheduling.test.ts for the same reasoning).
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

describe('isPillBreakDay — CYCLIC pill schedule (21 pill days + 7 break days)', () => {
  const start = '2026-09-01';
  const total = 28;
  const active = 21;
  const breakFor = (dateKey: string) => isPillBreakDay(getPillPackDay(start, dateKey, total), active);

  it('active days 1..21 are NOT break days', () => {
    expect(breakFor('2026-09-01')).toBe(false); // pack day 1
    expect(breakFor('2026-09-10')).toBe(false);
    expect(breakFor('2026-09-21')).toBe(false); // pack day 21 — last pill day
  });

  it('break days 22..28 ARE break days', () => {
    expect(breakFor('2026-09-22')).toBe(true); // pack day 22 — first break day
    expect(breakFor('2026-09-25')).toBe(true);
    expect(breakFor('2026-09-28')).toBe(true); // pack day 28 — last break day
  });

  it('the pack wraps: the next pack starts with active days again', () => {
    expect(breakFor('2026-09-29')).toBe(false); // pack day 1 of the next pack
    expect(breakFor('2026-10-19')).toBe(false); // pack day 21
    expect(breakFor('2026-10-20')).toBe(true); // pack day 22
  });

  it('a schedule with no break days never has a break day', () => {
    for (let day = 1; day <= 30; day += 1) {
      const key = `2026-09-${String(day).padStart(2, '0')}`;
      expect(isPillBreakDay(getPillPackDay(start, key, 21), 21)).toBe(false);
    }
  });
});

describe('isPillBreakDay — never applies where there is no cyclic pack', () => {
  it('continuous / unknown / not started / not configured (no pack day) → false', () => {
    expect(isPillBreakDay(null, 21)).toBe(false);
    expect(isPillBreakDay(null, null)).toBe(false);
    expect(isPillBreakDay(25, null)).toBe(false); // no known active length
    // getPillPackDay is null before the method start:
    expect(isPillBreakDay(getPillPackDay('2026-09-10', '2026-09-01', 28), 21)).toBe(false);
  });
});

describe('getContraceptionReminderIndicator', () => {
  it('pill / other: follows the stored flag', () => {
    expect(getContraceptionReminderIndicator('pill', true)).toBe('enabled');
    expect(getContraceptionReminderIndicator('pill', false)).toBe('disabled');
    expect(getContraceptionReminderIndicator('other', true)).toBe('enabled');
    expect(getContraceptionReminderIndicator('other', false)).toBe('disabled');
  });

  it('ring / patch: NEVER enabled — even when a stale Pill flag is still true', () => {
    expect(getContraceptionReminderIndicator('ring', true)).toBe('unavailable');
    expect(getContraceptionReminderIndicator('ring', false)).toBe('unavailable');
    expect(getContraceptionReminderIndicator('patch', true)).toBe('unavailable');
    expect(getContraceptionReminderIndicator('patch', false)).toBe('unavailable');
  });

  it('method not configured yet: unchanged (flag)', () => {
    expect(getContraceptionReminderIndicator(null, false)).toBe('disabled');
    expect(getContraceptionReminderIndicator(null, true)).toBe('enabled');
  });

  it('method switches: the answer depends only on the CURRENT method', () => {
    // Pill (enabled) → Ring / Patch; Other → Ring; Ring / Patch → Pill.
    expect(getContraceptionReminderIndicator('pill', true)).toBe('enabled');
    expect(getContraceptionReminderIndicator('ring', true)).toBe('unavailable');
    expect(getContraceptionReminderIndicator('patch', true)).toBe('unavailable');
    expect(getContraceptionReminderIndicator('other', true)).toBe('enabled');
    expect(getContraceptionReminderIndicator('ring', true)).toBe('unavailable');
    expect(getContraceptionReminderIndicator('pill', true)).toBe('enabled');
  });
});
