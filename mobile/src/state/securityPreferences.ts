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

async function readFlag(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) === 'true';
  } catch {
    return false;
  }
}

/**
 * Loads the persisted pin/biometric preferences from disk. Safe to call more
 * than once (from app startup and from any screen that needs to be sure the
 * values are ready) - every caller awaits the same in-flight/resolved load.
 */
export function loadSecurityPreferences(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const [storedPin, storedBiometric, storedSettings] = await Promise.all([
        readFlag(PIN_ENABLED_KEY),
        readFlag(BIOMETRIC_ENABLED_KEY),
        AsyncStorage.getItem(SETTINGS_KEY).catch(() => null),
      ]);
      const [pinCredentialExists, biometricCredentialExists] = await Promise.all([hasStoredPin().catch(() => false), hasBiometricCredential().catch(() => false)]);
      pinEnabled = storedPin && pinCredentialExists;
      biometricEnabled = storedBiometric && biometricCredentialExists;
      if (storedPin !== pinEnabled) {AsyncStorage.setItem(PIN_ENABLED_KEY, pinEnabled ? 'true' : 'false').catch(() => {});}
      if (storedBiometric !== biometricEnabled) {AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, biometricEnabled ? 'true' : 'false').catch(() => {});}
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
