import AsyncStorage from '@react-native-async-storage/async-storage';
import {hasBiometricCredential, hasStoredPin} from '../services/appSecurityService';

const PIN_ENABLED_KEY = '@hawa/security/pin-enabled';
const BIOMETRIC_ENABLED_KEY = '@hawa/security/biometric-enabled';
const SETTINGS_KEY = '@awa/security/settings-v1';

export type PrivacySecuritySettings = {
  discreetMode: boolean;
  discreetNotifications: boolean;
  hideNotificationPreview: boolean;
  intimacyProtection: boolean;
  privateContentProtection: boolean;
};

const DEFAULT_SETTINGS: PrivacySecuritySettings = {
  discreetMode: false,
  discreetNotifications: false,
  hideNotificationPreview: false,
  intimacyProtection: true,
  privateContentProtection: true,
};

/** Only the known settings are taken from the stored JSON: an old field (the removed `anonymousMode`) is dropped instead of being carried
 * into memory and written back, and a wrongly typed value falls back to its default. */
function sanitizeSettings(stored: unknown): PrivacySecuritySettings {
  const source = stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
  const next = {...DEFAULT_SETTINGS};
  (Object.keys(DEFAULT_SETTINGS) as Array<keyof PrivacySecuritySettings>).forEach(key => {
    if (typeof source[key] === 'boolean') {next[key] = source[key] as boolean;}
  });
  return next;
}

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
          privacySettings = sanitizeSettings(JSON.parse(storedSettings));
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
