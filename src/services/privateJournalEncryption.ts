import {gcm} from '@noble/ciphers/aes.js';
import {bytesToHex, hexToBytes, randomBytes, utf8ToBytes, bytesToUtf8} from '@noble/ciphers/utils.js';
import {getOrCreateAesKey} from './secureAesKeyStore';
import type {DailyJournalEntry, EncryptedIntimacyPayload, IntimacySection} from '../types/journal';

// Local encryption at rest for "Vie intime"/"Rapports" (the `intimacy`
// section — shared verbatim by JournalIntimacyScreen.tsx and
// JournalConceptionReportsScreen.tsx, see dailyJournalStore.ts). Frontend/
// local only, no backend — see TODO.md §2.14.
//
// Three independent layers, deliberately not conflated:
//  1. Android device lock protects the AES key itself (Keychain,
//     WHEN_UNLOCKED_THIS_DEVICE_ONLY) — same tier already used for the
//     private-section PIN verifier in privateSectionAuth.ts.
//  2. The existing Vie-Intime PIN/Face ID (privateSectionAuthStore.ts)
//     controls whether the UI ever shows decrypted data — untouched by
//     this file, and not coupled to the key's lifecycle below.
//  3. AES-256-GCM protects the data at rest, so a raw AsyncStorage dump is
//     unreadable without the Keychain-held key.

const ENCRYPTION_KEY_SERVICE = 'com.hawa.private.intimacy.encryption-key';
const CURRENT_VERSION = 1;

// TEMPORARY DIAGNOSTIC LOGGING (__DEV__ only) — structural/error-metadata
// only, never keys/IVs/ciphertext/plaintext. Added to isolate a real-device
// "Impossible d'enregistrer" regression; remove once the failing stage is
// confirmed. See TODO.md/session notes for the bug this is investigating.
const devLog = (...args: unknown[]): void => {
  if (__DEV__) {console.log('[INTIMACY_SAVE]', ...args);}
};
const safeErrorInfo = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

/** Same Keychain service string and key as before this was extracted into
 * secureAesKeyStore.ts — a purely mechanical extraction, existing encrypted
 * intimacy data keeps decrypting with the exact same key it always has. */
async function getOrCreateEncryptionKey(): Promise<Uint8Array> {
  devLog('key lifecycle start');
  try {
    const key = await getOrCreateAesKey(ENCRYPTION_KEY_SERVICE, 'intimacy-encryption-key');
    devLog('key ready, byteLength=', key.length);
    return key;
  } catch (error) {
    devLog('failed at keychain/key-lifecycle stage:', safeErrorInfo(error));
    throw error;
  }
}

/** Encrypts one "Vie intime"/"Rapports" section with AES-256-GCM — a fresh
 * random 12-byte nonce every call (never reused), authentication tag
 * embedded in the returned ciphertext by the cipher itself. */
export async function encryptIntimacySection(data: IntimacySection): Promise<EncryptedIntimacyPayload> {
  try {
    devLog('encrypt: start, has crypto.getRandomValues =', typeof (globalThis as {crypto?: {getRandomValues?: unknown}}).crypto?.getRandomValues === 'function');
    const key = await getOrCreateEncryptionKey();
    devLog('encrypt: key ready');
    const nonce = randomBytes(12);
    devLog('encrypt: nonce generated ok, byteLength=', nonce.length);
    const plaintext = utf8ToBytes(JSON.stringify(data));
    devLog('encrypt: plaintext bytes ready, byteLength=', plaintext.length);
    const ciphertext = gcm(key, nonce).encrypt(plaintext);
    devLog('encrypt: AES-GCM encryption ok, ciphertextLength=', ciphertext.length);
    return {version: CURRENT_VERSION, iv: bytesToHex(nonce), ciphertext: bytesToHex(ciphertext)};
  } catch (error) {
    devLog('failed at encryption stage:', safeErrorInfo(error));
    throw error;
  }
}

/** Decrypts a payload produced by encryptIntimacySection(). Throws on an
 * unsupported version or on ciphertext/tag corruption — callers must catch
 * this and show an honest failure state (never crash, never display
 * garbage, never auto-delete the corrupted payload). */
export async function decryptIntimacySection(payload: EncryptedIntimacyPayload): Promise<IntimacySection> {
  if (payload.version !== CURRENT_VERSION) {
    throw new Error(`Unsupported encryptedIntimacy version: ${payload.version}`);
  }
  const key = await getOrCreateEncryptionKey();
  const nonce = hexToBytes(payload.iv);
  const ciphertext = hexToBytes(payload.ciphertext);
  const plaintext = gcm(key, nonce).decrypt(ciphertext);
  return JSON.parse(bytesToUtf8(plaintext)) as IntimacySection;
}

export type ResolvedIntimacySection = {data: IntimacySection | undefined; corrupted: boolean};

/** Read-time resolution for a day's `intimacy` data: prefers the encrypted
 * shape (decrypting it), falls back to the legacy plaintext `intimacy`
 * field for entries saved before this existed, or reports `corrupted` if an
 * encrypted payload exists but can't be decrypted (never thrown to the
 * caller, never silently shown as blank/garbage — see the two consuming
 * screens for the honest "Impossible de lire ces données privées." state).
 * Never logs the decrypted value. */
export async function resolveIntimacySection(entry: DailyJournalEntry | undefined): Promise<ResolvedIntimacySection> {
  if (entry?.encryptedIntimacy) {
    try {
      return {data: await decryptIntimacySection(entry.encryptedIntimacy), corrupted: false};
    } catch {
      return {data: undefined, corrupted: true};
    }
  }
  if (entry?.intimacy) {
    return {data: entry.intimacy, corrupted: false};
  }
  return {data: undefined, corrupted: false};
}

/** Centralized display-only resolver for every non-gated UI surface that
 * merely needs to know "was Vie intime/Rapports recorded, and what was the
 * answer" — Dashboard progress rings, Calendar dots/day cards, TTC
 * statistics. Built on resolveIntimacySection() (the one canonical decrypt
 * path — never a second crypto implementation), reduced to the minimum
 * needed: `{answer}` only. Never libido/protection/discomfort/note/time —
 * those stay exclusively inside the encrypted payload and are only ever
 * fully decrypted by the gated JournalIntimacyScreen.tsx/
 * JournalConceptionReportsScreen.tsx entry screens themselves.
 *
 * Returns a plain DailyJournalEntry so every existing consumer
 * (DailyJournalCard, SelectedDayCard, ConceiveCalendarContent's
 * journalMarkersPresent()/ttcFields, ConceiveStatisticsScreen's
 * intercourseEntries) keeps reading `entry.intimacy`/`entry.intimacy?.answer`
 * exactly as before — none of them call any crypto themselves. A
 * corrupted/unreadable payload resolves to "not recorded" here (never a
 * crash, never garbage); the full honest failure message is only ever shown
 * on the two gated entry screens, not on these summary surfaces.
 *
 * Must only be called from an existing async data-loading effect
 * (useEffect/useFocusEffect), never from inside a render loop — callers
 * store the resolved result in state and read it synchronously afterwards. */
export async function withResolvedIntimacyForDisplay(entry: DailyJournalEntry | undefined): Promise<DailyJournalEntry | undefined> {
  if (!entry) {return undefined;}
  const {data} = await resolveIntimacySection(entry);
  return {...entry, intimacy: data ? {answer: data.answer} : undefined};
}

/** Batch form of withResolvedIntimacyForDisplay() for screens holding a
 * month's or the whole history's worth of entries at once — resolves them
 * all in parallel, once, outside any render loop. */
export async function withResolvedIntimacyForDisplayMany(entries: DailyJournalEntry[]): Promise<DailyJournalEntry[]> {
  return Promise.all(entries.map(entry => withResolvedIntimacyForDisplay(entry) as Promise<DailyJournalEntry>));
}
