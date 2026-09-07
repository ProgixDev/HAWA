import {randomBytes} from '@noble/ciphers/utils.js';
import {getOrCreateAesKey} from '../secureAesKeyStore';
import {decryptFieldValue, encryptFieldValue, isEncryptedFieldPayload} from '../atRestFieldEncryption';

// secureAesKeyStore.ts reads/writes the OS Keychain via react-native-keychain,
// unavailable in Jest — mocked with a fixed real AES-256 key so the actual
// @noble/ciphers encrypt/decrypt round-trip (pure JS) still runs for real,
// same approach as privateNotesEncryption.test.ts.
jest.mock('../secureAesKeyStore', () => ({getOrCreateAesKey: jest.fn()}));

const mockGetOrCreateAesKey = getOrCreateAesKey as jest.Mock;

beforeEach(() => {
  mockGetOrCreateAesKey.mockResolvedValue(randomBytes(32));
});

describe('atRestFieldEncryption — generic AES-256-GCM field envelope', () => {
  it('round-trips a string value exactly', async () => {
    const payload = await encryptFieldValue('com.hawa.test.service', 'sensitive personal note');
    expect(payload.version).toBe(1);
    expect(typeof payload.iv).toBe('string');
    expect(typeof payload.ciphertext).toBe('string');

    const decrypted = await decryptFieldValue<string>('com.hawa.test.service', payload);
    expect(decrypted).toBe('sensitive personal note');
  });

  it('never stores the plaintext value anywhere in the returned payload', async () => {
    const payload = await encryptFieldValue('com.hawa.test.service', 'PLAINTEXT_MARKER_9F3');
    expect(JSON.stringify(payload)).not.toContain('PLAINTEXT_MARKER_9F3');
  });

  it('uses a fresh nonce every call, so the same plaintext never produces identical ciphertext twice', async () => {
    const a = await encryptFieldValue('com.hawa.test.service', 'same text');
    const b = await encryptFieldValue('com.hawa.test.service', 'same text');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('rejects an unsupported version instead of attempting to decrypt it', async () => {
    await expect(
      decryptFieldValue('com.hawa.test.service', {version: 2 as 1, iv: 'aa', ciphertext: 'bb'}),
    ).rejects.toThrow(/Unsupported/);
  });

  it('throws (never crashes silently, never returns garbage) on a corrupted payload', async () => {
    await expect(
      decryptFieldValue('com.hawa.test.service', {version: 1, iv: 'not-valid-hex-zz', ciphertext: 'also-not-valid'}),
    ).rejects.toThrow();
  });

  describe('isEncryptedFieldPayload', () => {
    it('recognizes a real encrypted envelope', async () => {
      const payload = await encryptFieldValue('com.hawa.test.service', 'x');
      expect(isEncryptedFieldPayload(payload)).toBe(true);
    });

    it('rejects a legacy plaintext string', () => {
      expect(isEncryptedFieldPayload('plain legacy note text')).toBe(false);
    });

    it('rejects undefined/null/other shapes', () => {
      expect(isEncryptedFieldPayload(undefined)).toBe(false);
      expect(isEncryptedFieldPayload(null)).toBe(false);
      expect(isEncryptedFieldPayload({foo: 'bar'})).toBe(false);
      expect(isEncryptedFieldPayload(42)).toBe(false);
    });
  });
});
