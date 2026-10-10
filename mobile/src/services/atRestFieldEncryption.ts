import {gcm} from '@noble/ciphers/aes.js';
import {bytesToHex, hexToBytes, randomBytes, utf8ToBytes} from '@noble/ciphers/utils.js';
import {decodeUtf8} from '../utils/utf8';
import {getOrCreateAesKey, requireExistingAesKey} from './secureAesKeyStore';

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
  // Decrypting never creates a key: data encrypted under it exists, so the key must too. Creating one here (as this
  // used to) would, on a lookup that merely missed, store a random replacement over the real key.
  const key = await requireExistingAesKey(service);
  const nonce = hexToBytes(payload.iv);
  const ciphertext = hexToBytes(payload.ciphertext);
  const plaintext = gcm(key, nonce).decrypt(ciphertext);
  return JSON.parse(decodeUtf8(plaintext)) as T;
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

// ---- A field that cannot be opened right now is carried, never blanked --------------------------------------------
//
// A store decrypts a record's sealed fields and hands the UI / the schedulers plain values. When one cannot be
// decrypted at this moment (the Keychain answered an error, the key is not available yet, the payload is corrupted)
// the store answers with a blank. But saving ANY record of the same list writes the whole list back, so that blank used
// to REPLACE the sealed payload on disk: the text was lost for good even when the key came back a minute later.
//
// The sealed payload therefore travels with the record, untouched, under a reserved key, and is written back exactly
// as it was while the field is still blank. A real value (one she typed) always wins and replaces it. Nothing here
// decrypts, re-encrypts, migrates or re-keys anything; the persisted payload is the same bytes, in the same format.
const SEALED_CARRY_KEY = '__sealedFields';

type SealedCarry = Record<string, EncryptedFieldPayload>;

/** Remember, on the in-memory record `holder`, the sealed payload of `field` that could not be decrypted. */
export function carrySealedField(holder: Record<string, unknown>, field: string, payload: EncryptedFieldPayload): void {
  const carried = (holder[SEALED_CARRY_KEY] as SealedCarry | undefined) ?? {};
  holder[SEALED_CARRY_KEY] = {...carried, [field]: payload};
}

const isBlank = (value: unknown): boolean =>
  value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0);

/** The record as it must be persisted: each carried payload goes back into its field while that field is still blank
 * (a new value, already encrypted by the caller, is left alone), and the reserved key never reaches storage. */
export function restoreSealedFields<T extends Record<string, unknown>>(holder: T): T {
  const carried = holder[SEALED_CARRY_KEY] as SealedCarry | undefined;
  if (!carried) {return holder;}
  const output: Record<string, unknown> = {...holder};
  delete output[SEALED_CARRY_KEY];
  Object.keys(carried).forEach(field => {
    if (isBlank(output[field]) && isEncryptedFieldPayload(carried[field])) {
      output[field] = carried[field];
    }
  });
  return output as T;
}
