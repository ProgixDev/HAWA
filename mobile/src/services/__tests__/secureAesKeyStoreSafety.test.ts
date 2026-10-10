import * as Keychain from 'react-native-keychain';

import {clearAesKeyCache, getOrCreateAesKey, peekAesKey, requireExistingAesKey} from '../secureAesKeyStore';
import {decryptFieldValue, encryptFieldValue} from '../atRestFieldEncryption';

// Phase 2 — F16: the field-level key store must never lose a key.
//
// Two ways it used to: (1) the first use of a service by several encryptions at once let each caller mint and store
// its OWN key, so only the last survived and the values encrypted under the others were undecryptable for good;
// (2) DECRYPTING went through "get or create", so a lookup that merely missed was answered by storing a random
// replacement over the real key.
//
// No key, record or format is touched by the fix; the Keychain service names and the stored key encoding are exactly
// what they were. Fixtures only — the keychain here is the in-memory mock from jest.setup.js.

const getGenericPassword = Keychain.getGenericPassword as unknown as jest.Mock;
const setGenericPassword = Keychain.setGenericPassword as unknown as jest.Mock;

const SERVICE = 'com.hawa.private.test-domain.encryption-key';
const KEY_HEX = 'ab'.repeat(32);

beforeEach(async () => {
  clearAesKeyCache();
  await Keychain.resetGenericPassword({service: SERVICE});
  setGenericPassword.mockClear();
  getGenericPassword.mockClear();
});

describe('creating a key', () => {
  it('concurrent first uses share ONE key and store it exactly once', async () => {
    const keys = await Promise.all(Array.from({length: 12}, () => getOrCreateAesKey(SERVICE, 'test-key')));

    expect(setGenericPassword).toHaveBeenCalledTimes(1);
    const first = Array.from(keys[0]);
    keys.forEach(key => expect(Array.from(key)).toEqual(first));
  });

  it('values encrypted at the same moment on first use ALL stay decryptable (the data-loss case)', async () => {
    const values = Array.from({length: 6}, (_, index) => ({note: `note ${index}`}));

    const payloads = await Promise.all(values.map(value => encryptFieldValue(SERVICE, value)));
    clearAesKeyCache(); // a restart: the key now has to come back from the Keychain

    for (let index = 0; index < payloads.length; index += 1) {
      await expect(decryptFieldValue(SERVICE, payloads[index])).resolves.toEqual(values[index]);
    }
    expect(setGenericPassword).toHaveBeenCalledTimes(1);
  });

  it('an EXISTING key is read and never replaced', async () => {
    await Keychain.setGenericPassword('x', KEY_HEX, {service: SERVICE});
    setGenericPassword.mockClear();

    const key = await getOrCreateAesKey(SERVICE, 'test-key');

    expect(Array.from(key)).toEqual(Array.from(Buffer.from(KEY_HEX, 'hex')));
    expect(setGenericPassword).not.toHaveBeenCalled();
  });

  it('one MISSED read is not taken for "no key": it reads again before minting (and then keeps the real key)', async () => {
    await Keychain.setGenericPassword('x', KEY_HEX, {service: SERVICE});
    setGenericPassword.mockClear();
    getGenericPassword.mockImplementationOnce(async () => false); // a transient miss

    const key = await getOrCreateAesKey(SERVICE, 'test-key');

    expect(Array.from(key)).toEqual(Array.from(Buffer.from(KEY_HEX, 'hex')));
    expect(setGenericPassword).not.toHaveBeenCalled();
  });

  it('a genuinely missing key is still created (first ever use)', async () => {
    const key = await getOrCreateAesKey(SERVICE, 'test-key');

    expect(key).toHaveLength(32);
    expect(setGenericPassword).toHaveBeenCalledTimes(1);
    expect(setGenericPassword.mock.calls[0][2]).toMatchObject({service: SERVICE});
  });

  it('a failed creation does not poison later attempts', async () => {
    setGenericPassword.mockImplementationOnce(async () => {
      throw new Error('keychain locked');
    });

    await expect(getOrCreateAesKey(SERVICE, 'test-key')).rejects.toThrow('keychain locked');
    await expect(getOrCreateAesKey(SERVICE, 'test-key')).resolves.toHaveLength(32);
  });
});

describe('decrypting', () => {
  it('NEVER creates a key: with none present it fails and stores nothing', async () => {
    const payload = {version: 1 as const, iv: '00'.repeat(12), ciphertext: '11'.repeat(32)};

    await expect(decryptFieldValue(SERVICE, payload)).rejects.toThrow('encryption key is not available');

    expect(setGenericPassword).not.toHaveBeenCalled();
    await expect(peekAesKey(SERVICE)).resolves.toBeNull();
  });

  it('a transient miss on the first read still finds the real key (and replaces nothing)', async () => {
    await Keychain.setGenericPassword('x', KEY_HEX, {service: SERVICE});
    setGenericPassword.mockClear();
    getGenericPassword.mockImplementationOnce(async () => false);

    await expect(requireExistingAesKey(SERVICE)).resolves.toHaveLength(32);

    expect(setGenericPassword).not.toHaveBeenCalled();
  });

  it('after a key LOSS, decrypting cannot "fix" things by minting: the same record stays unreadable, nothing is stored', async () => {
    const payload = await encryptFieldValue(SERVICE, {note: 'secret'});
    await Keychain.resetGenericPassword({service: SERVICE}); // the Keychain lost the key
    clearAesKeyCache();
    setGenericPassword.mockClear();

    await expect(decryptFieldValue(SERVICE, payload)).rejects.toThrow();
    await expect(decryptFieldValue(SERVICE, payload)).rejects.toThrow();

    expect(setGenericPassword).not.toHaveBeenCalled();
  });
});
