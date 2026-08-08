import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_ENABLED_KEY = '@hawa/security/pin-enabled';
const BIOMETRIC_ENABLED_KEY = '@hawa/security/biometric-enabled';
const SETTINGS_KEY = '@awa/security/settings-v1';

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
  anonymousMode: true,
};

let pinEnabled = false;
let biometricEnabled = false;
let loadPromise: Promise<void> | null = null;
let privacySettings = {...DEFAULT_SETTINGS};

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
      pinEnabled = storedPin;
      biometricEnabled = storedBiometric;
      if (storedSettings) {
        try {privacySettings = {...DEFAULT_SETTINGS, ...JSON.parse(storedSettings)};} catch {}
      }
    })();
  }
  return loadPromise;
}

export const setPinEnabled = (enabled: boolean): void => {
  pinEnabled = enabled;
  AsyncStorage.setItem(PIN_ENABLED_KEY, enabled ? 'true' : 'false').catch(() => {});
};

export const isPinEnabled = (): boolean => pinEnabled;

export const setBiometricEnabled = (enabled: boolean): void => {
  biometricEnabled = enabled;
  AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false').catch(() => {});
};

export const isBiometricEnabled = (): boolean => biometricEnabled;

export const getPrivacySecuritySettings = (): PrivacySecuritySettings => ({...privacySettings});

export const updatePrivacySecuritySettings = (
  patch: Partial<PrivacySecuritySettings>,
): PrivacySecuritySettings => {
  privacySettings = {...privacySettings, ...patch};
  AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(privacySettings)).catch(() => {});
  return {...privacySettings};
};
