import {formatClockTimeInZone} from '../timeOfDay';

// Prayer / purity cards show an INSTANT in the prayer location's zone. Intl `hour12:false` printed 00:05 as "24:05"
// under en-US (V8, "h24" cycle); the helper uses hourCycle 'h23'. Display only, stored times are untouched.

describe('formatClockTimeInZone', () => {
  // 2026-10-10T22:05:00Z is 00:05 on 11 Oct in Paris (UTC+2 in October) and 18:05 in New York (UTC-4).
  const instant = new Date('2026-10-10T22:05:00Z');

  it('en-US prints 00:05 in an explicit zone, never "24:05"', () => {
    expect(formatClockTimeInZone(instant, 'en-US', 'Europe/Paris')).toBe('00:05');
    expect(formatClockTimeInZone(new Date('2026-10-10T22:30:00Z'), 'en-US', 'Europe/Paris')).toBe('00:30');
    expect(formatClockTimeInZone(new Date('2026-10-10T22:00:00Z'), 'en-US', 'Europe/Paris')).toBe('00:00');
  });

  it('keeps the explicit zone: the same instant reads differently elsewhere', () => {
    expect(formatClockTimeInZone(instant, 'en-US', 'America/New_York')).toBe('18:05');
    expect(formatClockTimeInZone(instant, 'en-US', 'Asia/Tokyo')).toBe('07:05');
  });

  it.each([
    ['fr-FR', '00:05'],
    ['es-ES', '00:05'],
    ['it-IT', '00:05'],
    ['tr-TR', '00:05'],
  ])('%s output is the same 00:05', (locale, expected) => {
    expect(formatClockTimeInZone(instant, locale, 'Europe/Paris')).toBe(expected);
  });

  it('afternoon and single digits stay zero-padded 24-hour', () => {
    expect(formatClockTimeInZone(new Date('2026-10-10T13:07:00Z'), 'en-US', 'UTC')).toBe('13:07');
    expect(formatClockTimeInZone(new Date('2026-10-10T05:07:00Z'), 'en-US', 'UTC')).toBe('05:07');
  });

  it('without a zone it uses the device zone and still never prints 24:xx', () => {
    const local = new Date(2026, 9, 10, 0, 5);
    expect(formatClockTimeInZone(local, 'en-US')).toBe('00:05');
  });
});
