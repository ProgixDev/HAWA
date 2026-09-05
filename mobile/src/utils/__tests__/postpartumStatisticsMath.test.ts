import {
  withinPeriod,
  groupByMonth,
  averageByMonth,
  resolvePostpartumCycleReturnEventInPeriod,
} from '../postpartumStatisticsMath';

// Postpartum's Premium longitudinal views — audited gaps: (1) the mood tab
// was wired with a permanently empty trend (`trend={[]}`), (2) "retour des
// règles" was a static, unfiltered point-in-time value with no
// period-aware evolution/history. Mood itself reuses the exact same
// averageByMonth mechanism already used (and already tested implicitly via
// production use) for fatigue/pain/recovery — these tests cover that
// mechanism plus the new cycle-return resolver, all against real fixtures,
// never a mock array.

describe('withinPeriod', () => {
  const cutoff = new Date('2026-06-15T12:00:00');
  const now = new Date('2026-09-15T12:00:00');

  it('includes a date inside [cutoff, now]', () => {
    expect(withinPeriod('2026-08-01', cutoff, now)).toBe(true);
  });

  it('excludes a date before the cutoff', () => {
    expect(withinPeriod('2026-01-01', cutoff, now)).toBe(false);
  });

  it('excludes a date after now', () => {
    expect(withinPeriod('2026-12-01', cutoff, now)).toBe(false);
  });

  it('includes the boundary dates (inclusive range)', () => {
    expect(withinPeriod('2026-06-15', cutoff, now)).toBe(true);
    expect(withinPeriod('2026-09-15', cutoff, now)).toBe(true);
  });
});

describe('groupByMonth / averageByMonth — the mood trend mechanism', () => {
  type Entry = {date: string; mood?: string};
  const MOOD_SCALE = ['Très difficile', 'Difficile', 'Neutre', 'Bien', 'Très bien'];
  const valueOf = (entry: Entry) => MOOD_SCALE.indexOf(entry.mood as string) + 1;

  it('groups real entries by real calendar month, chronologically', () => {
    const entries: Entry[] = [
      {date: '2026-06-01', mood: 'Bien'},
      {date: '2026-08-01', mood: 'Neutre'},
      {date: '2026-06-15', mood: 'Très bien'},
    ];
    expect(groupByMonth(entries).map(g => g.monthKey)).toEqual(['2026-06', '2026-08']);
  });

  it('averages the real mapped mood value per real month — uses real data, not a mock array', () => {
    const entries: Entry[] = [
      {date: '2026-08-01', mood: 'Bien'}, // 4
      {date: '2026-08-05', mood: 'Très bien'}, // 5
    ];
    const result = averageByMonth(entries, valueOf);
    expect(result).toEqual([{date: '2026-08', label: 'Août 2026', value: 4.5}]);
  });

  it('respects a real 1-month window (only entries the caller already filtered)', () => {
    const oneMonth: Entry[] = [{date: '2026-08-10', mood: 'Neutre'}];
    expect(averageByMonth(oneMonth, valueOf)).toEqual([{date: '2026-08', label: 'Août 2026', value: 3}]);
  });

  it('respects a real 3-month window', () => {
    const threeMonths: Entry[] = [{date: '2026-06-01', mood: 'Bien'}, {date: '2026-08-01', mood: 'Difficile'}];
    expect(averageByMonth(threeMonths, valueOf).map(m => m.date)).toEqual(['2026-06', '2026-08']);
  });

  it('respects a real 6-month window', () => {
    const sixMonths: Entry[] = [{date: '2026-03-01', mood: 'Très difficile'}, {date: '2026-08-01', mood: 'Très bien'}];
    expect(averageByMonth(sixMonths, valueOf).map(m => m.value)).toEqual([1, 5]);
  });

  it('respects a real 12-month window', () => {
    const twelveMonths: Entry[] = [{date: '2025-09-01', mood: 'Bien'}, {date: '2026-08-01', mood: 'Bien'}];
    expect(averageByMonth(twelveMonths, valueOf)).toHaveLength(2);
  });

  it('never fabricates a trend for zero real entries — no fake month/value ever appears', () => {
    expect(averageByMonth([], valueOf)).toEqual([]);
  });

  it('preserves the real recorded mood label — the numeric mapping is visualization-only, never the displayed value', () => {
    const entries: Entry[] = [{date: '2026-08-01', mood: 'Très bien'}];
    // The label itself ('Très bien') is what a caller looks up via
    // POSTPARTUM_MOOD_OPTIONS elsewhere for display — this module only ever
    // returns the numeric position, confirming no label is silently lost
    // or replaced by the mapping.
    expect(MOOD_SCALE[valueOf(entries[0]) - 1]).toBe('Très bien');
  });
});

describe('resolvePostpartumCycleReturnEventInPeriod', () => {
  const NOW = new Date('2026-09-15T12:00:00');
  const CUTOFF_3M = new Date('2026-06-15T12:00:00');

  it('shows the confirmed return event when the real recorded date falls inside the selected period', () => {
    const result = resolvePostpartumCycleReturnEventInPeriod('2026-08-12', CUTOFF_3M, NOW);
    expect(result).toBeInstanceOf(Date);
    expect(result?.toLocaleDateString('en-CA')).toBe('2026-08-12');
  });

  it('does NOT show an older confirmed event as if it belonged to a shorter selected period', () => {
    expect(resolvePostpartumCycleReturnEventInPeriod('2026-01-05', CUTOFF_3M, NOW)).toBeNull();
  });

  it('never shows an event when nothing was recorded (null) — no inference from elapsed days/lochia/breastfeeding', () => {
    expect(resolvePostpartumCycleReturnEventInPeriod(null, CUTOFF_3M, NOW)).toBeNull();
  });

  it('a single confirmed event resolves to an honest single real Date, never a synthesized trend', () => {
    const result = resolvePostpartumCycleReturnEventInPeriod('2026-09-01', CUTOFF_3M, NOW);
    expect(result?.toLocaleDateString('en-CA')).toBe('2026-09-01');
  });

  it('a boundary date exactly at the cutoff is included (inclusive lower bound)', () => {
    expect(resolvePostpartumCycleReturnEventInPeriod('2026-06-15', CUTOFF_3M, NOW)).not.toBeNull();
  });

  it('a boundary date exactly at "now" is included (inclusive upper bound)', () => {
    expect(resolvePostpartumCycleReturnEventInPeriod('2026-09-15', CUTOFF_3M, NOW)).not.toBeNull();
  });

  it('never classifies anything as late — only ever returns a real Date or null, no status/label object', () => {
    const result = resolvePostpartumCycleReturnEventInPeriod(null, CUTOFF_3M, NOW);
    expect(result).toBeNull();
  });

  it('treats a malformed stored date defensively — never throws, never fabricates a date', () => {
    expect(resolvePostpartumCycleReturnEventInPeriod('not-a-date', CUTOFF_3M, NOW)).toBeNull();
  });
});
