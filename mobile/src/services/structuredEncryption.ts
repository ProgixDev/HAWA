import {gcm} from '@noble/ciphers/aes.js';
import {bytesToHex, hexToBytes, randomBytes, utf8ToBytes} from '@noble/ciphers/utils.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {decodeUtf8} from '../utils/utf8';
import {getOrCreateAesKey, peekAesKey} from './secureAesKeyStore';

// AES-256-GCM encryption of STRUCTURED health data (period dates, cycle settings, symptoms, mood, pregnancy,
// Qadaa, …) — the data that used to sit in AsyncStorage as readable JSON. Same cipher and key-storage mechanism
// as the notes/intimacy/photo encryption (@noble/ciphers + a random 256-bit key in the Android Keystore through
// react-native-keychain); a SEPARATE Keychain key domain, so rotating or wiping one domain never touches another.
//
// Record format (the string stored in AsyncStorage in place of the plaintext JSON):
//   {"awa_enc":2,"alg":"AES-256-GCM","kid":1,"n":"<24 hex = 12-byte nonce>","c":"<hex ciphertext + 16-byte tag>"}
//
//   - a FRESH random 96-bit nonce for every encryption (a nonce is never reused with the same key);
//   - the storage key is bound in as ASSOCIATED DATA ("awa-structured:2:<storageKey>"): the storage key includes the
//     `:profile:<id>` suffix, so a ciphertext copied to another record or another profile fails authentication and is
//     never silently accepted as that record;
//   - `kid` names the key generation (1 today), so a future rotation can tell old and new records apart.
//
// The key is NOT derived from the app PIN and never leaves the Keychain; nothing here logs plaintext, keys or values.

export const STRUCTURED_KEY_SERVICE = 'com.hawa.private.structured-health-data.encryption-key';
/** Set (in plain AsyncStorage — it holds no secret) the first time a key is created. A missing Keychain key while this
 * marker exists is a key LOSS: encryption refuses to mint a replacement behind the user's back. */
export const KEY_ESTABLISHED_MARKER = '@awa/structured-migration/key-established';

const ENVELOPE_VERSION = 2 as const;
const ALGORITHM = 'AES-256-GCM' as const;
const KEY_ID = 1 as const;
const ENVELOPE_PREFIX = '{"awa_enc":';

export type StructuredFailureReason =
  | 'key-missing' // no key in the Keychain, and no marker saying one ever existed on this device
  | 'key-lost' // the marker says a key existed, but the Keychain no longer has it
  | 'authentication-failed' // wrong key, tampered or copied-from-elsewhere ciphertext
  | 'malformed' // not a parseable envelope
  | 'unsupported-version'
  | 'read-failed'; // the storage read itself failed (I/O error): the record may well be fine, it just was not read

export class StructuredDataError extends Error {
  readonly reason: StructuredFailureReason;
  constructor(reason: StructuredFailureReason) {
    super(`structured data unavailable: ${reason}`); // never includes the record, the key or the storage key
    this.name = 'StructuredDataError';
    this.reason = reason;
  }
}

export type StructuredEnvelope = {awa_enc: number; alg: string; kid: number; n: string; c: string};

/** Cheap check used on every read: is this stored string one of our envelopes (as opposed to legacy plaintext)? */
export const isStructuredEnvelope = (raw: string | null | undefined): raw is string =>
  typeof raw === 'string' && raw.startsWith(ENVELOPE_PREFIX);

const parseEnvelope = (raw: string): StructuredEnvelope => {
  try {
    const parsed = JSON.parse(raw) as Partial<StructuredEnvelope>;
    if (parsed && typeof parsed.awa_enc === 'number' && typeof parsed.n === 'string' && typeof parsed.c === 'string') {
      return parsed as StructuredEnvelope;
    }
  } catch {
    // falls through
  }
  throw new StructuredDataError('malformed');
};

const associatedData = (storageKey: string): Uint8Array => utf8ToBytes(`awa-structured:${ENVELOPE_VERSION}:${storageKey}`);

// Single-flight key creation: two first writes racing must not each mint a different key (the loser's data would
// be encrypted under a key that no longer exists).
let keyCreation: Promise<Uint8Array> | null = null;

async function keyForEncryption(): Promise<Uint8Array> {
  const existing = await peekAesKey(STRUCTURED_KEY_SERVICE);
  if (existing) {return existing;}
  if (!keyCreation) {
    keyCreation = (async () => {
      const again = await peekAesKey(STRUCTURED_KEY_SERVICE);
      if (again) {return again;}
      if ((await AsyncStorage.getItem(KEY_ESTABLISHED_MARKER)) !== null) {
        throw new StructuredDataError('key-lost');
      }
      const created = await getOrCreateAesKey(STRUCTURED_KEY_SERVICE, 'structured-health-data-key');
      await AsyncStorage.setItem(KEY_ESTABLISHED_MARKER, '1');
      return created;
    })().finally(() => {
      keyCreation = null;
    });
  }
  return keyCreation;
}

/** Encrypts `plaintext` for the record stored under `storageKey`. Throws StructuredDataError('key-lost') rather than
 * creating a replacement key when the previous one has disappeared. */
export async function encryptStructured(storageKey: string, plaintext: string): Promise<string> {
  const key = await keyForEncryption();
  const nonce = randomBytes(12);
  const ciphertext = gcm(key, nonce, associatedData(storageKey)).encrypt(utf8ToBytes(plaintext));
  const envelope: StructuredEnvelope = {awa_enc: ENVELOPE_VERSION, alg: ALGORITHM, kid: KEY_ID, n: bytesToHex(nonce), c: bytesToHex(ciphertext)};
  return JSON.stringify(envelope);
}

/** Decrypts an envelope read from `storageKey`. Never returns a fallback value: every failure is a typed error. */
export async function decryptStructured(storageKey: string, rawEnvelope: string): Promise<string> {
  const envelope = parseEnvelope(rawEnvelope);
  if (envelope.awa_enc !== ENVELOPE_VERSION || envelope.alg !== ALGORITHM || envelope.kid !== KEY_ID) {
    throw new StructuredDataError('unsupported-version');
  }
  const key = await peekAesKey(STRUCTURED_KEY_SERVICE);
  if (!key) {
    throw new StructuredDataError((await AsyncStorage.getItem(KEY_ESTABLISHED_MARKER)) !== null ? 'key-lost' : 'key-missing');
  }
  let nonce: Uint8Array;
  let ciphertext: Uint8Array;
  try {
    nonce = hexToBytes(envelope.n);
    ciphertext = hexToBytes(envelope.c);
  } catch {
    throw new StructuredDataError('malformed');
  }
  if (nonce.length !== 12) {throw new StructuredDataError('malformed');}
  try {
    return decodeUtf8(gcm(key, nonce, associatedData(storageKey)).decrypt(ciphertext));
  } catch {
    throw new StructuredDataError('authentication-failed');
  }
}

/** Test/maintenance helper: forget a half-finished single-flight (never needed in normal operation). */
export const __resetStructuredEncryptionForTests = (): void => {
  keyCreation = null;
};
