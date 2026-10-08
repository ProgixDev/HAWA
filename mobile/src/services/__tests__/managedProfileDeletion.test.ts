import AsyncStorage from '@react-native-async-storage/async-storage';

import {deleteManagedProfileCompletely, listManagedProfileKeys, recoverInterruptedManagedProfileDeletions} from '../managedProfileDeletion';
import {auditManagedProfileOrphans} from '../managedProfileOrphanAudit';
import {backupNow, restoreBackup} from '../backupService';
import {cancelLocalNotification} from '../pregnancyNotifications';
import {addInAppNotification, getInAppNotifications, hydrateInAppNotifications} from '../../state/inAppNotificationStore';
import {getDeletedManagedProfileIds} from '../../state/deletedManagedProfiles';
import {
  getHasRecordedFirstPeriod,
  getRecordedPeriodHistory,
  hydrateCyclePreferences,
  setCyclePreferences,
} from '../../state/onboardingPreferences';
import {hydrateCycleReminderPreferences, resetCycleReminderPreferencesForTests, setCycleReminderPreferences} from '../../state/cycleReminderPreferences';
import {addManagedProfile, getManagedProfiles, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, getActiveProfileId, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {seedManagedProfileCycleIfNeeded} from '../../state/managedProfileCycleSeed';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {syncCycleReminders} from '../../utils/cycleReminderScheduling';

// Deleting a daughter removes everything that was HERS (every `<base>:profile:<id>` key — including the
// Qadaa ledger whose base predates the '@' convention —, her reminders and her in-app notifications) and
// nothing else: not the owner's data, not another daughter's, not shared settings. Fixtures only — no real
// data is involved.

jest.mock('../pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(() => Promise.resolve(true)),
  cancelLocalNotification: jest.fn(() => Promise.resolve()),
  cancelLocalNotifications: jest.fn(() => Promise.resolve()),
}));

const mockCancel = cancelLocalNotification as jest.Mock;
const storage = AsyncStorage as unknown as {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  getAllKeys: jest.Mock;
};
// The in-app notification store uses the batch calls of the real AsyncStorage package, which the project's
// Jest mock does not provide — given here, backed by the same in-memory map.
const batchApi = AsyncStorage as unknown as Record<string, unknown>;
batchApi.getMany = async (keys: string[]) => Object.fromEntries(await Promise.all(keys.map(async key => [key, await AsyncStorage.getItem(key)] as const)));
batchApi.setMany = async (entries: Record<string, string>) => {
  await Promise.all(Object.entries(entries).map(([key, value]) => AsyncStorage.setItem(key, value)));
};
batchApi.removeMany = async (keys: string[]) => {
  await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
};
const originalRemoveItem = storage.removeItem.getMockImplementation() as (key: string) => Promise<void>;
const originalGetItem = storage.getItem.getMockImplementation() as (key: string) => Promise<string | null>;

const REMINDERS_ON = {
  upcomingPeriodEnabled: true,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: true,
  dailyJournalEnabled: false,
  dailyJournalTime: null,
  fertileWindowEnabled: true,
  ovulationEnabled: true,
};
const LEDGER_BASE = 'awa:qadaa:ledger:v1';
const BACKUP_BASE = '@awa/backup/local-v1';
const flush = async () => {
  for (let index = 0; index < 40; index += 1) {
    await Promise.resolve();
  }
};

const allKeys = async () => (await AsyncStorage.getAllKeys()).slice().sort();
const keysOf = async (profileId: string) => (await allKeys()).filter(key => key.endsWith(`:profile:${profileId}`));
const snapshotWithout = async (profileId: string) => {
  const keys = (await allKeys()).filter(key => !key.endsWith(`:profile:${profileId}`));
  return Object.fromEntries(await Promise.all(keys.map(async key => [key, await AsyncStorage.getItem(key)] as const)));
};

let noorId = '';
let leilaId = '';

/** A daughter with her own cycle, reminder settings, journal entry, Qadaa ledger, backup copy and a notification. */
const makeDaughter = async (firstName: string, lastPeriodDate: string) => {
  const profile = await addManagedProfile({
    type: 'daughter',
    firstName,
    birthDate: '2014-05-01',
    hasHadFirstPeriod: true,
    lastPeriodDate,
    periodLength: 5,
    cycleLength: 28,
    regularity: 'yes',
  });
  await setActiveProfileId(profile.id);
  await hydrateCyclePreferences();
  await hydrateCycleReminderPreferences();
  await seedManagedProfileCycleIfNeeded(profile.id);
  await setCycleReminderPreferences({...REMINDERS_ON});
  await saveJournalSection(lastPeriodDate, 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3});
  await AsyncStorage.setItem(`${LEDGER_BASE}:profile:${profile.id}`, JSON.stringify({entries: [firstName]}));
  await AsyncStorage.setItem(`${BACKUP_BASE}:profile:${profile.id}`, JSON.stringify({createdAt: 'x', entries: {}}));
  await addInAppNotification({
    id: `cycle-upcoming-period-reminder:${profile.id}-n`,
    type: 'cycle-reminder',
    title: firstName,
    message: 'm',
    receivedAt: '2026-10-01T00:00:00.000Z',
    read: false,
    profileId: profile.id,
  });
  await setActiveProfileId(OWNER_PROFILE_ID);
  await hydrateCyclePreferences();
  await hydrateCycleReminderPreferences();
  return profile;
};

beforeEach(async () => {
  jest.useFakeTimers({now: new Date(2026, 9, 1, 12, 0, 0)});
  storage.removeItem.mockImplementation(originalRemoveItem);
  storage.getItem.mockImplementation(originalGetItem);
  mockCancel.mockReset();
  mockCancel.mockResolvedValue(undefined);
  await AsyncStorage.clear();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  resetCycleReminderPreferencesForTests();
  await hydrateCyclePreferences();
  await hydrateCycleReminderPreferences();
  // The owner: her own cycle, reminders, journal entry, a notification without any profile, and shared settings.
  setCyclePreferences({lastPeriodStart: new Date(2026, 8, 10, 12), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
  await setCycleReminderPreferences({...REMINDERS_ON});
  await saveJournalSection('2026-09-10', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3});
  await AsyncStorage.setItem(LEDGER_BASE, JSON.stringify({entries: ['owner']}));
  await AsyncStorage.setItem('@hawa/language', 'fr');
  await addInAppNotification({id: 'owner-n', type: 'x', title: 'owner', message: 'm', receivedAt: '2026-10-01T00:00:00.000Z', read: false});
  await addInAppNotification({id: 'owner-n2', type: 'cycle-reminder', title: 'owner2', message: 'm', receivedAt: '2026-10-01T00:00:00.000Z', read: false, profileId: OWNER_PROFILE_ID});

  noorId = (await makeDaughter('Noor', '2026-09-12')).id;
  leilaId = (await makeDaughter('Leila', '2026-09-15')).id;
  mockCancel.mockClear();
  await hydrateInAppNotifications();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('deleting one daughter', () => {
  it('removes every key that was hers — journal, cycle, reminders, Qadaa ledger, backup copy — and the record', async () => {
    const before = await keysOf(noorId);
    expect(before.length).toBeGreaterThanOrEqual(5);
    expect(before.some(key => key.startsWith(LEDGER_BASE))).toBe(true); // the ledger's base has no '@'

    const result = await deleteManagedProfileCompletely(noorId);

    expect(result).toMatchObject({deleted: true, failedSteps: []});
    expect(result.removedKeyCount).toBe(before.length);
    expect(await keysOf(noorId)).toEqual([]);
    expect(getManagedProfiles().map(profile => profile.id)).toEqual([leilaId]);
    expect(await getDeletedManagedProfileIds()).toEqual([noorId]);
  });

  it("leaves the owner's data, the other daughter's data and shared settings byte-for-byte untouched", async () => {
    const untouchedBefore = await snapshotWithout(noorId);
    await deleteManagedProfileCompletely(noorId);
    const untouchedAfter = await snapshotWithout(noorId);

    // Only three things differ: the profile list (her record), the deleted-ids note, and her own notification.
    const changed = Object.keys({...untouchedBefore, ...untouchedAfter}).filter(key => untouchedBefore[key] !== untouchedAfter[key]);
    expect(changed.sort()).toEqual(
      [
        '@hawa/deleted-managed-profile-ids/v1',
        '@hawa/managed-profiles/v1',
        `@hawa/in-app-notifications/v2/item/cycle-upcoming-period-reminder:${noorId}-n`,
      ].sort(),
    );
    expect(await AsyncStorage.getItem('@hawa/language')).toBe('fr');
    expect((await keysOf(leilaId)).length).toBeGreaterThanOrEqual(5);
  });

  it("removes her first-period seed and her cycle history — she cannot be re-created from them", async () => {
    await setActiveProfileId(noorId);
    await hydrateCyclePreferences();
    expect(getHasRecordedFirstPeriod()).toBe(true);
    await deleteManagedProfileCompletely(noorId); // leaves her profile first

    expect(getActiveProfileId()).toBe(OWNER_PROFILE_ID);
    await setActiveProfileId(noorId); // she no longer exists: refused
    expect(getActiveProfileId()).toBe(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2026-09-10']); // the owner's own
  });

  it('cancels only her scheduled reminders', async () => {
    await deleteManagedProfileCompletely(noorId);
    const cancelled = mockCancel.mock.calls.map(([id]) => String(id));
    expect(cancelled.length).toBeGreaterThan(0);
    cancelled.forEach(id => expect(id.endsWith(`:${noorId}`)).toBe(true));
  });

  it("removes only her in-app notifications — the owner's, the other daughter's and unattributed ones stay", async () => {
    await deleteManagedProfileCompletely(noorId);
    await hydrateInAppNotifications();
    const left = getInAppNotifications().map(item => item.id).sort();
    expect(left).toEqual([`cycle-upcoming-period-reminder:${leilaId}-n`, 'owner-n', 'owner-n2'].sort());
  });

  it('refuses to touch the owner', async () => {
    const before = await allKeys();
    const result = await deleteManagedProfileCompletely(OWNER_PROFILE_ID);
    expect(result.deleted).toBe(false);
    expect(await allKeys()).toEqual(before);
  });
});

describe('interrupted, repeated and concurrent deletion', () => {
  it('a storage failure leaves the profile in place — nothing else removed — and a retry completes it', async () => {
    const victim = (await keysOf(noorId)).find(key => key.startsWith(LEDGER_BASE)) as string;
    storage.removeItem.mockImplementation((key: string) => (key === victim ? Promise.reject(new Error('disk')) : originalRemoveItem(key)));

    const failed = await deleteManagedProfileCompletely(noorId);
    expect(failed.deleted).toBe(false);
    expect(failed.failedSteps).toContain('remove-stored-data');
    expect(getManagedProfiles().map(profile => profile.id).sort()).toEqual([leilaId, noorId].sort()); // still there to retry
    expect((await keysOf(leilaId)).length).toBeGreaterThanOrEqual(5); // the sibling is untouched
    // The seed was already forgotten: the half-deleted profile cannot be rebuilt from it.
    expect(getManagedProfiles().find(profile => profile.id === noorId)).toMatchObject({hasHadFirstPeriod: false, lastPeriodDate: null});

    storage.removeItem.mockImplementation(originalRemoveItem);
    const retried = await deleteManagedProfileCompletely(noorId);
    expect(retried).toMatchObject({deleted: true, failedSteps: []});
    expect(await keysOf(noorId)).toEqual([]);
  });

  it('deleting twice is harmless', async () => {
    await deleteManagedProfileCompletely(noorId);
    const snapshot = await snapshotWithout(noorId);
    const again = await deleteManagedProfileCompletely(noorId);
    expect(again).toMatchObject({deleted: true, failedSteps: [], removedKeyCount: 0});
    expect(await snapshotWithout(noorId)).toEqual(snapshot);
  });

  it('a failed native cancellation is detected: the profile is kept (not silently dropped) and a retry finishes it', async () => {
    mockCancel.mockResolvedValue(false); // what the real cancelLocalNotification reports for a native failure
    const failed = await deleteManagedProfileCompletely(noorId);
    expect(failed.deleted).toBe(false);
    expect(failed.failedSteps).toContain('cancel-reminders');
    expect(getManagedProfiles().map(profile => profile.id)).toContain(noorId);

    mockCancel.mockResolvedValue(true);
    const retried = await deleteManagedProfileCompletely(noorId);
    expect(retried).toMatchObject({deleted: true, failedSteps: []});
    expect(await keysOf(noorId)).toEqual([]);
  });

  it('a native failure while cancelling touches only her own reminder ids', async () => {
    mockCancel.mockResolvedValue(false);
    await deleteManagedProfileCompletely(noorId);
    const ids = mockCancel.mock.calls.map(call => call[0] as string);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every(id => id.endsWith(`:${noorId}`))).toBe(true);
  });

  it('switching profile while deleting: she is gone, the sibling intact, and what is active is a profile that exists', async () => {
    await setActiveProfileId(noorId);
    const deleting = deleteManagedProfileCompletely(noorId);
    await setActiveProfileId(leilaId); // the user taps another profile meanwhile
    await deleting;
    await flush();

    expect(await keysOf(noorId)).toEqual([]);
    expect(getManagedProfiles().map(profile => profile.id)).toEqual([leilaId]);
    expect([OWNER_PROFILE_ID, leilaId]).toContain(getActiveProfileId());
    expect((await keysOf(leilaId)).length).toBeGreaterThanOrEqual(5);
  });

  it('a read of her data that lands after the deletion cannot bring any of it back', async () => {
    await setActiveProfileId(noorId);
    await hydrateCyclePreferences();
    const held: (() => void)[] = [];
    storage.getItem.mockImplementation((key: string) => {
      if (!key.includes(`:profile:${noorId}`)) {return originalGetItem(key);}
      const snapshot = originalGetItem(key);
      return new Promise(resolve => held.push(() => resolve(snapshot)));
    });
    // A stale re-read of hers is in flight (e.g. started by a switch) when the deletion runs.
    await setActiveProfileId(OWNER_PROFILE_ID);
    await setActiveProfileId(noorId);
    await deleteManagedProfileCompletely(noorId);
    storage.getItem.mockImplementation(originalGetItem);
    held.splice(0).forEach(release => release());
    await flush();

    expect(await keysOf(noorId)).toEqual([]);
    expect(getActiveProfileId()).toBe(OWNER_PROFILE_ID);
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toEqual(['2026-09-10']); // the owner's, not hers
  });

  it('after an app restart nothing of hers is left to restore, and a saved "active profile" naming her falls back to the owner', async () => {
    await deleteManagedProfileCompletely(noorId);
    await AsyncStorage.setItem('@hawa/active-profile-id', noorId); // stale value, as after a crash mid-switch

    let restored = 'unset';
    await jest.isolateModulesAsync(async () => {
      const {hydrateActiveProfileId} = require('../../state/activeProfileStore');
      restored = await hydrateActiveProfileId();
    });
    expect(restored).toBe(OWNER_PROFILE_ID);
  });

  it('reminders already in flight when she is deleted do not come back', async () => {
    await setActiveProfileId(noorId);
    const sync = syncCycleReminders();
    const deleting = deleteManagedProfileCompletely(noorId);
    await Promise.all([sync, deleting]);
    await syncCycleReminders();
    const scheduled = (jest.requireMock('../pregnancyNotifications').scheduleLocalNotification as jest.Mock).mock.calls
      .map(([input]) => String(input.id))
      .filter(id => id.endsWith(`:${noorId}`));
    // Whatever was scheduled for her before the deletion was cancelled by it (the cancel is queued last).
    const cancelledIds = mockCancel.mock.calls.map(([id]) => String(id));
    scheduled.forEach(id => expect(cancelledIds).toContain(id));
  });
});

describe('deletion intent is persisted before anything is destroyed, and an interrupted deletion recovers', () => {
  it('the intent is already on disk when the first destructive step runs', async () => {
    let intentAtFirstCancel: string[] | null = null;
    mockCancel.mockImplementation(async () => {
      intentAtFirstCancel ??= await getDeletedManagedProfileIds();
      return true;
    });
    await deleteManagedProfileCompletely(noorId);
    expect(intentAtFirstCancel).toEqual([noorId]);
  });

  it('if the intent cannot be written, nothing is destroyed at all', async () => {
    const intentKey = '@hawa/deleted-managed-profile-ids/v1';
    const setItem = storage.setItem.getMockImplementation() as (key: string, value: string) => Promise<void>;
    storage.setItem.mockImplementation((key: string, value: string) => (key === intentKey ? Promise.reject(new Error('disk')) : setItem(key, value)));
    const before = await allKeys();
    const result = await deleteManagedProfileCompletely(noorId);
    storage.setItem.mockImplementation(setItem);
    expect(result).toMatchObject({deleted: false, failedSteps: ['record-deletion-intent']});
    expect(await allKeys()).toEqual(before);
    expect(getManagedProfiles().map(profile => profile.id)).toContain(noorId);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('killed after the intent was written: the next launch finishes the deletion, and only that one', async () => {
    // "killed" = the removal of her keys never happens and the process ends
    const victim = (await keysOf(noorId))[0];
    storage.removeItem.mockImplementation((key: string) => (key === victim ? Promise.reject(new Error('killed')) : originalRemoveItem(key)));
    await deleteManagedProfileCompletely(noorId);
    storage.removeItem.mockImplementation(originalRemoveItem);
    expect(getManagedProfiles().map(profile => profile.id)).toContain(noorId); // half-deleted, still listed
    expect(await getDeletedManagedProfileIds()).toEqual([noorId]); // …but recorded as pending deletion

    const leilaKeys = await keysOf(leilaId);
    const completed = await recoverInterruptedManagedProfileDeletions();

    expect(completed).toEqual([noorId]);
    expect(await keysOf(noorId)).toEqual([]);
    expect(getManagedProfiles().map(profile => profile.id)).toEqual([leilaId]);
    expect(await keysOf(leilaId)).toEqual(leilaKeys);
    expect(await recoverInterruptedManagedProfileDeletions()).toEqual([]); // nothing left to do
  });

  it('a profile nobody asked to delete is never touched by recovery', async () => {
    const before = await allKeys();
    expect(await recoverInterruptedManagedProfileDeletions()).toEqual([]);
    expect(await allKeys()).toEqual(before);
    expect(getManagedProfiles().map(profile => profile.id).sort()).toEqual([leilaId, noorId].sort());
  });

  it('a pending deletion cannot be undone by restoring an older backup', async () => {
    const snapshot = await backupNow();
    const victim = (await keysOf(noorId))[0];
    storage.removeItem.mockImplementation((key: string) => (key === victim ? Promise.reject(new Error('killed')) : originalRemoveItem(key)));
    await deleteManagedProfileCompletely(noorId);
    storage.removeItem.mockImplementation(originalRemoveItem);

    await restoreBackup(snapshot);

    expect(await keysOf(noorId)).toEqual([victim]); // only the one key the failed removal left; nothing was restored
    const list = JSON.parse((await AsyncStorage.getItem('@hawa/managed-profiles/v1')) as string) as {id: string}[];
    expect(list.map(profile => profile.id)).toEqual([leilaId]);
  });
});

describe('backup restore does not resurrect a deleted profile', () => {
  it('an owner backup taken BEFORE the deletion brings back everything except the deleted profile', async () => {
    const snapshot = await backupNow(); // contains Noor and Leila
    await deleteManagedProfileCompletely(noorId);

    await restoreBackup(snapshot);

    expect(await keysOf(noorId)).toEqual([]);
    const restoredList = JSON.parse((await AsyncStorage.getItem('@hawa/managed-profiles/v1')) as string) as {id: string}[];
    expect(restoredList.map(profile => profile.id)).toEqual([leilaId]);
    expect((await keysOf(leilaId)).length).toBeGreaterThanOrEqual(5);
    expect(await getDeletedManagedProfileIds()).toEqual([noorId]); // the older copy did not shrink the list
    expect(await AsyncStorage.getItem('@hawa/language')).toBe('fr');
  });
});

describe('orphan audit (read-only)', () => {
  it('reports orphans with the evidence it has, flags the ambiguous ones, and mutates nothing', async () => {
    // A profile deleted before deletions were recorded: data left, no record, no deletion note.
    await AsyncStorage.setItem('@hawa/cycle-preferences:profile:ghost_1', '{}');
    await AsyncStorage.setItem('@hawa/daily-journal/v1:profile:ghost_1', '[]');
    await AsyncStorage.setItem(`${LEDGER_BASE}:profile:ghost_1`, '{}');
    // One whose deletion the app recorded but whose cleanup was cut short.
    await deleteManagedProfileCompletely(noorId);
    await AsyncStorage.setItem('@hawa/cycle-reminder-preferences/v1:profile:' + noorId, '{}');
    await AsyncStorage.setItem('@hawa/cycle-preferences:profile:' + leilaId + '-not-hers', '{}'); // another unknown id, not Leila's

    const keysBefore = await allKeys();
    const setItemCalls = storage.setItem.mock.calls.length;
    const removeItemCalls = storage.removeItem.mock.calls.length;

    const report = await auditManagedProfileOrphans();

    expect(report.complete).toBe(true);
    const byId = Object.fromEntries(report.orphans.map(orphan => [orphan.profileId, orphan]));
    expect(Object.keys(byId).sort()).toEqual([`${leilaId}-not-hers`, 'ghost_1', noorId].sort());
    expect(byId.ghost_1).toMatchObject({keyCount: 3, deletionRecorded: false, safeToRemove: false});
    expect(byId.ghost_1.ambiguity).toMatch(/No deletion record/);
    expect(byId.ghost_1.categories).toEqual(
      expect.arrayContaining(['cycle settings and recorded periods', 'Qadaa ledger', expect.stringContaining('daily journal')]),
    );
    expect(byId[noorId]).toMatchObject({keyCount: 1, deletionRecorded: true, safeToRemove: true, ambiguity: null});
    // Live profiles and the owner are never reported.
    expect(Object.keys(byId)).not.toContain(leilaId);
    expect(Object.keys(byId)).not.toContain(OWNER_PROFILE_ID);

    // Read-only: nothing written, nothing removed.
    expect(await allKeys()).toEqual(keysBefore);
    expect(storage.setItem.mock.calls.length).toBe(setItemCalls);
    expect(storage.removeItem.mock.calls.length).toBe(removeItemCalls);
  });

  it('says so when it cannot tell (the profile list could not be read)', async () => {
    await jest.isolateModulesAsync(async () => {
      const failing = require('@react-native-async-storage/async-storage').default;
      failing.getItem.mockImplementation(() => Promise.reject(new Error('unreadable')));
      const {auditManagedProfileOrphans: audit} = require('../managedProfileOrphanAudit');
      const report = await audit();
      expect(report.complete).toBe(false);
      expect(report.orphans).toEqual([]);
      expect(report.limitation).toMatch(/could not be read/);
    });
  });

  it('lists a profile\'s keys exactly by its own id suffix', async () => {
    await AsyncStorage.setItem('@hawa/cycle-preferences:profile:x' + noorId, '{}'); // an id that merely ENDS like hers
    const keys = await listManagedProfileKeys(noorId);
    expect(keys.every(key => key.endsWith(`:profile:${noorId}`))).toBe(true);
    expect(keys.some(key => key.includes(`:profile:x${noorId}`))).toBe(false);
  });
});
