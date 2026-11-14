import * as Keychain from 'react-native-keychain';

import {decryptPhotoBytes, encryptPhotoBytes} from '../privatePhotoEncryption';
import {clearAesKeyCache} from '../secureAesKeyStore';

// PHASE 3 — encryption at rest of the "Photos privées" files (privatePhotoEncryption.ts): AES-256-GCM, layout [version][12-byte nonce][ciphertext+tag].
// Real cipher, real key store (the global in-memory Keychain of jest.setup.js); no bytes are mocked.

const PHOTO_KEY_SERVICE = 'com.hawa.private.photos.encryption-key';
const INTIMACY_KEY_SERVICE = 'com.hawa.private.intimacy.encryption-key';

const toBase64 = (bytes: Uint8Array | number[]): string => Buffer.from(bytes).toString('base64');
const fromBase64 = (value: string): Buffer => Buffer.from(value, 'base64');
const sampleBytes = (length: number): number[] => Array.from({length}, (_unused, index) => (index * 37 + 11) % 256);

// A recognisable fake photo: JPEG magic number followed by a text marker that must never appear in the stored file.
const MARKER = 'SECRET-PRIVATE-PHOTO-MARKER-0123456789';
const markedPhoto = (): number[] => [0xff, 0xd8, 0xff, 0xe0, ...Buffer.from(MARKER, 'utf8'), ...sampleBytes(300)];

const flipByte = (payload: Buffer, index: number): string => {
  const copy = Buffer.from(payload);
  // eslint-disable-next-line no-bitwise
  copy[index] ^= 0x01;
  return copy.toString('base64');
};

beforeEach(async () => {
  clearAesKeyCache();
  await Keychain.resetGenericPassword({service: PHOTO_KEY_SERVICE});
  await Keychain.resetGenericPassword({service: INTIMACY_KEY_SERVICE});
});

describe('round trip', () => {
  it.each([0, 1, 2, 3, 4, 5, 16, 255, 1024, 5000])('restores exactly %i bytes', async length => {
    const plain = toBase64(sampleBytes(length));
    const decrypted = await decryptPhotoBytes(await encryptPhotoBytes(plain));
    expect(fromBase64(decrypted).equals(fromBase64(plain))).toBe(true);
    expect(decrypted).toBe(plain);
  });

  it('restores every possible byte value', async () => {
    const all = Array.from({length: 256}, (_unused, index) => index);
    const decrypted = await decryptPhotoBytes(await encryptPhotoBytes(toBase64(all)));
    expect(Array.from(fromBase64(decrypted))).toEqual(all);
  });
});

describe('what is written to disk', () => {
  it('follows the layout [version 1][12-byte nonce][ciphertext + 16-byte tag]', async () => {
    const plain = sampleBytes(100);
    const payload = fromBase64(await encryptPhotoBytes(toBase64(plain)));
    expect(payload[0]).toBe(1);
    expect(payload.length).toBe(1 + 12 + plain.length + 16);
  });

  it('never contains the photo bytes: neither the JPEG header nor a readable marker', async () => {
    const plain = markedPhoto();
    const stored = await encryptPhotoBytes(toBase64(plain));
    const payload = fromBase64(stored);
    expect(payload.includes(Buffer.from(MARKER, 'utf8'))).toBe(false);
    expect(payload.includes(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(false);
    expect(stored.includes(toBase64(plain).slice(0, 24))).toBe(false);
    expect(Buffer.from(stored, 'base64').toString('latin1')).not.toContain('SECRET');
  });

  it('uses a fresh nonce every time: the same photo never encrypts to the same file', async () => {
    const plain = toBase64(markedPhoto());
    const first = fromBase64(await encryptPhotoBytes(plain));
    const second = fromBase64(await encryptPhotoBytes(plain));
    expect(first.subarray(1, 13).equals(second.subarray(1, 13))).toBe(false);
    expect(first.equals(second)).toBe(false);
    expect(await decryptPhotoBytes(first.toString('base64'))).toBe(plain);
    expect(await decryptPhotoBytes(second.toString('base64'))).toBe(plain);
  });

  it('keeps its own key, separate from the intimacy journal key', async () => {
    await encryptPhotoBytes(toBase64(sampleBytes(10)));
    expect(await Keychain.getGenericPassword({service: PHOTO_KEY_SERVICE})).toBeTruthy();
    expect(await Keychain.getGenericPassword({service: INTIMACY_KEY_SERVICE})).toBe(false);
  });

  it('reuses one key for every photo (a second photo does not mint a new key)', async () => {
    await encryptPhotoBytes(toBase64(sampleBytes(10)));
    const first = (await Keychain.getGenericPassword({service: PHOTO_KEY_SERVICE})) as {password: string};
    await encryptPhotoBytes(toBase64(sampleBytes(20)));
    const second = (await Keychain.getGenericPassword({service: PHOTO_KEY_SERVICE})) as {password: string};
    expect(second.password).toBe(first.password);
    expect(first.password).toMatch(/^[0-9a-f]{64}$/); // 256-bit key
  });
});

describe('unreadable or tampered files are refused, never shown', () => {
  let payload: Buffer;
  beforeEach(async () => {
    payload = fromBase64(await encryptPhotoBytes(toBase64(markedPhoto())));
  });

  it.each([
    ['the nonce', 5],
    ['the first ciphertext byte', 13],
    ['a ciphertext byte in the middle', 100],
    ['the last byte (the authentication tag)', -1],
  ])('a single flipped bit in %s fails authentication', async (_label, offset) => {
    const index = offset < 0 ? payload.length + offset : offset;
    await expect(decryptPhotoBytes(flipByte(payload, index))).rejects.toThrow();
  });

  it('an unsupported version is refused with a message that carries no data', async () => {
    const corrupted = Buffer.from(payload);
    corrupted[0] = 2;
    const error = await decryptPhotoBytes(corrupted.toString('base64')).then(
      () => null,
      (caught: Error) => caught,
    );
    expect(error?.message).toBe('Unsupported encrypted photo version: 2');
    expect(error?.message).not.toContain(MARKER);
  });

  it.each([
    ['empty', ''],
    ['only the version byte', Buffer.from([1]).toString('base64')],
    ['version + nonce, no ciphertext', Buffer.concat([Buffer.from([1]), Buffer.alloc(12, 7)]).toString('base64')],
  ])('a %s file is refused', async (_label, bad) => {
    await expect(decryptPhotoBytes(bad)).rejects.toThrow();
  });

  it('a truncated file is refused', async () => {
    await expect(decryptPhotoBytes(payload.subarray(0, payload.length - 5).toString('base64'))).rejects.toThrow();
  });

  it('a file with extra bytes appended is refused', async () => {
    await expect(decryptPhotoBytes(Buffer.concat([payload, Buffer.from([0])]).toString('base64'))).rejects.toThrow();
  });

  it('the failure never exposes the photo content, the stored text or a key', async () => {
    const tampered = flipByte(payload, 100);
    const error = await decryptPhotoBytes(tampered).then(
      () => null,
      (caught: Error) => caught,
    );
    const keyHex = ((await Keychain.getGenericPassword({service: PHOTO_KEY_SERVICE})) as {password: string}).password;
    const text = `${error?.message ?? ''} ${error?.stack ?? ''}`;
    expect(text).not.toContain(MARKER);
    expect(text).not.toContain(tampered.slice(0, 40));
    expect(text).not.toContain(keyHex);
  });

  it('a file encrypted under another key (the key was lost and recreated) is refused', async () => {
    clearAesKeyCache();
    await Keychain.resetGenericPassword({service: PHOTO_KEY_SERVICE});
    await encryptPhotoBytes(toBase64(sampleBytes(10))); // mints a different key
    await expect(decryptPhotoBytes(payload.toString('base64'))).rejects.toThrow();
  });
});

describe('a missing key', () => {
  it('decrypting without a key fails and never creates one (a new key would erase every old photo for good)', async () => {
    const payload = await encryptPhotoBytes(toBase64(sampleBytes(10)));
    clearAesKeyCache();
    await Keychain.resetGenericPassword({service: PHOTO_KEY_SERVICE});
    await expect(decryptPhotoBytes(payload)).rejects.toThrow('encryption key is not available');
    expect(await Keychain.getGenericPassword({service: PHOTO_KEY_SERVICE})).toBe(false);
  });

  it('the key survives a restart of the JS process: the same key is read back from the Keychain', async () => {
    const payload = await encryptPhotoBytes(toBase64(markedPhoto()));
    clearAesKeyCache(); // a cold start has no in-memory key
    expect(fromBase64(await decryptPhotoBytes(payload)).includes(Buffer.from(MARKER, 'utf8'))).toBe(true);
  });
});
