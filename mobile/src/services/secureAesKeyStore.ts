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

/** Gets the existing random 256-bit key for `service` from the Keychain, or
 * generates and stores a new one on first use. Cached in memory only for the
 * life of the JS process, keyed by `service` so independent domains never
 * collide. `username` is only the Keychain entry's display label. */
export async function getOrCreateAesKey(service: string, username: string): Promise<Uint8Array> {
  const cached = keyCache.get(service);
  if (cached) {return cached;}

  const existing = await Keychain.getGenericPassword({service});
  if (existing) {
    const key = hexToBytes(existing.password);
    keyCache.set(service, key);
    return key;
  }

  const key = randomBytes(32);
  await Keychain.setGenericPassword(username, bytesToHex(key), {
    service,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  keyCache.set(service, key);
  return key;
}

/** Reads the existing key for `service` WITHOUT ever creating one. `null` means the Keychain has no key for it —
 * which, when data encrypted under that key exists, is a key LOSS, not a reason to silently mint a new key (a new
 * key would make every old ciphertext permanently unreadable). */
export async function peekAesKey(service: string): Promise<Uint8Array | null> {
  const cached = keyCache.get(service);
  if (cached) {return cached;}
  const existing = await Keychain.getGenericPassword({service});
  if (!existing) {return null;}
  const key = hexToBytes(existing.password);
  keyCache.set(service, key);
  return key;
}

/** Forgets the in-memory copy of a key (does not touch the Keychain). Used when the active data set changes and in tests. */
export function clearAesKeyCache(service?: string): void {
  if (service) {
    keyCache.delete(service);
  } else {
    keyCache.clear();
  }
}
