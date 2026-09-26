import {
  calendarDayKindFor,
  computeCyclePredictionStatus,
  currentPeriodLength,
  isBeforeCurrentProjectedCycle,
  kindFor,
  recordedPeriodInCycleOf,
  type CycleBasics,
  type RecordedPeriod,
} from '../cycleMath';

// M9 — prediction overlays describe the CURRENT / FUTURE cycle. Old months show
// what was really recorded; unrecorded projected periods are not painted
// retroactively. M7/M8 — the recorded range (edited / confirmed end) is the
// truthful source for the current period, not the habitual periodDuration.
const day = (month: number, date: number) => new Date(2026, month - 1, date);
const BASICS: CycleBasics = {lastPeriodStart: day(9, 1), cycleDuration: 28, periodDuration: 5};
const TODAY = day(9, 3);
const RECORDED: RecordedPeriod[] = [
  {startDate: '2026-08-04', endDate: '2026-08-08'},
  {startDate: '2026-09-01', endDate: '2026-09-05'},
];

const statusFor = (recorded: RecordedPeriod[], today = TODAY) =>
  computeCyclePredictionStatus(BASICS, 'yes', recorded.map(p => new Date(`${p.startDate}T12:00:00`)), null, today);
const kind = (date: Date, recorded = RECORDED) =>
  calendarDayKindFor(date, BASICS, statusFor(recorded), recorded, TODAY);

describe('M9 — past months: recorded periods stay painted, unrecorded projections do not', () => {
  it('a RECORDED period in an old month is still painted', () => {
    expect(kind(day(8, 4))).toBe('period');
    expect(kind(day(8, 8))).toBe('period');
  });

  it('the modulo-projected periods of earlier cycles that were never recorded are NOT painted', () => {
    // Projection back from Sep 1 (28-day cycle): Aug 4, Jul 7, Jun 9 are projected starts.
    expect(kind(day(7, 7))).toBe('normal');
    expect(kind(day(7, 9))).toBe('normal');
    expect(kind(day(6, 9))).toBe('normal');
    // The original projection WOULD have painted them:
    expect(kindFor(day(7, 7), BASICS)).toBe('period');
  });

  it('retroactive fertile window / ovulation of old months are not painted either', () => {
    // Aug 4 cycle: ovulation on cycle day 15 = Aug 18, fertile Aug 13..19.
    expect(kindFor(day(8, 18), BASICS)).toBe('ovulation');
    expect(kind(day(8, 18))).toBe('normal');
    expect(kind(day(8, 14))).toBe('normal');
  });

  it('the CURRENT cycle projection is unchanged (recorded period, fertile window, ovulation)', () => {
    expect(kind(day(9, 2))).toBe('period');
    expect(kind(day(9, 12))).toBe('fertile');
    expect(kind(day(9, 15))).toBe('ovulation');
    expect(kind(day(9, 20))).toBe('normal');
  });

  it('FUTURE predicted periods are unchanged: next cycles keep painting', () => {
    expect(kind(day(9, 29))).toBe('period');
    expect(kind(day(10, 27))).toBe('period');
    expect(kind(day(10, 10))).toBe('fertile');
  });

  it('every future day (from today) equals the original projection — only the past changed', () => {
    for (let offset = 0; offset < 120; offset += 1) {
      const date = new Date(2026, 8, 3 + offset);
      expect(kind(date)).toBe(kindFor(date, BASICS));
    }
  });

  it('without `today` the original projection is returned unchanged (legacy callers)', () => {
    for (let offset = -60; offset < 60; offset += 1) {
      const date = new Date(2026, 8, 1 + offset);
      expect(calendarDayKindFor(date, BASICS, statusFor(RECORDED), RECORDED)).toBe(kindFor(date, BASICS));
    }
  });

  it('a stale latest period (projection cycles already passed): only the cycle containing today keeps the projection', () => {
    const today = day(10, 30); // Sep 1 + 28*... cycle 2 started Sep 29, cycle 3 Oct 27
    const status = statusFor(RECORDED, today);
    const paint = (date: Date) => calendarDayKindFor(date, BASICS, status, RECORDED, today);
    expect(paint(day(9, 30))).toBe('normal'); // projected period of cycle 2, passed and never recorded
    expect(paint(day(10, 27))).toBe('period'); // the projected period of the cycle containing today
    expect(paint(day(9, 3))).toBe('period'); // recorded
    expect(isBeforeCurrentProjectedCycle(day(10, 26), BASICS, today)).toBe(true);
    expect(isBeforeCurrentProjectedCycle(day(10, 27), BASICS, today)).toBe(false);
  });
});

describe('M7/M8 — the recorded range wins over the habitual periodDuration', () => {
  it('a recorded period LONGER than the habitual duration is painted in full (Sep 1..7, habit 5)', () => {
    const recorded: RecordedPeriod[] = [{startDate: '2026-09-01', endDate: '2026-09-07'}];
    expect(kind(day(9, 6), recorded)).toBe('period');
    expect(kind(day(9, 7), recorded)).toBe('period');
    expect(kind(day(9, 8), recorded)).toBe('normal');
  });

  it('a period ENDED earlier than projected no longer paints its remaining projected days (Sep 1..3)', () => {
    const recorded: RecordedPeriod[] = [{startDate: '2026-09-01', endDate: '2026-09-03'}];
    expect(kind(day(9, 3), recorded)).toBe('period');
    expect(kind(day(9, 4), recorded)).toBe('normal');
    expect(kind(day(9, 5), recorded)).toBe('normal');
    // …while the NEXT projected period is still there.
    expect(kind(day(9, 29), recorded)).toBe('period');
  });

  it('currentPeriodLength reads the record starting on lastPeriodStart, else the habitual duration', () => {
    expect(currentPeriodLength(BASICS, [{startDate: '2026-09-01', endDate: '2026-09-07'}])).toBe(7);
    expect(currentPeriodLength(BASICS, [{startDate: '2026-09-01', endDate: '2026-09-03'}])).toBe(3);
    expect(currentPeriodLength(BASICS, [{startDate: '2026-08-04', endDate: '2026-08-11'}])).toBe(5);
    expect(currentPeriodLength(BASICS, [])).toBe(5);
  });

  it('recordedPeriodInCycleOf only returns the record within one cycle of its start', () => {
    expect(recordedPeriodInCycleOf(day(9, 10), RECORDED, 28)?.startDate).toBe('2026-09-01');
    expect(recordedPeriodInCycleOf(day(10, 30), RECORDED, 28)).toBeNull();
    expect(recordedPeriodInCycleOf(day(7, 1), RECORDED, 28)).toBeNull();
  });
});
