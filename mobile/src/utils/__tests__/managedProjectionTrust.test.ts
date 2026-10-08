import {
  calendarDayKindFor,
  canProjectCycle,
  computeCyclePredictionStatus,
  effectiveRegularityFor,
  type CyclePredictionStatus,
  type RecordedPeriod,
} from '../cycleMath';

// A managed (daughter) profile starts from an UNCONFIRMED placeholder cycle (5-day
// period, 28-day cycle, regularity 'yes'). These helpers decide whether anything may
// be PROJECTED from it; they never alter how a trusted cycle is predicted.

const BASICS = {lastPeriodStart: new Date(2026, 8, 1), cycleDuration: 28, periodDuration: 5};
const TODAY = new Date(2026, 8, 3);
const RECORDED: RecordedPeriod[] = [{startDate: '2026-09-01', endDate: '2026-09-05'}];

const declaredExact = computeCyclePredictionStatus(BASICS, 'yes', [new Date(2026, 8, 1)], null, TODAY);
const observing = computeCyclePredictionStatus(BASICS, 'unknown', [new Date(2026, 8, 1)], null, TODAY);
const window = computeCyclePredictionStatus(BASICS, 'no', [new Date(2026, 8, 1)], null, TODAY);
// Four real starts, 28 days apart → the 'unknown' branch MEASURES a regular cycle.
const observedRegular = computeCyclePredictionStatus(
  BASICS,
  'unknown',
  [new Date(2026, 5, 9), new Date(2026, 6, 7), new Date(2026, 7, 4), new Date(2026, 8, 1)],
  new Date(2026, 5, 9),
  TODAY,
);

describe('effectiveRegularityFor', () => {
  it("turns a declared-regular cycle whose lengths nobody provided into an observed one", () => {
    expect(effectiveRegularityFor('yes', false)).toBe('unknown');
  });

  it('keeps a declared-regular cycle whose lengths WERE provided', () => {
    expect(effectiveRegularityFor('yes', true)).toBe('yes');
  });

  it.each([true, false])("never touches 'no' or 'unknown' (confirmed duration = %s)", confirmed => {
    expect(effectiveRegularityFor('no', confirmed)).toBe('no');
    expect(effectiveRegularityFor('unknown', confirmed)).toBe('unknown');
  });
});

describe('canProjectCycle', () => {
  it('sanity: the fixtures cover every prediction mode', () => {
    expect(declaredExact.mode).toBe('exact');
    expect(observing.mode).toBe('observing');
    expect(window.mode).toBe('window');
    expect(observedRegular).toMatchObject({mode: 'exact', observedPattern: 'regular-looking', averageCycleLength: 28});
  });

  it.each<[string, CyclePredictionStatus]>([
    ['declared exact', declaredExact],
    ['observing', observing],
    ['window', window],
    ['observed regular', observedRegular],
  ])('nothing is projected without a recorded period (%s)', (_name, status) => {
    expect(canProjectCycle(status, true, 0)).toBe(false);
    expect(canProjectCycle(status, false, 0)).toBe(false);
  });

  it("an irregular 'window' is never projected as one cycle", () => {
    expect(canProjectCycle(window, true, 3)).toBe(false);
  });

  it('a cycle length MEASURED from recorded history is trusted even when no length was ever provided', () => {
    expect(canProjectCycle(observedRegular, false, 4)).toBe(true);
  });

  it('a declared cycle is projected only when its lengths were really provided', () => {
    expect(canProjectCycle(declaredExact, true, 1)).toBe(true);
    expect(canProjectCycle(declaredExact, false, 1)).toBe(false);
  });

  it('an observation still in progress is projected only from provided lengths, never from the placeholder', () => {
    expect(canProjectCycle(observing, false, 1)).toBe(false);
    expect(canProjectCycle(observing, true, 1)).toBe(true);
  });
});

describe('calendarDayKindFor — canProject', () => {
  const kinds = (canProject?: boolean) =>
    [2, 12, 15, 29].map(day => calendarDayKindFor(new Date(2026, 8, day), BASICS, declaredExact, RECORDED, TODAY, canProject));

  it('defaults to projecting, exactly as before', () => {
    expect(kinds()).toEqual(['period', 'fertile', 'ovulation', 'period']);
    expect(kinds(true)).toEqual(kinds());
  });

  it('false paints only the periods that were really recorded — no projected period, fertile window or ovulation', () => {
    expect(kinds(false)).toEqual(['period', 'normal', 'normal', 'normal']);
  });

  it("false behaves exactly like an irregular 'window'", () => {
    const windowKinds = [2, 12, 15, 29].map(day => calendarDayKindFor(new Date(2026, 8, day), BASICS, window, RECORDED, TODAY));
    expect(kinds(false)).toEqual(windowKinds);
  });

  it('false with nothing recorded is a plain calendar', () => {
    const plain = Array.from({length: 30}, (_, index) => calendarDayKindFor(new Date(2026, 8, index + 1), BASICS, declaredExact, [], TODAY, false));
    expect(new Set(plain)).toEqual(new Set(['normal']));
  });
});
