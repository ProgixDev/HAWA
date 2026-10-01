import {AppState} from 'react-native';

import {
  isIntimacyUnlocked,
  resetPrivateSectionAuthForTests,
  unlockIntimacy,
} from '../privateSectionAuthStore';
import {getActiveObjective, setActiveObjective} from '../onboardingPreferences';
import {
  OWNER_PROFILE_ID,
  getActiveProfileId,
  resetActiveProfileForTests,
  setActiveProfileId,
} from '../activeProfileStore';
import {addManagedProfile, resetManagedProfilesForTests} from '../managedProfilesStore';
import {buildMedicalExport} from '../../services/medicalExportOrchestrator';

// The shared "Personal Notes" (and Vie intime / private photos / conception
// reports / sensitive Medical Export) unlock is ONE global session — see
// privateSectionAuthStore.ts's own header comment. This suite exercises the
// REAL stores (onboardingPreferences.ts, activeProfileStore.ts,
// managedProfilesStore.ts, medicalExportOrchestrator.ts) rather than mocking
// them away, so the actual cross-module wiring is what's under test.

describe('privateSectionAuthStore — objective/profile invalidate the private session', () => {
  beforeEach(async () => {
    await resetActiveProfileForTests();
    await resetManagedProfilesForTests();
    await setActiveObjective('cycle');
    // Re-baselines against the now-settled 'cycle'/'owner' context and clears
    // any unlock left over from a previous test — must run LAST in setup.
    resetPrivateSectionAuthForTests();
  });

  it('TEST 1 — same context: stays unlocked', () => {
    unlockIntimacy();
    expect(isIntimacyUnlocked()).toBe(true);
  });

  it('TEST 2 — objective change locks immediately', async () => {
    unlockIntimacy();
    expect(isIntimacyUnlocked()).toBe(true);

    await setActiveObjective('conceive');

    expect(isIntimacyUnlocked()).toBe(false);
  });

  it('TEST 3 — switching back to the original objective does NOT restore the old unlock', async () => {
    unlockIntimacy();
    await setActiveObjective('conceive');
    expect(isIntimacyUnlocked()).toBe(false);

    await setActiveObjective('cycle');

    expect(isIntimacyUnlocked()).toBe(false);
  });

  it('TEST 4 — owner unlocks, switches to a managed daughter profile: locks immediately', async () => {
    const daughter = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    unlockIntimacy();
    expect(isIntimacyUnlocked()).toBe(true);

    await setActiveProfileId(daughter.id);

    expect(isIntimacyUnlocked()).toBe(false);
  });

  it('TEST 5 — a managed daughter profile unlocking, then switching to owner: locks immediately', async () => {
    const daughter = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    await setActiveProfileId(daughter.id);
    resetPrivateSectionAuthForTests(); // settle the baseline on the daughter profile before unlocking

    unlockIntimacy(); // e.g. Personal Notes, still reachable from a daughter's own journal sheet
    expect(isIntimacyUnlocked()).toBe(true);

    await setActiveProfileId(OWNER_PROFILE_ID);

    expect(isIntimacyUnlocked()).toBe(false);
  });

  it('TEST 6 — a no-op profile "change" (already the same id) does not disturb an existing unlock', async () => {
    unlockIntimacy();

    // setActiveProfileId no-ops (and never notifies) when the id is already
    // the active one — asserting the unlock survives confirms our listener
    // isn't somehow mis-triggered by this call either.
    await setActiveProfileId(getActiveProfileId());

    expect(isIntimacyUnlocked()).toBe(true);
  });

  it('TEST 7 — re-setting the SAME objective (a real notification, no actual change) does not lock', async () => {
    unlockIntimacy();

    // Unlike setActiveProfileId, setActiveObjective notifies unconditionally
    // even when the value is unchanged — the value-comparison in
    // privateSectionAuthStore.ts, not the setter, is what must absorb this.
    await setActiveObjective(getActiveObjective());

    expect(isIntimacyUnlocked()).toBe(true);
  });
});

describe('privateSectionAuthStore — background/foreground (existing 60s rule, unchanged)', () => {
  let listener: ((state: string) => void) | undefined;

  beforeAll(() => {
    listener = (AppState.addEventListener as jest.Mock).mock.calls.find(([type]) => type === 'change')?.[1];
  });

  beforeEach(async () => {
    await resetActiveProfileForTests();
    await setActiveObjective('cycle');
    resetPrivateSectionAuthForTests();
    unlockIntimacy();
  });

  afterEach(() => {
    jest.spyOn(Date, 'now').mockRestore();
  });

  it('TEST 8 — backgrounded under 60s: stays unlocked', () => {
    expect(listener).toBeDefined();
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    listener!('background');
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000 + 59_000);
    listener!('active');

    expect(isIntimacyUnlocked()).toBe(true);
  });

  it('TEST 9 — backgrounded 60s or more: locks', () => {
    expect(listener).toBeDefined();
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    listener!('background');
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000 + 60_000);
    listener!('active');

    expect(isIntimacyUnlocked()).toBe(false);
  });
});

describe('privateSectionAuthStore — Medical Export shares the session, but not across a context change', () => {
  beforeEach(async () => {
    await resetActiveProfileForTests();
    await resetManagedProfilesForTests();
    await setActiveObjective('cycle');
    resetPrivateSectionAuthForTests();
  });

  it('TEST 10 — same profile + same objective: a recent unlock still authorizes a sensitive export', async () => {
    unlockIntimacy();

    const result = await buildMedicalExport('cycle', 'all', 'csv', ['symptoms'], new Date('2026-09-30T10:00:00'));

    expect(result.kind).not.toBe('locked');
  });

  it('TEST 11 — after an objective change, Medical Export no longer inherits the old unlock', async () => {
    unlockIntimacy();
    await setActiveObjective('conceive');

    const result = await buildMedicalExport('cycle', 'all', 'csv', ['symptoms', 'notes'], new Date('2026-09-30T10:00:00'));

    expect(result).toEqual({kind: 'locked'});
  });

  it('TEST 12 — after a profile change, Medical Export no longer inherits the old unlock', async () => {
    const daughter = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    unlockIntimacy();
    await setActiveProfileId(daughter.id);

    const result = await buildMedicalExport('cycle', 'all', 'csv', ['symptoms', 'notes'], new Date('2026-09-30T10:00:00'));

    expect(result).toEqual({kind: 'locked'});
  });
});
