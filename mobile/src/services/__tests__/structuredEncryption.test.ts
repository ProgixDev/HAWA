import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {
  KEY_ESTABLISHED_MARKER,
  STRUCTURED_KEY_SERVICE,
  StructuredDataError,
  decryptStructured,
  encryptStructured,
  isStructuredEnvelope,
} from '../structuredEncryption';
import secureStorage, {
  __cacheStatsForTests,
  clearStructuredCache,
  resetStructuredStorageForTests,
  getRawItem,
  getUnavailableStructuredKeys,
  isAnyStructuredDataUnavailable,
  setStructuredEncryptionEnabled,
} from '../secureAsyncStorage';
import {clearAesKeyCache} from '../secureAesKeyStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests} from '../../state/activeProfileStore';

// FIXTURES ONLY — every value below is invented. These tests pin the properties that make the encryption trustworthy:
// round trip, unique nonces, authentication, binding to the record and profile, legacy-plaintext compatibility and,
// above all, that a failure to decrypt is never read as "no data" and never lets the unreadable record be overwritten.

const OWNER_JOURNAL = '@hawa/daily-journal/v1';
const DAUGHTER_JOURNAL = '@hawa/daily-journal/v1:profile:daughter_1';
const SAMPLE = JSON.stringify([{id: 'e1', date: '2026-09-20', symptoms: {names: ['Crampes'], severity: 'mild'}}]);

const wipeKeychainKey = async () => {
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  clearAesKeyCache();
};

beforeEach(async () => {
  setStructuredEncryptionEnabled(true);
  await AsyncStorage.clear();
  await wipeKeychainKey();
  clearStructuredCache();
  resetStructuredStorageForTests();
  await resetActiveProfileForTests();
});

afterAll(() => setStructuredEncryptionEnabled(false));

describe('structured encryption — the cipher', () => {
  it('round-trips and never stores the plaintext', async () => {
    const envelope = await encryptStructured(OWNER_JOURNAL, SAMPLE);
    expect(isStructuredEnvelope(envelope)).toBe(true);
    expect(envelope).not.toContain('Crampes');
    expect(envelope).not.toContain('2026-09-20');
    expect(await decryptStructured(OWNER_JOURNAL, envelope)).toBe(SAMPLE);
    expect(JSON.parse(envelope)).toMatchObject({awa_enc: 2, alg: 'AES-256-GCM', kid: 1});
  });

  it('uses a fresh nonce every time (never reused with the same key)', async () => {
    const nonces = new Set<string>();
    for (let index = 0; index < 300; index += 1) {
      nonces.add((JSON.parse(await encryptStructured(OWNER_JOURNAL, SAMPLE)) as {n: string}).n);
    }
    expect(nonces.size).toBe(300);
  });

  it('rejects a tampered ciphertext, a tampered nonce and a truncated tag', async () => {
    const envelope = JSON.parse(await encryptStructured(OWNER_JOURNAL, SAMPLE)) as {n: string; c: string};
    const flip = (hex: string) => `${hex.slice(0, -1)}${hex.endsWith('0') ? '1' : '0'}`;
    for (const tampered of [{...envelope, c: flip(envelope.c)}, {...envelope, n: flip(envelope.n)}, {...envelope, c: envelope.c.slice(0, -2)}]) {
      await expect(decryptStructured(OWNER_JOURNAL, JSON.stringify(tampered))).rejects.toMatchObject({reason: 'authentication-failed'});
    }
  });

  it('rejects the wrong key', async () => {
    const envelope = await encryptStructured(OWNER_JOURNAL, SAMPLE);
    await Keychain.setGenericPassword('x', '00'.repeat(32), {service: STRUCTURED_KEY_SERVICE});
    clearAesKeyCache();
    await expect(decryptStructured(OWNER_JOURNAL, envelope)).rejects.toMatchObject({reason: 'authentication-failed'});
  });

  it('binds a record to its storage key and profile: a copy elsewhere is not accepted', async () => {
    const envelope = await encryptStructured(OWNER_JOURNAL, SAMPLE);
    await expect(decryptStructured(DAUGHTER_JOURNAL, envelope)).rejects.toMatchObject({reason: 'authentication-failed'});
    await expect(decryptStructured('@hawa/confirmed-period-history', envelope)).rejects.toMatchObject({reason: 'authentication-failed'});
    expect(await decryptStructured(OWNER_JOURNAL, envelope)).toBe(SAMPLE);
  });

  it('reports malformed and unsupported envelopes distinctly', async () => {
    await encryptStructured(OWNER_JOURNAL, SAMPLE); // creates the key
    await expect(decryptStructured(OWNER_JOURNAL, '{"awa_enc":2,"alg":"AES-256-GCM","kid":1,"n":"zz","c":"zz"}')).rejects.toMatchObject({reason: 'malformed'});
    await expect(decryptStructured(OWNER_JOURNAL, '{"awa_enc":9,"alg":"AES-256-GCM","kid":1,"n":"00","c":"00"}')).rejects.toMatchObject({reason: 'unsupported-version'});
    await expect(decryptStructured(OWNER_JOURNAL, '{"awa_enc":')).rejects.toBeInstanceOf(StructuredDataError);
  });

  it('first use on two parallel writes creates exactly ONE key', async () => {
    const created: string[] = [];
    const setGeneric = Keychain.setGenericPassword as jest.Mock;
    setGeneric.mockClear();
    const [a, b] = await Promise.all([encryptStructured(OWNER_JOURNAL, 'a'), encryptStructured(DAUGHTER_JOURNAL, 'b')]);
    created.push(...setGeneric.mock.calls.filter(call => call[2]?.service === STRUCTURED_KEY_SERVICE).map(call => call[1] as string));
    expect(created).toHaveLength(1);
    expect(await decryptStructured(OWNER_JOURNAL, a)).toBe('a');
    expect(await decryptStructured(DAUGHTER_JOURNAL, b)).toBe('b');
  });
});

describe('secure storage adapter', () => {
  it('encrypts eligible keys at rest and returns the plaintext', async () => {
    await secureStorage.setItem(OWNER_JOURNAL, SAMPLE);
    const raw = await getRawItem(OWNER_JOURNAL);
    expect(isStructuredEnvelope(raw)).toBe(true);
    expect(raw).not.toContain('Crampes');
    expect(await secureStorage.getItem(OWNER_JOURNAL)).toBe(SAMPLE);
  });

  it('keeps reading legacy plaintext, and the next write encrypts it', async () => {
    await AsyncStorage.setItem(OWNER_JOURNAL, SAMPLE);
    expect(await secureStorage.getItem(OWNER_JOURNAL)).toBe(SAMPLE);
    await secureStorage.setItem(OWNER_JOURNAL, SAMPLE.replace('mild', 'severe'));
    expect(isStructuredEnvelope(await getRawItem(OWNER_JOURNAL))).toBe(true);
    expect(await secureStorage.getItem(OWNER_JOURNAL)).toContain('severe');
  });

  it('leaves settings and other keys untouched (plaintext)', async () => {
    await secureStorage.setItem('@awa/appearance/language-v1', 'fr');
    await secureStorage.setItem('@hawa/library/state/v1', '{"read":[]}');
    expect(await getRawItem('@awa/appearance/language-v1')).toBe('fr');
    expect(await getRawItem('@hawa/library/state/v1')).toBe('{"read":[]}');
  });

  it('returns null for a record that does not exist (and only then)', async () => {
    expect(await secureStorage.getItem(OWNER_JOURNAL)).toBeNull();
    expect(isAnyStructuredDataUnavailable()).toBe(false);
  });

  it('a record that cannot be decrypted is "unavailable", never "empty", and is never overwritten', async () => {
    await secureStorage.setItem(OWNER_JOURNAL, SAMPLE);
    const before = await getRawItem(OWNER_JOURNAL);
    await Keychain.setGenericPassword('x', '11'.repeat(32), {service: STRUCTURED_KEY_SERVICE}); // a different key
    clearAesKeyCache();
    clearStructuredCache();

    await expect(secureStorage.getItem(OWNER_JOURNAL)).rejects.toMatchObject({name: 'StructuredDataUnavailableError', reason: 'authentication-failed'});
    expect(getUnavailableStructuredKeys()).toEqual([{key: OWNER_JOURNAL, reason: 'authentication-failed'}]);

    await expect(secureStorage.setItem(OWNER_JOURNAL, '[]')).rejects.toMatchObject({name: 'StructuredDataUnavailableError'});
    expect(await getRawItem(OWNER_JOURNAL)).toBe(before); // untouched, bit for bit
  });

  it('a lost Keychain key is a recovery state: no replacement key is minted and nothing is overwritten', async () => {
    await secureStorage.setItem(OWNER_JOURNAL, SAMPLE);
    const before = await getRawItem(OWNER_JOURNAL);
    await wipeKeychainKey();
    clearStructuredCache();
    expect(await AsyncStorage.getItem(KEY_ESTABLISHED_MARKER)).not.toBeNull();

    await expect(secureStorage.getItem(OWNER_JOURNAL)).rejects.toMatchObject({reason: 'key-lost'});
    // even a brand-new record cannot be written until the user decides — a new key would orphan the old data silently
    await expect(secureStorage.setItem('@hawa/confirmed-period-history', '[]')).rejects.toMatchObject({reason: 'key-lost'});
    expect(await getRawItem(OWNER_JOURNAL)).toBe(before);
    expect(await getRawItem('@hawa/confirmed-period-history')).toBeNull();
    expect((Keychain.getGenericPassword as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    expect(await Keychain.getGenericPassword({service: STRUCTURED_KEY_SERVICE})).toBe(false); // still no key
  });

  it('a ciphertext copied to another profile is unavailable there', async () => {
    await secureStorage.setItem(OWNER_JOURNAL, SAMPLE);
    await AsyncStorage.setItem(DAUGHTER_JOURNAL, (await getRawItem(OWNER_JOURNAL)) as string);
    await expect(secureStorage.getItem(DAUGHTER_JOURNAL)).rejects.toMatchObject({reason: 'authentication-failed'});
    expect(await secureStorage.getItem(OWNER_JOURNAL)).toBe(SAMPLE);
  });

  it('serializes concurrent writes to one key: the last write wins and the record stays valid', async () => {
    await Promise.all(Array.from({length: 12}, (_, index) => secureStorage.setItem(OWNER_JOURNAL, JSON.stringify({n: index}))));
    expect(JSON.parse((await secureStorage.getItem(OWNER_JOURNAL)) as string)).toEqual({n: 11});
  });

  it('serves repeat reads from a bounded cache that never outlives a profile change', async () => {
    await secureStorage.setItem(OWNER_JOURNAL, SAMPLE);
    clearStructuredCache();
    await secureStorage.getItem(OWNER_JOURNAL);
    expect(__cacheStatsForTests().entries).toBe(1);
    for (let index = 0; index < 40; index += 1) {
      await secureStorage.setItem(`@hawa/daily-journal/v1:profile:p${index}`, SAMPLE);
    }
    expect(__cacheStatsForTests().entries).toBeLessThanOrEqual(16);
    await resetActiveProfileForTests(); // announces a profile change
    expect(__cacheStatsForTests().entries).toBe(0);
    expect(OWNER_PROFILE_ID).toBe('owner');
  });

  it('passes everything through when the switch is off', async () => {
    setStructuredEncryptionEnabled(false);
    await secureStorage.setItem(OWNER_JOURNAL, SAMPLE);
    expect(await getRawItem(OWNER_JOURNAL)).toBe(SAMPLE);
  });
});

describe('a failed read blocks writes until a read succeeds again (stores that default to "empty" cannot erase data)', () => {
  it('refuses to write after a transient read failure even once the cause has gone, and accepts writes after a good read', async () => {
    await secureStorage.setItem(OWNER_JOURNAL, SAMPLE);
    const stored = (await getRawItem(OWNER_JOURNAL)) as string;
    const goodKey = (await Keychain.getGenericPassword({service: STRUCTURED_KEY_SERVICE})) as {password: string};

    // the Keychain is momentarily unavailable: the read fails, the store falls back to "no data"
    const getGeneric = Keychain.getGenericPassword as jest.Mock;
    clearAesKeyCache();
    clearStructuredCache();
    getGeneric.mockRejectedValueOnce(new Error('keystore locked'));
    await expect(secureStorage.getItem(OWNER_JOURNAL)).rejects.toMatchObject({name: 'StructuredDataUnavailableError'});

    // the Keychain is back — but the store still holds its empty fallback, so a write must NOT go through
    expect(goodKey.password).toHaveLength(64);
    await expect(secureStorage.setItem(OWNER_JOURNAL, '[]')).rejects.toMatchObject({name: 'StructuredDataUnavailableError'});
    expect(await getRawItem(OWNER_JOURNAL)).toBe(stored);

    // a successful read lifts the block
    expect(await secureStorage.getItem(OWNER_JOURNAL)).toBe(SAMPLE);
    await secureStorage.setItem(OWNER_JOURNAL, JSON.stringify([{id: 'next'}]));
    expect(await secureStorage.getItem(OWNER_JOURNAL)).toBe(JSON.stringify([{id: 'next'}]));
  });
});

describe('read-your-writes: a read never overtakes an earlier write to the same record', () => {
  it('a read issued while an encrypted write is still in flight returns the NEW value', async () => {
    await secureStorage.setItem(OWNER_JOURNAL, '[{"id":"old"}]');
    // slow down the underlying write so the write is certainly still in flight when the read is issued
    const original = (AsyncStorage.setItem as jest.Mock).getMockImplementation() as (key: string, value: string) => Promise<void>;
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      await new Promise<void>(resolve => setTimeout(resolve, 20));
      return original(key, value);
    });
    try {
      const writing = secureStorage.setItem(OWNER_JOURNAL, '[{"id":"new"}]'); // not awaited
      const reading = secureStorage.getItem(OWNER_JOURNAL);
      await writing;
      expect(await reading).toBe('[{"id":"new"}]');
    } finally {
      (AsyncStorage.setItem as jest.Mock).mockImplementation(original);
    }
  });

  it('many interleaved writes and reads always observe the latest completed write', async () => {
    const seen: string[] = [];
    const operations: Promise<unknown>[] = [];
    for (let index = 0; index < 15; index += 1) {
      operations.push(secureStorage.setItem(OWNER_JOURNAL, JSON.stringify({n: index})));
      operations.push(secureStorage.getItem(OWNER_JOURNAL).then(value => {seen.push(value as string);}));
    }
    await Promise.all(operations);
    expect(seen.map(value => (JSON.parse(value) as {n: number}).n)).toEqual(Array.from({length: 15}, (_, index) => index));
  });
});
