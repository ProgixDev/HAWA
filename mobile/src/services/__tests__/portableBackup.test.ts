import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {
  PortableBackupError,
  createPortableBackup,
  inspectPortableBackup,
  restorePortableBackup,
} from '../portableBackup';
import {__setKdfIterationsForTests, DEFAULT_KDF_ITERATIONS} from '../passphraseKdf';
import {__setRestoreFaultForTests, recoverInterruptedRestore} from '../restoreJournal';
import secureStorage, {getRawItem, resetStructuredStorageForTests, setStructuredEncryptionEnabled} from '../secureAsyncStorage';
import {STRUCTURED_KEY_SERVICE, isStructuredEnvelope} from '../structuredEncryption';
import {clearAesKeyCache} from '../secureAesKeyStore';
import {decryptFieldValue, encryptFieldValue} from '../atRestFieldEncryption';
import {decryptNoteSection} from '../privateNotesEncryption';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {markManagedProfileDeleted} from '../../state/deletedManagedProfiles';

// FIXTURES ONLY. "Device A" and "device B" are simulated by wiping the storage AND every Keychain key between the backup
// and the restore — exactly what a different phone looks like to the app.

const PASS = 'une phrase de passe assez longue';
const NOTES_SERVICE = 'com.hawa.private.notes.encryption-key';
const JOURNAL_SERVICE = 'com.hawa.private.daily-journal.encryption-key';
const SERVICES = [STRUCTURED_KEY_SERVICE, NOTES_SERVICE, JOURNAL_SERVICE, 'com.hawa.private.intimacy.encryption-key'];
const JOURNAL = '@hawa/daily-journal/v1';
const PERIODS = '@hawa/confirmed-period-history';
const QADAA = 'awa:qadaa:ledger:v1';
const PREGNANCY = '@hawa/pregnancy-dating';
const LANGUAGE = '@awa/appearance/language-v1';

const SECRET_NOTE = 'rendez-vous chez la gynécologue mardi';
const periodsValue = JSON.stringify([{id: '2026-09-10', periodStart: '2026-09-10T00:00:00.000Z', periodEndDateTime: '2026-09-14T00:00:00.000Z'}]);

const fixtureJournal = async () =>
  JSON.stringify([
    {
      id: 'e1',
      date: '2026-09-20',
      symptoms: {names: ['Crampes'], severity: 'mild', note: await encryptFieldValue(JOURNAL_SERVICE, 'note de symptôme secrète')},
      encryptedNote: await encryptFieldValue(NOTES_SERVICE, {text: SECRET_NOTE, updatedAt: '2026-09-20T10:00:00.000Z'}),
      mood: {level: 'good'},
    },
  ]);

const wipeDevice = async () => {
  await AsyncStorage.clear();
  for (const service of SERVICES) {await Keychain.resetGenericPassword({service});}
  clearAesKeyCache();
  resetStructuredStorageForTests();
  await resetManagedProfilesForTests();
};

const seedDeviceA = async () => {
  await secureStorage.setItem(JOURNAL, await fixtureJournal());
  await secureStorage.setItem(PERIODS, periodsValue);
  await secureStorage.setItem(QADAA, JSON.stringify({entries: [{days: 3}]}));
  await secureStorage.setItem(PREGNANCY, JSON.stringify({dueDate: '2027-03-01'}));
  await AsyncStorage.setItem(LANGUAGE, 'fr');
};

const snapshotAll = async () => Object.fromEntries(await Promise.all((await AsyncStorage.getAllKeys()).slice().sort().map(async key => [key, await AsyncStorage.getItem(key)] as const)));
const keychainDump = async () => Object.fromEntries(await Promise.all(SERVICES.map(async service => [service, (await Keychain.getGenericPassword({service})) || null] as const)));

beforeEach(async () => {
  setStructuredEncryptionEnabled(true);
  __setKdfIterationsForTests(100_000);
  __setRestoreFaultForTests(null);
  await wipeDevice();
});
afterAll(() => {
  setStructuredEncryptionEnabled(false);
  __setKdfIterationsForTests(null);
});

describe('creating a portable backup', () => {
  it('produces a file with no plaintext and no key material in it', async () => {
    await seedDeviceA();
    const {contents} = await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}});
    for (const secret of [SECRET_NOTE, 'note de symptôme secrète', 'Crampes', '2026-09-10', '2027-03-01', 'dueDate']) {
      expect(contents).not.toContain(secret);
    }
    for (const entry of Object.values(await keychainDump())) {
      if (entry) {expect(contents).not.toContain(entry.password);}
    }
    const info = inspectPortableBackup(contents);
    expect(info).toMatchObject({version: 1, scope: {kind: 'owner'}});
    expect(JSON.parse(contents)).toMatchObject({format: 'awa-portable-backup', kdf: {alg: 'PBKDF2-HMAC-SHA256', iter: 100_000}, cipher: {alg: 'AES-256-GCM'}});
  });

  it('uses the production cost by default and a different salt / nonce / ciphertext every time', async () => {
    __setKdfIterationsForTests(null);
    await seedDeviceA();
    expect(DEFAULT_KDF_ITERATIONS).toBeGreaterThanOrEqual(600_000);
    __setKdfIterationsForTests(100_000);
    const a = JSON.parse((await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}})).contents);
    const b = JSON.parse((await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}})).contents);
    expect(a.kdf.salt).not.toBe(b.kdf.salt);
    expect(a.n).not.toBe(b.n);
    expect(a.c).not.toBe(b.c);
  });

  it('refuses a weak passphrase', async () => {
    await expect(createPortableBackup({passphrase: 'short', scope: {kind: 'owner'}})).rejects.toMatchObject({code: 'weak-passphrase'});
  });

  it('refuses to produce an INCOMPLETE backup: unreadable records are named and no file is made', async () => {
    await seedDeviceA();
    await Keychain.setGenericPassword('x', '44'.repeat(32), {service: STRUCTURED_KEY_SERVICE}); // the key no longer matches
    clearAesKeyCache();
    const failure = await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}}).catch((error: PortableBackupError) => error);
    expect(failure).toBeInstanceOf(PortableBackupError);
    expect((failure as PortableBackupError).code).toBe('unreadable-data');
    expect((failure as PortableBackupError).keys).toEqual(expect.arrayContaining([JOURNAL, PERIODS, QADAA]));
  });
});

describe('restoring on the same device and on a different one', () => {
  it('same phone: everything comes back exactly', async () => {
    await seedDeviceA();
    const {contents} = await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}});

    await secureStorage.setItem(JOURNAL, '[]');
    await secureStorage.setItem(PERIODS, '[]');
    const result = await restorePortableBackup({contents, passphrase: PASS});

    expect(result.restoredRecords).toBeGreaterThan(3);
    resetStructuredStorageForTests();
    // nested note fields are re-sealed with fresh nonces on restore, so compare what they DECRYPT to
    const restored = JSON.parse((await secureStorage.getItem(JOURNAL)) as string) as {symptoms: {names: string[]; note: {version: 1; iv: string; ciphertext: string}}; encryptedNote: {version: 1; iv: string; ciphertext: string}; mood: unknown}[];
    expect(restored[0].symptoms.names).toEqual(['Crampes']);
    expect(restored[0].mood).toEqual({level: 'good'});
    expect(await decryptFieldValue(JOURNAL_SERVICE, restored[0].symptoms.note)).toBe('note de symptôme secrète');
    expect((await decryptNoteSection(restored[0].encryptedNote)).text).toBe(SECRET_NOTE);
    expect(await secureStorage.getItem(PERIODS)).toBe(periodsValue);
    expect(await secureStorage.getItem(QADAA)).toBe(JSON.stringify({entries: [{days: 3}]}));
  });

  it('NEW PHONE: a different Keystore, empty storage — the data is restored and re-encrypted under the new phone’s own keys', async () => {
    await seedDeviceA();
    const originalJournalRaw = (await getRawItem(JOURNAL)) as string;
    const deviceAKeys = await keychainDump();
    const {contents} = await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}});

    await wipeDevice(); // device B: nothing — no data, no keys
    expect(await AsyncStorage.getAllKeys()).toHaveLength(0);
    await restorePortableBackup({contents, passphrase: PASS});

    // readable on B
    resetStructuredStorageForTests();
    const journal = JSON.parse((await secureStorage.getItem(JOURNAL)) as string) as {encryptedNote: {ciphertext: string}; symptoms: {names: string[]; note: {ciphertext: string}}}[];
    expect(journal[0].symptoms.names).toEqual(['Crampes']);
    expect(await secureStorage.getItem(PERIODS)).toBe(periodsValue);
    expect(await AsyncStorage.getItem(LANGUAGE)).toBe('fr');

    // encrypted at rest on B, under B's OWN keys (not a copy of A's ciphertext, not A's keys)
    expect(isStructuredEnvelope(await getRawItem(JOURNAL))).toBe(true);
    expect(await getRawItem(JOURNAL)).not.toBe(originalJournalRaw);
    const deviceBKeys = await keychainDump();
    expect(deviceBKeys[STRUCTURED_KEY_SERVICE]?.password).toBeDefined();
    expect(deviceBKeys[STRUCTURED_KEY_SERVICE]?.password).not.toBe(deviceAKeys[STRUCTURED_KEY_SERVICE]?.password);
    expect(deviceBKeys[NOTES_SERVICE]?.password).not.toBe(deviceAKeys[NOTES_SERVICE]?.password);

    // …and the nested note really decrypts on B with B's notes key
    expect((await decryptNoteSection(journal[0].encryptedNote as never)).text).toBe(SECRET_NOTE);
  });

  it('a wrong passphrase changes NOTHING on the phone', async () => {
    await seedDeviceA();
    const {contents} = await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}});
    await secureStorage.setItem(JOURNAL, '[{"id":"current"}]');
    const before = await snapshotAll();
    const keysBefore = await keychainDump();

    await expect(restorePortableBackup({contents, passphrase: 'une autre phrase de passe'})).rejects.toMatchObject({code: 'wrong-passphrase-or-corrupted'});

    expect(await snapshotAll()).toEqual(before);
    expect(await keychainDump()).toEqual(keysBefore);
  });

  it.each([
    ['one flipped bit in the ciphertext', (file: Record<string, unknown>) => ({...file, c: `${(file.c as string).slice(0, 40)}${(file.c as string)[40] === '0' ? '1' : '0'}${(file.c as string).slice(41)}`})],
    ['an edited creation date (header is authenticated)', (file: Record<string, unknown>) => ({...file, createdAt: '2020-01-01T00:00:00.000Z'})],
    ['an edited salt', (file: Record<string, unknown>) => ({...file, kdf: {...(file.kdf as object), salt: 'ab'.repeat(16)}})],
    ['an edited iteration count', (file: Record<string, unknown>) => ({...file, kdf: {...(file.kdf as object), iter: 100_001}})],
    ['an edited scope', (file: Record<string, unknown>) => ({...file, scope: {kind: 'managed-profile', profileId: 'x'}})],
    ['a truncated ciphertext', (file: Record<string, unknown>) => ({...file, c: (file.c as string).slice(0, -4)})],
  ])('a damaged file (%s) is rejected before anything is written', async (_name, damage) => {
    await seedDeviceA();
    const {contents} = await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}});
    const before = await snapshotAll();
    const damaged = JSON.stringify(damage(JSON.parse(contents)));
    await expect(restorePortableBackup({contents: damaged, passphrase: PASS})).rejects.toBeInstanceOf(PortableBackupError);
    expect(await snapshotAll()).toEqual(before);
  });

  it('rejects things that are not backups, unknown versions and hostile costs, without a passphrase prompt being useful', async () => {
    await expect(restorePortableBackup({contents: 'not json', passphrase: PASS})).rejects.toMatchObject({code: 'not-a-backup'});
    await expect(restorePortableBackup({contents: '{"format":"other"}', passphrase: PASS})).rejects.toMatchObject({code: 'not-a-backup'});
    await expect(restorePortableBackup({contents: '{"format":"awa-portable-backup","version":9}', passphrase: PASS})).rejects.toMatchObject({code: 'unsupported-version'});
    await seedDeviceA();
    const file = JSON.parse((await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}})).contents);
    for (const iter of [10, 50_000_000]) {
      await expect(restorePortableBackup({contents: JSON.stringify({...file, kdf: {...file.kdf, iter}}), passphrase: PASS})).rejects.toMatchObject({code: 'invalid-contents'});
    }
  });
});

describe('what a restore may and may not do to the rest of the phone', () => {
  it('a backup made before Qadaa was part of backups never erases Qadaa records already on the phone', async () => {
    await secureStorage.setItem(JOURNAL, '[{"id":"a"}]');
    const {contents} = await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}}); // has no Qadaa entry
    await secureStorage.setItem(QADAA, '{"entries":["on-the-phone"]}');
    await restorePortableBackup({contents, passphrase: PASS});
    resetStructuredStorageForTests();
    expect(await secureStorage.getItem(QADAA)).toBe('{"entries":["on-the-phone"]}');
  });

  it('a profile deleted after the backup is not resurrected', async () => {
    const noor = await addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2014-05-01', hasHadFirstPeriod: false});
    await secureStorage.setItem(`${JOURNAL}:profile:${noor.id}`, '[{"id":"noor"}]');
    await secureStorage.setItem(JOURNAL, '[{"id":"owner"}]');
    const {contents} = await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}});

    await markManagedProfileDeleted(noor.id);
    await AsyncStorage.removeItem(`${JOURNAL}:profile:${noor.id}`);
    await restorePortableBackup({contents, passphrase: PASS});

    expect(await AsyncStorage.getItem(`${JOURNAL}:profile:${noor.id}`)).toBeNull();
    const list = JSON.parse((await AsyncStorage.getItem('@hawa/managed-profiles/v1')) as string) as {id: string}[];
    expect(list.map(profile => profile.id)).not.toContain(noor.id);
  });

  it('a managed-profile backup restores only HER records, and only if her profile exists on this phone', async () => {
    const noor = await addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2014-05-01', hasHadFirstPeriod: false});
    await secureStorage.setItem(`${JOURNAL}:profile:${noor.id}`, '[{"id":"noor-original"}]');
    await secureStorage.setItem(`${QADAA}:profile:${noor.id}`, '{"noor":1}');
    await secureStorage.setItem(JOURNAL, '[{"id":"owner"}]');
    const {contents} = await createPortableBackup({passphrase: PASS, scope: {kind: 'managed-profile', profileId: noor.id}});

    await secureStorage.setItem(`${JOURNAL}:profile:${noor.id}`, '[{"id":"changed"}]');
    await secureStorage.setItem(JOURNAL, '[{"id":"owner-changed"}]');
    await restorePortableBackup({contents, passphrase: PASS});
    resetStructuredStorageForTests();
    expect(await secureStorage.getItem(`${JOURNAL}:profile:${noor.id}`)).toBe('[{"id":"noor-original"}]');
    expect(await secureStorage.getItem(JOURNAL)).toBe('[{"id":"owner-changed"}]'); // the owner is untouched

    await resetManagedProfilesForTests(); // a phone that does not know her
    await expect(restorePortableBackup({contents, passphrase: PASS})).rejects.toMatchObject({code: 'profile-missing'});
  });

  it('an interruption mid-restore leaves the phone exactly as it was after the next launch', async () => {
    await seedDeviceA();
    const {contents} = await createPortableBackup({passphrase: PASS, scope: {kind: 'owner'}});
    await secureStorage.setItem(JOURNAL, '[{"id":"current"}]');
    const before = await snapshotAll();

    __setRestoreFaultForTests('mid-writes');
    await expect(restorePortableBackup({contents, passphrase: PASS})).rejects.toMatchObject({code: 'storage-failed'});
    expect(await recoverInterruptedRestore()).toBe(true);
    expect(await snapshotAll()).toEqual(before);
  });
});
