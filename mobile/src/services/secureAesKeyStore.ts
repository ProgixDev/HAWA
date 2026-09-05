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
