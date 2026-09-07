import {gcm} from '@noble/ciphers/aes.js';
import {bytesToHex, hexToBytes, randomBytes, utf8ToBytes, bytesToUtf8} from '@noble/ciphers/utils.js';
import {getOrCreateAesKey} from './secureAesKeyStore';

// Generalizes the exact AES-256-GCM cipher plumbing already proven by
// privateNotesEncryption.ts / privateJournalEncryption.ts / privatePhotoEncryption.ts
// (see secureAesKeyStore.ts) so each additional objective store (miscarriage/
// pregnancy/postpartum/general-health/personal-information journals) doesn't
// need to hand-roll its own copy of this plumbing. The per-domain isolation
// those files' own comments describe ("a future rotation/wipe of one domain
// must never affect the other") is preserved because every caller still
// supplies its OWN distinct Keychain `service` id — only this lifecycle code
// is shared, the underlying keys never are. Not a second encryption system:
// same cipher, same key-storage mechanism, same envelope shape.

export type EncryptedFieldPayload = {version: 1; iv: string; ciphertext: string};

const CURRENT_VERSION = 1 as const;

/** Encrypts an arbitrary JSON-serializable value with AES-256-GCM under the
 * key for `service` — a fresh random 12-byte nonce every call (never
 * reused), authentication tag embedded in the ciphertext by the cipher
 * itself. */
export async function encryptFieldValue(service: string, value: unknown): Promise<EncryptedFieldPayload> {
  const key = await getOrCreateAesKey(service, `${service}-key`);
  const nonce = randomBytes(12);
  const plaintext = utf8ToBytes(JSON.stringify(value));
  const ciphertext = gcm(key, nonce).encrypt(plaintext);
  return {version: CURRENT_VERSION, iv: bytesToHex(nonce), ciphertext: bytesToHex(ciphertext)};
}

/** Decrypts a payload produced by encryptFieldValue() for the same
 * `service`. Throws on an unsupported version or on ciphertext/tag
 * corruption — callers must catch this and fall back to an honest
 * "unavailable" state (never crash, never fabricate, never auto-delete the
 * corrupted payload), matching resolveNoteSection()'s established
 * corrupted-payload handling in privateNotesEncryption.ts. */
export async function decryptFieldValue<T>(service: string, payload: EncryptedFieldPayload): Promise<T> {
  if (payload.version !== CURRENT_VERSION) {
    throw new Error(`Unsupported encrypted field payload version: ${payload.version}`);
  }
  const key = await getOrCreateAesKey(service, `${service}-key`);
  const nonce = hexToBytes(payload.iv);
  const ciphertext = hexToBytes(payload.ciphertext);
  const plaintext = gcm(key, nonce).decrypt(ciphertext);
  return JSON.parse(bytesToUtf8(plaintext)) as T;
}

/** Distinguishes an already-encrypted envelope (produced by
 * encryptFieldValue) from a legacy plaintext value read from a JSON blob
 * persisted before a given store adopted encryption-at-rest — the same
 * plaintext/encrypted-coexistence check every existing encryption domain in
 * this project relies on for its migration. */
export function isEncryptedFieldPayload(value: unknown): value is EncryptedFieldPayload {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<EncryptedFieldPayload>;
  return candidate.version === CURRENT_VERSION && typeof candidate.iv === 'string' && typeof candidate.ciphertext === 'string';
}
