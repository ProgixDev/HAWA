import AsyncStorage from '@react-native-async-storage/async-storage';
import {hasBiometricCredential, hasStoredPin} from '../services/appSecurityService';

const PIN_ENABLED_KEY = '@hawa/security/pin-enabled';
const BIOMETRIC_ENABLED_KEY = '@hawa/security/biometric-enabled';
const SETTINGS_KEY = '@awa/security/settings-v1';
const ANONYMOUS_ID_KEY = '@hawa/security/anonymous-id';
const ANONYMOUS_CREATED_AT_KEY = '@hawa/security/anonymous-created-at';

export type PrivacySecuritySettings = {
  discreetMode: boolean;
  discreetNotifications: boolean;
  hideNotificationPreview: boolean;
  intimacyProtection: boolean;
  privateContentProtection: boolean;
  anonymousMode: boolean;
};

const DEFAULT_SETTINGS: PrivacySecuritySettings = {
  discreetMode: false,
  discreetNotifications: false,
  hideNotificationPreview: false,
  intimacyProtection: true,
  privateContentProtection: true,
  // Anonymous Mode is opt-in — activated only through the explicit
  // AnonymousMode → Limitations → Creating → Success flow, never on by
  // default for a fresh install.
  anonymousMode: false,
};

let pinEnabled = false;
let biometricEnabled = false;
let loadPromise: Promise<void> | null = null;
let privacySettings = { ...DEFAULT_SETTINGS };
const settingsListeners = new Set<() => void>();
const securityListeners = new Set<() => void>();
const notifySecurity = () => securityListeners.forEach(listener => listener());

/** The persisted choice. `null` = the read itself failed (unknown), which is NOT the same as "off". */
async function readFlag(key: string): Promise<boolean | null> {
  try {
    return (await AsyncStorage.getItem(key)) === 'true';
  } catch {
    return null;
  }
}

/** Whether the credential exists on THIS phone. 'unknown' = the Keychain call itself failed. */
type CredentialCheck = 'present' | 'absent' | 'unknown';

async function checkCredential(check: () => Promise<boolean>): Promise<CredentialCheck> {
  // One missed read is not proof that the credential is gone, so absence needs two agreeing reads. A call that
  // threw is never read as "absent": it is "unknown" (and the lock then follows the persisted choice).
  let failed = false;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      if (await check()) {return 'present';}
    } catch {
      failed = true;
    }
  }
  return failed ? 'unknown' : 'absent';
}

/**
 * Whether the lock is enforced this session, from what she chose (the persisted flag) and from what this phone can
 * actually verify (the Keychain credential).
 *
 *  - credential PRESENT        → enforced, unless the persisted choice is explicitly "off" (never turned ON by
 *                                inference: that is her decision to make in settings);
 *  - credential ABSENT         → not enforced for this session. The flag can legitimately outlive the credential
 *                                (a backup restored on another phone: device keys never leave their device), and
 *                                demanding a PIN that cannot be verified would lock her out of her own data;
 *  - credential UNKNOWN (check failed) → follows the persisted choice. A Keychain call that threw says nothing about
 *                                whether the PIN exists, so it must never LOOSEN the lock.
 */
function lockEnforced(persisted: boolean | null, credential: CredentialCheck): boolean {
  if (credential === 'present') {return persisted !== false;}
  if (credential === 'absent') {return false;}
  return persisted === true;
}

/**
 * Loads the persisted pin/biometric preferences from disk. Safe to call more
 * than once (from app startup and from any screen that needs to be sure the
 * values are ready) - every caller awaits the same in-flight/resolved load.
 *
 * Nothing derived from the Keychain check is ever WRITTEN back. It used to be: a Keychain call that failed (or one
 * transient "not found") flipped the persisted flag to off, so the app lock was silently and permanently disabled
 * by a single hiccup. The flag only changes when she changes it (setPinEnabled / setBiometricEnabled).
 */
export function loadSecurityPreferences(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const [storedPin, storedBiometric, storedSettings] = await Promise.all([
        readFlag(PIN_ENABLED_KEY),
        readFlag(BIOMETRIC_ENABLED_KEY),
        AsyncStorage.getItem(SETTINGS_KEY).catch(() => null),
      ]);
      const [pinCredential, biometricCredential] = await Promise.all([
        checkCredential(hasStoredPin),
        checkCredential(hasBiometricCredential),
      ]);
      pinEnabled = lockEnforced(storedPin, pinCredential);
      biometricEnabled = lockEnforced(storedBiometric, biometricCredential);
      if (storedSettings) {
        try {
          privacySettings = {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(storedSettings),
          };
        } catch {}
      }
      notifySecurity();
    })();
  }
  return loadPromise;
}

export const setPinEnabled = async (enabled: boolean): Promise<void> => {
  pinEnabled = enabled;
  await AsyncStorage.setItem(PIN_ENABLED_KEY, enabled ? 'true' : 'false');
  notifySecurity();
};

export const isPinEnabled = (): boolean => pinEnabled;

export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  biometricEnabled = enabled;
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  notifySecurity();
};

export const isBiometricEnabled = (): boolean => biometricEnabled;
export const requiresAppLock = (): boolean => pinEnabled || biometricEnabled;
export const subscribeSecurityPreferences = (listener: () => void): (() => void) => {securityListeners.add(listener); return () => securityListeners.delete(listener);};

export const getPrivacySecuritySettings = (): PrivacySecuritySettings => ({
  ...privacySettings,
});

export const updatePrivacySecuritySettings = (
  patch: Partial<PrivacySecuritySettings>,
): PrivacySecuritySettings => {
  privacySettings = { ...privacySettings, ...patch };
  settingsListeners.forEach(listener => listener());
  AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(privacySettings)).catch(
    () => {},
  );
  return { ...privacySettings };
};

export const subscribePrivacySecuritySettings = (
  listener: () => void,
): (() => void) => {
  settingsListeners.add(listener);
  return () => {
    settingsListeners.delete(listener);
  };
};

/* ============================================================
 * ANONYMOUS ACCOUNT IDENTITY
 *
 * A stable, purely local identifier for the anonymous profile — generated
 * once (the first time Anonymous Mode is actually activated) and persisted,
 * never regenerated on re-render or app restart. Deliberately kept in this
 * file rather than a separate store: it's part of the same local privacy/
 * security state as `anonymousMode` itself, not a second source of truth.
 * ============================================================ */

export type AnonymousAccountInfo = {
  id: string;
  createdAt: string;
};

let anonymousAccount: AnonymousAccountInfo | null = null;
let anonymousAccountPromise: Promise<AnonymousAccountInfo> | null = null;

const randomSegment = (): string =>
  Math.random().toString(36).slice(2, 6).toUpperCase();

/** Synchronous read of whatever is currently cached in memory (may be null before hydration). */
export const getAnonymousAccount = (): AnonymousAccountInfo | null => anonymousAccount;

/**
 * Creates (once) or loads the persisted anonymous identifier. Safe to call
 * repeatedly — every caller after the first resolves the same cached value,
 * so it never regenerates an already-existing identifier.
 */
export function ensureAnonymousAccount(): Promise<AnonymousAccountInfo> {
  if (anonymousAccount) {
    return Promise.resolve(anonymousAccount);
  }
  if (!anonymousAccountPromise) {
    anonymousAccountPromise = (async () => {
      const [storedId, storedCreatedAt] = await Promise.all([
        AsyncStorage.getItem(ANONYMOUS_ID_KEY).catch(() => null),
        AsyncStorage.getItem(ANONYMOUS_CREATED_AT_KEY).catch(() => null),
      ]);
      if (storedId && storedCreatedAt) {
        anonymousAccount = {id: storedId, createdAt: storedCreatedAt};
        return anonymousAccount;
      }
      const id = `AWA-${randomSegment()}-${randomSegment()}`;
      const createdAt = new Date().toISOString();
      await Promise.all([
        AsyncStorage.setItem(ANONYMOUS_ID_KEY, id).catch(() => {}),
        AsyncStorage.setItem(ANONYMOUS_CREATED_AT_KEY, createdAt).catch(() => {}),
      ]);
      anonymousAccount = {id, createdAt};
      return anonymousAccount;
    })();
  }
  return anonymousAccountPromise;
}
