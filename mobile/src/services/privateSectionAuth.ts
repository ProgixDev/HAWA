import * as Keychain from 'react-native-keychain';
import {sha256} from 'js-sha256';

const PIN_SERVICE = 'com.hawa.private.intimacy.pin';
const BIOMETRIC_SERVICE = 'com.hawa.private.intimacy.biometric';

const randomSalt = (): string => `${Date.now()}-${Math.random()}-${Math.random()}`;
const pinHash = (pin: string, salt: string): string => sha256(`${salt}:${pin}:hawa-intimacy`);

export async function hasPrivatePin(): Promise<boolean> {
  return Boolean(await Keychain.getGenericPassword({service: PIN_SERVICE}));
}

export async function savePrivatePin(pin: string): Promise<void> {
  const salt = randomSalt();
  const verifier = JSON.stringify({salt, hash: pinHash(pin, salt)});
  await Keychain.setGenericPassword('intimacy-pin-verifier', verifier, {
    service: PIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function verifyPrivatePin(pin: string): Promise<boolean> {
  const credentials = await Keychain.getGenericPassword({service: PIN_SERVICE});
  if (!credentials) {return false;}
  try {
    const {salt, hash} = JSON.parse(credentials.password) as {salt: string; hash: string};
    return pinHash(pin, salt) === hash;
  } catch {return false;}
}

export async function getBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
  return Keychain.getSupportedBiometryType();
}

export function getBiometryLabel(type: Keychain.BIOMETRY_TYPE | null): string {
  if (type === Keychain.BIOMETRY_TYPE.FACE || type === Keychain.BIOMETRY_TYPE.FACE_ID) {return 'Utiliser Face ID';}
  if (type === Keychain.BIOMETRY_TYPE.FINGERPRINT || type === Keychain.BIOMETRY_TYPE.TOUCH_ID) {return 'Utiliser l’empreinte';}
  return 'Utiliser la biométrie';
}

export function getBiometryIcon(type: Keychain.BIOMETRY_TYPE | null): string {
  if (type === Keychain.BIOMETRY_TYPE.FACE || type === Keychain.BIOMETRY_TYPE.FACE_ID) {return 'face-recognition';}
  if (type === Keychain.BIOMETRY_TYPE.FINGERPRINT || type === Keychain.BIOMETRY_TYPE.TOUCH_ID) {return 'fingerprint';}
  if (type === Keychain.BIOMETRY_TYPE.IRIS) {return 'eye-outline';}
  if (type === Keychain.BIOMETRY_TYPE.OPTIC_ID) {return 'eye-outline';}
  return 'shield-lock-outline';
}

export async function authenticateWithBiometry(): Promise<boolean> {
  const existing = await Keychain.getGenericPassword({
    service: BIOMETRIC_SERVICE,
    authenticationPrompt: {title:'Espace privé AWA', subtitle:'Confirme ton identité pour continuer', cancel:'Annuler'},
  });
  if (existing) {return true;}
  await Keychain.setGenericPassword('intimacy-biometric', `session-${Date.now()}`, {
    service: BIOMETRIC_SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: {title:'Espace privé AWA', subtitle:'Confirme ton identité pour continuer', cancel:'Annuler'},
  });
  const verified = await Keychain.getGenericPassword({
    service: BIOMETRIC_SERVICE,
    authenticationPrompt: {title:'Espace privé AWA', subtitle:'Confirme ton identité pour continuer', cancel:'Annuler'},
  });
  return Boolean(verified);
}
