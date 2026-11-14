import * as Keychain from 'react-native-keychain';
import {sha256} from 'js-sha256';
import {bytesToHex} from '@noble/ciphers/utils.js';
import i18n from '../i18n';
import {MAX_KDF_ITERATIONS, derivePassphraseKey, randomSaltHex} from './passphraseKdf';
import {assertPinNotLocked, recordPinFailure, recordPinSuccess} from './pinAttemptLimiter';

// The "Vie intime" / private-sections gate: its own PIN and its own biometric session, independent from the whole-app lock (appSecurityService.ts).
//
// PIN verifier. Two formats live side by side:
//  - v1 (legacy, service PIN_SERVICE): {salt, hash} with hash = SHA-256(salt:pin:hawa-intimacy), a single round.
//  - v2 (service PIN_SERVICE_V2): {v: 2, kdf: 'pbkdf2-sha256', iter, salt, hash}, PBKDF2-HMAC-SHA256 computed natively (passphraseKdf.ts), random salt.
// A v1 verifier is never rewritten on its own: it is migrated only right after the right PIN was typed (the only moment the PIN is known), and the
// v1 entry is removed only once the v2 entry has been read back and checked. If anything fails half-way, the v1 entry stays valid. Whenever a v2
// entry exists it is the only one consulted, so a stale v1 entry left by an interrupted clean-up can never reopen an old PIN.
//
// Biometrics. The session credential is bound to the CURRENT biometric set (enrolling another finger or face invalidates it), with no fallback to
// the phone's own unlock code: the private PIN is the fallback. It is created ONLY when she turns the setting on (enablePrivateBiometry), and
// authenticateWithBiometry() only reads it — it never recreates a credential, otherwise a freshly enrolled finger would simply re-arm it.

const PIN_SERVICE = 'com.hawa.private.intimacy.pin';
const PIN_SERVICE_V2 = 'com.hawa.private.intimacy.pin.v2';
/** Legacy session credential (bound to biometrics OR the device passcode): superseded, removed when the new one is created or the setting is turned off. */
const LEGACY_BIOMETRIC_SERVICE = 'com.hawa.private.intimacy.biometric';
const BIOMETRIC_SERVICE = 'com.hawa.private.intimacy.biometric.v2';

/** PBKDF2 cost of the private PIN verifier, paid on every attempt. Chosen below the backup passphrase cost (600,000) because it runs at each entry;
 * its wall-clock time on a Samsung Galaxy A13-class phone has NOT been measured yet (needs a build on a test device). */
export const PRIVATE_PIN_KDF_ITERATIONS = 200_000;
let iterationOverride: number | null = null;
/** Test-only: a cheap iteration count for suites that type many PINs (the production value is never lowered at runtime). */
export const __setPrivatePinKdfIterationsForTests = (iterations: number | null): void => {
  iterationOverride = iterations;
};
const kdfIterations = (): number => iterationOverride ?? PRIVATE_PIN_KDF_ITERATIONS;

type VerifierV2 = {v: 2; kdf: 'pbkdf2-sha256'; iter: number; salt: string; hash: string};

const legacyHash = (salt: string, pin: string): string => sha256(`${salt}:${pin}:hawa-intimacy`);

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) {return false;}
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {diff += a.charCodeAt(i) === b.charCodeAt(i) ? 0 : 1;}
  return diff === 0;
}

async function buildVerifierV2(pin: string): Promise<VerifierV2> {
  const salt = randomSaltHex();
  const iter = kdfIterations();
  return {v: 2, kdf: 'pbkdf2-sha256', iter, salt, hash: bytesToHex(await derivePassphraseKey(pin, salt, iter))};
}

function parseVerifierV2(raw: string): VerifierV2 | null {
  try {
    const value = JSON.parse(raw) as Partial<VerifierV2> | null;
    if (!value || value.v !== 2 || value.kdf !== 'pbkdf2-sha256') {return null;}
    if (typeof value.salt !== 'string' || typeof value.hash !== 'string') {return null;}
    if (!Number.isInteger(value.iter) || (value.iter as number) < 1 || (value.iter as number) > MAX_KDF_ITERATIONS) {return null;}
    return value as VerifierV2;
  } catch {return null;}
}

async function matchesV2(verifier: VerifierV2, pin: string): Promise<boolean> {
  return sameText(bytesToHex(await derivePassphraseKey(pin, verifier.salt, verifier.iter)), verifier.hash);
}

function matchesLegacy(raw: string, pin: string): boolean | null {
  try {
    const {salt, hash} = JSON.parse(raw) as {salt: string; hash: string};
    if (typeof salt !== 'string' || typeof hash !== 'string') {return null;}
    return sameText(legacyHash(salt, pin), hash);
  } catch {return null;}
}

/** Writes the v2 verifier, reads it back, and only then removes the v1 entry. Throws if the new verifier cannot be stored or confirmed
 * (the new entry is then removed and the v1 entry is left untouched). */
async function writeVerifierV2AndRetireV1(pin: string): Promise<void> {
  const verifier = await buildVerifierV2(pin);
  const serialized = JSON.stringify(verifier);
  await Keychain.setGenericPassword('intimacy-pin-verifier-v2', serialized, {
    service: PIN_SERVICE_V2,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  const written = await Keychain.getGenericPassword({service: PIN_SERVICE_V2});
  if (!written || written.password !== serialized) {
    await Keychain.resetGenericPassword({service: PIN_SERVICE_V2}).catch(() => undefined);
    throw new Error('private PIN verifier could not be confirmed');
  }
  await Keychain.resetGenericPassword({service: PIN_SERVICE}).catch(() => undefined);
}

export async function hasPrivatePin(): Promise<boolean> {
  return Boolean(await Keychain.getGenericPassword({service: PIN_SERVICE_V2})) || Boolean(await Keychain.getGenericPassword({service: PIN_SERVICE}));
}

export async function savePrivatePin(pin: string): Promise<void> {
  await writeVerifierV2AndRetireV1(pin);
}

// Throws PinLockedError while the wait that follows repeated wrong entries is running (pinAttemptLimiter.ts). Only a wrong entry against a
// verifier that can be read is counted: no PIN stored, or an unreadable verifier, is not something she can fix by trying again.
export async function verifyPrivatePin(pin: string): Promise<boolean> {
  await assertPinNotLocked('privateSection');
  const current = await Keychain.getGenericPassword({service: PIN_SERVICE_V2});
  if (current) {
    const verifier = parseVerifierV2(current.password);
    if (!verifier) {return false;}
    const ok = await matchesV2(verifier, pin);
    if (ok) {
      await recordPinSuccess('privateSection');
      // a v1 entry still there is a stale leftover (an interrupted clean-up): the v2 PIN is now confirmed, so it can go
      await Keychain.resetGenericPassword({service: PIN_SERVICE}).catch(() => undefined);
    } else {
      await recordPinFailure('privateSection');
    }
    return ok;
  }
  const legacy = await Keychain.getGenericPassword({service: PIN_SERVICE});
  if (!legacy) {return false;}
  const ok = matchesLegacy(legacy.password, pin);
  if (ok === null) {return false;}
  if (!ok) {
    await recordPinFailure('privateSection');
    return false;
  }
  await recordPinSuccess('privateSection');
  try {
    await writeVerifierV2AndRetireV1(pin); // upgrade now that the PIN is known; on any failure the v1 entry stays valid
  } catch {
    // nothing to report to her: she is unlocked, and the next successful entry tries again
  }
  return true;
}

export async function getBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
  return Keychain.getSupportedBiometryType();
}

// The device-type name alone (no "Use "/"Utiliser " prefix) — the one place
// that name is produced, so PrivateIntimacyFaceIdScreen's page title never
// needs to fragile-parse it back out of the full button label (which used to
// regex-strip a French-only "Utiliser " prefix — broken for any other
// language).
export function getBiometryDeviceName(type: Keychain.BIOMETRY_TYPE | null): string {
  if (type === Keychain.BIOMETRY_TYPE.FACE || type === Keychain.BIOMETRY_TYPE.FACE_ID) {return 'Face ID';}
  if (type === Keychain.BIOMETRY_TYPE.FINGERPRINT || type === Keychain.BIOMETRY_TYPE.TOUCH_ID) {return i18n.t('privateSectionAuth.fingerprint');}
  return i18n.t('privateSectionAuth.biometrics');
}

export function getBiometryLabel(type: Keychain.BIOMETRY_TYPE | null): string {
  return i18n.t('privateSectionAuth.useBiometryLabel', {device: getBiometryDeviceName(type)});
}

export function getBiometryIcon(type: Keychain.BIOMETRY_TYPE | null): string {
  if (type === Keychain.BIOMETRY_TYPE.FACE || type === Keychain.BIOMETRY_TYPE.FACE_ID) {return 'face-recognition';}
  if (type === Keychain.BIOMETRY_TYPE.FINGERPRINT || type === Keychain.BIOMETRY_TYPE.TOUCH_ID) {return 'fingerprint';}
  if (type === Keychain.BIOMETRY_TYPE.IRIS) {return 'eye-outline';}
  if (type === Keychain.BIOMETRY_TYPE.OPTIC_ID) {return 'eye-outline';}
  return 'shield-lock-outline';
}

// Built at call time, so a runtime language switch shows on the very next prompt.
function authenticationPrompt() {
  return {
    title: i18n.t('privateSectionAuth.promptTitle'),
    subtitle: i18n.t('privateSectionAuth.promptSubtitle'),
    cancel: i18n.t('privateSectionAuth.promptCancel'),
  };
}

/** Whether the biometric session credential exists on this phone (not whether it still works: that needs the prompt). */
export async function hasPrivateBiometryCredential(): Promise<boolean> {
  return Keychain.hasGenericPassword({service: BIOMETRIC_SERVICE});
}

/** Turns the private biometric unlock ON: creates a credential bound to the current biometric set and proves it with one prompt. The legacy
 * credential (which accepted the phone's unlock code) is removed once the new one works. False — with nothing left behind — when the phone has no
 * biometrics, the prompt is declined, or the credential cannot be stored. Only the settings screen calls this. */
export async function enablePrivateBiometry(): Promise<boolean> {
  if (!(await getBiometryType())) {return false;}
  const prompt = authenticationPrompt();
  await Keychain.resetGenericPassword({service: BIOMETRIC_SERVICE});
  const saved = await Keychain.setGenericPassword('intimacy-biometric', `session-${Date.now()}`, {
    service: BIOMETRIC_SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: prompt,
  });
  if (!saved) {return false;}
  const verified = await Keychain.getGenericPassword({
    service: BIOMETRIC_SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    authenticationPrompt: prompt,
  });
  if (!verified) {
    await Keychain.resetGenericPassword({service: BIOMETRIC_SERVICE}).catch(() => undefined);
    return false;
  }
  await Keychain.resetGenericPassword({service: LEGACY_BIOMETRIC_SERVICE}).catch(() => undefined);
  return true;
}

/** The unlock itself: one biometric prompt on the existing credential. It NEVER creates one — after a change of enrolled fingers or faces (or when
 * the setting was never turned on) it simply answers false and the private PIN is used. */
export async function authenticateWithBiometry(): Promise<boolean> {
  const verified = await Keychain.getGenericPassword({
    service: BIOMETRIC_SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    authenticationPrompt: authenticationPrompt(),
  });
  return Boolean(verified);
}

/** Turns the private biometric unlock OFF after one successful prompt. The legacy credential is removed as well. */
export async function disablePrivateBiometry(): Promise<boolean> {
  if (!(await authenticateWithBiometry())) {return false;}
  await Keychain.resetGenericPassword({service: BIOMETRIC_SERVICE});
  await Keychain.resetGenericPassword({service: LEGACY_BIOMETRIC_SERVICE}).catch(() => undefined);
  return true;
}
