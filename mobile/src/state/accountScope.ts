import AsyncStorage from '@react-native-async-storage/async-storage';

// The ACTIVE LOCAL PROFILE of this phone, as far as storage is concerned. Dependency-free on purpose: secureAsyncStorage.ts (the one place every store
// reads and writes through) imports it, so it must import no store.
//
// These are local profiles on this device — NOT online accounts: nothing is sent anywhere, the e-mail is not verified and no password is checked.
//
// What is scoped. Only the keys the onboarding questionnaire writes and the list of managed profiles (ACCOUNT_SCOPED_BASES below) get a per-profile copy; every other record
// (daily health logs, pregnancy / postpartum / contraception / menopause journals, Qadaa, reminders, managed daughter profiles, AWA à deux ...)
// stays shared between the local profiles of this device, exactly as before.
//
// Key format. The default profile (`local`, "Continuer sans compte") keeps the CURRENT keys byte-for-byte: no migration, nothing is moved or deleted.
// Another profile's copy of a scoped key is `<key>:acct:<acct-id>`. The `:profile:<id>` suffix of managed (daughter) profiles is deliberately not
// reused, so backup / deletion / orphan-audit code that reasons about managed profiles never mistakes these keys for one. A key that already has a
// managed-profile suffix is never account-scoped (the daughter's own data is not part of the questionnaire of an account).

export const LOCAL_ACCOUNT_ID = 'local';
/** Session value after "Se déconnecter": nobody is signed in; the stores read the default (`local`) keys until a profile is chosen. */
export const SIGNED_OUT_SESSION = 'signed-out';
export const ACCOUNT_KEY_MARKER = ':acct:';
export const SESSION_STORAGE_KEY = '@awa/local-accounts/session-v1';

const ACCOUNT_ID_PATTERN = /^acct-[0-9a-f]{16}$/;

/** The records the onboarding questionnaire writes, plus the list of managed profiles. Order is irrelevant. */
export const ACCOUNT_SCOPED_BASES: readonly string[] = [
  '@hawa/has-completed-onboarding',
  '@hawa/active-objective',
  '@hawa/selected-location',
  '@hawa/spiritual-markers-enabled',
  '@hawa/hijri-adjustment-days',
  '@hawa/personal-information/v1',
  '@hawa/cycle-preferences',
  '@hawa/period-end-datetime',
  '@hawa/conception-preferences',
  '@hawa/irregular-preferences/v1',
  '@hawa/pregnancy-dating',
  // The list of managed (daughter) profiles belongs to the profile that added them: another local profile must not see them. Her records
  // (`:profile:<id>` keys) are untouched and stay under the profile that owns the list.
  '@hawa/managed-profiles/v1',
];
const SCOPED = new Set(ACCOUNT_SCOPED_BASES);

export const isValidAccountId = (value: unknown): value is string => typeof value === 'string' && ACCOUNT_ID_PATTERN.test(value);

let session: string = LOCAL_ACCOUNT_ID;
let ready: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** `local`, `signed-out` or an `acct-…` id. */
export const getSession = (): string => session;
export const isSignedOut = (): boolean => session === SIGNED_OUT_SESSION;
/** The profile whose copy of the scoped keys is in use. While signed out the default profile's keys are the ones in use. */
export const getActiveAccountId = (): string => (isValidAccountId(session) ? session : LOCAL_ACCOUNT_ID);
export const isDefaultLocalProfile = (): boolean => getActiveAccountId() === LOCAL_ACCOUNT_ID;

export const subscribeSession = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

const parseSession = (value: string | null): string =>
  value === SIGNED_OUT_SESSION ? SIGNED_OUT_SESSION : isValidAccountId(value) ? value : LOCAL_ACCOUNT_ID;

/** Resolves once the stored session has been read. Every storage call waits for it, so a store that hydrates at import never reads the wrong profile. */
export const whenAccountScopeReady = (): Promise<void> => {
  if (!ready) {
    ready = AsyncStorage.getItem(SESSION_STORAGE_KEY)
      .then(value => {
        session = parseSession(value);
      })
      .catch(() => {
        session = LOCAL_ACCOUNT_ID; // an unreadable session never invents a profile
      });
  }
  return ready;
};

/** Persists the session, THEN makes it the one in memory. A failed write throws and leaves the previous session in force. */
export async function writeSession(next: string): Promise<void> {
  const value = parseSession(next);
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, value);
  ready = Promise.resolve();
  session = value;
  listeners.forEach(listener => listener());
}

const baseOf = (key: string): string => {
  const at = key.lastIndexOf(ACCOUNT_KEY_MARKER);
  return at > 0 ? key.slice(0, at) : key;
};

/** The physical key for a logical one: unchanged for the default profile, for a key outside the scoped list, for a managed-profile key, and for a key
 * that is already scoped (so calling it twice is harmless). */
export function scopeKey(key: string): string {
  const id = getActiveAccountId();
  if (id === LOCAL_ACCOUNT_ID || key.includes(ACCOUNT_KEY_MARKER) || key.includes(':profile:')) {return key;}
  return SCOPED.has(baseOf(key)) ? `${key}${ACCOUNT_KEY_MARKER}${id}` : key;
}

/** After "delete my data" (the session and the registry are gone from storage): the original profile is the one in force again, in memory only —
 * nothing is read or written, so a deleted session is never re-created. */
export const forgetSessionInMemory = (): void => {
  session = LOCAL_ACCOUNT_ID;
  ready = Promise.resolve();
  listeners.forEach(listener => listener());
};

/** Test-only: back to "never read", default profile. */
export const resetAccountScopeForTests = (): void => {
  session = LOCAL_ACCOUNT_ID;
  ready = null;
  listeners.clear();
};
