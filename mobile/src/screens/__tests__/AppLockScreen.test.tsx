import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {BackHandler, Pressable, Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import * as Keychain from 'react-native-keychain';

import AppLockScreen from '../AppLockScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {
  beginPinSetup,
  cancelPinSetup,
  confirmAndSavePin,
  enableBiometricCredential,
} from '../../services/appSecurityService';
import {getAppLockState, setAppLockState} from '../../state/appLockStore';
import {setBiometricEnabled, setPinEnabled} from '../../state/securityPreferences';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {resetPinAttemptsMemoryForTests} from '../../services/pinAttemptLimiter';

// PHASE 3 — the app-lock screen: unlocking by PIN or biometrics, failures, switching method, the blocked back button. Real appSecurityService and
// securityPreferences over the in-memory Keychain of jest.setup.js; only what the OS decides (biometric support, a declined prompt) is scripted.

const PIN_SERVICE = 'com.hawa.app-lock.pin';
const BIOMETRIC_SERVICE = 'com.hawa.app-lock.biometric';
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 760}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flush = async () => {
  for (let index = 0; index < 14; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function mount() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <AppLockScreen />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await flush();
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const alertText = (renderer: ReactTestRenderer.ReactTestRenderer): string | undefined => {
  const alert = renderer.root.findAll(node => node.props.accessibilityRole === 'alert')[0];
  if (!alert) {return undefined;}
  if (typeof alert.props.children === 'string') {return alert.props.children;}
  // (the icon glyph is a private-use character: not part of what is read)
  return alert.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join('').replace(/[󰀀-󿿿]/gu, '')).join('');
};

const pressableByLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.type === Pressable && node.props.accessibilityLabel === label);

async function typeDigits(renderer: ReactTestRenderer.ReactTestRenderer, digits: string) {
  for (const digit of digits) {
    const key = pressableByLabel(renderer, i18n.t('pinKeypad.digitLabel', {digit}))[0];
    await act(async () => {
      key.props.onPress();
    });
  }
  await flush();
}

const filledDots = (renderer: ReactTestRenderer.ReactTestRenderer): number => {
  // the keypad's dots carry their own hint, e.g. "2 chiffres saisis sur 4": read the count back from it, in any language
  for (let count = 0; count <= 4; count += 1) {
    if (renderer.root.findAll(node => node.props.accessibilityLabel === i18n.t('pinKeypad.digitsEnteredHint', {count, total: 4})).length > 0) {return count;}
  }
  return -1;
};

const storePin = async (pin: string) => {
  expect(beginPinSetup(pin)).toBe(true);
  expect(await confirmAndSavePin(pin)).toBe('success');
  await setPinEnabled(true);
};

const useBiometrics = async () => {
  (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue('Fingerprint');
  expect(await enableBiometricCredential()).toBe(true);
  await setBiometricEnabled(true);
};

beforeEach(async () => {
  await AsyncStorage.clear();
  resetPinAttemptsMemoryForTests();
  // the app's default language is English: pin French explicitly, as the other suites do, so the screen and the expectations agree
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await Keychain.resetGenericPassword({service: PIN_SERVICE});
  await Keychain.resetGenericPassword({service: BIOMETRIC_SERVICE});
  (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(null);
  await setPinEnabled(false);
  await setBiometricEnabled(false);
  cancelPinSetup();
  setAppLockState('locked');
});

afterEach(() => {
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.restoreAllMocks();
});

describe('PIN lock', () => {
  beforeEach(async () => {
    await storePin('2468');
  });

  it('shows the lock, asks for the code and offers no biometric button', async () => {
    const renderer = await mount();
    expect(textsOf(renderer)).toContain(i18n.t('appLock.title'));
    expect(textsOf(renderer)).toContain(i18n.t('appLock.enterPinTitle'));
    expect(textsOf(renderer)).not.toContain(i18n.t('appLock.usePin'));
    expect(textsOf(renderer)).not.toContain(i18n.t('appLock.useBiometrics'));
    expect(getAppLockState()).toBe('locked');
  });

  it('the right code unlocks the app', async () => {
    const renderer = await mount();
    await typeDigits(renderer, '2468');
    expect(getAppLockState()).toBe('unlocked');
  });

  it('a wrong code keeps the app locked, says so, and clears the entry', async () => {
    const renderer = await mount();
    await typeDigits(renderer, '1357');
    expect(getAppLockState()).toBe('locked');
    expect(alertText(renderer)).toBe(i18n.t('security.incorrectCode'));
    expect(filledDots(renderer)).toBe(0);
  });

  it('after a wrong code the right one still works, and the error disappears as soon as typing resumes', async () => {
    const renderer = await mount();
    await typeDigits(renderer, '0000');
    expect(alertText(renderer)).toBe(i18n.t('security.incorrectCode'));
    await typeDigits(renderer, '2');
    expect(alertText(renderer)).toBeUndefined();
    await typeDigits(renderer, '468');
    expect(getAppLockState()).toBe('unlocked');
  });

  it('four wrong codes in a row never unlock the app and never alter the stored code; the right one still works', async () => {
    const renderer = await mount();
    for (const attempt of ['1111', '2222', '3333', '4444']) {
      await typeDigits(renderer, attempt);
      expect(getAppLockState()).toBe('locked');
    }
    await typeDigits(renderer, '2468');
    expect(getAppLockState()).toBe('unlocked');
  });

  describe('after five wrong codes', () => {
    const lockIt = async () => {
      const renderer = await mount();
      for (const attempt of ['1111', '2222', '3333', '4444', '5555']) {
        await typeDigits(renderer, attempt);
      }
      return renderer;
    };

    it('a wait is announced with the minutes left, the keypad is disabled and even the right code is refused', async () => {
      const renderer = await lockIt();
      expect(alertText(renderer)).toBe(i18n.t('security.tooManyAttempts', {minutes: 1}));
      expect(pressableByLabel(renderer, i18n.t('pinKeypad.digitLabel', {digit: '2'}))[0].props.disabled).toBe(true);
      await typeDigits(renderer, '2468');
      expect(getAppLockState()).toBe('locked');
      expect((await Keychain.getGenericPassword({service: PIN_SERVICE})) as {password: string}).toMatchObject({password: '2468'}); // never erased
    });

    it('the wait survives closing the app: a fresh screen still refuses the right code', async () => {
      const first = await lockIt();
      act(() => first.unmount());
      renderers.splice(0);
      resetPinAttemptsMemoryForTests();
      const renderer = await mount();
      expect(alertText(renderer)).toBe(i18n.t('security.tooManyAttempts', {minutes: 1}));
      await typeDigits(renderer, '2468');
      expect(getAppLockState()).toBe('locked');
    });

    it('once the wait is over the right code unlocks again', async () => {
      await lockIt();
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 31_000);
      const renderer = await mount();
      expect(alertText(renderer)).toBeUndefined();
      await typeDigits(renderer, '2468');
      expect(getAppLockState()).toBe('unlocked');
    });
  });

  it('a Keychain failure while verifying shows the verification error, clears the entry and does not unlock', async () => {
    const renderer = await mount();
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable'));
    await typeDigits(renderer, '2468');
    expect(getAppLockState()).toBe('locked');
    expect(alertText(renderer)).toBe(i18n.t('appLock.pinVerifyError'));
    expect(filledDots(renderer)).toBe(0);
  });

  it('never puts the code, or any error detail from the Keychain, on the screen', async () => {
    const renderer = await mount();
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable: 2468'));
    await typeDigits(renderer, '2468');
    const tree = JSON.stringify(renderer.toJSON());
    expect(tree).not.toContain('keystore unavailable');
    expect(tree).not.toContain('2468');
  });

  it('swallows the hardware back button, so the lock cannot be dismissed', async () => {
    const add = jest.spyOn(BackHandler, 'addEventListener');
    await mount();
    const handler = add.mock.calls.find(call => call[0] === 'hardwareBackPress')?.[1];
    expect(handler).toBeDefined();
    expect(handler?.()).toBe(true);
  });

  it('releases the back-button subscription when it unmounts', async () => {
    const remove = jest.fn();
    jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({remove});
    const renderer = await mount();
    act(() => renderer.unmount());
    renderers.splice(0);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

describe('biometric lock', () => {
  beforeEach(async () => {
    await useBiometrics();
  });

  it('asks for the biometric prompt on its own when opened, and unlocks when it is passed', async () => {
    const renderer = await mount();
    expect(getAppLockState()).toBe('unlocked');
    expect(textsOf(renderer)).toContain(i18n.t('appLock.biometricAreaTitle'));
  });

  it('a declined prompt keeps the app locked and says so; the button lets her try again', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
    const renderer = await mount();
    expect(getAppLockState()).toBe('locked');
    expect(alertText(renderer)).toBe(i18n.t('appLock.biometricFailed'));

    const retry = renderer.root.find(node => node.props.accessibilityLabel === i18n.t('biometrics.useFingerprint') && typeof node.props.onPress === 'function');
    await act(async () => {
      retry.props.onPress();
    });
    await flush();
    expect(getAppLockState()).toBe('unlocked');
  });

  it('a prompt that errors out shows the "cancelled or unavailable" message and does not unlock', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('sensor failure'));
    const renderer = await mount();
    expect(getAppLockState()).toBe('locked');
    expect(alertText(renderer)).toBe(i18n.t('security.authCancelledOrUnavailable'));
    expect(JSON.stringify(renderer.toJSON())).not.toContain('sensor failure');
  });

  it('without a PIN there is no way to bypass the biometric prompt', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
    const renderer = await mount();
    expect(textsOf(renderer)).not.toContain(i18n.t('appLock.usePin'));
    expect(renderer.root.findAllByProps({accessibilityLabel: i18n.t('pinKeypad.digitLabel', {digit: '1'})}).length).toBe(0);
    expect(getAppLockState()).toBe('locked');
  });
});

describe('PIN and biometrics together', () => {
  beforeEach(async () => {
    await storePin('2468');
    await useBiometrics();
  });

  it('starts on the biometric prompt, then offers the PIN as an alternative', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
    const renderer = await mount();
    expect(getAppLockState()).toBe('locked');
    expect(textsOf(renderer)).toContain(i18n.t('appLock.usePin'));
    expect(pressableByLabel(renderer, i18n.t('pinKeypad.digitLabel', {digit: '1'})).length).toBe(0);

    const usePin = renderer.root.find(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => [text.props.children].flat().join('') === i18n.t('appLock.usePin')));
    await act(async () => {
      usePin.props.onPress();
    });
    await flush();
    expect(textsOf(renderer)).toContain(i18n.t('appLock.enterPinTitle'));
    expect(alertText(renderer)).toBeUndefined(); // switching method clears the previous error

    await typeDigits(renderer, '2468');
    expect(getAppLockState()).toBe('unlocked');

  });

  it('from the PIN pad she can go back to the biometrics, which empties the entry', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
    const renderer = await mount();
    const usePin = renderer.root.find(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => [text.props.children].flat().join('') === i18n.t('appLock.usePin')));
    await act(async () => {
      usePin.props.onPress();
    });
    await typeDigits(renderer, '24');
    expect(filledDots(renderer)).toBe(2);

    const back = renderer.root.find(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => [text.props.children].flat().join('') === i18n.t('appLock.useBiometrics')));
    await act(async () => {
      back.props.onPress();
    });
    await flush();
    expect(textsOf(renderer)).toContain(i18n.t('appLock.biometricAreaTitle'));
    expect(pressableByLabel(renderer, i18n.t('pinKeypad.digitLabel', {digit: '1'})).length).toBe(0);
  });
});

describe('biometric capability check fails', () => {
  it('falls back to the PIN pad when the lock has a PIN', async () => {
    await storePin('2468');
    (Keychain.getSupportedBiometryType as jest.Mock).mockRejectedValue(new Error('unsupported'));
    const renderer = await mount();
    expect(textsOf(renderer)).toContain(i18n.t('appLock.enterPinTitle'));
    await typeDigits(renderer, '2468');
    expect(getAppLockState()).toBe('unlocked');
  });
});
