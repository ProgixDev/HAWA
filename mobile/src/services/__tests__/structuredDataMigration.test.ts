import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {
  __setMigrationFaultForTests,
  getStructuredMigrationState,
  migrateStructuredKey,
  recoverStructuredMigration,
  runStructuredMigration,
  type MigrationStep,
} from '../structuredDataMigration';
import secureStorage, {clearStructuredCache, getRawItem, resetStructuredStorageForTests, setStructuredEncryptionEnabled} from '../secureAsyncStorage';
import {KEY_ESTABLISHED_MARKER, STRUCTURED_KEY_SERVICE, decryptStructured, isStructuredEnvelope} from '../structuredEncryption';
import {clearAesKeyCache} from '../secureAesKeyStore';

// The migration must never lose, corrupt, resurrect or "empty" a record, whatever kills the process and whenever.
// Fixtures only.

const OWNER = '@hawa/daily-journal/v1';
const DAUGHTER = '@hawa/daily-journal/v1:profile:daughter_1';
const PERIODS = '@hawa/confirmed-period-history';
const QADAA = 'awa:qadaa:ledger:v1';
const OWNER_VALUE = JSON.stringify([{id: 'a', date: '2026-09-20', mood: {level: 'good'}}]);
const DAUGHTER_VALUE = JSON.stringify([{id: 'b', date: '2026-09-21', symptoms: {names: ['Fatigue']}}]);
const PERIODS_VALUE = JSON.stringify([{id: '2026-09-10', periodStart: '2026-09-10T00:00:00.000Z'}]);
const TEMP_PREFIX = '@awa/structured-migration/tmp/';

const tempKeys = async () => (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(TEMP_PREFIX));
const wipeKey = async () => {
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  clearAesKeyCache();
};

beforeEach(async () => {
  setStructuredEncryptionEnabled(true);
  __setMigrationFaultForTests(null);
  await AsyncStorage.clear();
  await wipeKey();
  clearStructuredCache();
  resetStructuredStorageForTests();
});
afterAll(() => setStructuredEncryptionEnabled(false));

const seedLegacy = async () => {
  await AsyncStorage.setItem(OWNER, OWNER_VALUE);
  await AsyncStorage.setItem(DAUGHTER, DAUGHTER_VALUE);
  await AsyncStorage.setItem(PERIODS, PERIODS_VALUE);
  await AsyncStorage.setItem(QADAA, '{"entries":[1]}');
  await AsyncStorage.setItem('@awa/appearance/language-v1', 'fr'); // not eligible: must stay as it is
};

describe('structured data migration', () => {
  it('encrypts every legacy record, keeps its value, and leaves other keys alone', async () => {
    await seedLegacy();
    const summary = await runStructuredMigration();

    expect(summary).toMatchObject({migrated: 4, alreadyEncrypted: 0, failed: []});
    for (const [key, value] of [[OWNER, OWNER_VALUE], [DAUGHTER, DAUGHTER_VALUE], [PERIODS, PERIODS_VALUE], [QADAA, '{"entries":[1]}']] as const) {
      const raw = await getRawItem(key);
      expect(isStructuredEnvelope(raw)).toBe(true);
      expect(raw).not.toContain('2026');
      expect(await secureStorage.getItem(key)).toBe(value);
    }
    expect(await getRawItem('@awa/appearance/language-v1')).toBe('fr');
    expect(await tempKeys()).toEqual([]);
    expect(Object.values(await getStructuredMigrationState()).every(phase => phase === 'done')).toBe(true);
  });

  it('is idempotent: a second run changes nothing', async () => {
    await seedLegacy();
    await runStructuredMigration();
    const before = await Promise.all([OWNER, DAUGHTER, PERIODS, QADAA].map(getRawItem));
    const summary = await runStructuredMigration();
    expect(summary).toMatchObject({migrated: 0, alreadyEncrypted: 4});
    expect(await Promise.all([OWNER, DAUGHTER, PERIODS, QADAA].map(getRawItem))).toEqual(before);
  });

  it('never creates a record that does not exist', async () => {
    const summary = await runStructuredMigration();
    expect(summary.migrated).toBe(0);
    expect(await getRawItem(OWNER)).toBeNull();
    expect(await migrateStructuredKey(OWNER)).toBe('absent');
    expect(await getRawItem(OWNER)).toBeNull();
  });

  it('a record written encrypted by the app before the migration runs is simply recognised', async () => {
    await secureStorage.setItem(OWNER, OWNER_VALUE);
    expect(await migrateStructuredKey(OWNER)).toBe('already-encrypted');
    expect(await secureStorage.getItem(OWNER)).toBe(OWNER_VALUE);
  });

  describe('a process kill at every step is recoverable and loses nothing', () => {
    const steps: Exclude<MigrationStep, null>[] = [
      'after-stage',
      'after-verify-stage',
      'after-mark-committing',
      'after-recheck',
      'after-commit',
      'after-verify-commit',
    ];

    it.each(steps)('killed %s: the value is readable right away, and a restart settles the record', async step => {
      await AsyncStorage.setItem(OWNER, OWNER_VALUE);
      __setMigrationFaultForTests(step);
      await expect(migrateStructuredKey(OWNER)).rejects.toThrow(/simulated process kill/);

      // 1. immediately after the "crash" — before any recovery — the app still reads the right data
      clearStructuredCache();
      expect(await secureStorage.getItem(OWNER)).toBe(OWNER_VALUE);

      // 2. restart: recovery, then a normal run
      await recoverStructuredMigration();
      const summary = await runStructuredMigration();
      expect(summary.failed).toEqual([]);

      clearStructuredCache();
      expect(await secureStorage.getItem(OWNER)).toBe(OWNER_VALUE);
      expect(isStructuredEnvelope(await getRawItem(OWNER))).toBe(true);
      expect(await tempKeys()).toEqual([]);
    });

    it('killed after the commit: recovery verifies the envelope and finishes (no second encryption needed)', async () => {
      await AsyncStorage.setItem(OWNER, OWNER_VALUE);
      __setMigrationFaultForTests('after-commit');
      await expect(migrateStructuredKey(OWNER)).rejects.toThrow();
      const committed = await getRawItem(OWNER);
      const report = await recoverStructuredMigration();
      expect(report.finished).toEqual([OWNER]);
      expect(await getRawItem(OWNER)).toBe(committed);
      expect(await tempKeys()).toEqual([]);
    });

    it('killed before the commit: the plaintext is untouched and is retried later', async () => {
      await AsyncStorage.setItem(OWNER, OWNER_VALUE);
      __setMigrationFaultForTests('after-recheck');
      await expect(migrateStructuredKey(OWNER)).rejects.toThrow();
      expect(await getRawItem(OWNER)).toBe(OWNER_VALUE);
      const report = await recoverStructuredMigration();
      expect(report.retryLater).toEqual([OWNER]);
      expect(await getRawItem(OWNER)).toBe(OWNER_VALUE);
    });

    it('killed mid-migration and the record is then DELETED: recovery drops the copy and does not resurrect it', async () => {
      await AsyncStorage.setItem(OWNER, OWNER_VALUE);
      __setMigrationFaultForTests('after-mark-committing');
      await expect(migrateStructuredKey(OWNER)).rejects.toThrow();
      await AsyncStorage.removeItem(OWNER); // e.g. the profile was deleted before the next launch

      const report = await recoverStructuredMigration();
      expect(report.dropped).toEqual([OWNER]);
      await runStructuredMigration();
      expect(await getRawItem(OWNER)).toBeNull();
      expect(await tempKeys()).toEqual([]);
    });
  });

  describe('concurrency', () => {
    it('an edit made while the migration runs is never overwritten by the older value', async () => {
      await AsyncStorage.setItem(OWNER, OWNER_VALUE);
      const migrating = migrateStructuredKey(OWNER);
      const edited = secureStorage.setItem(OWNER, JSON.stringify([{id: 'newer'}]));
      await Promise.all([migrating, edited]);
      expect(await secureStorage.getItem(OWNER)).toBe(JSON.stringify([{id: 'newer'}]));
      expect(isStructuredEnvelope(await getRawItem(OWNER))).toBe(true);
    });

    it('a deletion made while the migration runs wins: the record is not resurrected', async () => {
      await AsyncStorage.setItem(DAUGHTER, DAUGHTER_VALUE);
      const migrating = migrateStructuredKey(DAUGHTER);
      const removed = secureStorage.removeItem(DAUGHTER);
      await Promise.all([migrating, removed]);
      expect(await getRawItem(DAUGHTER)).toBeNull();
      expect(await tempKeys()).toEqual([]);
    });

    it('two simultaneous runs share one pass', async () => {
      await seedLegacy();
      const [a, b] = await Promise.all([runStructuredMigration(), runStructuredMigration()]);
      expect(a).toBe(b);
      expect(a.migrated).toBe(4);
    });
  });

  describe('failures are reported, never turned into data loss', () => {
    it('when encryption is impossible (key lost) the plaintext is left exactly as it was', async () => {
      await secureStorage.setItem(PERIODS, PERIODS_VALUE); // establishes the key
      await wipeKey(); // key lost
      await AsyncStorage.setItem(OWNER, OWNER_VALUE);

      expect(await migrateStructuredKey(OWNER)).toBe('failed');
      expect(await getRawItem(OWNER)).toBe(OWNER_VALUE);
      expect(await tempKeys()).toEqual([]);
      expect((await getStructuredMigrationState())[OWNER]).toBe('failed');
      expect(await AsyncStorage.getItem(KEY_ESTABLISHED_MARKER)).not.toBeNull();
    });

    it('an unreadable already-encrypted record is reported and kept untouched', async () => {
      await secureStorage.setItem(OWNER, OWNER_VALUE);
      const raw = await getRawItem(OWNER);
      await Keychain.setGenericPassword('x', '22'.repeat(32), {service: STRUCTURED_KEY_SERVICE});
      clearAesKeyCache();
      expect(await migrateStructuredKey(OWNER)).toBe('failed');
      expect(await getRawItem(OWNER)).toBe(raw);
    });

    it('the staged copy is a verified, decryptable recovery copy of the data', async () => {
      await AsyncStorage.setItem(OWNER, OWNER_VALUE);
      __setMigrationFaultForTests('after-verify-stage');
      await expect(migrateStructuredKey(OWNER)).rejects.toThrow();
      const [temp] = await tempKeys();
      const staged = (await AsyncStorage.getItem(temp)) as string;
      expect(await decryptStructured(OWNER, staged)).toBe(OWNER_VALUE);
    });
  });

  it('profile isolation: each profile is migrated under its own identity', async () => {
    await seedLegacy();
    await runStructuredMigration();
    const owner = (await getRawItem(OWNER)) as string;
    // the owner's ciphertext, placed in the daughter's record, is not accepted as hers
    await AsyncStorage.setItem(DAUGHTER, owner);
    clearStructuredCache();
    await expect(secureStorage.getItem(DAUGHTER)).rejects.toMatchObject({reason: 'authentication-failed'});
  });

  it('does nothing while the feature switch is off', async () => {
    setStructuredEncryptionEnabled(false);
    await AsyncStorage.setItem(OWNER, OWNER_VALUE);
    const summary = await runStructuredMigration();
    expect(summary.migrated).toBe(0);
    expect(await getRawItem(OWNER)).toBe(OWNER_VALUE);
  });
});

describe('the migration’s own guards, each exercised directly', () => {
  type SetItem = (key: string, value: string) => Promise<void>;
  const realSetItem = () => (AsyncStorage.setItem as jest.Mock).getMockImplementation() as SetItem;
  const restoreSetItem = (impl: SetItem) => (AsyncStorage.setItem as jest.Mock).mockImplementation(impl);

  /** Holds the FIRST write to `matcher`'s key until released, so a test can act at an exact point of the migration. */
  const gateFirstWrite = (matches: (key: string) => boolean) => {
    const original = realSetItem();
    let reached: () => void = () => undefined;
    let release: () => void = () => undefined;
    const reachedPromise = new Promise<void>(resolve => {
      reached = resolve;
    });
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    let gated = false;
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      if (!gated && matches(key)) {
        gated = true;
        reached();
        await gate;
      }
      return original(key, value);
    });
    return {reached: reachedPromise, release: () => release(), restore: () => restoreSetItem(original)};
  };

  it('LOCK: an edit that arrives while the commit is in flight cannot be overwritten by the older value', async () => {
    await AsyncStorage.setItem(OWNER, OWNER_VALUE);
    const gate = gateFirstWrite(key => key === OWNER); // the migration's commit of the real record
    const migrating = migrateStructuredKey(OWNER);
    await gate.reached; // the commit is paused in the middle of writing

    const edited = secureStorage.setItem(OWNER, JSON.stringify([{id: 'newer'}])); // the user edits right now
    for (let index = 0; index < 20; index += 1) {await Promise.resolve();}
    gate.release();
    await Promise.all([migrating, edited]);
    gate.restore();

    expect(await secureStorage.getItem(OWNER)).toBe(JSON.stringify([{id: 'newer'}]));
  });

  it('RE-CHECK: a raw edit made between staging and commit abandons the attempt and keeps the newer value', async () => {
    await AsyncStorage.setItem(OWNER, OWNER_VALUE);
    const gate = gateFirstWrite(key => key.startsWith(TEMP_PREFIX)); // pause right after the staged copy is being written
    const migrating = migrateStructuredKey(OWNER);
    await gate.reached;
    await getRawItem(OWNER); // (an unrelated read changes nothing)
    const rawSet = realSetItem();
    await rawSet(OWNER, '[{"id":"edited-by-a-path-that-bypasses-the-lock"}]');
    gate.release();
    expect(await migrating).toBe('raced');
    gate.restore();

    expect(await getRawItem(OWNER)).toBe('[{"id":"edited-by-a-path-that-bypasses-the-lock"}]');
    expect(await tempKeys()).toEqual([]);
  });

  it('RE-CHECK: a raw deletion between staging and commit is respected — the record is NOT recreated', async () => {
    await AsyncStorage.setItem(DAUGHTER, DAUGHTER_VALUE);
    const gate = gateFirstWrite(key => key.startsWith(TEMP_PREFIX));
    const migrating = migrateStructuredKey(DAUGHTER);
    await gate.reached;
    await AsyncStorage.removeItem(DAUGHTER); // e.g. a deletion path that does not take the lock
    gate.release();
    expect(await migrating).toBe('raced');
    gate.restore();

    expect(await getRawItem(DAUGHTER)).toBeNull();
    expect(await tempKeys()).toEqual([]);
  });

  it('STAGED COPY: a corrupted staging write is detected and the plaintext is never overwritten', async () => {
    await AsyncStorage.setItem(OWNER, OWNER_VALUE);
    const original = realSetItem();
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) =>
      original(key, key.startsWith(TEMP_PREFIX) ? `${value}0` : value), // a flaky write that damages the temp copy
    );
    expect(await migrateStructuredKey(OWNER)).toBe('failed');
    restoreSetItem(original);

    expect(await getRawItem(OWNER)).toBe(OWNER_VALUE);
    expect(await tempKeys()).toEqual([]);
    expect((await getStructuredMigrationState())[OWNER]).toBe('failed');
  });

  it('COMMIT: a corrupted commit write is detected and the original plaintext is put back', async () => {
    await AsyncStorage.setItem(OWNER, OWNER_VALUE);
    const original = realSetItem();
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      const damaged = key === OWNER && isStructuredEnvelope(value);
      return original(key, damaged ? `${value} ` : value);
    });
    expect(await migrateStructuredKey(OWNER)).toBe('failed');
    restoreSetItem(original);

    expect(await getRawItem(OWNER)).toBe(OWNER_VALUE);
    expect(await tempKeys()).toEqual([]);
  });
});
