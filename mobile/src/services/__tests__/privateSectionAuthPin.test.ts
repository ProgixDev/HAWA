import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {sha256} from 'js-sha256';

import {
  PRIVATE_PIN_KDF_ITERATIONS,
  __setPrivatePinKdfIterationsForTests,
  authenticateWithBiometry,
  disablePrivateBiometry,
  enablePrivateBiometry,
  getBiometryDeviceName,
  getBiometryIcon,
  getBiometryLabel,
  hasPrivateBiometryCredential,
  hasPrivatePin,
  savePrivatePin,
  verifyPrivatePin,
} from '../privateSectionAuth';
import {PinLockedError, getPinLockoutRemainingMs, recordPinSuccess, resetPinAttemptsMemoryForTests} from '../pinAttemptLimiter';
import {beginPinSetup, confirmAndSavePin, hasStoredPin} from '../appSecurityService';
import i18n from '../../i18n';

// PHASE 3 follow-up — the "Vie intime" / private-sections gate (privateSectionAuth.ts): its own PIN verifier (v2 = PBKDF2, with the legacy SHA-256
// v1 still readable and migrated after a right entry), its wait after repeated wrong entries, and its own biometric credential (current biometric
// set only, never created by an unlock, no fallback to the phone's code). Local in-memory Keychain with failure switches.

const PIN_V1 = 'com.hawa.private.intimacy.pin';
const PIN_V2 = 'com.hawa.private.intimacy.pin.v2';
const BIO_LEGACY = 'com.hawa.private.intimacy.biometric';
const BIO_V2 = 'com.hawa.private.intimacy.biometric.v2';
const APP_LOCK_PIN = 'com.hawa.app-lock.pin';

const mockStore = new Map<string, {username: string; password: string; options: Record<string, unknown>}>();
const mockSwitches = {
  biometricDenied: false,
  biometryType: null as string | null,
  failSetFor: null as string | null,
  garbleWriteFor: null as string | null,
  setReturnsFalse: false,
};

jest.mock('react-native-keychain', () => ({
  __esModule: true,
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly'},
  ACCESS_CONTROL: {BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BiometryAnyOrDevicePasscode', BIOMETRY_CURRENT_SET: 'BiometryCurrentSet'},
  BIOMETRY_TYPE: {FACE_ID: 'FaceID', TOUCH_ID: 'TouchID', FINGERPRINT: 'Fingerprint', FACE: 'Face', IRIS: 'Iris', OPTIC_ID: 'OpticID'},
  getSupportedBiometryType: jest.fn(async () => mockSwitches.biometryType),
  hasGenericPassword: jest.fn(async (options?: {service?: string}) => mockStore.has(options?.service ?? 'default')),
  getGenericPassword: jest.fn(async (options?: {service?: string}) => {
    const service = options?.service ?? 'default';
    if (service === 'com.hawa.private.intimacy.biometric.v2' && mockSwitches.biometricDenied) {return false;}
    const stored = mockStore.get(service);
    return stored ? {service, username: stored.username, password: stored.password, storage: 'mock'} : false;
  }),
  setGenericPassword: jest.fn(async (username: string, password: string, options?: {service?: string}) => {
    const service = options?.service ?? 'default';
    if (mockSwitches.failSetFor === service) {throw new Error('keystore write failure');}
    if (mockSwitches.setReturnsFalse) {return false;}
    mockStore.set(service, {username, password: mockSwitches.garbleWriteFor === service ? `${password} ` : password, options: (options ?? {}) as Record<string, unknown>});
    return {service, storage: 'mock'};
  }),
  resetGenericPassword: jest.fn(async (options?: {service?: string}) => {
    mockStore.delete(options?.service ?? 'default');
    return true;
  }),
}));

const legacyVerifier = (pin: string, salt = 'legacy-salt-123') => JSON.stringify({salt, hash: sha256(`${salt}:${pin}:hawa-intimacy`)});
const putLegacy = (pin: string) => mockStore.set(PIN_V1, {username: 'intimacy-pin-verifier', password: legacyVerifier(pin), options: {}});
const wrongTimes = async (times: number, pin = '000000') => {
  for (let index = 0; index < times; index += 1) {
    expect(await verifyPrivatePin(pin)).toBe(false);
  }
};
const realStorage = {
  getItem: (AsyncStorage.getItem as jest.Mock).getMockImplementation(),
  setItem: (AsyncStorage.setItem as jest.Mock).getMockImplementation(),
  removeItem: (AsyncStorage.removeItem as jest.Mock).getMockImplementation(),
};

beforeEach(async () => {
  mockStore.clear();
  Object.assign(mockSwitches, {biometricDenied: false, biometryType: null, failSetFor: null, garbleWriteFor: null, setReturnsFalse: false});
  await AsyncStorage.clear();
  resetPinAttemptsMemoryForTests();
  __setPrivatePinKdfIterationsForTests(1000); // cheap cost for the many entries below; the real cost has its own test
  jest.clearAllMocks();
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  __setPrivatePinKdfIterationsForTests(null);
  (AsyncStorage.getItem as jest.Mock).mockImplementation(realStorage.getItem);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(realStorage.setItem);
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(realStorage.removeItem);
});

describe('private PIN (v2: PBKDF2)', () => {
  it('has no PIN until one is saved', async () => {
    expect(await hasPrivatePin()).toBe(false);
    expect(await verifyPrivatePin('123456')).toBe(false);
  });

  it('stores a versioned PBKDF2 verifier with a random salt, never the PIN, readable only while unlocked on this device', async () => {
    await savePrivatePin('482159');
    expect(await hasPrivatePin()).toBe(true);
    const saved = mockStore.get(PIN_V2)!;
    expect(saved.password).not.toContain('482159');
    expect(saved.options.accessible).toBe(Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY);
    const verifier = JSON.parse(saved.password) as {v: number; kdf: string; iter: number; salt: string; hash: string};
    expect(verifier.v).toBe(2);
    expect(verifier.kdf).toBe('pbkdf2-sha256');
    expect(verifier.iter).toBe(1000);
    expect(verifier.salt).toMatch(/^[0-9a-f]{32}$/); // 16 random bytes
    expect(verifier.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(mockStore.has(PIN_V1)).toBe(false); // no legacy entry is written any more
  });

  it('uses the production cost by default: 200,000 PBKDF2 iterations', async () => {
    __setPrivatePinKdfIterationsForTests(null);
    expect(PRIVATE_PIN_KDF_ITERATIONS).toBe(200_000);
    await savePrivatePin('482159');
    expect((JSON.parse(mockStore.get(PIN_V2)!.password) as {iter: number}).iter).toBe(200_000);
    expect(await verifyPrivatePin('482159')).toBe(true);
    expect(await verifyPrivatePin('482150')).toBe(false);
  }, 20_000);

  it('accepts the saved PIN and refuses any other, including empty, longer and padded values', async () => {
    await savePrivatePin('482159');
    expect(await verifyPrivatePin('482159')).toBe(true);
    for (const wrong of ['000000', '482158', '', '4821590', ' 482159', 'abcdef']) {
      expect([wrong, await verifyPrivatePin(wrong)]).toEqual([wrong, false]);
      await recordPinSuccess('privateSection'); // (the wait after five wrong entries has its own tests: keep these independent of it)
    }
  });

  it('saving the same PIN twice gives two different verifiers (a fresh salt) that both verify', async () => {
    await savePrivatePin('135790');
    const first = mockStore.get(PIN_V2)!.password;
    await savePrivatePin('135790');
    expect(mockStore.get(PIN_V2)!.password).not.toBe(first);
    expect(await verifyPrivatePin('135790')).toBe(true);
  });

  it('replacing the PIN: the old one stops working', async () => {
    await savePrivatePin('111111');
    await savePrivatePin('222222');
    expect(await verifyPrivatePin('111111')).toBe(false);
    expect(await verifyPrivatePin('222222')).toBe(true);
  });

  it.each([
    ['not JSON', 'definitely-not-json'],
    ['an empty object', '{}'],
    ['a verifier without hash', '{"v":2,"kdf":"pbkdf2-sha256","iter":1000,"salt":"ab"}'],
    ['an unknown KDF', '{"v":2,"kdf":"md5","iter":1000,"salt":"ab","hash":"cd"}'],
    ['a zero cost', '{"v":2,"kdf":"pbkdf2-sha256","iter":0,"salt":"ab","hash":"cd"}'],
    ['a cost that would freeze the phone', '{"v":2,"kdf":"pbkdf2-sha256","iter":1000000000,"salt":"ab","hash":"cd"}'],
    ['a fractional cost', '{"v":2,"kdf":"pbkdf2-sha256","iter":1.5,"salt":"ab","hash":"cd"}'],
    ['null', 'null'],
  ])('an unreadable v2 verifier (%s) refuses everything, quickly, and is not counted as a wrong entry', async (_label, password) => {
    mockStore.set(PIN_V2, {username: 'x', password, options: {}});
    const started = Date.now();
    for (let index = 0; index < 8; index += 1) {
      await expect(verifyPrivatePin('123456')).resolves.toBe(false);
    }
    expect(Date.now() - started).toBeLessThan(3000);
    expect(await getPinLockoutRemainingMs('privateSection')).toBe(0);
  });

  it('is independent from the whole-app lock PIN, in both directions', async () => {
    expect(beginPinSetup('9999')).toBe(true);
    expect(await confirmAndSavePin('9999')).toBe('success');
    expect(await hasPrivatePin()).toBe(false);
    expect(await verifyPrivatePin('999999')).toBe(false);

    await savePrivatePin('555555');
    expect(await hasStoredPin()).toBe(true);
    expect(mockStore.get(APP_LOCK_PIN)?.password).toBe('9999'); // untouched by the private PIN
  });

  it('a Keychain failure rejects instead of answering "correct", and is not counted', async () => {
    await savePrivatePin('123456');
    for (let index = 0; index < 7; index += 1) {
      (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable'));
      await expect(verifyPrivatePin('123456')).rejects.toThrow('keystore unavailable');
    }
    expect(await verifyPrivatePin('123456')).toBe(true);
  });

  it('never logs the PIN, the verifier or the key', async () => {
    const spies = (['log', 'warn', 'error', 'info', 'debug'] as const).map(level => jest.spyOn(console, level).mockImplementation(() => undefined));
    putLegacy('246810');
    await savePrivatePin('135791');
    await verifyPrivatePin('135791');
    await verifyPrivatePin('000000');
    const logged = JSON.stringify(spies.flatMap(spy => spy.mock.calls));
    spies.forEach(spy => spy.mockRestore());
    expect(logged).not.toContain('135791');
    expect(logged).not.toContain('246810');
    expect(logged).not.toContain(JSON.parse(mockStore.get(PIN_V2)!.password).hash);
  });
});

describe('migration from the legacy SHA-256 verifier', () => {
  it('the legacy PIN still opens, and the right entry upgrades the verifier: v2 written and confirmed, then v1 removed', async () => {
    putLegacy('123456');
    expect(await hasPrivatePin()).toBe(true);
    expect(await verifyPrivatePin('123456')).toBe(true);
    expect(mockStore.has(PIN_V2)).toBe(true);
    expect(mockStore.has(PIN_V1)).toBe(false);
    expect(await verifyPrivatePin('123456')).toBe(true); // now served by v2
    expect(await verifyPrivatePin('654321')).toBe(false);
  });

  it('a wrong entry against the legacy verifier changes nothing but the counter', async () => {
    putLegacy('123456');
    const before = mockStore.get(PIN_V1)!.password;
    expect(await verifyPrivatePin('000000')).toBe(false);
    expect(mockStore.get(PIN_V1)!.password).toBe(before);
    expect(mockStore.has(PIN_V2)).toBe(false);
  });

  it('if the new verifier cannot be written, she is still let in and the legacy verifier stays valid; the next right entry tries again', async () => {
    putLegacy('123456');
    mockSwitches.failSetFor = PIN_V2;
    expect(await verifyPrivatePin('123456')).toBe(true);
    expect(mockStore.has(PIN_V1)).toBe(true);
    expect(mockStore.has(PIN_V2)).toBe(false);
    mockSwitches.failSetFor = null;
    expect(await verifyPrivatePin('123456')).toBe(true);
    expect(mockStore.has(PIN_V2)).toBe(true);
    expect(mockStore.has(PIN_V1)).toBe(false);
  });

  it('if the new verifier cannot be read back as written, it is dropped and the legacy verifier is NOT removed', async () => {
    putLegacy('123456');
    mockSwitches.garbleWriteFor = PIN_V2;
    expect(await verifyPrivatePin('123456')).toBe(true);
    expect(mockStore.has(PIN_V2)).toBe(false);
    expect(mockStore.has(PIN_V1)).toBe(true);
    mockSwitches.garbleWriteFor = null;
    expect(await verifyPrivatePin('123456')).toBe(true); // and the upgrade succeeds next time
    expect(mockStore.has(PIN_V1)).toBe(false);
  });

  it('an interrupted migration (both entries exist): only v2 is consulted, so a stale legacy PIN cannot reopen the gate', async () => {
    putLegacy('111111'); // the stale entry
    await savePrivatePin('222222'); // would normally retire it...
    putLegacy('111111'); // ...but the clean-up was interrupted
    expect(await verifyPrivatePin('111111')).toBe(false);
    expect(await verifyPrivatePin('222222')).toBe(true);
    expect(mockStore.has(PIN_V1)).toBe(false); // the right v2 entry confirms the situation and the leftover goes
  });

  it('saving a new PIN over a legacy one retires the legacy entry only after the new one is confirmed', async () => {
    putLegacy('111111');
    mockSwitches.garbleWriteFor = PIN_V2;
    await expect(savePrivatePin('222222')).rejects.toThrow('could not be confirmed');
    expect(mockStore.has(PIN_V1)).toBe(true);
    expect(mockStore.has(PIN_V2)).toBe(false);
    expect(await verifyPrivatePin('111111')).toBe(true); // the old PIN still works: nothing was lost
  });

  it('an unreadable legacy verifier refuses everything, is not counted and is not "migrated"', async () => {
    mockStore.set(PIN_V1, {username: 'x', password: 'definitely-not-json', options: {}});
    for (let index = 0; index < 8; index += 1) {
      await expect(verifyPrivatePin('123456')).resolves.toBe(false);
    }
    expect(await getPinLockoutRemainingMs('privateSection')).toBe(0);
    expect(mockStore.has(PIN_V2)).toBe(false);
  });

  it('a downgraded app that no longer sees v1 simply finds no PIN to verify (documented limit): nothing is read from v2', async () => {
    putLegacy('123456');
    await verifyPrivatePin('123456');
    expect(mockStore.has(PIN_V1)).toBe(false); // what an older version would look at
  });
});

describe('wait after repeated wrong entries (private PIN only)', () => {
  beforeEach(async () => {
    await savePrivatePin('123456');
  });

  it('the fifth wrong entry starts a wait; even the right PIN is then refused, without checking it', async () => {
    await wrongTimes(5);
    (Keychain.getGenericPassword as jest.Mock).mockClear();
    const error = await verifyPrivatePin('123456').then(
      () => null,
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(PinLockedError);
    expect((error as PinLockedError).scope).toBe('privateSection');
    expect(Keychain.getGenericPassword).not.toHaveBeenCalled();
    expect(mockStore.has(PIN_V2)).toBe(true); // nothing is ever erased
  });

  it('four wrong entries then the right one: no wait', async () => {
    await wrongTimes(4);
    expect(await verifyPrivatePin('123456')).toBe(true);
    await wrongTimes(4);
    expect(await verifyPrivatePin('123456')).toBe(true);
  });

  it('does not touch the whole-app lock counter, and survives a restart', async () => {
    await wrongTimes(5);
    expect(await getPinLockoutRemainingMs('appLock')).toBe(0);
    resetPinAttemptsMemoryForTests();
    await expect(verifyPrivatePin('123456')).rejects.toBeInstanceOf(PinLockedError);
  });

  it('after the wait the right PIN opens again', async () => {
    await wrongTimes(5);
    const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 31_000);
    try {
      expect(await verifyPrivatePin('123456')).toBe(true);
    } finally {
      clock.mockRestore();
    }
  });
});

describe('private biometric credential', () => {
  const promptArgs = () => (Keychain.getGenericPassword as jest.Mock).mock.calls.map(call => call[0]);

  it('cannot be created on a phone without biometrics, and nothing is left behind', async () => {
    expect(await enablePrivateBiometry()).toBe(false);
    expect(mockStore.size).toBe(0);
  });

  it('is created bound to the CURRENT biometric set (no fallback to the phone code), proven by one prompt', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    expect(await enablePrivateBiometry()).toBe(true);
    const saved = mockStore.get(BIO_V2)!;
    expect(saved.options.accessControl).toBe(Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET);
    expect(saved.options.accessControl).not.toBe(Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE);
    expect(saved.options.accessible).toBe(Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY);
    expect(await hasPrivateBiometryCredential()).toBe(true);
    expect(promptArgs().some(args => args?.service === BIO_V2 && args.accessControl === Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET)).toBe(true);
  });

  it('turning it on retires the legacy credential (the one that accepted the phone code)', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    mockStore.set(BIO_LEGACY, {username: 'x', password: 'session-old', options: {accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE}});
    expect(await enablePrivateBiometry()).toBe(true);
    expect(mockStore.has(BIO_LEGACY)).toBe(false);
  });

  it('a declined prompt while turning it on reports failure and leaves nothing behind (the legacy credential is kept)', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    mockSwitches.biometricDenied = true;
    mockStore.set(BIO_LEGACY, {username: 'x', password: 'session-old', options: {}});
    expect(await enablePrivateBiometry()).toBe(false);
    expect(mockStore.has(BIO_V2)).toBe(false);
    expect(mockStore.has(BIO_LEGACY)).toBe(true);
  });

  it('a Keychain that refuses to store it reports failure', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    mockSwitches.setReturnsFalse = true;
    expect(await enablePrivateBiometry()).toBe(false);
    expect(await hasPrivateBiometryCredential()).toBe(false);
  });

  it('unlocking only READS the credential: it passes with the right biometrics', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    await enablePrivateBiometry();
    (Keychain.setGenericPassword as jest.Mock).mockClear();
    expect(await authenticateWithBiometry()).toBe(true);
    expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
  });

  it('with no credential (never turned on, or invalidated by a change of enrolled fingers or faces) it answers false and NEVER creates one', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    expect(await authenticateWithBiometry()).toBe(false);
    expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
    expect(mockStore.size).toBe(0);

    await enablePrivateBiometry();
    mockSwitches.biometricDenied = true; // the system no longer releases it: a new finger was enrolled
    (Keychain.setGenericPassword as jest.Mock).mockClear();
    expect(await authenticateWithBiometry()).toBe(false);
    expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
  });

  it('the legacy credential is not a way in: an old passcode-fallback credential alone never unlocks', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    mockStore.set(BIO_LEGACY, {username: 'x', password: 'session-old', options: {accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE}});
    expect(await authenticateWithBiometry()).toBe(false);
  });

  it('a declined prompt is a refusal, a Keychain error rejects', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    await enablePrivateBiometry();
    mockSwitches.biometricDenied = true;
    expect(await authenticateWithBiometry()).toBe(false);
    mockSwitches.biometricDenied = false;
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('sensor failure'));
    await expect(authenticateWithBiometry()).rejects.toThrow('sensor failure');
  });

  it('turning it off needs a successful prompt; a declined one keeps the credential, the right one removes both credentials', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    await enablePrivateBiometry();
    mockStore.set(BIO_LEGACY, {username: 'x', password: 'session-old', options: {}});
    mockSwitches.biometricDenied = true;
    expect(await disablePrivateBiometry()).toBe(false);
    expect(await hasPrivateBiometryCredential()).toBe(true);
    mockSwitches.biometricDenied = false;
    expect(await disablePrivateBiometry()).toBe(true);
    expect(await hasPrivateBiometryCredential()).toBe(false);
    expect(mockStore.has(BIO_LEGACY)).toBe(false);
  });

  it('is independent from the whole-app lock biometric credential', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    mockStore.set('com.hawa.app-lock.biometric', {username: 'awa-biometric', password: 'enabled', options: {}});
    await enablePrivateBiometry();
    await disablePrivateBiometry();
    expect(mockStore.has('com.hawa.app-lock.biometric')).toBe(true);
  });
});

describe('biometric naming and icons', () => {
  it.each([
    ['Face', 'Face ID', 'face-recognition'],
    ['FaceID', 'Face ID', 'face-recognition'],
    ['Fingerprint', null, 'fingerprint'],
    ['TouchID', null, 'fingerprint'],
    ['Iris', null, 'eye-outline'],
    ['OpticID', null, 'eye-outline'],
    [null, null, 'shield-lock-outline'],
  ])('%s → icon %s', (type, deviceName, icon) => {
    const t = type as Keychain.BIOMETRY_TYPE | null;
    if (deviceName) {expect(getBiometryDeviceName(t)).toBe(deviceName);}
    expect(getBiometryIcon(t)).toBe(icon);
    expect(getBiometryLabel(t)).toContain(getBiometryDeviceName(t));
  });

  it('fingerprint and generic names are localized, Face ID keeps its brand name', async () => {
    expect(getBiometryDeviceName(Keychain.BIOMETRY_TYPE.FINGERPRINT)).toBe(i18n.t('privateSectionAuth.fingerprint'));
    expect(getBiometryDeviceName(null)).toBe(i18n.t('privateSectionAuth.biometrics'));
    await i18n.changeLanguage('en');
    expect(getBiometryDeviceName(Keychain.BIOMETRY_TYPE.FINGERPRINT)).toBe(i18n.t('privateSectionAuth.fingerprint'));
    expect(getBiometryDeviceName(Keychain.BIOMETRY_TYPE.FACE_ID)).toBe('Face ID');
  });
});
