import fs from 'fs';
import path from 'path';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import secureStorage, {
  STRUCTURED_ENCRYPTED_BASES,
  __markUnavailableForTests,
  getRawItem,
  isAnyStructuredDataUnavailable,
  isStructuredEncryptionEligible,
  resetStructuredStorageForTests,
  setStructuredEncryptionEnabled,
} from '../secureAsyncStorage';
import {STRUCTURED_KEY_SERVICE, encryptStructured, isStructuredEnvelope} from '../structuredEncryption';
import {clearAesKeyCache} from '../secureAesKeyStore';
import {runStructuredMigration} from '../structuredDataMigration';
import {discardUnreadableRecords, createReplacementProtectionKey, retryStructuredAccess, summarizeUnavailable} from '../structuredKeyRecovery';
import {getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {getConfirmedPeriodHistory, hydrateConfirmedPeriodHistory, recordConfirmedPeriodEnd} from '../../state/confirmedPeriodHistoryStore';
import {getRemainingQadaaDays, hydrateRemainingQadaaDays, setRemainingQadaaDays} from '../../state/qadaaStore';
import {getPregnancyDating, hydratePregnancyDating, setPregnancyDating} from '../../state/pregnancyPreferences';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {reloadCycleStateFromStorage} from '../../state/onboardingPreferences';

// The real stores, with encryption ON: what they write is ciphertext, what they read is their own data, a daughter's
// data stays hers, and unreadable data is reported instead of being treated as empty. Fixtures only.

const wipeKey = async () => {
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  clearAesKeyCache();
};

beforeEach(async () => {
  setStructuredEncryptionEnabled(true);
  await AsyncStorage.clear();
  await wipeKey();
  resetStructuredStorageForTests();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  await reloadCycleStateFromStorage().catch(() => undefined);
});
afterAll(() => setStructuredEncryptionEnabled(false));

describe('the list of encrypted bases is real', () => {
  const sources: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__' && entry.name !== 'assets') {walk(full);}
      } else if (/\.(ts|tsx)$/.test(entry.name) && !/secureAsyncStorage\.ts$/.test(entry.name)) {
        sources.push(fs.readFileSync(full, 'utf8'));
      }
    }
  };
  walk(path.join(__dirname, '..', '..'));
  const allSource = sources.join('\n');

  it.each([...STRUCTURED_ENCRYPTED_BASES])('%s is a key some store really uses (no typo silently leaves data plaintext)', base => {
    expect(allSource).toContain(`'${base}'`);
  });

  it('routes eligibility by the key WITHOUT the profile suffix', () => {
    expect(isStructuredEncryptionEligible('@hawa/daily-journal/v1')).toBe(true);
    expect(isStructuredEncryptionEligible('@hawa/daily-journal/v1:profile:abc')).toBe(true);
    expect(isStructuredEncryptionEligible('awa:qadaa:ledger:v1:profile:abc')).toBe(true);
    expect(isStructuredEncryptionEligible('@awa/appearance/theme-v1')).toBe(false);
    expect(isStructuredEncryptionEligible('@awa/backup/local-v1')).toBe(false);
    expect(isStructuredEncryptionEligible('@hawa/library/state/v1')).toBe(false);
  });
});

describe('stores write ciphertext and read their own data back', () => {
  it('daily journal: structured symptom/mood/flow values are not readable in storage', async () => {
    await saveJournalSection('2026-09-20', 'symptoms', {names: ['Crampes'], severity: 'severe'});
    await saveJournalSection('2026-09-20', 'mood', {level: 'sad', energy: 1, stress: 4, irritability: 2, motivation: 1});
    await saveJournalSection('2026-09-20', 'flow', {intensity: 'heavy'});
    const raw = (await getRawItem('@hawa/daily-journal/v1')) as string;
    expect(isStructuredEnvelope(raw)).toBe(true);
    for (const secret of ['Crampes', 'severe', 'sad', 'heavy', '2026-09-20']) {expect(raw).not.toContain(secret);}
    const entry = await getJournalEntry('2026-09-20');
    expect(entry?.symptoms?.names).toEqual(['Crampes']);
    expect(entry?.mood?.level).toBe('sad');
    expect(entry?.flow?.intensity).toBe('heavy');
  });

  it('confirmed period history', async () => {
    await recordConfirmedPeriodEnd(new Date(2026, 8, 10, 12), new Date(2026, 8, 14, 12));
    const raw = (await getRawItem('@hawa/confirmed-period-history')) as string;
    expect(isStructuredEnvelope(raw)).toBe(true);
    expect(raw).not.toContain('2026');
    // a fresh hydration (as after a restart) reads it back
    await setActiveProfileId('owner');
    const history = await hydrateConfirmedPeriodHistory();
    expect(history).toHaveLength(1);
    expect(getConfirmedPeriodHistory()[0].id).toBe('2026-09-10');
  });

  it('Qadaa counter and pregnancy dating', async () => {
    await setRemainingQadaaDays(12);
    await setPregnancyDating({method: 'dueDate', dueDate: '2027-03-01'} as never);
    expect(isStructuredEnvelope(await getRawItem('@hawa/remaining-qadaa-days'))).toBe(true);
    expect(isStructuredEnvelope(await getRawItem('@hawa/pregnancy-dating'))).toBe(true);
    expect(await getRawItem('@hawa/pregnancy-dating')).not.toContain('2027');
    await hydrateRemainingQadaaDays();
    await hydratePregnancyDating();
    expect(getRemainingQadaaDays()).toBe(12);
    expect(getPregnancyDating()).toMatchObject({dueDate: '2027-03-01'});
  });

  it('a managed profile’s journal lives under her own key and is bound to her', async () => {
    const noor = await addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2014-05-01', hasHadFirstPeriod: false});
    await saveJournalSection('2026-09-20', 'mood', {level: 'good', energy: 3, stress: 1, irritability: 1, motivation: 3});
    await setActiveProfileId(noor.id);
    await saveJournalSection('2026-09-21', 'mood', {level: 'tired', energy: 1, stress: 2, irritability: 1, motivation: 1});

    const hers = (await getRawItem(`@hawa/daily-journal/v1:profile:${noor.id}`)) as string;
    const owner = (await getRawItem('@hawa/daily-journal/v1')) as string;
    expect(isStructuredEnvelope(hers) && isStructuredEnvelope(owner)).toBe(true);
    expect((await getJournalEntry('2026-09-21'))?.mood?.level).toBe('tired');
    expect(await getJournalEntry('2026-09-20')).toBeUndefined(); // the owner's day is not hers

    // the owner's ciphertext dropped into her record is not accepted as hers
    await AsyncStorage.setItem(`@hawa/daily-journal/v1:profile:${noor.id}`, owner);
    resetStructuredStorageForTests();
    await expect(getJournalEntry('2026-09-20')).rejects.toMatchObject({name: 'StructuredDataUnavailableError'});
  });
});

describe('legacy plaintext data keeps working and is then migrated', () => {
  it('a user who had a plaintext journal before the update loses nothing', async () => {
    const legacy = JSON.stringify([{id: 'l1', date: '2026-08-02', symptoms: {names: ['Fatigue'], severity: 'mild'}}]);
    await AsyncStorage.setItem('@hawa/daily-journal/v1', legacy);

    expect((await getJournalEntry('2026-08-02'))?.symptoms?.names).toEqual(['Fatigue']); // readable before migration
    await saveJournalSection('2026-08-03', 'flow', {intensity: 'light'}); // the next write encrypts, keeping the old entry
    expect(isStructuredEnvelope(await getRawItem('@hawa/daily-journal/v1'))).toBe(true);
    expect((await getJournalEntry('2026-08-02'))?.symptoms?.names).toEqual(['Fatigue']);

    await AsyncStorage.setItem('@hawa/confirmed-period-history', JSON.stringify([]));
    const summary = await runStructuredMigration();
    expect(summary.failed).toEqual([]);
    expect(isStructuredEnvelope(await getRawItem('@hawa/confirmed-period-history'))).toBe(true);
  });
});

describe('unreadable data is reported, never treated as empty, never overwritten', () => {
  it('journal: reads fail loudly and the stored record survives every attempted write', async () => {
    await saveJournalSection('2026-09-20', 'mood', {level: 'good', energy: 3, stress: 1, irritability: 1, motivation: 3});
    const before = await getRawItem('@hawa/daily-journal/v1');
    await Keychain.setGenericPassword('x', '55'.repeat(32), {service: STRUCTURED_KEY_SERVICE});
    clearAesKeyCache();
    resetStructuredStorageForTests();

    await expect(getJournalEntry('2026-09-20')).rejects.toMatchObject({name: 'StructuredDataUnavailableError'});
    await expect(saveJournalSection('2026-09-22', 'flow', {intensity: 'light'})).rejects.toBeInstanceOf(Error);
    expect(await getRawItem('@hawa/daily-journal/v1')).toBe(before);
    expect(isAnyStructuredDataUnavailable()).toBe(true);
  });

  it('a lost key: nothing is written, the summary says so, and a replacement key only ever affects NEW writes', async () => {
    await setRemainingQadaaDays(9);
    const original = await getRawItem('@hawa/remaining-qadaa-days');
    await wipeKey();
    resetStructuredStorageForTests();
    await hydrateRemainingQadaaDays().catch(() => undefined);
    await secureStorage.getItem('@hawa/remaining-qadaa-days').catch(() => undefined);
    expect(summarizeUnavailable()).toMatchObject({total: 1, keyLost: 1});

    await expect(setRemainingQadaaDays(4)).rejects.toBeInstanceOf(Error);
    expect(await getRawItem('@hawa/remaining-qadaa-days')).toBe(original);

    expect(await createReplacementProtectionKey()).toBe(true);
    // the old record is STILL unreadable (it was never touched) …
    await expect(secureStorage.getItem('@hawa/remaining-qadaa-days')).rejects.toBeInstanceOf(Error);
    expect(await getRawItem('@hawa/remaining-qadaa-days')).toBe(original);
    // … while other records can be written again under the new key
    await secureStorage.setItem('@hawa/pregnancy-dating', '{"dueDate":"2027-01-01"}');
    expect(await secureStorage.getItem('@hawa/pregnancy-dating')).toBe('{"dueDate":"2027-01-01"}');
  });

  it('"discard" removes exactly the unreadable records and nothing readable', async () => {
    await secureStorage.setItem('@hawa/pregnancy-dating', '{"dueDate":"2027-01-01"}');
    await secureStorage.setItem('@hawa/remaining-qadaa-days', '7');
    await Keychain.setGenericPassword('x', '66'.repeat(32), {service: STRUCTURED_KEY_SERVICE});
    clearAesKeyCache();
    resetStructuredStorageForTests();
    await AsyncStorage.setItem('@hawa/pregnancy-dating', await encryptWithOtherKey());
    await secureStorage.getItem('@hawa/remaining-qadaa-days').catch(() => undefined);
    // only the Qadaa record is unreadable in this scenario (the pregnancy one was re-encrypted under the current key)
    __markUnavailableForTests('@hawa/remaining-qadaa-days');

    expect(await discardUnreadableRecords()).toBe(1);
    expect(await getRawItem('@hawa/remaining-qadaa-days')).toBeNull();
    expect(await secureStorage.getItem('@hawa/pregnancy-dating')).toBe('{"dueDate":"2027-01-01"}');
    expect(isAnyStructuredDataUnavailable()).toBe(false);
  });

  it('"try again" forgets old failures so the next read is a fresh attempt', async () => {
    await secureStorage.setItem('@hawa/pregnancy-dating', '{"x":1}');
    __markUnavailableForTests('@hawa/pregnancy-dating');
    expect(isAnyStructuredDataUnavailable()).toBe(true);
    await retryStructuredAccess();
    expect(isAnyStructuredDataUnavailable()).toBe(false);
    expect(await secureStorage.getItem('@hawa/pregnancy-dating')).toBe('{"x":1}');
  });
});

async function encryptWithOtherKey(): Promise<string> {
  return encryptStructured('@hawa/pregnancy-dating', '{"dueDate":"2027-01-01"}');
}
