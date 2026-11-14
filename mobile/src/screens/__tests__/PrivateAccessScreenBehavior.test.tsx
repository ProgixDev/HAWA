import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {ActivityIndicator, Pressable, Text} from 'react-native';
import Aes from 'react-native-aes-crypto';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import * as Keychain from 'react-native-keychain';

import PrivateAccessScreen from '../PrivateAccessScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {__setPrivatePinKdfIterationsForTests, enablePrivateBiometry, hasPrivatePin, savePrivatePin, verifyPrivatePin} from '../../services/privateSectionAuth';
import {resetPinAttemptsMemoryForTests} from '../../services/pinAttemptLimiter';
import {setBiometricEnabled, setPrivateBiometricEnabled} from '../../state/securityPreferences';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import type {PrivateAccessPurpose} from '../../navigation/privateAccess';
import i18n from '../../i18n';

// PHASE 3 — the private-access gate of the pregnancy medical information and the miscarriage personal notes (PrivateAccessScreen): its own 6-digit
// PIN (created on first use, then verified), the optional biometric key, failures, and where a success leads. Real privateSectionAuth and
// securityPreferences over the in-memory Keychain of jest.setup.js; PrivateAccessScreenThemeHardening.test.tsx only covers colours.

const PRIVATE_PIN_SERVICE = 'com.hawa.private.intimacy.pin.v2';
const PRIVATE_BIOMETRIC_SERVICE = 'com.hawa.private.intimacy.biometric.v2';
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 760}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];
const realGetGenericPassword = (Keychain.getGenericPassword as jest.Mock).getMockImplementation()!;

const wait = async (ms: number) => {
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, ms));
  });
};
const flush = async () => {
  for (let index = 0; index < 14; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function mount(purpose: PrivateAccessPurpose = 'pregnancyMedicalInformation') {
  const navigation = {replace: jest.fn(), goBack: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <PrivateAccessScreen navigation={navigation as never} route={{key: 'k', name: 'PrivateAccess', params: {purpose}} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await flush();
  return {renderer, navigation};
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join('').replace(/[\u{F0000}-\u{FFFFF}]/gu, '').trim());

const keyByLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.type === Pressable && node.props.accessibilityLabel === label)[0];

async function press(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const key = keyByLabel(renderer, label);
  expect(key).toBeDefined();
  await act(async () => {
    key.props.onPress();
  });
}

async function typePin(renderer: ReactTestRenderer.ReactTestRenderer, digits: string, settleMs = 0) {
  for (const digit of digits) {
    await press(renderer, digit);
  }
  if (settleMs) {await wait(settleMs);}
  await flush();
}

const counter = (renderer: ReactTestRenderer.ReactTestRenderer): number => {
  for (let count = 0; count <= 6; count += 1) {
    if (renderer.root.findAll(node => node.props.accessibilityLabel === i18n.t('privateAccess.digitsEnteredOf', {count, total: 6})).length > 0) {return count;}
  }
  return -1;
};

const errorLine = (renderer: ReactTestRenderer.ReactTestRenderer): string =>
  renderer.root.find(node => node.props.accessibilityLiveRegion === 'polite' && typeof node.props.children === 'string').props.children.trim();

const supportBiometrics = (type: string | null) => (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(type);
const denyPrivateBiometrics = () =>
  (Keychain.getGenericPassword as jest.Mock).mockImplementation(async (options?: {service?: string}) =>
    options?.service === PRIVATE_BIOMETRIC_SERVICE ? false : realGetGenericPassword(options));

beforeEach(async () => {
  __setPrivatePinKdfIterationsForTests(1000); // cheap PBKDF2 cost: the production cost has its own test
  await AsyncStorage.clear();
  resetPinAttemptsMemoryForTests();
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await Keychain.resetGenericPassword({service: PRIVATE_PIN_SERVICE});
  await Keychain.resetGenericPassword({service: PRIVATE_BIOMETRIC_SERVICE});
  (Keychain.getGenericPassword as jest.Mock).mockImplementation(realGetGenericPassword);
  supportBiometrics(null);
  await setBiometricEnabled(false);
  await setPrivateBiometricEnabled(false);
});

afterEach(() => {
  __setPrivatePinKdfIterationsForTests(null);
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  (Keychain.getGenericPassword as jest.Mock).mockImplementation(realGetGenericPassword);
});

describe('with a PIN already set', () => {
  beforeEach(async () => {
    await savePrivatePin('123456');
  });

  it('asks for the code, with an empty entry and no biometric key', async () => {
    const {renderer} = await mount();
    expect(textsOf(renderer)).toContain(i18n.t('privateAccess.title'));
    expect(textsOf(renderer)).toContain(i18n.t('privateAccess.enterPinToContinue'));
    expect(counter(renderer)).toBe(0);
    expect(errorLine(renderer)).toBe('');
    expect(keyByLabel(renderer, i18n.t('biometrics.genericLabel'))).toBeUndefined();
  });

  it('the right code opens the pregnancy medical information', async () => {
    const {renderer, navigation} = await mount('pregnancyMedicalInformation');
    await typePin(renderer, '123456', 500);
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    expect(navigation.replace).toHaveBeenCalledWith('PregnancyMedicalInformation');
  });

  it('the right code opens the miscarriage personal notes for that purpose', async () => {
    const {renderer, navigation} = await mount('miscarriagePersonalNotes');
    await typePin(renderer, '123456', 500);
    expect(navigation.replace).toHaveBeenCalledWith('MiscarriageJournalEntry', {category: 'personalNotes'});
  });

  it('a wrong code opens nothing, says so, and empties the entry; the right code then works', async () => {
    const {renderer, navigation} = await mount();
    await typePin(renderer, '000000', 400);
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(errorLine(renderer)).toBe(i18n.t('security.incorrectCode'));
    expect(counter(renderer)).toBe(0);

    await typePin(renderer, '123456', 500);
    expect(navigation.replace).toHaveBeenCalledTimes(1);
  });

  it('repeated wrong codes never open the gate and never alter the stored code', async () => {
    const {renderer, navigation} = await mount();
    for (const wrong of ['111111', '222222', '333333', '444444']) {
      await typePin(renderer, wrong, 400);
    }
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(await verifyPrivatePin('123456')).toBe(true);
  });

  it('five wrong codes start a wait: the right code is refused with the minutes left, nothing is erased, and the wait ends on its own', async () => {
    const {renderer, navigation} = await mount();
    for (const wrong of ['111111', '222222', '333333', '444444', '555555']) {
      await typePin(renderer, wrong, 400);
    }
    expect(errorLine(renderer)).toBe(i18n.t('security.tooManyAttempts', {minutes: 1}));
    await typePin(renderer, '123456', 500);
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(await hasPrivatePin()).toBe(true);

    const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 31_000);
    try {
      expect(await verifyPrivatePin('123456')).toBe(true);
    } finally {
      clock.mockRestore();
    }
  });

  it('a shorter code is never submitted, and a delete removes the last digit', async () => {
    const {renderer, navigation} = await mount();
    await typePin(renderer, '123');
    expect(counter(renderer)).toBe(3);
    await press(renderer, i18n.t('privateAccess.deleteKey'));
    expect(counter(renderer)).toBe(2);
    await wait(300);
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(errorLine(renderer)).toBe('');
  });

  it('a seventh digit is ignored', async () => {
    const {renderer} = await mount();
    await typePin(renderer, '1234567');
    expect(counter(renderer)).toBe(6);
  });

  it('a Keychain failure while verifying shows a generic error, opens nothing, and leaks no detail', async () => {
    const {renderer, navigation} = await mount();
    // only the PIN verifier read fails (a one-shot rejection could be consumed by any other Keychain read of the screen)
    (Keychain.getGenericPassword as jest.Mock).mockImplementation(async (options?: {service?: string}) => {
      if (options?.service === PRIVATE_PIN_SERVICE) {throw new Error('keystore unavailable: 123456');}
      return realGetGenericPassword(options);
    });
    await typePin(renderer, '123456', 1000);
    expect(errorLine(renderer)).toBe(i18n.t('security.genericError'));
    expect(navigation.replace).not.toHaveBeenCalled();
    const tree = JSON.stringify(renderer.toJSON());
    expect(tree).not.toContain('keystore unavailable');
    expect(tree).not.toContain('123456');
  });

  it('never shows the digits typed', async () => {
    const {renderer} = await mount();
    await typePin(renderer, '1234');
    expect(JSON.stringify(renderer.toJSON())).not.toContain('1234');
  });

  it('the back arrow leaves without opening anything', async () => {
    const {renderer, navigation} = await mount();
    const back = renderer.root.find(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === i18n.t('common.back'));
    await act(async () => {
      back.props.onPress();
    });
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});

describe('first use: no PIN yet', () => {
  it('asks to create a code, then to confirm it, then saves it and opens', async () => {
    const {renderer, navigation} = await mount();
    expect(textsOf(renderer)).toContain(i18n.t('privateAccess.createPinToContinue'));
    await typePin(renderer, '654321', 400);
    expect(textsOf(renderer)).toContain(i18n.t('privateAccess.confirmPin'));
    expect(errorLine(renderer)).toBe(i18n.t('privateAccess.confirmNewCode'));
    expect(await hasPrivatePin()).toBe(false); // nothing saved before the confirmation
    expect(navigation.replace).not.toHaveBeenCalled();

    await typePin(renderer, '654321', 500);
    expect(await hasPrivatePin()).toBe(true);
    expect(await verifyPrivatePin('654321')).toBe(true);
    expect(navigation.replace).toHaveBeenCalledWith('PregnancyMedicalInformation');
  });

  it('a mismatching confirmation saves nothing, says so, and starts again', async () => {
    const {renderer, navigation} = await mount();
    await typePin(renderer, '111111', 400);
    await typePin(renderer, '222222', 400);
    expect(errorLine(renderer)).toBe(i18n.t('security.codesDontMatch'));
    expect(textsOf(renderer)).toContain(i18n.t('privateAccess.createPinToContinue'));
    expect(await hasPrivatePin()).toBe(false);
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('a Keychain failure while saving shows a generic error and opens nothing', async () => {
    const {renderer, navigation} = await mount();
    await typePin(renderer, '333333', 400);
    (Keychain.setGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('disk failure'));
    await typePin(renderer, '333333', 400);
    expect(errorLine(renderer)).toBe(i18n.t('security.genericError'));
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(await hasPrivatePin()).toBe(false);
  });
});

describe('while the existence of a PIN is still being checked', () => {
  it('keys do nothing yet, and the instruction is blank', async () => {
    let release!: () => void;
    (Keychain.getGenericPassword as jest.Mock).mockImplementationOnce(() => new Promise(resolve => {
      release = () => resolve(false);
    }));
    const {renderer} = await mount();
    expect(textsOf(renderer)).not.toContain(i18n.t('privateAccess.enterPinToContinue'));
    expect(textsOf(renderer)).not.toContain(i18n.t('privateAccess.createPinToContinue'));
    await press(renderer, '1');
    expect(counter(renderer)).toBe(0);
    await act(async () => {
      release();
    });
    await flush();
    expect(textsOf(renderer)).toContain(i18n.t('privateAccess.createPinToContinue'));
    await press(renderer, '1');
    expect(counter(renderer)).toBe(1);
  });

  it('if the check itself fails, the screen offers to create a code rather than crash', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable'));
    const {renderer} = await mount();
    expect(textsOf(renderer)).toContain(i18n.t('privateAccess.createPinToContinue'));
  });
});

describe('biometric key', () => {
  beforeEach(async () => {
    await savePrivatePin('123456');
  });

  it('is absent when the phone has no biometrics, or when the biometric unlock is off', async () => {
    expect(keyByLabel((await mount()).renderer, i18n.t('privateSectionAuth.useBiometryLabel', {device: i18n.t('privateSectionAuth.fingerprint')}))).toBeUndefined();
    supportBiometrics('Fingerprint');
    await setPrivateBiometricEnabled(false);
    expect(keyByLabel((await mount()).renderer, i18n.t('privateSectionAuth.useBiometryLabel', {device: i18n.t('privateSectionAuth.fingerprint')}))).toBeUndefined();
  });

  it('when available and enabled, a successful prompt opens the destination', async () => {
    supportBiometrics('Fingerprint');
    await setPrivateBiometricEnabled(true);
    expect(await enablePrivateBiometry()).toBe(true);
    const {renderer, navigation} = await mount();
    await press(renderer, i18n.t('privateSectionAuth.useBiometryLabel', {device: i18n.t('privateSectionAuth.fingerprint')}));
    await wait(400);
    expect(navigation.replace).toHaveBeenCalledWith('PregnancyMedicalInformation');
  });

  it('a declined prompt opens nothing and says the person was not recognised', async () => {
    supportBiometrics('Fingerprint');
    await setPrivateBiometricEnabled(true);
    expect(await enablePrivateBiometry()).toBe(true);
    const {renderer, navigation} = await mount();
    denyPrivateBiometrics();
    await press(renderer, i18n.t('privateSectionAuth.useBiometryLabel', {device: i18n.t('privateSectionAuth.fingerprint')}));
    await flush();
    expect(errorLine(renderer)).toBe(i18n.t('privateAccess.authNotRecognized'));
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('a biometric error shows the same message and no detail', async () => {
    supportBiometrics('Fingerprint');
    await setPrivateBiometricEnabled(true);
    expect(await enablePrivateBiometry()).toBe(true);
    const {renderer, navigation} = await mount();
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('sensor failure'));
    await press(renderer, i18n.t('privateSectionAuth.useBiometryLabel', {device: i18n.t('privateSectionAuth.fingerprint')}));
    await flush();
    expect(errorLine(renderer)).toBe(i18n.t('privateAccess.authNotRecognized'));
    expect(JSON.stringify(renderer.toJSON())).not.toContain('sensor failure');
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});

describe('feedback while the code is being checked (PBKDF2 takes ~0.5 s, ~1.1 s on its first call)', () => {
  const realPbkdf2 = (Aes as unknown as {pbkdf2: (...args: unknown[]) => Promise<string>}).pbkdf2;
  const verifyingText = () => i18n.t('appLock.verifying');
  const notice = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAll(node => node.props.accessibilityState?.busy === true && node.findAllByType(ActivityIndicator).length > 0);
  const pbkdf2Calls = () => (Aes as unknown as {pbkdf2: jest.Mock}).pbkdf2.mock.calls.length;
  // a derivation that takes as long as the first one measured on the Huawei; `onStart` runs when the native call is made
  const slowDerivation = (ms: number, onStart?: () => void) =>
    jest.spyOn(Aes as never, 'pbkdf2').mockImplementation((async (...args: unknown[]) => {
      onStart?.();
      await new Promise<void>(resolve => setTimeout(resolve, ms));
      return realPbkdf2(...args);
    }) as never);

  beforeEach(async () => {
    await savePrivatePin('135790');
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows "Vérification…" with a loader BEFORE the derivation starts, keeps it for the whole derivation, then opens', async () => {
    let atStart: {texts: string[]; loaders: number} | null = null;
    const {renderer, navigation} = await mount();
    slowDerivation(1100, () => {
      atStart = {texts: textsOf(renderer), loaders: notice(renderer).length};
    });
    await typePin(renderer, '135790');
    await wait(400); // still deriving
    expect(textsOf(renderer)).toContain(verifyingText());
    expect(notice(renderer)).not.toHaveLength(0);
    expect(navigation.replace).not.toHaveBeenCalled();
    await wait(1200);
    expect(atStart).not.toBeNull();
    expect(atStart!.texts).toContain(verifyingText()); // on screen when the native call was made, not added afterwards
    expect(atStart!.loaders).toBeGreaterThan(0);
    expect(textsOf(renderer)).not.toContain(verifyingText());
    expect(navigation.replace).toHaveBeenCalledTimes(1);
  });

  it('is already visible during the short delay before the check, with the sixth dot filled', async () => {
    const {renderer} = await mount();
    slowDerivation(300);
    await typePin(renderer, '135790'); // the check itself starts 120 ms later
    expect(textsOf(renderer)).toContain(verifyingText());
    expect(counter(renderer)).toBe(6);
    await wait(900);
  });

  it('ignores every key, the biometric key included, while checking: one derivation, one opening', async () => {
    const {renderer, navigation} = await mount();
    slowDerivation(800);
    (Aes as unknown as {pbkdf2: jest.Mock}).pbkdf2.mockClear();
    await typePin(renderer, '135790');
    await press(renderer, '1'); // before the check starts
    await press(renderer, i18n.t('privateAccess.deleteKey'));
    await wait(300);
    await press(renderer, '2'); // during the derivation
    await press(renderer, i18n.t('privateAccess.deleteKey'));
    expect(counter(renderer)).toBe(6);
    await wait(1000);
    expect(pbkdf2Calls()).toBe(1);
    expect(navigation.replace).toHaveBeenCalledTimes(1);
  });

  it('a wrong code: the notice goes away and the error is shown; the keypad works again', async () => {
    const {renderer, navigation} = await mount();
    slowDerivation(400);
    await typePin(renderer, '000000');
    await wait(150);
    expect(textsOf(renderer)).toContain(verifyingText());
    await wait(800);
    expect(textsOf(renderer)).not.toContain(verifyingText());
    expect(errorLine(renderer)).toBe(i18n.t('security.incorrectCode'));
    expect(counter(renderer)).toBe(0);
    await typePin(renderer, '1');
    expect(counter(renderer)).toBe(1);
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('a derivation that fails shows the generic error and releases the keypad (the notice never stays)', async () => {
    const {renderer} = await mount();
    jest.spyOn(Aes as never, 'pbkdf2').mockRejectedValueOnce(new Error('native failure') as never);
    await typePin(renderer, '135790', 500);
    expect(textsOf(renderer)).not.toContain(verifyingText());
    expect(errorLine(renderer)).toBe(i18n.t('security.genericError'));
    await typePin(renderer, '1');
    expect(counter(renderer)).toBe(1);
  });
});

describe('feedback while the new code is being saved', () => {
  it('nothing is announced while the first entry is only remembered; the saving of the confirmation shows the notice', async () => {
    const realPbkdf2 = (Aes as unknown as {pbkdf2: (...args: unknown[]) => Promise<string>}).pbkdf2;
    const {renderer, navigation} = await mount();
    jest.spyOn(Aes as never, 'pbkdf2').mockImplementation((async (...args: unknown[]) => {
      await new Promise<void>(resolve => setTimeout(resolve, 600));
      return realPbkdf2(...args);
    }) as never);
    await typePin(renderer, '135790');
    expect(textsOf(renderer)).not.toContain(i18n.t('appLock.verifying'));
    await wait(300);
    await typePin(renderer, '135790');
    expect(textsOf(renderer)).toContain(i18n.t('appLock.verifying'));
    await wait(1200);
    expect(textsOf(renderer)).not.toContain(i18n.t('appLock.verifying'));
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    jest.restoreAllMocks();
  });
});
