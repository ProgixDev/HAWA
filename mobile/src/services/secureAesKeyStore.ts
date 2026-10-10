import * as Keychain from 'react-native-keychain';
import {bytesToHex, hexToBytes, randomBytes} from '@noble/ciphers/utils.js';

// Shared Keychain-backed lifecycle for a random 256-bit AES key, reused by
// every local encryption-at-rest domain in AWA (see privateJournalEncryption.ts,
// privatePhotoEncryption.ts). Each caller supplies its own Keychain `service`
// string, so the underlying keys themselves are never shared across domains —
// only this lifecycle logic (get existing, or generate+store new) is shared.
// Never derived from the PIN, never written to AsyncStorage. Android device
// lock protects the key itself (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) — the same
// tier already used for the private-section PIN verifier in privateSectionAuth.ts.

const keyCache = new Map<string, Uint8Array>();
// Concurrent first uses of one service share ONE lookup/creation. Without this, N values encrypted at the same
// moment (a list saved with Promise.all, a migration sealing several notes) each saw "no key yet", each minted and
// stored a DIFFERENT key, and only the last one survived: the values encrypted under the others became undecryptable
// for good.
const inFlight = new Map<string, Promise<Uint8Array>>();

async function readStoredKey(service: string): Promise<Uint8Array | null> {
  const existing = await Keychain.getGenericPassword({service});
  return existing ? hexToBytes(existing.password) : null;
}

/** Gets the existing random 256-bit key for `service` from the Keychain, or
 * generates and stores a new one on first use. Cached in memory only for the
 * life of the JS process, keyed by `service` so independent domains never
 * collide. `username` is only the Keychain entry's display label.
 *
 * ONLY for ENCRYPTING. Reading data back must use requireExistingAesKey(): creating a key while decrypting can only
 * ever destroy (a lookup that merely MISSED would be answered by minting a new key and storing it over the real one). */
export function getOrCreateAesKey(service: string, username: string): Promise<Uint8Array> {
  const cached = keyCache.get(service);
  if (cached) {return Promise.resolve(cached);}
  const pending = inFlight.get(service);
  if (pending) {return pending;}

  const run = (async (): Promise<Uint8Array> => {
    let key = await readStoredKey(service);
    if (!key) {
      // A single missed read is not proof that there is no key: the replacement would be stored OVER the real one.
      key = await readStoredKey(service);
    }
    if (key) {
      keyCache.set(service, key);
      return key;
    }
    const created = randomBytes(32);
    await Keychain.setGenericPassword(username, bytesToHex(created), {
      service,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    keyCache.set(service, created);
    return created;
  })();

  inFlight.set(service, run);
  const forget = () => {
    if (inFlight.get(service) === run) {
      inFlight.delete(service);
    }
  };
  run.then(forget, forget);
  return run;
}

/** Reads the existing key for `service` WITHOUT ever creating one. `null` means the Keychain has no key for it —
 * which, when data encrypted under that key exists, is a key LOSS, not a reason to silently mint a new key (a new
 * key would make every old ciphertext permanently unreadable). */
export async function peekAesKey(service: string): Promise<Uint8Array | null> {
  const cached = keyCache.get(service);
  if (cached) {return cached;}
  const key = await readStoredKey(service);
  if (!key) {return null;}
  keyCache.set(service, key);
  return key;
}

/** The key DECRYPTION needs. It must already exist (data encrypted under it does): this never creates, stores or
 * replaces anything. Reads twice before giving up, because one missed read is not evidence of a missing key. */
export async function requireExistingAesKey(service: string): Promise<Uint8Array> {
  const key = (await peekAesKey(service)) ?? (await peekAesKey(service));
  if (!key) {
    throw new Error('encryption key is not available');
  }
  return key;
}

/** Forgets the in-memory copy of a key (does not touch the Keychain). Used when the active data set changes and in tests. */
export function clearAesKeyCache(service?: string): void {
  if (service) {
    keyCache.delete(service);
    inFlight.delete(service);
  } else {
    keyCache.clear();
    inFlight.clear();
  }
}
