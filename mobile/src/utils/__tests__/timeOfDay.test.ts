import {dateAtTimeOfDay, formatTimeOfDay, normalizeTimeOfDay, parseTimeOfDay} from '../timeOfDay';

// Phase 2: F17 — midnight must never be stored or read as "24:xx".

describe('formatTimeOfDay', () => {
  it('is 24-hour, zero padded and never "24:xx" at midnight', () => {
    expect(formatTimeOfDay(new Date(2026, 9, 10, 0, 30))).toBe('00:30');
    expect(formatTimeOfDay(new Date(2026, 9, 10, 0, 0))).toBe('00:00');
    expect(formatTimeOfDay(new Date(2026, 9, 10, 9, 5))).toBe('09:05');
    expect(formatTimeOfDay(new Date(2026, 9, 10, 23, 59))).toBe('23:59');
  });

  it('does not depend on the language of the device (no Intl involved)', () => {
    const spy = jest.spyOn(Intl, 'DateTimeFormat');
    formatTimeOfDay(new Date(2026, 9, 10, 0, 30));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('parseTimeOfDay', () => {
  it('reads a normal time', () => {
    expect(parseTimeOfDay('20:36')).toEqual({hours: 20, minutes: 36});
    expect(parseTimeOfDay('9:05')).toEqual({hours: 9, minutes: 5});
    expect(parseTimeOfDay('00:00')).toEqual({hours: 0, minutes: 0});
  });

  it('reads the "24:30" an en-US build could store for midnight as 00:30 (same day, nothing rewritten)', () => {
    expect(parseTimeOfDay('24:30')).toEqual({hours: 0, minutes: 30});
    expect(parseTimeOfDay('24:00')).toEqual({hours: 0, minutes: 0});
  });

  it('rejects what is not a time of day', () => {
    for (const value of ['', 'abc', '25:00', '12:60', '١٢:٣٠', '12', null, undefined, '12:5']) {
      expect(parseTimeOfDay(value as string)).toBeNull();
    }
  });
});

describe('dateAtTimeOfDay', () => {
  it('builds the local date at that time, on the base day', () => {
    expect(dateAtTimeOfDay(new Date(2026, 9, 10, 15, 0), '20:36')).toEqual(new Date(2026, 9, 10, 20, 36));
  });

  it('a stored "24:30" is 00:30 of the SAME day — not the day after', () => {
    expect(dateAtTimeOfDay(new Date(2026, 9, 10, 15, 0), '24:30')).toEqual(new Date(2026, 9, 10, 0, 30));
  });

  it('uses the fallback when the value cannot be read', () => {
    expect(dateAtTimeOfDay(new Date(2026, 9, 10, 15, 0), 'nope', '09:00')).toEqual(new Date(2026, 9, 10, 9, 0));
  });
});

describe('normalizeTimeOfDay (read-only displays of stored text)', () => {
  it('a legacy "24:30" is shown as 00:30; a normal time is zero-padded 24-hour', () => {
    expect(normalizeTimeOfDay('24:30')).toBe('00:30');
    expect(normalizeTimeOfDay('24:00')).toBe('00:00');
    expect(normalizeTimeOfDay('9:05')).toBe('09:05');
    expect(normalizeTimeOfDay('20:36')).toBe('20:36');
  });

  it('anything that is not a time of day is returned exactly as stored (never invented, never blanked)', () => {
    expect(normalizeTimeOfDay('matin')).toBe('matin');
    expect(normalizeTimeOfDay('25:00')).toBe('25:00');
    expect(normalizeTimeOfDay('')).toBe('');
  });
});
