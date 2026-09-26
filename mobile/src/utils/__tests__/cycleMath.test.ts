import {
  calendarDayKindFor,
  computeCyclePredictionStatus,
  describeAverageCycle,
  estimateFertilityDates,
  isWithinRecordedPeriod,
  kindFor,
  upcomingDateForCycleDay,
  upcomingFertileWindow,
  addDays,
  recordedPeriodFor,
  type CycleBasics,
  type RecordedPeriod,
} from '../cycleMath';

const day = (month: number, date: number, year = 2026) => new Date(year, month - 1, date);
const key = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const basics: CycleBasics = {lastPeriodStart: day(9, 1), cycleDuration: 28, periodDuration: 5};
const today = day(9, 12);

const recorded: RecordedPeriod[] = [{startDate: '2026-09-01', endDate: '2026-09-05'}];

describe('recorded period helpers', () => {
  it('isWithinRecordedPeriod is inclusive on both ends', () => {
    expect(isWithinRecordedPeriod(day(9, 1), recorded)).toBe(true);
    expect(isWithinRecordedPeriod(day(9, 5), recorded)).toBe(true);
    expect(isWithinRecordedPeriod(day(9, 6), recorded)).toBe(false);
    expect(isWithinRecordedPeriod(day(8, 31), recorded)).toBe(false);
  });

  it('recordedPeriodFor returns the covering period, else the latest one that started before, else null', () => {
    const periods: RecordedPeriod[] = [
      {startDate: '2026-07-01', endDate: '2026-07-05'},
      {startDate: '2026-09-01', endDate: '2026-09-05'},
    ];
    expect(recordedPeriodFor(day(9, 3), periods)?.startDate).toBe('2026-09-01');
    expect(recordedPeriodFor(day(8, 10), periods)?.startDate).toBe('2026-07-01');
    expect(recordedPeriodFor(day(6, 1), periods)).toBeNull();
  });
});

describe('REGULAR cycle — Dashboard and Calendar keep the precise projection', () => {
  const status = computeCyclePredictionStatus(basics, 'yes', [day(9, 1)], null, today);

  it('is an exact prediction', () => {
    expect(status.mode).toBe('exact');
  });

  it('paints the SAME cells the original single-cycle projection painted', () => {
    for (let offset = -40; offset <= 90; offset += 1) {
      const date = new Date(2026, 8, 1 + offset);
      expect(calendarDayKindFor(date, basics, status, recorded)).toBe(kindFor(date, basics));
    }
  });

  it('still estimates the fertile window and ovulation from the configured cycle length', () => {
    // "Upcoming" dates: on Sept 3 the whole window is still ahead.
    const fertility = estimateFertilityDates(basics, status, day(9, 3));
    expect(fertility).not.toBeNull();
    // cycle 28 → ovulation on cycle day 15 → Sept 15; fertile Sept 10 → 16.
    expect(key(fertility!.ovulation)).toBe('2026-09-15');
    expect(key(fertility!.fertileStart)).toBe('2026-09-10');
    expect(key(fertility!.fertileEnd)).toBe('2026-09-16');
  });
});

describe('IRREGULAR cycle — a range is never presented as one certain projected cycle', () => {
  const irregularBasics = {...basics};
  const status = computeCyclePredictionStatus(irregularBasics, 'no', [day(9, 1)], null, today);

  it('is a 26–32 day window', () => {
    expect(status.mode).toBe('window');
    if (status.mode === 'window') {
      expect(key(status.windowStart)).toBe('2026-09-27');
      expect(key(status.windowEnd)).toBe('2026-10-03');
    }
  });

  it('paints ONLY the periods that were really recorded — no projected period / fertile / ovulation', () => {
    // The modulo projection WOULD have painted these (next cycle's period and
    // this cycle's fertile window / ovulation)…
    expect(kindFor(day(9, 15), irregularBasics)).toBe('ovulation');
    expect(kindFor(day(9, 29), irregularBasics)).toBe('period');
    // …but the Calendar no longer does, matching the window on the Dashboard.
    expect(calendarDayKindFor(day(9, 15), irregularBasics, status, recorded)).toBe('normal');
    expect(calendarDayKindFor(day(9, 12), irregularBasics, status, recorded)).toBe('normal');
    expect(calendarDayKindFor(day(9, 29), irregularBasics, status, recorded)).toBe('normal');
    expect(calendarDayKindFor(day(10, 27), irregularBasics, status, recorded)).toBe('normal');
    // Real recorded period days are still painted.
    expect(calendarDayKindFor(day(9, 1), irregularBasics, status, recorded)).toBe('period');
    expect(calendarDayKindFor(day(9, 5), irregularBasics, status, recorded)).toBe('period');
  });

  it('gives NO single fertile-window / ovulation date', () => {
    expect(estimateFertilityDates(irregularBasics, status, today)).toBeNull();
  });
});

describe('UNKNOWN regularity — existing observation behavior is preserved', () => {
  it('while observing (too little history) nothing changes: same projection, same fertility estimate', () => {
    const status = computeCyclePredictionStatus(basics, 'unknown', [day(9, 1)], day(9, 1), today);
    expect(status.mode).toBe('observing');
    for (let offset = -20; offset <= 60; offset += 1) {
      const date = new Date(2026, 8, 1 + offset);
      expect(calendarDayKindFor(date, basics, status, recorded)).toBe(kindFor(date, basics));
    }
    expect(estimateFertilityDates(basics, status, today)).not.toBeNull();
  });

  it('once a regular-looking pattern was OBSERVED, the calendar wraps by the observed average like the Dashboard', () => {
    // Starts every 30 days (4 gaps, range 0): observed average = 30, configured = 28.
    const starts = [day(5, 1), day(5, 31), day(6, 30), day(7, 30), day(8, 29)];
    const observedBasics: CycleBasics = {lastPeriodStart: day(8, 29), cycleDuration: 28, periodDuration: 5};
    const status = computeCyclePredictionStatus(observedBasics, 'unknown', starts, day(5, 1), day(9, 5));
    expect(status.mode).toBe('exact');
    if (status.mode !== 'exact') {return;}
    expect(status.averageCycleLength).toBe(30);

    const effective = {...observedBasics, cycleDuration: 30};
    const probe = day(10, 20);
    expect(calendarDayKindFor(probe, observedBasics, status, [])).toBe(kindFor(probe, effective));
    const fertility = estimateFertilityDates(observedBasics, status, day(9, 5));
    // ovulation day for a 30-day cycle is cycle day 17, not 15.
    expect(key(fertility!.ovulation)).toBe(key(new Date(2026, 7, 29 + 16)));
  });

  it('an observed VARIABLE pattern behaves like irregular (window, recorded periods only)', () => {
    const starts = [day(5, 1), day(6, 10), day(7, 5), day(8, 20), day(9, 1)];
    const variableBasics: CycleBasics = {lastPeriodStart: day(9, 1), cycleDuration: 28, periodDuration: 5};
    const status = computeCyclePredictionStatus(variableBasics, 'unknown', starts, day(5, 1), today);
    expect(status.mode).toBe('window');
    expect(calendarDayKindFor(day(9, 15), variableBasics, status, recorded)).toBe('normal');
    expect(estimateFertilityDates(variableBasics, status, today)).toBeNull();
  });
});

describe('describeAverageCycle — a configured number is never called a measured average', () => {
  const exactRegular = computeCyclePredictionStatus(basics, 'yes', [day(9, 1)], null, today);
  const window = computeCyclePredictionStatus(basics, 'no', [day(9, 1)], null, today);
  const observing = computeCyclePredictionStatus(basics, 'unknown', [day(9, 1)], day(9, 1), today);

  it('declared regular cycle → "Durée habituelle", worded as declared by the user', () => {
    expect(describeAverageCycle(exactRegular, basics, true)).toEqual({
      label: 'Durée habituelle',
      value: '28 jours',
      subtitle: 'Renseignée par toi',
    });
  });

  it('an unconfirmed fallback is NOT shown as the user\'s data', () => {
    expect(describeAverageCycle(exactRegular, basics, false).value).toBe('Non renseignée');
    expect(describeAverageCycle(observing, basics, false).value).toBe('Non renseignée');
  });

  it('still-observing cycle → provisional configured estimate', () => {
    expect(describeAverageCycle(observing, basics, true)).toEqual({
      label: 'Durée habituelle',
      value: '28 jours',
      subtitle: 'Estimation provisoire',
    });
  });

  it('irregular cycle → the 26–32 day window, never one precise figure', () => {
    expect(describeAverageCycle(window, basics, true)).toEqual({
      label: 'Cycle variable',
      value: '26–32 jours',
      subtitle: 'Fenêtre estimée',
    });
  });

  it('only an OBSERVED regular-looking pattern is called an average', () => {
    const starts = [day(5, 1), day(5, 31), day(6, 30), day(7, 30), day(8, 29)];
    const observedBasics: CycleBasics = {lastPeriodStart: day(8, 29), cycleDuration: 28, periodDuration: 5};
    const status = computeCyclePredictionStatus(observedBasics, 'unknown', starts, day(5, 1), day(9, 5));
    expect(describeAverageCycle(status, observedBasics, true)).toEqual({
      label: 'Durée moyenne',
      value: '30 jours',
      subtitle: 'Basée sur tes cycles enregistrés',
    });
  });
});

describe('upcomingFertileWindow — ONE coherent fertile window (start <= ovulation <= end)', () => {
  // Cycle 28, last period Sept 1 → ovulation on cycle day 15 (Sept 15),
  // fertile window Sept 10 → Sept 16.
  const cycle: CycleBasics = {lastPeriodStart: day(9, 1), cycleDuration: 28, periodDuration: 5};
  const win = (asOf: Date) => {
    const w = upcomingFertileWindow(cycle, asOf);
    return {start: key(w.start), end: key(w.end), ovulation: key(w.ovulation)};
  };
  const NEXT = {start: '2026-10-08', end: '2026-10-14', ovulation: '2026-10-13'};
  const CURRENT = {start: '2026-09-10', end: '2026-09-16', ovulation: '2026-09-15'};

  it('1. before the fertile window: the upcoming window', () => {
    expect(win(day(9, 5))).toEqual(CURRENT);
  });

  it('2. on the first fertile day', () => {
    expect(win(day(9, 10))).toEqual(CURRENT);
  });

  it('3. inside the fertile window (the old start/end mix-up): still the SAME window', () => {
    expect(win(day(9, 12))).toEqual(CURRENT);
    // The defect this fixes: independent lookups put the start in the NEXT
    // cycle while the end stayed in the current one.
    const oldStart = upcomingDateForCycleDay(cycle, 10, day(9, 12));
    const oldEnd = upcomingDateForCycleDay(cycle, 16, day(9, 12));
    expect(oldStart.getTime()).toBeGreaterThan(oldEnd.getTime());
  });

  it('4. on the estimated ovulation day', () => {
    expect(win(day(9, 15))).toEqual(CURRENT);
  });

  it('5. on the final fertile day — at any time of day', () => {
    expect(win(day(9, 16))).toEqual(CURRENT);
    expect(key(upcomingFertileWindow(cycle, new Date(2026, 8, 16, 18, 30)).end)).toBe('2026-09-16');
  });

  it("6. after the fertile window: the next cycle's window", () => {
    expect(win(day(9, 17))).toEqual(NEXT);
    expect(win(day(9, 30))).toEqual(NEXT);
  });

  it('7. around a month boundary (window spanning Sept 29 → Oct 5)', () => {
    const spanning: CycleBasics = {lastPeriodStart: day(9, 20), cycleDuration: 28, periodDuration: 5};
    const w = upcomingFertileWindow(spanning, day(10, 1));
    expect(key(w.start)).toBe('2026-09-29');
    expect(key(w.end)).toBe('2026-10-05');
    expect(key(w.ovulation)).toBe('2026-10-04');
  });

  it('8. around a year boundary (window spanning Dec 29 → Jan 4)', () => {
    const yearEnd: CycleBasics = {lastPeriodStart: day(12, 20), cycleDuration: 28, periodDuration: 5};
    const inside = upcomingFertileWindow(yearEnd, day(1, 1, 2027));
    expect(key(inside.start)).toBe('2026-12-29');
    expect(key(inside.end)).toBe('2027-01-04');
    expect(key(inside.ovulation)).toBe('2027-01-03');
    const after = upcomingFertileWindow(yearEnd, day(1, 5, 2027));
    expect(after.start.getTime()).toBeGreaterThan(inside.end.getTime());
    expect(after.start.getTime()).toBeLessThanOrEqual(after.end.getTime());
  });

  it('invariant over two years of days and several cycle lengths: start <= ovulation <= end, today <= end, 6-day window', () => {
    [21, 26, 28, 30, 35].forEach(cycleDuration => {
      const cyc: CycleBasics = {lastPeriodStart: day(3, 3), cycleDuration, periodDuration: 5};
      for (let offset = 0; offset < 730; offset += 1) {
        const asOf = new Date(2026, 2, 1 + offset);
        const w = upcomingFertileWindow(cyc, asOf);
        expect(w.start.getTime()).toBeLessThanOrEqual(w.ovulation.getTime());
        expect(w.ovulation.getTime()).toBeLessThanOrEqual(w.end.getTime());
        expect(w.end.getTime()).toBeGreaterThanOrEqual(asOf.getTime());
        expect(Math.round((w.end.getTime() - w.start.getTime()) / 86_400_000)).toBe(6);
      }
    });
  });

  it('never changes the project formula: same window days as before whenever today precedes it', () => {
    const before = day(9, 2);
    const w = upcomingFertileWindow(cycle, before);
    expect(w.start.getTime()).toBe(upcomingDateForCycleDay(cycle, 10, before).getTime());
    expect(w.end.getTime()).toBe(upcomingDateForCycleDay(cycle, 16, before).getTime());
    expect(addDays(w.start, 5).getTime()).toBe(w.ovulation.getTime());
  });
});

// H5 — Cycle Dashboard/Calendar fertility estimate: ONE coherent window.
describe('estimateFertilityDates — a single coherent fertile window (start ≤ ovulation ≤ end)', () => {
  const exactStatusFor = (at: Date) => computeCyclePredictionStatus(basics, 'yes', [day(9, 1)], null, at);
  const estimateAt = (at: Date) => estimateFertilityDates(basics, exactStatusFor(at), at)!;

  it('before the window: the upcoming window of the current cycle', () => {
    const fertility = estimateAt(day(9, 3));
    expect([key(fertility.fertileStart), key(fertility.ovulation), key(fertility.fertileEnd)]).toEqual([
      '2026-09-10',
      '2026-09-15',
      '2026-09-16',
    ]);
  });

  it('INSIDE the window (Sept 12–16): still the current window — the start no longer jumps to the next cycle', () => {
    for (const d of [12, 13, 15, 16]) {
      const fertility = estimateAt(day(9, d));
      expect(key(fertility.fertileStart)).toBe('2026-09-10');
      expect(key(fertility.ovulation)).toBe('2026-09-15');
      expect(key(fertility.fertileEnd)).toBe('2026-09-16');
    }
  });

  it('after the window: the NEXT cycle window (Oct 8 → Oct 14, ovulation Oct 13)', () => {
    const fertility = estimateAt(day(9, 17));
    expect([key(fertility.fertileStart), key(fertility.ovulation), key(fertility.fertileEnd)]).toEqual([
      '2026-10-08',
      '2026-10-13',
      '2026-10-14',
    ]);
  });

  it('holds the invariant start ≤ ovulation ≤ end and equals upcomingFertileWindow for every day of two cycles', () => {
    for (let offset = 0; offset < 60; offset += 1) {
      const at = day(9, 1 + offset);
      const fertility = estimateAt(at);
      expect(fertility.fertileStart.getTime()).toBeLessThanOrEqual(fertility.ovulation.getTime());
      expect(fertility.ovulation.getTime()).toBeLessThanOrEqual(fertility.fertileEnd.getTime());
      const canonical = upcomingFertileWindow(basics, at);
      expect(key(fertility.fertileStart)).toBe(key(canonical.start));
      expect(key(fertility.fertileEnd)).toBe(key(canonical.end));
      expect(key(fertility.ovulation)).toBe(key(canonical.ovulation));
    }
  });

  it('month boundary: Oct window (23 → 29) while inside it, then the November one', () => {
    const monthBasics: CycleBasics = {lastPeriodStart: day(10, 14), cycleDuration: 28, periodDuration: 5};
    const at = day(10, 26);
    const status = computeCyclePredictionStatus(monthBasics, 'yes', [day(10, 14)], null, at);
    const fertility = estimateFertilityDates(monthBasics, status, at)!;
    expect(key(fertility.fertileStart)).toBe('2026-10-23');
    expect(key(fertility.fertileEnd)).toBe('2026-10-29');
    const later = day(11, 1);
    const status2 = computeCyclePredictionStatus(monthBasics, 'yes', [day(10, 14)], null, later);
    const next = estimateFertilityDates(monthBasics, status2, later)!;
    expect(key(next.fertileStart)).toBe('2026-11-20');
    expect(next.fertileStart.getTime()).toBeLessThanOrEqual(next.fertileEnd.getTime());
  });

  it('year boundary: the Dec 29 → Jan 4 window stays one window on both sides of Jan 1', () => {
    const yearBasics: CycleBasics = {lastPeriodStart: day(12, 20), cycleDuration: 28, periodDuration: 5};
    // ovulation on cycle day 15 → Jan 3; fertile Dec 29 → Jan 4.
    for (const at of [day(12, 30), day(1, 1, 2027), day(1, 4, 2027)]) {
      const status = computeCyclePredictionStatus(yearBasics, 'yes', [day(12, 20)], null, at);
      const fertility = estimateFertilityDates(yearBasics, status, at)!;
      expect(key(fertility.fertileStart)).toBe('2026-12-29');
      expect(key(fertility.ovulation)).toBe('2027-01-03');
      expect(key(fertility.fertileEnd)).toBe('2027-01-04');
    }
  });

  it('irregular / window mode: still NO precise date (no false precision)', () => {
    const status = computeCyclePredictionStatus(basics, 'no', [day(9, 1)], null, day(9, 12));
    expect(status.mode).toBe('window');
    expect(estimateFertilityDates(basics, status, day(9, 12))).toBeNull();
  });

  it('unknown / provisional (observing) mode keeps the estimate, coherent too', () => {
    const at = day(9, 13);
    const status = computeCyclePredictionStatus(basics, 'unknown', [day(9, 1)], day(9, 1), at);
    expect(status.mode).toBe('observing');
    const fertility = estimateFertilityDates(basics, status, at)!;
    expect(key(fertility.fertileStart)).toBe('2026-09-10');
    expect(key(fertility.fertileEnd)).toBe('2026-09-16');
  });
});
