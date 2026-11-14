import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {
  PIN_LENGTH,
  authenticateBiometric,
  beginPinSetup,
  cancelPinSetup,
  confirmAndSavePin,
  disableBiometricCredential,
  disableStoredPin,
  enableBiometricCredential,
  getAvailableBiometry,
  hasBiometricCredential,
  hasStoredPin,
  isBiometricPromptActive,
  verifyPin,
} from '../appSecurityService';
import i18n from '../../i18n';
import {PinLockedError, recordPinSuccess, resetPinAttemptsMemoryForTests} from '../pinAttemptLimiter';

// PHASE 3 — the whole-app lock (appSecurityService.ts, Keychain-backed): PIN create / verify / change / remove, and the biometric credential.
// Complements appSecurityServiceBiometricPrompt.test.ts (prompt language) and securityPreferencesKeychainSafety.test.ts (the lock policy):
// this file is about what the service itself stores, refuses and releases. Local in-memory Keychain, with failure switches.

const PIN_SERVICE = 'com.hawa.app-lock.pin';
const BIOMETRIC_SERVICE = 'com.hawa.app-lock.biometric';

const mockStore = new Map<string, {username: string; password: string; options: Record<string, unknown>}>();
const mockSwitches = {
  setReturnsFalse: false,
  biometricDenied: false, // the person cancels / fails the system prompt: a protected read returns false
  biometryType: null as string | null,
  holdBiometricRead: null as null | (() => Promise<void>),
  holdSet: null as null | (() => Promise<void>),
};

jest.mock('react-native-keychain', () => ({
  __esModule: true,
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly'},
  ACCESS_CONTROL: {BIOMETRY_CURRENT_SET: 'BiometryCurrentSet', BIOMETRY_ANY: 'BiometryAny'},
  BIOMETRY_TYPE: {FACE_ID: 'FaceID', TOUCH_ID: 'TouchID', FINGERPRINT: 'Fingerprint', FACE: 'Face', IRIS: 'Iris'},
  getSupportedBiometryType: jest.fn(async () => mockSwitches.biometryType),
  hasGenericPassword: jest.fn(async (options?: {service?: string}) => mockStore.has(options?.service ?? 'default')),
  getGenericPassword: jest.fn(async (options?: {service?: string; authenticationPrompt?: unknown}) => {
    const service = options?.service ?? 'default';
    if (service === 'com.hawa.app-lock.biometric') {
      if (mockSwitches.holdBiometricRead) {await mockSwitches.holdBiometricRead();}
      if (mockSwitches.biometricDenied) {return false;}
    }
    const stored = mockStore.get(service);
    return stored ? {service, username: stored.username, password: stored.password, storage: 'mock'} : false;
  }),
  setGenericPassword: jest.fn(async (username: string, password: string, options?: {service?: string}) => {
    if (mockSwitches.holdSet) {await mockSwitches.holdSet();}
    if (mockSwitches.setReturnsFalse) {return false;}
    const service = options?.service ?? 'default';
    mockStore.set(service, {username, password, options: (options ?? {}) as Record<string, unknown>});
    return {service, storage: 'mock'};
  }),
  resetGenericPassword: jest.fn(async (options?: {service?: string}) => {
    mockStore.delete(options?.service ?? 'default');
    return true;
  }),
}));

const setPin = async (pin: string) => {
  expect(beginPinSetup(pin)).toBe(true);
  expect(await confirmAndSavePin(pin)).toBe('success');
};

let appStateListener: ((state: string) => void) | undefined;
beforeAll(() => {
  // registered when the service is imported: read it before any test clears the mock's calls
  appStateListener = (AppState.addEventListener as jest.Mock).mock.calls.find(([type]) => type === 'change')?.[1];
});

beforeEach(async () => {
  await AsyncStorage.clear(); // the wrong-entry counter is persisted: every test starts with a clean one
  resetPinAttemptsMemoryForTests();
  mockSwitches.holdSet = null;
  mockStore.clear();
  mockSwitches.setReturnsFalse = false;
  mockSwitches.biometricDenied = false;
  mockSwitches.biometryType = null;
  mockSwitches.holdBiometricRead = null;
  cancelPinSetup();
  jest.clearAllMocks();
  await i18n.changeLanguage('fr');
});

describe('PIN creation', () => {
  it(`only a ${PIN_LENGTH}-digit numeric code is accepted to start a setup`, async () => {
    for (const bad of ['', '1', '123', '12345', 'abcd', '12a4', ' 1234', '1234 ', '12.4', '١٢٣٤']) {
      expect([bad, beginPinSetup(bad)]).toEqual([bad, false]);
    }
    // nothing was held for confirmation, so nothing can be saved
    expect(await confirmAndSavePin('1234')).toBe('missing');
    expect(await hasStoredPin()).toBe(false);
    expect(beginPinSetup('0000')).toBe(true); // leading zeros are a valid code
  });

  it('a matching confirmation stores the code under the App-Lock service, readable only while unlocked on this device', async () => {
    await setPin('4821');
    expect(await hasStoredPin()).toBe(true);
    const saved = mockStore.get(PIN_SERVICE);
    expect(saved?.password).toBe('4821');
    expect(saved?.options.accessible).toBe(Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY);
    // the whole-app lock never touches the other (private-section) service
    expect(Array.from(mockStore.keys())).toEqual([PIN_SERVICE]);
  });

  it('a mismatching confirmation stores nothing and forgets the first entry (a later correct confirmation cannot reuse it)', async () => {
    expect(beginPinSetup('1111')).toBe(true);
    expect(await confirmAndSavePin('2222')).toBe('mismatch');
    expect(await hasStoredPin()).toBe(false);
    expect(await confirmAndSavePin('1111')).toBe('missing');
    expect(await hasStoredPin()).toBe(false);
  });

  it('cancelling a setup forgets the entry', async () => {
    expect(beginPinSetup('1357')).toBe(true);
    cancelPinSetup();
    expect(await confirmAndSavePin('1357')).toBe('missing');
    expect(await hasStoredPin()).toBe(false);
  });

  it('a confirmation can only be used once', async () => {
    await setPin('2468');
    expect(await confirmAndSavePin('2468')).toBe('missing');
  });

  it('when the Keychain refuses to store the code the result is "missing" and no lock is created', async () => {
    mockSwitches.setReturnsFalse = true;
    expect(beginPinSetup('9753')).toBe(true);
    expect(await confirmAndSavePin('9753')).toBe('missing');
    expect(await hasStoredPin()).toBe(false);
    expect(await verifyPin('9753')).toBe(false);
  });
});

describe('the code awaiting confirmation is forgotten', () => {
  it('after a Keychain exception: a later confirmation needs a new entry, and nothing was stored', async () => {
    expect(beginPinSetup('1234')).toBe(true);
    (Keychain.setGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable'));
    await expect(confirmAndSavePin('1234')).rejects.toThrow('keystore unavailable');
    expect(await confirmAndSavePin('1234')).toBe('missing');
    expect(await hasStoredPin()).toBe(false);
    expect(beginPinSetup('1234')).toBe(true); // typing it again works
    expect(await confirmAndSavePin('1234')).toBe('success');
  });

  it('after a refusal (the Keychain answers false) too', async () => {
    mockSwitches.setReturnsFalse = true;
    expect(beginPinSetup('1234')).toBe(true);
    expect(await confirmAndSavePin('1234')).toBe('missing');
    mockSwitches.setReturnsFalse = false;
    expect(await confirmAndSavePin('1234')).toBe('missing');
    expect(await hasStoredPin()).toBe(false);
  });

  it('is not erased before the save is over: the in-flight save completes with the right code', async () => {
    let release!: () => void;
    mockSwitches.holdSet = () => new Promise<void>(resolve => {release = resolve;});
    expect(beginPinSetup('2468')).toBe(true);
    const saving = confirmAndSavePin('2468');
    await Promise.resolve();
    appStateListener?.('background'); // the app leaves while the Keychain is still writing
    release();
    expect(await saving).toBe('success');
    expect(mockStore.get(PIN_SERVICE)?.password).toBe('2468');
    mockSwitches.holdSet = null;
    expect(await confirmAndSavePin('2468')).toBe('missing'); // and it is gone once the attempt is over
  });

  it('is forgotten when the app goes to the background: coming back requires typing it again', async () => {
    expect(appStateListener).toBeDefined();
    expect(beginPinSetup('1357')).toBe(true);
    appStateListener!('background');
    appStateListener!('active');
    expect(await confirmAndSavePin('1357')).toBe('missing');
    expect(await hasStoredPin()).toBe(false);
  });

  it('is kept while the app stays active', async () => {
    expect(beginPinSetup('1357')).toBe(true);
    appStateListener!('active');
    expect(await confirmAndSavePin('1357')).toBe('success');
  });
});

describe('PIN verification, change and removal', () => {
  it('verifies the right code and refuses wrong, empty, partial and longer ones', async () => {
    await setPin('1234');
    expect(await verifyPin('1234')).toBe(true);
    for (const wrong of ['0000', '4321', '', '123', '12345', '1234 ', 'abcd']) {
      expect([wrong, await verifyPin(wrong)]).toEqual([wrong, false]);
      await recordPinSuccess('appLock'); // (the wait after five wrong entries is covered below: keep each of these independent of it)
    }
  });

  it('with no code stored nothing verifies — not even an empty string', async () => {
    expect(await verifyPin('1234')).toBe(false);
    expect(await verifyPin('')).toBe(false);
  });

  it('wrong attempts never alter or erase the stored code', async () => {
    await setPin('1234');
    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect(await verifyPin(String(1000 + attempt))).toBe(false);
    }
    expect(await verifyPin('1234')).toBe(true);
    expect(mockStore.get(PIN_SERVICE)?.password).toBe('1234');
  });

  it('changing the code: the old one stops working, the new one works', async () => {
    await setPin('1234');
    expect(await verifyPin('1234')).toBe(true); // the identity check the sheet makes first
    await setPin('5678');
    expect(await verifyPin('1234')).toBe(false);
    expect(await verifyPin('5678')).toBe(true);
  });

  it('removing the code needs the current code: a wrong one leaves the lock in place', async () => {
    await setPin('1234');
    expect(await disableStoredPin('0000')).toBe(false);
    expect(await hasStoredPin()).toBe(true);
    expect(await verifyPin('1234')).toBe(true);
  });

  it('removing the code with the right one deletes it for good', async () => {
    await setPin('1234');
    expect(await disableStoredPin('1234')).toBe(true);
    expect(await hasStoredPin()).toBe(false);
    expect(await verifyPin('1234')).toBe(false);
    expect(mockStore.size).toBe(0);
  });

  it('removing a code that was never set does nothing and reports a refusal', async () => {
    expect(await disableStoredPin('1234')).toBe(false);
    expect(mockStore.size).toBe(0);
  });

  it('a Keychain failure during verification rejects instead of answering "correct"', async () => {
    await setPin('1234');
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable'));
    await expect(verifyPin('1234')).rejects.toThrow('keystore unavailable');
  });
});

describe('repeated wrong codes: the wait', () => {
  const wrongTimes = async (times: number) => {
    for (let index = 0; index < times; index += 1) {
      expect(await verifyPin('0000')).toBe(false);
    }
  };

  it('the fifth wrong code in a row locks verification: even the right code is then refused, without reading the Keychain', async () => {
    await setPin('1234');
    await wrongTimes(5);
    (Keychain.getGenericPassword as jest.Mock).mockClear();
    const error = await verifyPin('1234').then(
      () => null,
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(PinLockedError);
    expect((error as PinLockedError).scope).toBe('appLock');
    expect((error as PinLockedError).remainingMs).toBeGreaterThan(25_000);
    expect(Keychain.getGenericPassword).not.toHaveBeenCalled();
    expect(mockStore.get(PIN_SERVICE)?.password).toBe('1234'); // nothing was erased
  });

  it('four wrong codes then the right one: no wait, and the counter starts again from zero', async () => {
    await setPin('1234');
    await wrongTimes(4);
    expect(await verifyPin('1234')).toBe(true);
    await wrongTimes(4);
    expect(await verifyPin('1234')).toBe(true);
  });

  it('after the wait the right code works again and clears the counter', async () => {
    await setPin('1234');
    await wrongTimes(5);
    const realNow = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(realNow + 31_000);
    try {
      expect(await verifyPin('1234')).toBe(true);
      clock.mockReturnValue(realNow + 32_000);
      await wrongTimes(4); // a fresh count: four free entries again
      expect(await verifyPin('1234')).toBe(true);
    } finally {
      clock.mockRestore();
    }
  });

  it('the wait survives a restart of the app', async () => {
    await setPin('1234');
    await wrongTimes(5);
    resetPinAttemptsMemoryForTests(); // cold start: only the disk is left
    await expect(verifyPin('1234')).rejects.toBeInstanceOf(PinLockedError);
  });

  it('removing the PIN counts wrong codes too, and is refused during the wait', async () => {
    await setPin('1234');
    for (let index = 0; index < 5; index += 1) {
      expect(await disableStoredPin('0000')).toBe(false);
    }
    await expect(disableStoredPin('1234')).rejects.toBeInstanceOf(PinLockedError);
    expect(await hasStoredPin()).toBe(true);
  });

  it('with no PIN stored there is nothing to guess: nothing is counted', async () => {
    for (let index = 0; index < 12; index += 1) {
      expect(await verifyPin('0000')).toBe(false);
    }
    await setPin('1234');
    expect(await verifyPin('1234')).toBe(true);
  });

  it('a Keychain error is not a wrong code: it is not counted', async () => {
    await setPin('1234');
    for (let index = 0; index < 8; index += 1) {
      (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable'));
      await expect(verifyPin('1234')).rejects.toThrow('keystore unavailable');
    }
    expect(await verifyPin('1234')).toBe(true);
  });

  it('a storage error on the counter never blocks a right code', async () => {
    await setPin('1234');
    const realGet = (AsyncStorage.getItem as jest.Mock).getMockImplementation();
    const realSet = (AsyncStorage.setItem as jest.Mock).getMockImplementation();
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage unavailable'));
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('disk full'));
    try {
      expect(await verifyPin('1234')).toBe(true);
    } finally {
      (AsyncStorage.getItem as jest.Mock).mockImplementation(realGet);
      (AsyncStorage.setItem as jest.Mock).mockImplementation(realSet);
    }
  });
});

describe('biometric capability and credential', () => {
  it('reports no capability when the phone has no biometrics, and refuses to create a credential', async () => {
    expect(await getAvailableBiometry()).toBeNull();
    expect(await enableBiometricCredential()).toBe(false);
    expect(await hasBiometricCredential()).toBe(false);
    expect(mockStore.size).toBe(0);
  });

  it.each([
    ['FaceID', 'biometrics.faceId', 'biometrics.useFaceId'],
    ['TouchID', 'biometrics.touchId', 'biometrics.useTouchId'],
    ['Fingerprint', 'biometrics.fingerprintLabel', 'biometrics.useFingerprint'],
    ['Iris', 'biometrics.genericLabel', 'biometrics.useGeneric'],
  ])('describes %s with its own localized label and action', async (type, labelKey, actionKey) => {
    mockSwitches.biometryType = type;
    expect(await getAvailableBiometry()).toEqual({type, label: i18n.t(labelKey), actionLabel: i18n.t(actionKey)});
  });

  it('creates the credential bound to the CURRENT biometric set, then proves it by reading it back', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    expect(await enableBiometricCredential()).toBe(true);
    expect(await hasBiometricCredential()).toBe(true);
    const saved = mockStore.get(BIOMETRIC_SERVICE);
    expect(saved?.options.accessControl).toBe(Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET);
    expect(saved?.options.accessible).toBe(Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY);
    expect(mockStore.has(PIN_SERVICE)).toBe(false); // independent from the PIN
  });

  it('declining the system prompt while enabling reports failure, and never reports success', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    mockSwitches.biometricDenied = true;
    expect(await enableBiometricCredential()).toBe(false);
    expect(isBiometricPromptActive()).toBe(false);
  });

  it('a Keychain that refuses to store the credential reports failure', async () => {
    mockSwitches.biometryType = 'Fingerprint';
    mockSwitches.setReturnsFalse = true;
    expect(await enableBiometricCredential()).toBe(false);
    expect(await hasBiometricCredential()).toBe(false);
  });
});

describe('biometric unlock', () => {
  beforeEach(async () => {
    mockSwitches.biometryType = 'Fingerprint';
    await enableBiometricCredential();
  });

  it('succeeds when the system prompt is passed, and fails when it is declined', async () => {
    expect(await authenticateBiometric()).toBe(true);
    mockSwitches.biometricDenied = true;
    expect(await authenticateBiometric()).toBe(false);
  });

  it('a second prompt while one is open is refused, and the flag is released afterwards', async () => {
    let release!: () => void;
    mockSwitches.holdBiometricRead = () => new Promise<void>(resolve => {release = resolve;});
    const first = authenticateBiometric();
    await Promise.resolve();
    expect(isBiometricPromptActive()).toBe(true);
    await expect(authenticateBiometric()).rejects.toThrow('PROMPT_ACTIVE');
    release();
    expect(await first).toBe(true);
    expect(isBiometricPromptActive()).toBe(false);
    mockSwitches.holdBiometricRead = null;
    expect(await authenticateBiometric()).toBe(true); // usable again
  });

  it('a Keychain error during the prompt rejects and still releases the flag (no permanent lock-up)', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('sensor failure'));
    await expect(authenticateBiometric()).rejects.toThrow('sensor failure');
    expect(isBiometricPromptActive()).toBe(false);
    expect(await authenticateBiometric()).toBe(true);
  });

  it('turning the biometric lock off needs a successful prompt: a declined one keeps the credential', async () => {
    mockSwitches.biometricDenied = true;
    expect(await disableBiometricCredential()).toBe(false);
    expect(await hasBiometricCredential()).toBe(true);
    mockSwitches.biometricDenied = false;
    expect(await disableBiometricCredential()).toBe(true);
    expect(await hasBiometricCredential()).toBe(false);
  });
});
