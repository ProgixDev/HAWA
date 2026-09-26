import AsyncStorage from '@react-native-async-storage/async-storage';

// onboardingPreferences.ts is a module singleton with a hydration cache, so
// every test loads a fresh copy on top of an empty AsyncStorage.
type Onboarding = typeof import('../onboardingPreferences');
let onboarding: Onboarding;

const CYCLE_KEY = '@hawa/cycle-preferences';

const prefs = (start: Date) => ({
  lastPeriodStart: start,
  periodDuration: 5,
  cycleDuration: 28,
  regularity: 'yes' as const,
});

const key = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.resetModules();
  onboarding = require('../onboardingPreferences');
});

describe('placeholder period record seeded from the unconfirmed fallback defaults', () => {
  it('is visible to raw readers but is NOT recorded history', async () => {
    await onboarding.hydrateCyclePreferences();

    expect(onboarding.getHasConfirmedCycleData()).toBe(false);
    expect(onboarding.getPeriodHistory()).toHaveLength(1); // the placeholder (unchanged raw behavior)
    expect(onboarding.getRecordedPeriodHistory()).toEqual([]);
  });

  it('never makes today look like "inside a confirmed period" before anything was confirmed', async () => {
    await onboarding.hydrateCyclePreferences();
    // The fallback puts the placeholder period around "today".
    expect(onboarding.isDateWithinConfirmedPeriod(new Date())).toBe(false);
  });

  it('is DISCARDED when the user confirms her first real period — it is never persisted next to it', async () => {
    await onboarding.hydrateCyclePreferences();
    const realStart = new Date(2026, 7, 3);

    onboarding.setCyclePreferences(prefs(realStart));

    const recorded = onboarding.getRecordedPeriodHistory();
    expect(recorded.map(record => record.startDate)).toEqual([key(realStart)]);
    expect(onboarding.getPeriodHistory().map(record => record.startDate)).toEqual([key(realStart)]);

    await new Promise(resolve => setImmediate(resolve));
    const persisted = JSON.parse((await AsyncStorage.getItem(CYCLE_KEY)) as string);
    expect(persisted.periodHistory.map((record: {startDate: string}) => record.startDate)).toEqual([key(realStart)]);
    expect(persisted.hasConfirmedCycleData).toBe(true);
  });

  it('is also discarded when the first real data comes from editing the period range in the Calendar', async () => {
    await onboarding.hydrateCyclePreferences();
    await onboarding.updateCurrentPeriodRange(new Date(2026, 7, 3), new Date(2026, 7, 7));

    expect(onboarding.getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2026-08-03']);
  });
});

describe('once real cycle data is confirmed, real history is preserved', () => {
  it('keeps every recorded period when a newer one is added', async () => {
    await onboarding.hydrateCyclePreferences();
    onboarding.setCyclePreferences(prefs(new Date(2026, 6, 6)));
    onboarding.setCyclePreferences(prefs(new Date(2026, 7, 3)));
    onboarding.confirmPeriodStart(new Date(2026, 8, 1));

    expect(onboarding.getRecordedPeriodHistory().map(record => record.startDate)).toEqual([
      '2026-07-06',
      '2026-08-03',
      '2026-09-01',
    ]);
  });

  it('a user with previously stored data (legacy blob, no flag) keeps her history untouched', async () => {
    await AsyncStorage.setItem(
      CYCLE_KEY,
      JSON.stringify({
        preferences: {
          lastPeriodStart: new Date(2026, 7, 3).toISOString(),
          periodDuration: 5,
          cycleDuration: 28,
          regularity: 'yes',
        },
        periodHistory: [
          {id: '2026-07-06', startDate: '2026-07-06', endDate: '2026-07-10'},
          {id: '2026-08-03', startDate: '2026-08-03', endDate: '2026-08-07'},
        ],
      }),
    );

    await onboarding.hydrateCyclePreferences();

    expect(onboarding.getHasConfirmedCycleData()).toBe(true);
    expect(onboarding.getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2026-07-06', '2026-08-03']);
    expect(onboarding.isDateWithinConfirmedPeriod(new Date(2026, 7, 4))).toBe(true);
    expect(onboarding.isDateWithinConfirmedPeriod(new Date(2026, 7, 20))).toBe(false);
  });
});
