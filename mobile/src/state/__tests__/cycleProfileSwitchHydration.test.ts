import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  addPeriodOccurrence,
  getCyclePreferences,
  getHasConfirmedCycleData,
  getHasRecordedFirstPeriod,
  getIsCycleStateReady,
  getRecordedPeriodHistory,
  hydrateCyclePreferences,
  reloadCycleStateFromStorage,
  setCyclePreferences,
} from '../onboardingPreferences';
import {addManagedProfile, getManagedProfiles, resetManagedProfileFirstPeriod, resetManagedProfilesForTests} from '../managedProfilesStore';
import {OWNER_PROFILE_ID, getActiveProfileId, reloadActiveProfileData, resetActiveProfileForTests, setActiveProfileId} from '../activeProfileStore';
import {recordManagedProfileFirstPeriod, seedManagedProfileCycleIfNeeded, syncManagedProfileRecordFromCycle} from '../managedProfileCycleSeed';
import {profileScopedKey} from '../profileScopedStorage';
import {deleteTrackedDataForProfile} from '../../services/backupService';

// The cycle state (periods, flags, placeholders) is ONE in-memory singleton that is
// re-filled from the ACTIVE profile's own storage key. These tests pin down what it
// may and may not hold while that happens — a daughter's calendar must never show the
// mother's (or a sibling's) periods, not even for a moment, and not when reads finish
// out of order.

const CYCLE_KEY_BASE = '@hawa/cycle-preferences';
const cycleKey = (profileId: string) => profileScopedKey(CYCLE_KEY_BASE, profileId);

const getItem = AsyncStorage.getItem as jest.Mock;
const originalGetItem = getItem.getMockImplementation() as (key: string) => Promise<string | null>;

const MOTHER_START = new Date(2025, 2, 4, 12);
const NOOR_START = new Date(2025, 3, 10, 12);
const LINA_START = new Date(2025, 3, 20, 12);

const flush = async () => {
  for (let index = 0; index < 20; index += 1) {
    await Promise.resolve();
  }
};

const addDaughter = (firstName: string) =>
  addManagedProfile({type: 'daughter', firstName, birthDate: '2013-01-01', hasHadFirstPeriod: false});

/** Starts a profile switch WITHOUT waiting for it: every listener has already run synchronously, the
 * async part (persisting the choice, reading the new profile's data) is left pending. */
const startSwitch = (profileId: string): void => {
  setActiveProfileId(profileId).catch(() => undefined);
};

/** Makes the first read of `key` wait for release(); its value is the storage content at the moment the
 * read STARTS (like a real read), so a release after the storage changed delivers stale data. */
const holdFirstRead = (key: string) => {
  let release: () => void = () => undefined;
  let held = false;
  getItem.mockImplementation((requested: string) => {
    if (requested !== key || held) {
      return originalGetItem(requested);
    }
    held = true;
    const snapshot = originalGetItem(requested);
    return new Promise(resolve => {
      release = () => resolve(snapshot);
    });
  });
  return {release: () => release()};
};

/** Holds EVERY read of the given keys until released individually. */
const holdReads = (...keys: string[]) => {
  const releases = new Map<string, () => void>();
  getItem.mockImplementation((requested: string) => {
    if (!keys.includes(requested)) {
      return originalGetItem(requested);
    }
    const snapshot = originalGetItem(requested);
    return new Promise(resolve => {
      releases.set(requested, () => resolve(snapshot));
    });
  });
  return (key: string) => releases.get(key)?.();
};

beforeEach(async () => {
  getItem.mockImplementation(originalGetItem);
  await AsyncStorage.clear();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  await hydrateCyclePreferences();
  // The mother's own cycle: confirmed, with a real recorded period. Awaited: the encrypted write has several async
  // steps, and a test that clears storage right after must not race it.
  await setCyclePreferences({lastPeriodStart: MOTHER_START, periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
});

afterEach(() => {
  getItem.mockImplementation(originalGetItem);
});

describe('getHasRecordedFirstPeriod — derived from the recorded history', () => {
  it('is false for the neutral placeholder even though cyclePreferences is fully populated, and true once a period is recorded', async () => {
    await AsyncStorage.clear();
    await resetActiveProfileForTests();
    await hydrateCyclePreferences();

    // A populated, non-null placeholder (5-day period / 28-day cycle / regular) — NOT a recorded period.
    expect(getCyclePreferences()).toMatchObject({periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    expect(getHasRecordedFirstPeriod()).toBe(false);
    expect(getRecordedPeriodHistory()).toEqual([]);

    addPeriodOccurrence(NOOR_START);
    expect(getHasRecordedFirstPeriod()).toBe(true);
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2025-04-10']);
  });
});

describe('switching profiles', () => {
  it("drops the previous profile's cycle data in the SAME tick as the switch — before any read lands", async () => {
    const noor = await addDaughter('Noor');
    expect(getHasRecordedFirstPeriod()).toBe(true); // the mother's own history

    const switching = setActiveProfileId(noor.id); // not awaited: every listener already ran
    expect(getActiveProfileId()).toBe(noor.id);
    expect(getHasRecordedFirstPeriod()).toBe(false);
    expect(getRecordedPeriodHistory()).toEqual([]);
    expect(getHasConfirmedCycleData()).toBe(false);
    expect(getIsCycleStateReady()).toBe(false);

    await switching;
    await hydrateCyclePreferences();
    expect(getIsCycleStateReady()).toBe(true);
    expect(getHasRecordedFirstPeriod()).toBe(false); // still hers: nothing recorded
  });

  it("brings the owner's own history back — and only hers — when switching back", async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, NOOR_START);
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2025-04-10']);

    const switching = setActiveProfileId(OWNER_PROFILE_ID);
    expect(getRecordedPeriodHistory()).toEqual([]); // Noor's period is gone from memory at once
    expect(getIsCycleStateReady()).toBe(false);

    await switching;
    await hydrateCyclePreferences();
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2025-03-04']);
  });

  it("keeps sibling histories apart in both directions", async () => {
    const noor = await addDaughter('Noor');
    const lina = await addDaughter('Lina');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, NOOR_START);
    await setActiveProfileId(lina.id);
    await hydrateCyclePreferences();
    expect(getRecordedPeriodHistory()).toEqual([]); // Lina has recorded nothing
    await recordManagedProfileFirstPeriod(lina.id, LINA_START);
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2025-04-20']);

    await setActiveProfileId(noor.id);
    await hydrateCyclePreferences();
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2025-04-10']);
  });

  it('discards a read that finishes after a NEWER switch (reads resolving out of order)', async () => {
    const noor = await addDaughter('Noor');
    const lina = await addDaughter('Lina');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, NOOR_START);
    await setActiveProfileId(lina.id);
    await recordManagedProfileFirstPeriod(lina.id, LINA_START);
    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();

    const release = holdReads(cycleKey(noor.id), cycleKey(lina.id));
    startSwitch(noor.id); // Noor's read starts first …
    startSwitch(lina.id); // … Lina's second, and Lina is the profile that ends up active.
    await flush();
    expect(getActiveProfileId()).toBe(lina.id);
    expect(getHasRecordedFirstPeriod()).toBe(false); // nothing of anyone's is in memory yet

    release(cycleKey(lina.id));
    await flush();
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2025-04-20']);

    release(cycleKey(noor.id)); // the STALE read finishes last
    await flush();
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2025-04-20']);
    expect(getIsCycleStateReady()).toBe(true);
    expect(getActiveProfileId()).toBe(lina.id);
  });

  it('applies the newest read even when the OLDER read is the one that finishes first', async () => {
    const noor = await addDaughter('Noor');
    const lina = await addDaughter('Lina');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, NOOR_START);
    await setActiveProfileId(lina.id);
    await recordManagedProfileFirstPeriod(lina.id, LINA_START);
    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();

    const release = holdReads(cycleKey(noor.id), cycleKey(lina.id));
    startSwitch(noor.id);
    startSwitch(lina.id);
    await flush();

    release(cycleKey(noor.id)); // stale one first
    await flush();
    expect(getHasRecordedFirstPeriod()).toBe(false); // it must not have been applied to Lina
    expect(getIsCycleStateReady()).toBe(false);

    release(cycleKey(lina.id));
    await flush();
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2025-04-20']);
    expect(getIsCycleStateReady()).toBe(true);
  });

  it('shares ONE read between every caller that hydrates the same profile at the same time', async () => {
    const noor = await addDaughter('Noor');
    getItem.mockClear();

    startSwitch(noor.id);
    await Promise.all([hydrateCyclePreferences(), hydrateCyclePreferences(), hydrateCyclePreferences(), hydrateCyclePreferences()]);

    const reads = getItem.mock.calls.filter(([key]) => key === cycleKey(noor.id));
    expect(reads).toHaveLength(1);
    expect(getIsCycleStateReady()).toBe(true);
  });
});

describe('reloadCycleStateFromStorage — storage changed behind the store back', () => {
  it("clears a daughter's recorded period from memory once her tracking data was deleted", async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, NOOR_START);
    expect(getHasRecordedFirstPeriod()).toBe(true);

    await deleteTrackedDataForProfile(noor.id);
    expect(getHasRecordedFirstPeriod()).toBe(true); // memory alone cannot know — that is why the reload exists

    await reloadCycleStateFromStorage();
    expect(getHasRecordedFirstPeriod()).toBe(false);
    expect(getRecordedPeriodHistory()).toEqual([]);
    expect(getHasConfirmedCycleData()).toBe(false);
    expect(getIsCycleStateReady()).toBe(true);
  });

  it('is not undone by a read that started BEFORE the deletion and finishes after it', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, NOOR_START);

    const stale = holdFirstRead(cycleKey(noor.id));
    reloadCycleStateFromStorage().catch(() => undefined); // a read starts here and sees the old data …
    await flush();
    // … the data is deleted while it is in flight … (not awaited yet: reads and removals of one encrypted record are
    // serialized per key, so with encryption on the deletion queues behind the held read and ends once it is released)
    const deleting = deleteTrackedDataForProfile(noor.id);
    await flush();
    const reloading = reloadCycleStateFromStorage(); // … and the deletion's own reload starts a fresh read

    stale.release();
    await deleting;
    await reloading;
    await flush();
    expect(getHasRecordedFirstPeriod()).toBe(false);
    expect(getRecordedPeriodHistory()).toEqual([]);
  });

  it("brings a restored backup's periods into memory", async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, NOOR_START);
    const backedUp = await AsyncStorage.getItem(cycleKey(noor.id));

    await deleteTrackedDataForProfile(noor.id);
    await reloadCycleStateFromStorage();
    expect(getHasRecordedFirstPeriod()).toBe(false);

    await AsyncStorage.setItem(cycleKey(noor.id), backedUp as string); // what restoreBackupForProfile writes
    await reloadCycleStateFromStorage();
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2025-04-10']);
  });
});

describe('"delete tracking data" for a daughter — the deleted first period never comes back', () => {
  it('forgets the first period her profile record carried, so a profile switch or restart cannot re-seed it', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, NOOR_START);
    expect(getManagedProfiles().find(item => item.id === noor.id)?.hasHadFirstPeriod).toBe(true);

    await deleteTrackedDataForProfile(noor.id);
    await resetManagedProfileFirstPeriod(noor.id);
    reloadActiveProfileData();
    await reloadCycleStateFromStorage();
    expect(getHasRecordedFirstPeriod()).toBe(false);

    // Away and back (what a switch or an app restart does): the seed finds nothing to rebuild from.
    await setActiveProfileId(OWNER_PROFILE_ID);
    await setActiveProfileId(noor.id);
    await seedManagedProfileCycleIfNeeded(noor.id);
    expect(getHasRecordedFirstPeriod()).toBe(false);
    const record = getManagedProfiles().find(item => item.id === noor.id);
    expect(record).toMatchObject({firstName: 'Noor', hasHadFirstPeriod: false, lastPeriodDate: null, periodLength: null, cycleLength: null, regularity: null});
  });

  it('WITHOUT forgetting the record the seed brings the period back (the bug this guards)', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, NOOR_START);
    await deleteTrackedDataForProfile(noor.id);
    await reloadCycleStateFromStorage();
    await seedManagedProfileCycleIfNeeded(noor.id);
    expect(getHasRecordedFirstPeriod()).toBe(true);
  });

  it('a restored backup brings the history back AND updates her record, without duplicating the period', async () => {
    const noor = await addDaughter('Noor');
    await setActiveProfileId(noor.id);
    await recordManagedProfileFirstPeriod(noor.id, NOOR_START);
    const backedUp = await AsyncStorage.getItem(cycleKey(noor.id));
    await deleteTrackedDataForProfile(noor.id);
    await resetManagedProfileFirstPeriod(noor.id);
    await reloadCycleStateFromStorage();

    await AsyncStorage.setItem(cycleKey(noor.id), backedUp as string);
    reloadActiveProfileData();
    await reloadCycleStateFromStorage();
    await syncManagedProfileRecordFromCycle(noor.id);
    await seedManagedProfileCycleIfNeeded(noor.id);

    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2025-04-10']);
    expect(getManagedProfiles().find(item => item.id === noor.id)).toMatchObject({hasHadFirstPeriod: true, lastPeriodDate: '2025-04-10'});
  });
});
