import secureAsyncStorage from '../services/secureAsyncStorage';

// Test helpers for asserting on what a store PERSISTED.
//
// Under AWA_STRUCTURED_ENCRYPTION=1 (npm run test:encrypted) the whole record behind an encrypted storage key is an
// AES-256-GCM envelope (`{"awa_enc":2,...}`), so reading the mocked AsyncStorage raw and JSON.parse-ing it no longer
// yields the store's JSON. These helpers read through the production read path (secureAsyncStorage), which returns
// the stored JSON text in BOTH modes (the envelope is decrypted; with encryption off, or for a legacy plaintext record,
// the string is returned unchanged). Field-level ciphertext inside that JSON (notes, treatment notes, ...) is untouched,
// so "the note is encrypted at rest" assertions keep their meaning.

/** The stored JSON/text of `key`, decrypted when it is an envelope. `null` when nothing is stored. */
export const readStoredString = (key: string): Promise<string | null> => secureAsyncStorage.getItem(key);

/** Same as readStoredString, parsed. `null` when nothing is stored. */
export const readStoredJson = async <T = unknown>(key: string): Promise<T | null> => {
  const raw = await secureAsyncStorage.getItem(key);
  return raw === null ? null : (JSON.parse(raw) as T);
};
