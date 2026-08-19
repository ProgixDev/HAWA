import {Platform} from 'react-native';
import * as Keychain from 'react-native-keychain';

export const PIN_LENGTH = 4;
const PIN_SERVICE = 'com.hawa.app-lock.pin';
const BIOMETRIC_SERVICE = 'com.hawa.app-lock.biometric';
let pendingPin: string | null = null;
let biometricPromptActive = false;

export type BiometryCapability = {type: Keychain.BIOMETRY_TYPE; label: string; actionLabel: string};

export const isBiometricPromptActive = (): boolean => biometricPromptActive;

export async function getAvailableBiometry(): Promise<BiometryCapability | null> {
  const type = await Keychain.getSupportedBiometryType();
  if (!type) {return null;}
  if (type === Keychain.BIOMETRY_TYPE.FACE_ID) {return {type, label: 'Face ID', actionLabel: 'Utiliser Face ID'};}
  if (type === Keychain.BIOMETRY_TYPE.TOUCH_ID) {return {type, label: 'Touch ID', actionLabel: 'Utiliser Touch ID'};}
  if (type === Keychain.BIOMETRY_TYPE.FINGERPRINT) {return {type, label: 'Empreinte digitale', actionLabel: 'Utiliser l’empreinte digitale'};}
  return {type, label: Platform.OS === 'ios' ? 'Biométrie' : 'Biométrie', actionLabel: 'Utiliser la biométrie'};
}

export function beginPinSetup(pin: string): boolean {
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) {return false;}
  pendingPin = pin;
  return true;
}

export function cancelPinSetup(): void {pendingPin = null;}

export async function confirmAndSavePin(confirmation: string): Promise<'success' | 'mismatch' | 'missing'> {
  const candidate = pendingPin;
  if (!candidate) {return 'missing';}
  if (candidate !== confirmation) {pendingPin = null; return 'mismatch';}
  const stored = await Keychain.setGenericPassword('awa-pin', candidate, {service: PIN_SERVICE, accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
  pendingPin = null;
  return stored ? 'success' : 'missing';
}

export async function hasStoredPin(): Promise<boolean> {return Boolean(await Keychain.getGenericPassword({service: PIN_SERVICE}));}
export async function hasBiometricCredential(): Promise<boolean> {return Keychain.hasGenericPassword({service: BIOMETRIC_SERVICE});}

export async function verifyPin(pin: string): Promise<boolean> {
  const credential = await Keychain.getGenericPassword({service: PIN_SERVICE});
  return Boolean(credential && credential.password === pin);
}

export async function disableStoredPin(pin: string): Promise<boolean> {
  if (!(await verifyPin(pin))) {return false;}
  return Keychain.resetGenericPassword({service: PIN_SERVICE});
}

const prompt = {title: 'Déverrouiller AWA', subtitle: 'Authentifie-toi pour accéder à ton espace.', cancel: 'Annuler'};

async function withBiometricPrompt<T>(operation: () => Promise<T>): Promise<T> {
  if (biometricPromptActive) {throw new Error('PROMPT_ACTIVE');}
  biometricPromptActive = true;
  try {return await operation();} finally {biometricPromptActive = false;}
}

export async function enableBiometricCredential(): Promise<boolean> {
  if (!(await getAvailableBiometry())) {return false;}
  return withBiometricPrompt(async () => {
    await Keychain.resetGenericPassword({service: BIOMETRIC_SERVICE});
    const saved = await Keychain.setGenericPassword('awa-biometric', 'enabled', {
      service: BIOMETRIC_SERVICE,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticationPrompt: prompt,
    });
    if (!saved) {return false;}
    return Boolean(await Keychain.getGenericPassword({service: BIOMETRIC_SERVICE, accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET, authenticationPrompt: prompt}));
  });
}

export async function authenticateBiometric(): Promise<boolean> {
  return withBiometricPrompt(async () => Boolean(await Keychain.getGenericPassword({service: BIOMETRIC_SERVICE, accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET, authenticationPrompt: prompt})));
}

export async function disableBiometricCredential(): Promise<boolean> {
  if (!(await authenticateBiometric())) {return false;}
  return Keychain.resetGenericPassword({service: BIOMETRIC_SERVICE});
}
