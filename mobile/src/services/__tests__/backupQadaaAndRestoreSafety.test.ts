import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {
  backupNow,
  backupNowForProfile,
  deleteTrackedData,
  deleteTrackedDataForProfile,
  getBackupSnapshot,
  getLocalBackupStatus,
  getLocalBackupStatusForProfile,
  readAwaStorage,
  readAwaStorageForProfile,
  restoreBackup,
  restoreBackupForProfile,
  type BackupSnapshot,
} from '../backupService';
import {__setRestoreFaultForTests, recoverInterruptedRestore} from '../restoreJournal';
import {classifyStorageKey, isIncludedInBackup, isDeletedWithAllTrackedData} from '../storageKeyClassifier';
import secureStorage, {getRawItem, resetStructuredStorageForTests, setStructuredEncryptionEnabled} from '../secureAsyncStorage';
import {STRUCTURED_KEY_SERVICE, isStructuredEnvelope} from '../structuredEncryption';
import {clearAesKeyCache} from '../secureAesKeyStore';

// Fixtures only. The Qadaa ledger lives under the older `awa:` namespace: it must be backed up, restored to the right
// profile and deleted with the user's data — without treating every unknown `awa:` key as disposable.

const QADAA = 'awa:qadaa:ledger:v1';
const QADAA_PROGRESS = 'awa:qadaa:progress:v1';
const QADAA_NOOR = `${QADAA}:profile:noor`;
const QADAA_LEILA = `${QADAA}:profile:leila`;
const JOURNAL = '@hawa/daily-journal/v1';
const JOURNAL_NOOR = `${JOURNAL}:profile:noor`;
const JOURNAL_LEILA = `${JOURNAL}:profile:leila`;
const UNKNOWN_AWA = 'awa:something-else:v1';
const SETTINGS = '@awa/backup/settings-v1';
const SLOT = '@awa/backup/local-v1';

const seed = async () => {
  const entries: Record<string, string> = {
    [QADAA]: '{"owner":true}',
    [QADAA_PROGRESS]: '{"completedDays":3}',
    [QADAA_NOOR]: '{"noor":true}',
    [QADAA_LEILA]: '{"leila":true}',
    [JOURNAL]: '[{"id":"o"}]',
    [JOURNAL_NOOR]: '[{"id":"n"}]',
    [JOURNAL_LEILA]: '[{"id":"l"}]',
    [UNKNOWN_AWA]: 'keep-me',
    [SETTINGS]: '{"enabled":true}',
    [`${SLOT}:profile:noor`]: 'daughter-slot',
    '@hawa/language': 'fr',
    'someone-elses-key': 'not ours',
  };
  for (const [key, value] of Object.entries(entries)) {await AsyncStorage.setItem(key, value);}
};
const allEntries = async () => Object.fromEntries(await Promise.all((await AsyncStorage.getAllKeys()).slice().sort().map(async key => [key, await AsyncStorage.getItem(key)] as const)));

beforeEach(async () => {
  setStructuredEncryptionEnabled(false);
  __setRestoreFaultForTests(null);
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  clearAesKeyCache();
  resetStructuredStorageForTests();
  await seed();
});
afterAll(() => setStructuredEncryptionEnabled(false));

describe('one classifier for every backup / delete decision', () => {
  it('classifies the Qadaa ledger as tracking data and an unknown awa: key as unclassified', () => {
    expect(classifyStorageKey(QADAA)).toMatchObject({kind: 'tracking-data', profileId: null, baseKey: QADAA});
    expect(classifyStorageKey(QADAA_NOOR)).toMatchObject({kind: 'tracking-data', profileId: 'noor', baseKey: QADAA});
    expect(classifyStorageKey(UNKNOWN_AWA).kind).toBe('unclassified');
    expect(classifyStorageKey(SLOT).kind).toBe('backup-artifact');
    expect(classifyStorageKey('@awa/restore-journal/v1').kind).toBe('internal-state');
    expect(classifyStorageKey('someone-elses-key').kind).toBe('foreign');
    expect(isIncludedInBackup(QADAA)).toBe(true);
    expect(isIncludedInBackup(UNKNOWN_AWA)).toBe(false);
    expect(isDeletedWithAllTrackedData(UNKNOWN_AWA)).toBe(false);
  });
});

describe('Qadaa is backed up and isolated per profile', () => {
  it('the owner backup contains every profile’s Qadaa records and no backup artifacts, unknown keys or foreign keys', async () => {
    const entries = await readAwaStorage();
    expect(Object.keys(entries)).toEqual(expect.arrayContaining([QADAA, QADAA_PROGRESS, QADAA_NOOR, QADAA_LEILA, JOURNAL, '@hawa/language']));
    for (const excluded of [SETTINGS, `${SLOT}:profile:noor`, UNKNOWN_AWA, 'someone-elses-key']) {
      expect(Object.keys(entries)).not.toContain(excluded);
    }
  });

  it('a managed profile’s backup contains her Qadaa ledger and nothing of anyone else', async () => {
    const entries = await readAwaStorageForProfile('noor');
    expect(Object.keys(entries).sort()).toEqual([JOURNAL_NOOR, QADAA_NOOR].sort());
  });

  it('restoring her backup brings back HER Qadaa ledger only', async () => {
    const snapshot = await backupNowForProfile('noor');
    await AsyncStorage.setItem(QADAA_NOOR, '{"changed":true}');
    await AsyncStorage.setItem(QADAA, '{"owner":"edited"}');
    await AsyncStorage.setItem(QADAA_LEILA, '{"leila":"edited"}');

    await restoreBackupForProfile(snapshot, 'noor');

    expect(await AsyncStorage.getItem(QADAA_NOOR)).toBe('{"noor":true}');
    expect(await AsyncStorage.getItem(QADAA)).toBe('{"owner":"edited"}');
    expect(await AsyncStorage.getItem(QADAA_LEILA)).toBe('{"leila":"edited"}');
  });

  it('a snapshot carrying another profile’s keys cannot restore them into hers', async () => {
    const hostile: BackupSnapshot = {createdAt: 'x', sizeBytes: 1, scope: 'managed-profile', profileId: 'noor', entries: {[QADAA_LEILA]: '{"hijacked":true}', [QADAA]: '{"hijacked":true}'}};
    await restoreBackupForProfile(hostile, 'noor');
    expect(await AsyncStorage.getItem(QADAA_LEILA)).toBe('{"leila":true}');
    expect(await AsyncStorage.getItem(QADAA)).toBe('{"owner":true}');
  });
});

describe('Qadaa is deleted with the data it belongs to — and only that', () => {
  it('"delete my data" removes the ledgers but keeps the backup settings, unknown awa: keys and other apps’ keys', async () => {
    await deleteTrackedData();
    const left = await allEntries();
    expect(left).toEqual({[SETTINGS]: '{"enabled":true}', [UNKNOWN_AWA]: 'keep-me', 'someone-elses-key': 'not ours'});
  });

  it('deleting one daughter’s tracked data removes her Qadaa ledger and leaves the owner and her sister untouched', async () => {
    await deleteTrackedDataForProfile('noor');
    const left = await allEntries();
    expect(Object.keys(left)).not.toContain(QADAA_NOOR);
    expect(Object.keys(left)).not.toContain(JOURNAL_NOOR);
    expect(left[QADAA]).toBe('{"owner":true}');
    expect(left[QADAA_LEILA]).toBe('{"leila":true}');
    expect(left[JOURNAL_LEILA]).toBe('[{"id":"l"}]');
    expect(left[UNKNOWN_AWA]).toBe('keep-me');
  });
});

describe('old and partial backups never erase what they do not contain', () => {
  const OLD_SNAPSHOT: BackupSnapshot = {
    createdAt: '2026-01-01T00:00:00.000Z',
    sizeBytes: 10,
    entries: {[JOURNAL]: '[{"id":"from-old-backup"}]', '@hawa/language': 'en'}, // taken before Qadaa was part of backups
  };

  it('restoring a snapshot without Qadaa entries leaves the Qadaa records on the device exactly as they are', async () => {
    await restoreBackup(OLD_SNAPSHOT);
    expect(await AsyncStorage.getItem(JOURNAL)).toBe('[{"id":"from-old-backup"}]');
    expect(await AsyncStorage.getItem(QADAA)).toBe('{"owner":true}');
    expect(await AsyncStorage.getItem(QADAA_NOOR)).toBe('{"noor":true}');
    expect(await AsyncStorage.getItem(QADAA_PROGRESS)).toBe('{"completedDays":3}');
  });

  it('a snapshot with a null entry removes that key — and only that key', async () => {
    await restoreBackup({...OLD_SNAPSHOT, entries: {[QADAA_PROGRESS]: null}});
    expect(await AsyncStorage.getItem(QADAA_PROGRESS)).toBeNull();
    expect(await AsyncStorage.getItem(QADAA)).toBe('{"owner":true}');
  });

  it('ignores backup artifacts, unclassified keys and foreign keys that a snapshot happens to carry', async () => {
    await restoreBackup({...OLD_SNAPSHOT, entries: {[SLOT]: 'evil', [UNKNOWN_AWA]: 'evil', 'someone-elses-key': 'evil', '@awa/restore-journal/v1': 'evil'}});
    expect(await AsyncStorage.getItem(SLOT)).toBeNull();
    expect(await AsyncStorage.getItem(UNKNOWN_AWA)).toBe('keep-me');
    expect(await AsyncStorage.getItem('someone-elses-key')).toBe('not ours');
    expect(await AsyncStorage.getItem('@awa/restore-journal/v1')).toBeNull();
  });

  it('rejects a malformed snapshot without touching anything', async () => {
    const before = await allEntries();
    await expect(restoreBackup({createdAt: 'x', entries: {[JOURNAL]: 42}} as unknown as BackupSnapshot)).rejects.toThrow('invalid backup');
    expect(await allEntries()).toEqual(before);
  });
});

describe('an interrupted restore puts everything back', () => {
  const FULL: BackupSnapshot = {
    createdAt: 'x',
    sizeBytes: 1,
    entries: {[JOURNAL]: '[{"id":"restored"}]', [QADAA]: '{"restored":true}', [QADAA_NOOR]: null, '@hawa/language': 'es', [JOURNAL_NOOR]: '[{"id":"restored-n"}]'},
  };

  it.each(['after-journal', 'mid-writes', 'before-journal-removal'] as const)('killed at "%s": the next launch restores the exact previous state', async point => {
    const before = await allEntries();
    __setRestoreFaultForTests(point);
    await expect(restoreBackup(FULL)).rejects.toThrow(/simulated interruption/);

    expect(await recoverInterruptedRestore()).toBe(true);

    expect(await allEntries()).toEqual(before);
    expect(await AsyncStorage.getItem('@awa/restore-journal/v1')).toBeNull();
    expect(await recoverInterruptedRestore()).toBe(false);
  });

  it('a transient write failure rolls back immediately and reports it', async () => {
    const before = await allEntries();
    const setItem = (AsyncStorage.setItem as jest.Mock).getMockImplementation() as (key: string, value: string) => Promise<void>;
    let failed = false;
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      if (key === QADAA && !failed) {
        failed = true;
        return Promise.reject(new Error('disk full'));
      }
      return setItem(key, value);
    });
    await expect(restoreBackup(FULL)).rejects.toThrow('disk full');
    (AsyncStorage.setItem as jest.Mock).mockImplementation(setItem);
    expect(await allEntries()).toEqual(before);
  });

  it('when even the rollback fails (disk really full) the journal stays, and the next launch finishes the rollback', async () => {
    const before = await allEntries();
    const setItem = (AsyncStorage.setItem as jest.Mock).getMockImplementation() as (key: string, value: string) => Promise<void>;
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => (key === QADAA ? Promise.reject(new Error('disk full')) : setItem(key, value)));
    await expect(restoreBackup(FULL)).rejects.toThrow('disk full');
    (AsyncStorage.setItem as jest.Mock).mockImplementation(setItem);

    expect(await AsyncStorage.getItem('@awa/restore-journal/v1')).not.toBeNull(); // the way back is still there
    expect(await recoverInterruptedRestore()).toBe(true);
    expect(await allEntries()).toEqual(before);
  });

  it('a new restore first rolls back an unfinished one instead of layering on top of it', async () => {
    const before = await allEntries();
    __setRestoreFaultForTests('mid-writes');
    await expect(restoreBackup(FULL)).rejects.toThrow();
    await restoreBackup({...FULL, entries: {[JOURNAL]: '[{"id":"second"}]'}});
    const after = await allEntries();
    expect(after[JOURNAL]).toBe('[{"id":"second"}]');
    expect(after['@hawa/language']).toBe(before['@hawa/language']); // the unfinished one's changes are gone
    expect(after[QADAA]).toBe(before[QADAA]);
  });
});

describe('the local backup slot is encrypted, and says so honestly when it cannot be read', () => {
  beforeEach(() => setStructuredEncryptionEnabled(true));

  it('stores no plaintext, reads back, and notes that nothing is legacy', async () => {
    await backupNow();
    const raw = await getRawItem(SLOT);
    expect(isStructuredEnvelope(raw)).toBe(true);
    expect(raw).not.toContain('owner');
    expect(raw).not.toContain('2026');
    const status = await getLocalBackupStatus();
    expect(status).toMatchObject({status: 'ok', legacyPlaintext: false});
    expect((await getBackupSnapshot())?.entries[QADAA]).toBe('{"owner":true}');
  });

  it('still reads a plaintext snapshot written by an older build', async () => {
    const legacy: BackupSnapshot = {createdAt: '2026-01-01T00:00:00.000Z', sizeBytes: 5, entries: {[JOURNAL]: '[]'}};
    await AsyncStorage.setItem(SLOT, JSON.stringify(legacy));
    expect(await getLocalBackupStatus()).toMatchObject({status: 'ok', legacyPlaintext: true});
  });

  it('reports "none", "unreadable" and "corrupted" distinctly — never "none" for a snapshot it cannot open', async () => {
    await AsyncStorage.removeItem(SLOT);
    expect(await getLocalBackupStatus()).toEqual({status: 'none'});

    await backupNow();
    await Keychain.setGenericPassword('x', '33'.repeat(32), {service: STRUCTURED_KEY_SERVICE});
    clearAesKeyCache();
    expect(await getLocalBackupStatus()).toEqual({status: 'unreadable', reason: 'authentication-failed'});
    expect(await getBackupSnapshot()).toBeUndefined();

    await AsyncStorage.setItem(SLOT, 'not json at all');
    expect(await getLocalBackupStatus()).toEqual({status: 'corrupted'});
  });

  it('a snapshot copied into another slot is not accepted there (its slot key is authenticated)', async () => {
    await backupNowForProfile('noor');
    const noorSlot = `${SLOT}:profile:noor`;
    await AsyncStorage.setItem(`${SLOT}:profile:leila`, (await AsyncStorage.getItem(noorSlot)) as string);
    expect(await getLocalBackupStatusForProfile('leila')).toMatchObject({status: 'unreadable', reason: 'authentication-failed'});
    expect(await getLocalBackupStatusForProfile('noor')).toMatchObject({status: 'ok'});
  });

  it('never falls back to a plaintext backup when it cannot encrypt (key lost): the old backup stays', async () => {
    await backupNow();
    const before = await getRawItem(SLOT);
    await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
    clearAesKeyCache();
    await expect(backupNow()).rejects.toMatchObject({reason: 'key-lost'});
    expect(await getRawItem(SLOT)).toBe(before);
  });

  it('restores encrypted records verbatim to the same keys, and they still decrypt', async () => {
    await secureStorage.setItem(JOURNAL, '[{"id":"secret"}]');
    const snapshot = await backupNow();
    expect(isStructuredEnvelope(snapshot.entries[JOURNAL])).toBe(true);
    await secureStorage.setItem(JOURNAL, '[{"id":"changed-later"}]');
    await restoreBackup(snapshot);
    resetStructuredStorageForTests();
    expect(await secureStorage.getItem(JOURNAL)).toBe('[{"id":"secret"}]');
  });
});
