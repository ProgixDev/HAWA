import AsyncStorage from '@react-native-async-storage/async-storage';

// Phase 2 — F19: a transient Keychain failure must never disable the app lock.
//
// Before: loadSecurityPreferences() computed `pinEnabled = storedFlag && credentialExists`, with a Keychain check that
// answered `false` when the call THREW, and then wrote the result back — so one hiccup at launch set the persisted
// "PIN enabled" flag to false for good and the app opened unlocked from then on.
//
// What is preserved: the PIN credential, the persisted flags (they only change through setPinEnabled /
// setBiometricEnabled, i.e. when she changes them), backup/restore behaviour — and the case the old code existed
// for: a flag restored from a backup onto a phone that has no credential must not lock her out.
//
// Real preferences module, the Keychain-facing service mocked, a cold start per scenario.
jest.mock('../../services/appSecurityService', () => ({
  hasStoredPin: jest.fn(),
  hasBiometricCredential: jest.fn(),
}));

const PIN_KEY = '@hawa/security/pin-enabled';
const BIO_KEY = '@hawa/security/biometric-enabled';

type Prefs = typeof import('../securityPreferences');
type Service = typeof import('../../services/appSecurityService');

function coldStart(): {prefs: Prefs; service: jest.Mocked<Service>} {
  jest.resetModules();
  const service = require('../../services/appSecurityService') as jest.Mocked<Service>;
  const prefs = require('../securityPreferences') as Prefs;
  return {prefs, service};
}

/** Every write to a security flag since the test started (the shared storage mock's setItem). */
const flagWrites = (): Array<[string, string]> =>
  ((AsyncStorage.setItem as unknown as jest.Mock).mock.calls as Array<[string, string]>).filter(
    ([key]) => key === PIN_KEY || key === BIO_KEY,
  );

beforeEach(async () => {
  await AsyncStorage.clear();
  (AsyncStorage.setItem as unknown as jest.Mock).mockClear();
});

describe('PIN lock', () => {
  it('flag on + credential present: enforced, nothing written', async () => {
    await AsyncStorage.setItem(PIN_KEY, 'true');
    (AsyncStorage.setItem as unknown as jest.Mock).mockClear();
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockResolvedValue(true);
    service.hasBiometricCredential.mockResolvedValue(false);

    await prefs.loadSecurityPreferences();

    expect(prefs.isPinEnabled()).toBe(true);
    expect(prefs.requiresAppLock()).toBe(true);
    expect(flagWrites()).toEqual([]);
  });

  it('flag on + the Keychain call THROWS: the lock stays enforced and the persisted flag is untouched', async () => {
    await AsyncStorage.setItem(PIN_KEY, 'true');
    (AsyncStorage.setItem as unknown as jest.Mock).mockClear();
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockRejectedValue(new Error('keystore unavailable'));
    service.hasBiometricCredential.mockResolvedValue(false);

    await prefs.loadSecurityPreferences();

    expect(prefs.isPinEnabled()).toBe(true);
    expect(await AsyncStorage.getItem(PIN_KEY)).toBe('true');
    expect(flagWrites()).toEqual([]);
  });

  it('a hiccup on one launch does not disable the lock on the NEXT launch (nothing was persisted)', async () => {
    await AsyncStorage.setItem(PIN_KEY, 'true');
    let boot = coldStart();
    boot.service.hasStoredPin.mockRejectedValue(new Error('keystore unavailable'));
    boot.service.hasBiometricCredential.mockResolvedValue(false);
    await boot.prefs.loadSecurityPreferences();

    boot = coldStart();
    boot.service.hasStoredPin.mockResolvedValue(true);
    boot.service.hasBiometricCredential.mockResolvedValue(false);
    await boot.prefs.loadSecurityPreferences();

    expect(boot.prefs.isPinEnabled()).toBe(true);
  });

  it('flag on + credential genuinely absent (a backup restored on another phone): not enforced this session — no lockout — and still nothing written', async () => {
    await AsyncStorage.setItem(PIN_KEY, 'true');
    (AsyncStorage.setItem as unknown as jest.Mock).mockClear();
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockResolvedValue(false);
    service.hasBiometricCredential.mockResolvedValue(false);

    await prefs.loadSecurityPreferences();

    expect(prefs.isPinEnabled()).toBe(false);
    expect(prefs.requiresAppLock()).toBe(false);
    expect(flagWrites()).toEqual([]); // a single "not found" is not allowed to rewrite her choice
  });

  it('...and when the credential is there again on the next launch the lock is back (a missed read is not permanent)', async () => {
    await AsyncStorage.setItem(PIN_KEY, 'true');
    let boot = coldStart();
    boot.service.hasStoredPin.mockResolvedValue(false);
    boot.service.hasBiometricCredential.mockResolvedValue(false);
    await boot.prefs.loadSecurityPreferences();
    expect(boot.prefs.isPinEnabled()).toBe(false);

    boot = coldStart();
    boot.service.hasStoredPin.mockResolvedValue(true);
    boot.service.hasBiometricCredential.mockResolvedValue(false);
    await boot.prefs.loadSecurityPreferences();

    expect(boot.prefs.isPinEnabled()).toBe(true);
  });

  it('ONE missed read (not found once, then found) is not taken for "no credential": the lock stays on', async () => {
    await AsyncStorage.setItem(PIN_KEY, 'true');
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    service.hasBiometricCredential.mockResolvedValue(false);

    await prefs.loadSecurityPreferences();

    expect(prefs.isPinEnabled()).toBe(true);
  });

  it('a throw followed by a successful read also keeps the lock on', async () => {
    await AsyncStorage.setItem(PIN_KEY, 'true');
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockRejectedValueOnce(new Error('keystore busy')).mockResolvedValueOnce(true);
    service.hasBiometricCredential.mockResolvedValue(false);

    await prefs.loadSecurityPreferences();

    expect(prefs.isPinEnabled()).toBe(true);
  });

  it('a throw then "not found" is still UNKNOWN, not absent: the persisted choice decides (lock stays on)', async () => {
    await AsyncStorage.setItem(PIN_KEY, 'true');
    (AsyncStorage.setItem as unknown as jest.Mock).mockClear();
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockRejectedValueOnce(new Error('keystore busy')).mockResolvedValueOnce(false);
    service.hasBiometricCredential.mockResolvedValue(false);

    await prefs.loadSecurityPreferences();

    expect(prefs.isPinEnabled()).toBe(true);
    expect(flagWrites()).toEqual([]);
  });

  it('the persisted flag unreadable + credential present: enforced (a PIN exists on this phone)', async () => {
    await AsyncStorage.setItem(PIN_KEY, 'true');
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockResolvedValue(true);
    service.hasBiometricCredential.mockResolvedValue(false);
    const mocked = AsyncStorage.getItem as unknown as jest.Mock;
    const original = mocked.getMockImplementation() as (key: string) => Promise<string | null>;
    mocked.mockImplementation(async (key: string) => {
      if (key === PIN_KEY) {throw new Error('disk I/O error');}
      return original(key);
    });

    await prefs.loadSecurityPreferences();
    mocked.mockImplementation(original);

    expect(prefs.isPinEnabled()).toBe(true);
  });

  it('flag explicitly OFF + a credential present: stays off — it is never switched on by inference', async () => {
    await AsyncStorage.setItem(PIN_KEY, 'false');
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockResolvedValue(true);
    service.hasBiometricCredential.mockResolvedValue(false);

    await prefs.loadSecurityPreferences();

    expect(prefs.isPinEnabled()).toBe(false);
    expect(await AsyncStorage.getItem(PIN_KEY)).toBe('false');
  });

  it('no flag at all and nothing readable: not enforced (no evidence a lock was ever set)', async () => {
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockRejectedValue(new Error('keystore unavailable'));
    service.hasBiometricCredential.mockRejectedValue(new Error('keystore unavailable'));

    await prefs.loadSecurityPreferences();

    expect(prefs.requiresAppLock()).toBe(false);
  });
});

describe('biometric lock', () => {
  it('flag on + the Keychain call THROWS: still enabled, flag untouched', async () => {
    await AsyncStorage.setItem(BIO_KEY, 'true');
    (AsyncStorage.setItem as unknown as jest.Mock).mockClear();
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockResolvedValue(false);
    service.hasBiometricCredential.mockRejectedValue(new Error('keystore unavailable'));

    await prefs.loadSecurityPreferences();

    expect(prefs.isBiometricEnabled()).toBe(true);
    expect(await AsyncStorage.getItem(BIO_KEY)).toBe('true');
    expect(flagWrites()).toEqual([]);
  });

  it('flag on + credential absent: not enforced and not rewritten', async () => {
    await AsyncStorage.setItem(BIO_KEY, 'true');
    (AsyncStorage.setItem as unknown as jest.Mock).mockClear();
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockResolvedValue(false);
    service.hasBiometricCredential.mockResolvedValue(false);

    await prefs.loadSecurityPreferences();

    expect(prefs.isBiometricEnabled()).toBe(false);
    expect(flagWrites()).toEqual([]);
  });
});

describe('her own changes still persist', () => {
  it('setPinEnabled / setBiometricEnabled write the flag and update the lock', async () => {
    const {prefs, service} = coldStart();
    service.hasStoredPin.mockResolvedValue(false);
    service.hasBiometricCredential.mockResolvedValue(false);
    await prefs.loadSecurityPreferences();

    await prefs.setPinEnabled(true);
    await prefs.setBiometricEnabled(true);
    expect(await AsyncStorage.getItem(PIN_KEY)).toBe('true');
    expect(await AsyncStorage.getItem(BIO_KEY)).toBe('true');
    expect(prefs.requiresAppLock()).toBe(true);

    await prefs.setPinEnabled(false);
    await prefs.setBiometricEnabled(false);
    expect(await AsyncStorage.getItem(PIN_KEY)).toBe('false');
    expect(prefs.requiresAppLock()).toBe(false);
  });
});
