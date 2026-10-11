import {
  OWNER_PROFILE_ID,
  reloadActiveProfileData,
  resetActiveProfileForTests,
  setActiveProfileId,
} from '../../state/activeProfileStore';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {loadOwnerProfileData} from '../ownerReminderGate';

// The gate the three owner-global reminders (TTC, SOPK, post-Ramadan Qadaa) wait behind before deriving anything:
//   - a managed (daughter) profile active  -> null, and `load` (the reads) is not even started;
//   - a switch while `load` is in flight   -> the result may describe another profile: null, or load again;
//   - a switch AWAY AND BACK (A -> B -> A) -> the same id again, but the data read may be B's: load again;
//   - reloadActiveProfileData() (a restore replaced the records) -> load again;
//   - a switch in the microtask gap between the gate's decision and the caller's resumption -> isCurrent() is false.
// Synthetic profiles only.

let daughterId = '';

beforeEach(async () => {
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  const daughter = await addManagedProfile({
    type: 'daughter',
    firstName: 'Noor',
    birthDate: '2015-01-01',
    hasHadFirstPeriod: false,
  });
  daughterId = daughter.id;
});

/** A `load` whose completion the test controls, one call at a time. */
function controlledLoad() {
  const releases: (() => void)[] = [];
  const load = jest.fn(
    () =>
      new Promise<number>(resolve => {
        releases.push(() => resolve(load.mock.calls.length));
      }),
  );
  const releaseNext = async () => {
    const release = releases.shift();
    if (!release) {throw new Error('no load in flight');}
    release();
    for (let tick = 0; tick < 10; tick += 1) {await Promise.resolve();}
  };
  return {load, releaseNext, inFlight: () => releases.length};
}

describe('loadOwnerProfileData', () => {
  it('owner active: runs the load once and hands back what it read', async () => {
    const load = jest.fn(async () => 'owner-records');

    const loaded = await loadOwnerProfileData(load);

    expect(loaded?.value).toBe('owner-records');
    expect(loaded?.isCurrent()).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('a managed profile active: null, and nothing is read at all', async () => {
    await setActiveProfileId(daughterId);
    const load = jest.fn(async () => 'her-records');

    await expect(loadOwnerProfileData(load)).resolves.toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it('switching to a managed profile while the load is in flight: null, never "owner data"', async () => {
    const controlled = controlledLoad();
    const result = loadOwnerProfileData(controlled.load);
    await Promise.resolve();
    expect(controlled.inFlight()).toBe(1);

    await setActiveProfileId(daughterId); // the person switches while the owner's records are being read
    await controlled.releaseNext();

    await expect(result).resolves.toBeNull();
    expect(controlled.load).toHaveBeenCalledTimes(1); // no second read for the daughter's profile
  });

  it('owner -> daughter -> owner during the load: the same id again, yet the load is run AGAIN', async () => {
    const controlled = controlledLoad();
    const result = loadOwnerProfileData(controlled.load);
    await Promise.resolve();

    await setActiveProfileId(daughterId);
    await setActiveProfileId(OWNER_PROFILE_ID);
    await controlled.releaseNext(); // the first read may hold the daughter's records: it is discarded

    let settled = false;
    result.then(() => {
      settled = true;
    });
    for (let tick = 0; tick < 10; tick += 1) {await Promise.resolve();}
    expect(settled).toBe(false); // not accepted: a second read is in flight
    expect(controlled.inFlight()).toBe(1);

    await controlled.releaseNext();
    const loaded = await result;
    expect(loaded?.value).toBe(2);
    expect(controlled.load).toHaveBeenCalledTimes(2);
  });

  it('reloadActiveProfileData() during the load (a restore replaced the records): loaded again', async () => {
    const controlled = controlledLoad();
    const result = loadOwnerProfileData(controlled.load);
    await Promise.resolve();

    reloadActiveProfileData();
    await controlled.releaseNext();
    await controlled.releaseNext();

    const loaded = await result;
    expect(loaded?.value).toBe(2);
    expect(controlled.load).toHaveBeenCalledTimes(2);
  });

  it('a daughter -> owner switch is what lets the next call through', async () => {
    await setActiveProfileId(daughterId);
    const load = jest.fn(async () => 'owner-records');
    await expect(loadOwnerProfileData(load)).resolves.toBeNull();

    await setActiveProfileId(OWNER_PROFILE_ID);
    const loaded = await loadOwnerProfileData(load);
    expect(loaded?.value).toBe('owner-records');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('a load that rejects rejects the call (the sync reports it) instead of looping', async () => {
    const load = jest.fn(async () => {
      throw new Error('storage exploded');
    });

    await expect(loadOwnerProfileData(load)).rejects.toThrow('storage exploded');
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe('isCurrent — the check the caller makes in the tick it resumes', () => {
  it('turns false when the profile changes between the gate\'s decision and the caller\'s resumption', async () => {
    const loaded = await loadOwnerProfileData(async () => 'owner-records');
    expect(loaded?.isCurrent()).toBe(true);

    await setActiveProfileId(daughterId); // lands in the microtask gap an `await` leaves open

    expect(loaded?.isCurrent()).toBe(false);
  });

  it('also turns false after a switch away AND straight back (the id alone looks unchanged)', async () => {
    const loaded = await loadOwnerProfileData(async () => 'owner-records');

    await setActiveProfileId(daughterId);
    await setActiveProfileId(OWNER_PROFILE_ID);

    expect(loaded?.isCurrent()).toBe(false);
  });

  it('and after reloadActiveProfileData()', async () => {
    const loaded = await loadOwnerProfileData(async () => 'owner-records');

    reloadActiveProfileData();

    expect(loaded?.isCurrent()).toBe(false);
  });
});
