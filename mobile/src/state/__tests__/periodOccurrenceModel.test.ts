import AsyncStorage from '@react-native-async-storage/async-storage';

// M4 / M7 / M8 / M16 — one coherent period data model:
//   periodHistory (recorded occurrences) + lastPeriodStart (= the LATEST real
//   start) + confirmedPeriodHistory (actual start/end pairs) + habitual
//   periodDuration / cycleDuration (settings, never redefined by an edit).
// onboardingPreferences.ts is a module singleton, so every test loads a fresh
// copy (and a fresh confirmedPeriodHistoryStore) on top of an empty storage.
type Onboarding = typeof import('../onboardingPreferences');
type Confirmed = typeof import('../confirmedPeriodHistoryStore');
let onboarding: Onboarding;
let confirmed: Confirmed;

const prefs = (start: Date, periodDuration = 5, cycleDuration = 28) => ({
  lastPeriodStart: start,
  periodDuration,
  cycleDuration,
  regularity: 'yes' as const,
});

const starts = () => onboarding.getRecordedPeriodHistory().map(record => record.startDate);
const latestKey = () => onboarding.getCyclePreferences().lastPeriodStart.toLocaleDateString('en-CA');
const ranges = () => onboarding.getRecordedPeriodHistory().map(record => `${record.startDate}..${record.endDate}`);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.resetModules();
  onboarding = require('../onboardingPreferences');
  confirmed = require('../confirmedPeriodHistoryStore');
  await onboarding.hydrateCyclePreferences();
});

describe('M4 — correcting a period start replaces it, it never leaves the old start behind', () => {
  it('setCyclePreferences: Aug 1, Sep 1, then Sep 1 -> Sep 2 gives Aug 1, Sep 2 (not Aug 1, Sep 1, Sep 2)', () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 1)));
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1)));
    expect(starts()).toEqual(['2026-08-01', '2026-09-01']);

    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 2)));

    expect(starts()).toEqual(['2026-08-01', '2026-09-02']);
    expect(latestKey()).toBe('2026-09-02');
  });

  it('setCyclePreferences: correcting BACKWARDS (Sep 1 -> Aug 28) also replaces', () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 6, 4)));
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1)));
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 28)));

    expect(starts()).toEqual(['2026-07-04', '2026-08-28']);
    expect(latestKey()).toBe('2026-08-28');
  });

  it('setCyclePreferences: a start a full cycle later is a NEW period, the earlier one is kept', () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 1)));
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1)));
    onboarding.setCyclePreferences(prefs(new Date(2026, 9, 1)));

    expect(starts()).toEqual(['2026-08-01', '2026-09-01', '2026-10-01']);
  });

  it('correctPeriodOccurrence: Sep 1 -> Sep 2 (forward) and Sep 1 -> Aug 28 (backward), unrelated periods untouched', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 1)));
    onboarding.confirmPeriodStart(new Date(2026, 8, 1));

    await onboarding.correctPeriodOccurrence(new Date(2026, 8, 1), new Date(2026, 8, 2));
    expect(ranges()).toEqual(['2026-08-01..2026-08-05', '2026-09-02..2026-09-06']);

    await onboarding.correctPeriodOccurrence(new Date(2026, 8, 2), new Date(2026, 7, 28));
    expect(ranges()).toEqual(['2026-08-01..2026-08-05', '2026-08-28..2026-09-01']);
  });

  it('a corrected range that overlaps ANOTHER period is refused and nothing changes', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 1)));
    onboarding.confirmPeriodStart(new Date(2026, 8, 1));

    await expect(onboarding.correctPeriodOccurrence(new Date(2026, 8, 1), new Date(2026, 7, 4))).rejects.toThrow('OVERLAPPING_RANGE');
    expect(starts()).toEqual(['2026-08-01', '2026-09-01']);
  });

  it('the first real period discards the placeholder seed (unchanged)', () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 3)));
    expect(starts()).toEqual(['2026-08-03']);
  });
});

describe('M16 — lastPeriodStart is the LATEST real start', () => {
  it('A. backfill: existing Sep 20, add Aug 22 -> latest stays Sep 20, Aug 22 is added', () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 20)));
    onboarding.confirmPeriodStart(new Date(2026, 7, 22));

    expect(starts()).toEqual(['2026-08-22', '2026-09-20']);
    expect(latestKey()).toBe('2026-09-20');
  });

  it('B. new latest: existing Sep 20, add Oct 18 -> latest Oct 18', () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 20)));
    onboarding.confirmPeriodStart(new Date(2026, 9, 18));

    expect(starts()).toEqual(['2026-09-20', '2026-10-18']);
    expect(latestKey()).toBe('2026-10-18');
  });

  it('C. correction: latest Sep 20 corrected to Sep 19 -> latest Sep 19 and the Sep 20 occurrence is gone', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 22)));
    onboarding.confirmPeriodStart(new Date(2026, 8, 20));

    await onboarding.correctPeriodOccurrence(new Date(2026, 8, 20), new Date(2026, 8, 19));

    expect(starts()).toEqual(['2026-08-22', '2026-09-19']);
    expect(latestKey()).toBe('2026-09-19');
  });

  it('D. historical correction: Aug 22 -> Aug 23 leaves Sep 20 as the latest', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 22)));
    onboarding.confirmPeriodStart(new Date(2026, 8, 20));

    await onboarding.correctPeriodOccurrence(new Date(2026, 7, 22), new Date(2026, 7, 23));

    expect(starts()).toEqual(['2026-08-23', '2026-09-20']);
    expect(latestKey()).toBe('2026-09-20');
  });

  it('a backfilled period never runs into the next recorded period', () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 3)));
    onboarding.confirmPeriodStart(new Date(2026, 8, 1)); // projected end Sep 5 would overlap Sep 3

    expect(ranges()).toEqual(['2026-09-01..2026-09-02', '2026-09-03..2026-09-07']);
  });

  it('a start already inside a recorded period is a no-op (no duplicate, no reset of its end)', () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1)));
    onboarding.confirmPeriodStart(new Date(2026, 8, 3));
    onboarding.confirmPeriodStart(new Date(2026, 8, 1));

    expect(ranges()).toEqual(['2026-09-01..2026-09-05']);
  });

  it('a normal new-latest period keeps the habitual settings exactly as configured', () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 1), 6, 31));
    onboarding.confirmPeriodStart(new Date(2026, 8, 5));

    expect(onboarding.getCyclePreferences()).toMatchObject({periodDuration: 6, cycleDuration: 31, regularity: 'yes'});
    expect(latestKey()).toBe('2026-09-05');
  });
});

describe('M8 — editing one actual period never redefines the habitual durations', () => {
  it('configured cycle 28 / period 5, actual period edited Sep 1 -> Sep 7: period is 7 days, habits unchanged', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 4), 5, 28));
    onboarding.confirmPeriodStart(new Date(2026, 8, 1));

    const result = await onboarding.updateCurrentPeriodRange(new Date(2026, 8, 1), new Date(2026, 8, 7));

    expect(ranges()).toEqual(['2026-08-04..2026-08-08', '2026-09-01..2026-09-07']);
    expect(result.periodDuration).toBe(5);
    expect(result.cycleDuration).toBe(28);
    expect(onboarding.getCyclePreferences()).toMatchObject({periodDuration: 5, cycleDuration: 28});
  });

  it('a start moved by the edit does not turn the history gaps into a new habitual cycleDuration', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 4), 5, 28));
    onboarding.confirmPeriodStart(new Date(2026, 8, 6)); // 33-day gap
    await onboarding.updateCurrentPeriodRange(new Date(2026, 8, 6), new Date(2026, 8, 9));

    expect(onboarding.getCyclePreferences().cycleDuration).toBe(28);
    expect(onboarding.getCyclePreferences().periodDuration).toBe(5);
  });

  it('the habitual period duration configured later still moves a never-edited (projected) end, but not an edited one', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 4), 5, 28));
    onboarding.confirmPeriodStart(new Date(2026, 8, 1));
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1), 6, 28)); // same start, habit 6
    expect(ranges()[1]).toBe('2026-09-01..2026-09-06');

    await onboarding.updateCurrentPeriodRange(new Date(2026, 8, 1), new Date(2026, 8, 9)); // user-set end
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1), 4, 28)); // habit changes again
    expect(ranges()[1]).toBe('2026-09-01..2026-09-09');
  });
});

describe('M7 — confirming the actual end updates the recorded period', () => {
  it('start Sep 1, confirm end Sep 5 -> recorded Sep 1..Sep 5 (and the confirmed history agrees)', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1), 7, 28)); // projected end Sep 7
    expect(ranges()).toEqual(['2026-09-01..2026-09-07']);

    await confirmed.recordConfirmedPeriodEnd(new Date(2026, 8, 1), new Date(2026, 8, 5, 18, 30));

    expect(ranges()).toEqual(['2026-09-01..2026-09-05']);
    expect(onboarding.isDateWithinConfirmedPeriod(new Date(2026, 8, 5))).toBe(true);
    expect(onboarding.isDateWithinConfirmedPeriod(new Date(2026, 8, 6))).toBe(false);
    expect(confirmed.getConfirmedPeriodHistory().map(item => item.id)).toEqual(['2026-09-01']);
  });

  it('a period that lasted longer than projected is extended, never past the next period', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1), 5, 28));
    onboarding.confirmPeriodStart(new Date(2026, 8, 10));

    await confirmed.recordConfirmedPeriodEnd(new Date(2026, 8, 1), new Date(2026, 8, 8, 9, 0));
    expect(ranges()[0]).toBe('2026-09-01..2026-09-08');

    await confirmed.recordConfirmedPeriodEnd(new Date(2026, 8, 1), new Date(2026, 8, 20, 9, 0));
    expect(ranges()[0]).toBe('2026-09-01..2026-09-09');
  });

  it('editing the confirmed end again (Modifier) updates the SAME recorded period', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1), 5, 28));
    await confirmed.recordConfirmedPeriodEnd(new Date(2026, 8, 1), new Date(2026, 8, 4, 10, 0));
    await confirmed.recordConfirmedPeriodEnd(new Date(2026, 8, 1), new Date(2026, 8, 6, 10, 0));

    expect(ranges()).toEqual(['2026-09-01..2026-09-06']);
  });

  it('never manufactures an end for a historical period that was never confirmed', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 4), 5, 28));
    onboarding.confirmPeriodStart(new Date(2026, 8, 1));
    await confirmed.recordConfirmedPeriodEnd(new Date(2026, 8, 1), new Date(2026, 8, 3, 10, 0));

    expect(ranges()).toEqual(['2026-08-04..2026-08-08', '2026-09-01..2026-09-03']);
  });

  it('a confirmed end for a start that is not recorded changes nothing', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1), 5, 28));
    await confirmed.recordConfirmedPeriodEnd(new Date(2026, 6, 1), new Date(2026, 6, 4, 10, 0));

    expect(ranges()).toEqual(['2026-09-01..2026-09-05']);
  });

  it('re-saving the SAME start with a new habitual duration keeps a confirmed end', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1), 5, 28));
    await confirmed.recordConfirmedPeriodEnd(new Date(2026, 8, 1), new Date(2026, 8, 5, 10, 0));
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1), 6, 28));

    expect(ranges()).toEqual(['2026-09-01..2026-09-05']);
  });

  it('correcting the range drops the stale confirmed occurrence; a still-valid one is kept', async () => {
    onboarding.setCyclePreferences(prefs(new Date(2026, 8, 1), 5, 28));
    await confirmed.recordConfirmedPeriodEnd(new Date(2026, 8, 1), new Date(2026, 8, 5, 10, 0));

    await onboarding.correctPeriodOccurrence(new Date(2026, 8, 1), new Date(2026, 8, 2), new Date(2026, 8, 6));
    expect(confirmed.getConfirmedPeriodHistory()).toEqual([]);
    expect(ranges()).toEqual(['2026-09-02..2026-09-06']);

    await confirmed.recordConfirmedPeriodEnd(new Date(2026, 8, 2), new Date(2026, 8, 6, 10, 0));
    await onboarding.correctPeriodOccurrence(new Date(2026, 8, 2), new Date(2026, 8, 2), new Date(2026, 8, 6));
    expect(confirmed.getConfirmedPeriodHistory().map(item => item.id)).toEqual(['2026-09-02']);
  });

  it('hydrating older persisted data never overrides a recorded range with a confirmed end', async () => {
    await AsyncStorage.setItem(
      '@hawa/cycle-preferences',
      JSON.stringify({
        preferences: {lastPeriodStart: new Date(2026, 8, 1).toISOString(), periodDuration: 5, cycleDuration: 28, regularity: 'yes'},
        periodHistory: [{id: '2026-09-01', startDate: '2026-09-01', endDate: '2026-09-07'}],
        hasConfirmedCycleData: true,
      }),
    );
    await AsyncStorage.setItem(
      '@hawa/confirmed-period-history',
      JSON.stringify([
        {id: '2026-09-01', periodStart: new Date(2026, 8, 1).toISOString(), periodEndDateTime: new Date(2026, 8, 5, 10).toISOString(), capturedAt: new Date().toISOString()},
      ]),
    );
    jest.resetModules();
    onboarding = require('../onboardingPreferences');
    confirmed = require('../confirmedPeriodHistoryStore');
    await onboarding.hydrateCyclePreferences();
    await confirmed.hydrateConfirmedPeriodHistory();

    expect(ranges()).toEqual(['2026-09-01..2026-09-07']);
  });
});
