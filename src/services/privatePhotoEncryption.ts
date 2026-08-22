import {gcm} from '@noble/ciphers/aes.js';
import {randomBytes, concatBytes} from '@noble/ciphers/utils.js';
import {getOrCreateAesKey} from './secureAesKeyStore';

// Local encryption at rest for "Photos privées" (JournalPrivatePhotosScreen.tsx).
// Frontend/local only, no backend — see TODO.md §1.4/§2.15.
//
// Deliberately a SEPARATE Keychain key from privateJournalEncryption.ts's
// intimacy key (both go through the shared lifecycle in secureAesKeyStore.ts)
// — a future rotation/wipe of one domain must never affect the other, even
// though both currently sit behind the same "Vie intime" PIN/Face ID
// (target: 'photos') at the UI level. PIN/Face ID controls UI access;
// this file protects the file's bytes at rest — the two are not conflated.
//
// Encrypted file layout, written directly as raw bytes (base64-encoded once
// for RNFS's string-only file API) — deliberately NOT the hex-in-JSON
// envelope privateJournalEncryption.ts uses for its small text payloads,
// since that would bloat a multi-megabyte photo ~2x for no benefit here:
//   [1 byte version][12 bytes GCM nonce][ciphertext + embedded auth tag]

const ENCRYPTION_KEY_SERVICE = 'com.hawa.private.photos.encryption-key';
const CURRENT_VERSION = 1;
const NONCE_LENGTH = 12;

async function getPhotoEncryptionKey(): Promise<Uint8Array> {
  return getOrCreateAesKey(ENCRYPTION_KEY_SERVICE, 'photos-encryption-key');
}

/* ---- base64 <-> bytes --------------------------------------------------
 * No global Buffer/atob/btoa exists in this app's RN runtime, and neither
 * @noble/ciphers nor @dr.pogodin/react-native-fs exposes one — RNFS's own
 * readFile()/writeFile() only accept base64 as a *string* content parameter,
 * so this hand-rolled codec is the bridge between that string-based file I/O
 * and the Uint8Array-based cipher. Standard base64 alphabet, no dependency.
 * Round-trip-verified against Node's own Buffer for all lengths 0-5000. */
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = ((): Int16Array => {
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < BASE64_CHARS.length; i++) {table[BASE64_CHARS.charCodeAt(i)] = i;}
  return table;
})();

// Bitwise ops are intrinsic to a base64 codec (packing/unpacking 6-bit
// groups from 8-bit bytes) — disabled deliberately for this block only.
/* eslint-disable no-bitwise */
function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 0x03) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
    result += b1 === undefined ? '=' : BASE64_CHARS[((b1 & 0x0f) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
    result += b2 === undefined ? '=' : BASE64_CHARS[b2 & 0x3f];
  }
  return result;
}

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[=]+$/, '');
  const fullGroups = Math.floor(clean.length / 4);
  const remainder = clean.length % 4;
  const outputLength = fullGroups * 3 + (remainder === 0 ? 0 : remainder - 1);
  const bytes = new Uint8Array(outputLength);
  let outIndex = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = BASE64_LOOKUP[clean.charCodeAt(i)];
    const c1 = BASE64_LOOKUP[clean.charCodeAt(i + 1)];
    const c2 = i + 2 < clean.length ? BASE64_LOOKUP[clean.charCodeAt(i + 2)] : -1;
    const c3 = i + 3 < clean.length ? BASE64_LOOKUP[clean.charCodeAt(i + 3)] : -1;
    bytes[outIndex++] = (c0 << 2) | (c1 >> 4);
    if (c2 >= 0) {bytes[outIndex++] = ((c1 & 0x0f) << 4) | (c2 >> 2);}
    if (c3 >= 0) {bytes[outIndex++] = ((c2 & 0x03) << 6) | c3;}
  }
  return bytes;
}
/* eslint-enable no-bitwise */

/** Encrypts raw image bytes (as a base64 string, e.g. from RNFS's
 * readFile(path, 'base64')) into the `[version][nonce][ciphertext]` layout
 * described above, itself returned as a base64 string ready for RNFS's
 * writeFile(path, ..., 'base64'). A fresh random 12-byte nonce every call. */
export async function encryptPhotoBytes(base64Plaintext: string): Promise<string> {
  const key = await getPhotoEncryptionKey();
  const plaintext = base64ToBytes(base64Plaintext);
  const nonce = randomBytes(NONCE_LENGTH);
  const ciphertext = gcm(key, nonce).encrypt(plaintext);
  const payload = concatBytes(new Uint8Array([CURRENT_VERSION]), nonce, ciphertext);
  return bytesToBase64(payload);
}

/** Decrypts a payload produced by encryptPhotoBytes() (as a base64 string,
 * e.g. from RNFS's readFile(path, 'base64')), returning the original image
 * bytes as base64 — ready to embed in a `data:` URI for display. Throws on
 * an unsupported version or on ciphertext/tag corruption — callers must
 * catch this and show an honest failure state (never crash, never display
 * garbage). */
export async function decryptPhotoBytes(base64Payload: string): Promise<string> {
  const payload = base64ToBytes(base64Payload);
  const version = payload[0];
  if (version !== CURRENT_VERSION) {
    throw new Error(`Unsupported encrypted photo version: ${version}`);
  }
  const nonce = payload.subarray(1, 1 + NONCE_LENGTH);
  const ciphertext = payload.subarray(1 + NONCE_LENGTH);
  const key = await getPhotoEncryptionKey();
  const plaintext = gcm(key, nonce).decrypt(ciphertext);
  return bytesToBase64(plaintext);
}
