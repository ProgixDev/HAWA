import AsyncStorage from '@react-native-async-storage/async-storage';

import {getActiveProfileId, subscribeActiveProfileId} from '../state/activeProfileStore';
import {profileScopedKey} from '../state/profileScopedStorage';
import {classifyStorageKey, splitProfileKey} from './storageKeyClassifier';
import {
  StructuredDataError,
  decryptStructured,
  encryptStructured,
  isStructuredEnvelope,
  type StructuredFailureReason,
} from './structuredEncryption';

// The storage layer the health-data stores use instead of AsyncStorage directly. It exposes the same
// getItem / setItem / removeItem surface, so a store adopts it by changing ONE import line, and:
//
//   - keys in STRUCTURED_ENCRYPTED_BASES are encrypted on write (AES-256-GCM, see structuredEncryption.ts);
//   - a stored value that is still legacy PLAINTEXT is returned as-is — old data stays readable until the
//     migration (structuredDataMigration.ts) has rewritten it, and new writes are encrypted straight away;
//   - a stored value that is an envelope and CANNOT be decrypted is never turned into "no data": the read throws
//     StructuredDataUnavailableError, the key is recorded as unavailable (so the UI, statistics and reminders can
//     say so instead of showing empty or fabricated values), and WRITES TO THAT KEY ARE REFUSED so the unreadable
//     record is never overwritten by whatever a store derives from an empty read;
//   - every read-modify-write on a key is serialized (withKeyLock), which is what lets the migration and profile
//     deletion run safely next to normal edits.
//
// Everything else (settings, UI state, keys of other apps) passes straight through.

/**
 * The storage keys (WITHOUT the `:profile:<id>` suffix) whose content is sensitive structured health, religious-practice,
 * pregnancy/loss/contraception or location data. A new health store must be added here (a test checks that every entry
 * is a real key used by the code, and the audit documents what is left plaintext and why).
 */
export const STRUCTURED_ENCRYPTED_BASES: readonly string[] = [
  // profile-scoped
  '@hawa/daily-journal/v1',
  '@hawa/confirmed-period-history',
  '@hawa/cycle-preferences',
  '@hawa/period-end-datetime',
  '@hawa/cycle-reminder-preferences/v1',
  '@hawa/remaining-qadaa-days',
  'awa:qadaa:ledger:v1',
  // owner-only (global keys)
  'awa:qadaa:progress:v1',
  '@hawa/qadaa-post-ramadan-reminder/v1',
  '@awa/general-health/v1',
  '@hawa/personal-information/v1',
  '@hawa/pregnancy-dating',
  '@hawa/pregnancy-tracking-preferences',
  '@hawa/pregnancy-reminder-preferences',
  '@hawa/pregnancy-journal/v1',
  '@hawa/pregnancy-medical-events',
  '@hawa/pregnancy-health-reminders',
  '@hawa/pregnancy-custom-reminders',
  '@hawa/pregnancy-notification-settings',
  '@hawa/postpartum-preferences/v1',
  '@hawa/postpartum-journal/v3',
  '@hawa/postpartum-lochia/v1',
  '@hawa/postpartum-nifas-reminders/v1',
  '@hawa/miscarriage-preferences/v1',
  '@hawa/miscarriage-journal/v1',
  '@hawa/contraception-preferences',
  '@hawa/contraception-journal/v1',
  '@hawa/contraception-intake-history/v1',
  '@hawa/contraception-event-history/v1',
  '@hawa/conception-preferences',
  '@hawa/irregular-preferences/v1',
  '@hawa/irregular-journal/v1',
  '@hawa/menopause-preferences/v1',
  '@hawa/menopause-journal/v1',
  '@hawa/menopause-lab-results/v1',
  '@hawa/selected-location',
  '@hawa/active-objective',
];

const ELIGIBLE = new Set(STRUCTURED_ENCRYPTED_BASES);

// Production default: ON. The Jest setup file turns the default OFF (so the ~12,000 store/screen tests keep asserting on
// plain values) unless AWA_STRUCTURED_ENCRYPTION=1; the encryption's own tests switch it on explicitly.
let encryptionEnabled = (globalThis as {__AWA_STRUCTURED_ENCRYPTION_DEFAULT__?: boolean}).__AWA_STRUCTURED_ENCRYPTION_DEFAULT__ !== false;
/** Switch for tests and for emergency roll-back builds: when false everything passes through unchanged. */
export const setStructuredEncryptionEnabled = (enabled: boolean): void => {
  encryptionEnabled = enabled;
};
export const isStructuredEncryptionEnabled = (): boolean => encryptionEnabled;

export const isStructuredEncryptionEligible = (key: string): boolean => {
  if (!encryptionEnabled) {return false;}
  const {kind} = classifyStorageKey(key);
  if (kind === 'foreign' || kind === 'backup-artifact' || kind === 'internal-state') {return false;}
  return ELIGIBLE.has(splitProfileKey(key).baseKey);
};

/** Same check, independent of the on/off switch (used by the migration and the backup code to ask "is this one of ours?"). */
export const isStructuredBase = (key: string): boolean => ELIGIBLE.has(splitProfileKey(key).baseKey);

// ---------------------------------------------------------------------------------------------------------------
// Unavailable-record registry
// ---------------------------------------------------------------------------------------------------------------

export class StructuredDataUnavailableError extends Error {
  readonly reason: StructuredFailureReason;
  constructor(reason: StructuredFailureReason) {
    super(`structured data unavailable: ${reason}`);
    this.name = 'StructuredDataUnavailableError';
    this.reason = reason;
  }
}

const unavailable = new Map<string, StructuredFailureReason>();
const unavailableListeners = new Set<() => void>();
const notifyUnavailable = () => unavailableListeners.forEach(listener => listener());

const markUnavailable = (key: string, reason: StructuredFailureReason): void => {
  if (unavailable.get(key) === reason) {return;}
  unavailable.set(key, reason);
  notifyUnavailable();
};
const markAvailable = (key: string): void => {
  if (unavailable.delete(key)) {notifyUnavailable();}
};

/** Keys that exist but could not be read (never silently treated as empty). Safe to show: only storage keys + reasons. */
export const getUnavailableStructuredKeys = (): {key: string; reason: StructuredFailureReason}[] =>
  [...unavailable.entries()].map(([key, reason]) => ({key, reason}));
/** Are any of these storage bases (given WITHOUT the `:profile:<id>` suffix) unreadable for the ACTIVE profile? */
export const isActiveProfileDataUnavailable = (bases: readonly string[]): boolean => {
  const profileId = getActiveProfileId();
  const keys = new Set(bases.map(base => profileScopedKey(base, profileId)));
  return [...unavailable.keys()].some(key => keys.has(key));
};
export const isStructuredKeyUnavailable = (key: string): boolean => unavailable.has(key);
export const isAnyStructuredDataUnavailable = (): boolean => unavailable.size > 0;
export const subscribeStructuredAvailability = (listener: () => void): (() => void) => {
  unavailableListeners.add(listener);
  return () => {
    unavailableListeners.delete(listener);
  };
};

// ---------------------------------------------------------------------------------------------------------------
// Per-key serialization
// ---------------------------------------------------------------------------------------------------------------

const locks = new Map<string, Promise<unknown>>();

/** Runs `task` after every earlier task on the SAME key has finished (FIFO), whatever its outcome. */
export function withKeyLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail = run.then(
    () => undefined,
    () => undefined,
  );
  locks.set(key, tail);
  tail.then(() => {
    if (locks.get(key) === tail) {locks.delete(key);}
  });
  return run;
}

// ---------------------------------------------------------------------------------------------------------------
// Bounded decrypted-value cache
// ---------------------------------------------------------------------------------------------------------------
// A big record (a year of journal entries) is read many times per screen. The cache is keyed by the stored RAW
// string, so it can never serve a value that no longer matches storage; it is bounded; and it is emptied on profile
// change, deletion and reset so decrypted health data does not linger in memory.

const CACHE_MAX_ENTRIES = 16;
const CACHE_MAX_CHARS = 2_000_000;
const cache = new Map<string, {raw: string; plain: string}>();
let cacheChars = 0;

const cacheDrop = (key: string): void => {
  const existing = cache.get(key);
  if (existing) {
    cacheChars -= existing.raw.length + existing.plain.length;
    cache.delete(key);
  }
};
const cachePut = (key: string, raw: string, plain: string): void => {
  cacheDrop(key);
  const size = raw.length + plain.length;
  if (size > CACHE_MAX_CHARS) {return;}
  cache.set(key, {raw, plain});
  cacheChars += size;
  while (cache.size > CACHE_MAX_ENTRIES || cacheChars > CACHE_MAX_CHARS) {
    const oldest = cache.keys().next().value as string;
    cacheDrop(oldest);
  }
};
const cacheGet = (key: string, raw: string): string | null => {
  const hit = cache.get(key);
  return hit && hit.raw === raw ? hit.plain : null;
};
/** Forget every decrypted value held in memory (profile switch, deletion, reset). */
export const clearStructuredCache = (): void => {
  cache.clear();
  cacheChars = 0;
};
export const __cacheStatsForTests = () => ({entries: cache.size, chars: cacheChars});

subscribeActiveProfileId(clearStructuredCache);

// ---------------------------------------------------------------------------------------------------------------
// The adapter
// ---------------------------------------------------------------------------------------------------------------

const asUnavailable = (error: unknown): StructuredDataUnavailableError =>
  new StructuredDataUnavailableError(error instanceof StructuredDataError ? error.reason : 'authentication-failed');

async function readDecrypted(key: string, raw: string): Promise<string> {
  const cached = cacheGet(key, raw);
  if (cached !== null) {return cached;}
  try {
    const plain = await decryptStructured(key, raw);
    cachePut(key, raw, plain);
    markAvailable(key);
    return plain;
  } catch (error) {
    const failure = asUnavailable(error);
    markUnavailable(key, failure.reason);
    throw failure;
  }
}

async function getItem(key: string): Promise<string | null> {
  // A read of an encrypted record waits for the writes on that record that were STARTED before it. Without this, an
  // encrypted write (several async steps: read the old value, encrypt, store) could still be in flight when the read hits
  // storage, and the read would return the OLD value — a stale read a store would then adopt as the truth.
  if (isStructuredEncryptionEligible(key)) {return withKeyLock(key, () => readItemLocked(key));}
  return AsyncStorage.getItem(key);
}

async function readItemLocked(key: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null || !isStructuredEncryptionEligible(key)) {
    if (raw === null) {markAvailable(key);}
    return raw;
  }
  if (!isStructuredEnvelope(raw)) {
    markAvailable(key);
    return raw; // legacy plaintext, not migrated yet
  }
  return readDecrypted(key, raw);
}

async function setItem(key: string, value: string): Promise<void> {
  if (!isStructuredEncryptionEligible(key)) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await withKeyLock(key, async () => {
    // A store whose read of this key FAILED may be holding default/empty state (many stores turn a failed read into
    // "nothing recorded"). Writing that state back would replace real data with nothing. So a key whose last read
    // failed accepts no write until a read of it has succeeded again — even if the cause (a locked Keychain, say) has
    // gone away in the meantime. The stores re-read on the next launch or profile reload; the banner offers a retry.
    const lastFailure = unavailable.get(key);
    if (lastFailure) {throw new StructuredDataUnavailableError(lastFailure);}
    // Never overwrite a record we cannot read now either.
    const existing = await AsyncStorage.getItem(key);
    if (isStructuredEnvelope(existing)) {await readDecrypted(key, existing);}
    let envelope: string;
    try {
      envelope = await encryptStructured(key, value);
    } catch (error) {
      const failure = asUnavailable(error);
      markUnavailable(key, failure.reason);
      throw failure;
    }
    await AsyncStorage.setItem(key, envelope);
    cachePut(key, envelope, value);
    markAvailable(key);
  });
}

async function removeItem(key: string): Promise<void> {
  await withKeyLock(key, async () => {
    await AsyncStorage.removeItem(key);
    cacheDrop(key);
    markAvailable(key);
  });
}

/** Writes a stored value verbatim (already an envelope, or legacy plaintext) under the key lock. Used by restore. */
export const setRawItemLocked = (key: string, value: string): Promise<void> =>
  withKeyLock(key, async () => {
    await AsyncStorage.setItem(key, value);
    cacheDrop(key);
    markAvailable(key);
  });

/** The stored value exactly as persisted (never decrypted). */
export const getRawItem = (key: string): Promise<string | null> => AsyncStorage.getItem(key);

const secureAsyncStorage = {
  getItem,
  setItem,
  removeItem,
  getAllKeys: (): Promise<readonly string[]> => AsyncStorage.getAllKeys(),
};

export default secureAsyncStorage;

/** Test-only: forget every in-memory trace (failed-read registry, cache) so tests do not leak state into each other. */
export const resetStructuredStorageForTests = (): void => {
  unavailable.clear();
  clearStructuredCache();
  notifyUnavailable();
};

/** Forgets which keys failed to read, so the next read of each is a fresh attempt (the "Try again" action). */
export const forgetUnavailableStructuredKeys = (): void => {
  unavailable.clear();
  clearStructuredCache();
  notifyUnavailable();
};

/** Test-only: records a key as unreadable without needing a real decryption failure. */
export const __markUnavailableForTests = (key: string, reason: StructuredFailureReason = 'authentication-failed'): void => {
  markUnavailable(key, reason);
};
