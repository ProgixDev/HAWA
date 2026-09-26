import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  confirmDelivery,
  getPostpartumPreferences,
  recordFirstPostpartumPeriod,
  setDeliveryDate,
  setDeliveryType,
  setFeedingType,
  setPostpartumPreferences,
} from '../postpartumPreferences';
import {getPostpartumLochiaTracking, markPostpartumLochiaEnded} from '../postpartumLochiaStore';

// M34 - starting a NEW postpartum journey never erases the earlier answers: they
// stay in storage, but they are no longer reported as the new journey's.
const d = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12);
const STORAGE_KEY = '@hawa/postpartum-preferences/v1';

const rawStored = async () => JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '{}') as Record<string, unknown>;

const EMPTY = {
  deliveryDate: null,
  startedAt: null,
  deliveryType: null,
  feedingType: null,
  firstPostpartumPeriodDate: null,
  dailyTrackingReminderEnabled: false,
  dailyTrackingReminderTime: null,
};

// The store is a module singleton: each test starts from an explicit empty state.
beforeEach(async () => {
  await setPostpartumPreferences({...EMPTY});
});

const seedOldJourney = async () => {
  await confirmDelivery(d(2026, 1, 10));
  await setDeliveryType('vaginal');
  await setFeedingType('mixed');
  await recordFirstPostpartumPeriod(d(2026, 2, 20));
  await markPostpartumLochiaEnded('2026-02-05');
};

describe('starting a new journey (Pregnancy -> Postpartum transition)', () => {
  it('KEEPS every earlier answer in storage and in the lochia store', async () => {
    await seedOldJourney();
    await confirmDelivery(d(2026, 9, 20), {startsNewJourney: true});

    const stored = await rawStored();
    expect(stored.deliveryType).toBe('vaginal');
    expect(stored.feedingType).toBe('mixed');
    expect(stored.firstPostpartumPeriodDate).toBe('2026-02-20');
    expect(stored.deliveryDate).toBe('2026-09-20');
    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-02-05');
  });

  it('does NOT present the earlier answers as the new journey\'s', async () => {
    await seedOldJourney();
    await confirmDelivery(d(2026, 9, 20), {startsNewJourney: true});

    const current = getPostpartumPreferences();
    expect(current.deliveryDate).toBe('2026-09-20');
    expect(current.deliveryType).toBeNull();
    expect(current.feedingType).toBeNull();
    expect(current.firstPostpartumPeriodDate).toBeNull(); // dated before the new delivery
  });

  it('a new answer for the new journey is shown and does NOT resurrect the other earlier answer', async () => {
    await seedOldJourney();
    await confirmDelivery(d(2026, 9, 20), {startsNewJourney: true});
    await setDeliveryType('planned_csection');

    const current = getPostpartumPreferences();
    expect(current.deliveryType).toBe('planned_csection');
    expect(current.feedingType).toBeNull(); // the earlier feeding answer stays hidden...
    expect((await rawStored()).feedingType).toBe('mixed'); // ...and preserved
  });

  it('correcting the new delivery date keeps ITS answers and still hides the earlier ones', async () => {
    await seedOldJourney();
    await confirmDelivery(d(2026, 9, 20), {startsNewJourney: true});
    await setDeliveryType('emergency_csection');

    await setDeliveryDate(d(2026, 9, 22));

    const current = getPostpartumPreferences();
    expect(current.deliveryDate).toBe('2026-09-22');
    expect(current.deliveryType).toBe('emergency_csection');
    expect(current.feedingType).toBeNull();
  });

  it('a first period recorded for the new journey (on/after its delivery) is shown', async () => {
    await seedOldJourney();
    await confirmDelivery(d(2026, 9, 1), {startsNewJourney: true});
    await recordFirstPostpartumPeriod(d(2026, 9, 25));
    expect(getPostpartumPreferences().firstPostpartumPeriodDate).toBe('2026-09-25');
    expect((await rawStored()).firstPostpartumPeriodDate).toBe('2026-09-25');
  });
});

describe('no earlier journey / legacy data', () => {
  it('a first delivery keeps behaving as before: answers are shown', async () => {
    await confirmDelivery(d(2026, 9, 1));
    await setDeliveryType('vaginal');
    await setFeedingType('unknown');
    const current = getPostpartumPreferences();
    expect(current.deliveryType).toBe('vaginal');
    expect(current.feedingType).toBe('unknown');
  });

  it('data persisted before the markers existed (no marker) still counts as the current journey', async () => {
    await setPostpartumPreferences({
      ...EMPTY,
      deliveryDate: '2026-08-01',
      startedAt: '2026-08-01T00:00:00.000Z',
      deliveryType: 'vaginal',
      feedingType: 'exclusive_bottle',
      firstPostpartumPeriodDate: '2026-09-10',
    });
    const current = getPostpartumPreferences();
    expect(current.deliveryType).toBe('vaginal');
    expect(current.feedingType).toBe('exclusive_bottle');
    expect(current.firstPostpartumPeriodDate).toBe('2026-09-10');
  });

  it('legacy answers (no marker) are recognised as the EARLIER journey once a new one starts, and kept', async () => {
    await setPostpartumPreferences({
      ...EMPTY,
      deliveryDate: '2026-01-10',
      startedAt: '2026-01-10T00:00:00.000Z',
      deliveryType: 'vaginal',
      feedingType: 'mixed',
    });
    await confirmDelivery(d(2026, 9, 20), {startsNewJourney: true});
    expect(getPostpartumPreferences().deliveryType).toBeNull();
    expect(getPostpartumPreferences().feedingType).toBeNull();
    expect((await rawStored()).deliveryType).toBe('vaginal');
    expect((await rawStored()).feedingType).toBe('mixed');
  });

  it('confirmDelivery without startsNewJourney (standalone flow) never hides current answers', async () => {
    await confirmDelivery(d(2026, 9, 1));
    await setDeliveryType('vaginal');
    await confirmDelivery(d(2026, 9, 2)); // same journey, date corrected
    expect(getPostpartumPreferences().deliveryType).toBe('vaginal');
  });
});
