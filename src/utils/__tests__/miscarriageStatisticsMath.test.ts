import {resolveCycleReturnEventInPeriod} from '../miscarriageStatisticsMath';

// "Retour du cycle" evolution — audited as a static point-in-time value with
// no period-aware history. This is the pure decision function AppearanceScreen's
// sibling, MiscarriageStatisticsScreen.tsx, now uses instead of showing the
// confirmed date unconditionally. Deliberately NEVER infers a return from
// elapsed days/bleeding/average cycle duration — only real recorded
// status==='yes' + a real date ever counts.

const NOW = new Date('2026-09-15T12:00:00');
const CUTOFF_3M = new Date('2026-06-15T12:00:00'); // cutoffDateForPeriod('3', NOW) equivalent

describe('resolveCycleReturnEventInPeriod', () => {
  it('shows the confirmed return event when the real date falls inside the selected period', () => {
    const confirmedDate = new Date('2026-08-12T12:00:00');
    expect(resolveCycleReturnEventInPeriod('yes', confirmedDate, CUTOFF_3M, NOW)).toBe(confirmedDate);
  });

  it('does NOT show an older confirmed event as if it belonged to a shorter selected period', () => {
    const oldDate = new Date('2026-01-05T12:00:00');
    expect(resolveCycleReturnEventInPeriod('yes', oldDate, CUTOFF_3M, NOW)).toBeNull();
  });

  it('never shows an event when status is "no" — no inference from any other field', () => {
    const someDate = new Date('2026-08-12T12:00:00');
    expect(resolveCycleReturnEventInPeriod('no', someDate, CUTOFF_3M, NOW)).toBeNull();
  });

  it('never shows an event when status is "unknown"', () => {
    expect(resolveCycleReturnEventInPeriod('unknown', new Date('2026-08-12T12:00:00'), CUTOFF_3M, NOW)).toBeNull();
  });

  it('never shows an event when status is null (never onboarded this question)', () => {
    expect(resolveCycleReturnEventInPeriod(null, new Date('2026-08-12T12:00:00'), CUTOFF_3M, NOW)).toBeNull();
  });

  it('never shows an event when status is "yes" but no date was actually recorded', () => {
    expect(resolveCycleReturnEventInPeriod('yes', null, CUTOFF_3M, NOW)).toBeNull();
  });

  it('a single confirmed event renders as an honest point, not a fabricated trend — the function returns exactly the one real Date, nothing synthesized', () => {
    const confirmedDate = new Date('2026-09-01T12:00:00');
    const result = resolveCycleReturnEventInPeriod('yes', confirmedDate, CUTOFF_3M, NOW);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(confirmedDate.getTime());
  });

  it('a boundary date exactly at the cutoff is included (inclusive lower bound)', () => {
    expect(resolveCycleReturnEventInPeriod('yes', CUTOFF_3M, CUTOFF_3M, NOW)).toBe(CUTOFF_3M);
  });

  it('a boundary date exactly at "now" is included (inclusive upper bound)', () => {
    expect(resolveCycleReturnEventInPeriod('yes', NOW, CUTOFF_3M, NOW)).toBe(NOW);
  });

  it('never classifies anything as late — the function only ever returns a real Date or null, never a status/label object', () => {
    const result = resolveCycleReturnEventInPeriod('no', null, CUTOFF_3M, NOW);
    expect(result).toBeNull();
  });
});
